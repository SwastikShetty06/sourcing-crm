const express = require('express');
const { z } = require('zod');
const Client = require('../models/Client');
const Lookup = require('../models/Lookup');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { resolveLookup } = require('../services/lookupResolver');
const { escapeRegex } = require('../utils/escapeRegex');

const router = express.Router();

router.use(requireAuth);

const lookupRefSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional()
}).refine(data => data.id || data.name, {
  message: 'Either id or name must be provided'
});

const createClientSchema = z.object({
  clientName: z.string().trim().min(2, 'Client name must be at least 2 characters').max(80),
  clientPhone: z.string().trim().regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits').optional().or(z.literal('')),
  projectName: z.string().trim().max(80).optional().or(z.literal('')),
  leadSource: z.enum(['calling', 'reference']),
  cpFirm: lookupRefSchema,
  cp: lookupRefSchema,
  caller: lookupRefSchema.optional(),
  firstVisitDate: z.string().or(z.date()).optional(),
  kind: z.enum(['site_visit', 'revisit', 'call', 'vc', 'obm', 'other']).default('site_visit'),
  occurredAt: z.string().or(z.date()).optional(),
  salesManager: lookupRefSchema,
  feedback: z.string().trim().min(3, 'Feedback must be at least 3 characters').max(2000)
}).strict();

const updateClientSchema = z.object({
  clientName: z.string().trim().min(2).max(80).optional(),
  clientPhone: z.string().trim().regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits').optional().or(z.literal('')).nullable(),
  projectName: z.string().trim().max(80).optional().or(z.literal('')).nullable(),
  firstVisitDate: z.string().or(z.date()).optional(),
  leadSource: z.enum(['calling', 'reference']).optional(),
  cpFirm: lookupRefSchema.optional().nullable(),
  cp: lookupRefSchema.optional().nullable(),
  caller: lookupRefSchema.optional().nullable(),
  unitDetails: z.string().trim().max(80).optional().or(z.literal('')).nullable(),
  bookingDate: z.string().or(z.date()).optional().nullable(),
  lostReason: z.enum(['budget', 'location', 'chose_competitor', 'not_interested', 'unreachable', 'other']).optional().nullable(),
  lostNote: z.string().trim().max(300).optional().or(z.literal('')).nullable()
}).strict();

const createInteractionSchema = z.object({
  kind: z.enum(['site_visit', 'revisit', 'call', 'vc', 'obm', 'other']).default('site_visit'),
  occurredAt: z.string().or(z.date()).optional(),
  salesManager: lookupRefSchema,
  feedback: z.string().trim().min(3, 'Feedback must be at least 3 characters').max(2000)
}).strict();

const updateInteractionSchema = z.object({
  kind: z.enum(['site_visit', 'revisit', 'call', 'vc', 'obm', 'other']).optional(),
  occurredAt: z.string().or(z.date()).optional(),
  salesManager: lookupRefSchema.optional(),
  feedback: z.string().trim().min(3, 'Feedback must be at least 3 characters').max(2000).optional()
}).strict();

const updateStatusSchema = z.object({
  status: z.enum(['in_progress', 'booked', 'lost']),
  note: z.string().trim().max(300).optional().or(z.literal('')),
  lostReason: z.enum(['budget', 'location', 'chose_competitor', 'not_interested', 'unreachable', 'other']).optional(),
  lostNote: z.string().trim().max(300).optional().or(z.literal('')),
  unitDetails: z.string().trim().max(80).optional().or(z.literal('')),
  bookingDate: z.string().or(z.date()).optional()
}).refine(data => {
  if (data.status === 'lost') {
    return Boolean(data.lostReason);
  }
  return true;
}, {
  message: 'Lost reason is required when status is lost',
  path: ['lostReason']
});

router.get('/', async (req, res, next) => {
  try {
    const {
      q,
      status,
      leadSource,
      cpFirm,
      cp,
      caller,
      salesManager,
      from,
      to,
      createdBy,
      sortBy = 'lastInteractionAt',
      sortOrder = 'desc',
      page = 1,
      limit = 25
    } = req.query;

    const filter = { isArchived: false, createdBy: req.user._id };

    if (req.user.role === 'admin' && createdBy) {
      filter.createdBy = createdBy;
    }

    if (status) filter.status = status;
    if (leadSource) filter.leadSource = leadSource;
    if (cpFirm) filter.cpFirm = cpFirm;
    if (cp) filter.cp = cp;
    if (caller) filter.caller = caller;
    if (salesManager) filter.lastSalesManager = salesManager;

    if (from || to) {
      filter.lastInteractionAt = {};
      if (from) filter.lastInteractionAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.lastInteractionAt.$lte = toDate;
      }
    }

    if (q && q.trim()) {
      const escaped = escapeRegex(q.trim());
      const regex = new RegExp(escaped, 'i');
      filter.$or = [{ clientName: regex }, { clientPhone: regex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    let sortObj = { lastInteractionAt: -1 };
    if (sortBy === 'clientName') {
      sortObj = { clientName: sortDirection };
    } else if (sortBy === 'firstVisitDate') {
      sortObj = { firstVisitDate: sortDirection };
    } else if (sortBy === 'status') {
      sortObj = { status: sortDirection };
    } else {
      sortObj = { lastInteractionAt: sortDirection };
    }

    const [clients, total] = await Promise.all([
      Client.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate('cpFirm', 'name')
        .populate('cp', 'name')
        .populate('caller', 'name')
        .populate('lastSalesManager', 'name')
        .populate('createdBy', 'displayName userId'),
      Client.countDocuments(filter)
    ]);

    res.json({
      clients,
      total,
      page: pageNum,
      limit: limitNum
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(createClientSchema), async (req, res, next) => {
  try {
    const {
      clientName,
      clientPhone,
      projectName,
      leadSource,
      cpFirm,
      cp,
      caller,
      firstVisitDate,
      kind,
      occurredAt,
      salesManager,
      feedback
    } = req.body;

    let resolvedFirm = null;
    let resolvedCp = null;
    let resolvedCaller = null;

    if (!cpFirm) {
      return res.status(400).json({ message: 'CP firm is required.' });
    }
    resolvedFirm = await resolveLookup({
      type: 'cp_firm',
      ref: cpFirm,
      userId: req.user._id
    });

    if (!cp) {
      return res.status(400).json({ message: 'Channel Partner name is required.' });
    }
    resolvedCp = await resolveLookup({
      type: 'cp',
      ref: cp,
      parentId: resolvedFirm._id,
      userId: req.user._id
    });

    if (leadSource === 'calling') {
      if (!caller) {
        return res.status(400).json({ message: 'Caller is required for Calling source.' });
      }
      resolvedCaller = await resolveLookup({
        type: 'caller',
        ref: caller,
        userId: req.user._id
      });
    } else {
      resolvedCaller = null;
    }

    const resolvedSalesManager = await resolveLookup({
      type: 'sales_manager',
      ref: salesManager,
      userId: req.user._id
    });

    if (!resolvedSalesManager) {
      return res.status(400).json({ message: 'Sales manager is required.' });
    }

    const visitDate = firstVisitDate ? new Date(firstVisitDate) : new Date();
    const interactionDate = occurredAt ? new Date(occurredAt) : visitDate;

    const initialInteraction = {
      kind: kind || 'site_visit',
      occurredAt: interactionDate,
      salesManager: resolvedSalesManager._id,
      feedback,
      createdBy: req.user._id
    };

    const client = new Client({
      clientName,
      clientPhone: clientPhone || undefined,
      projectName: projectName || undefined,
      leadSource,
      cpFirm: resolvedFirm ? resolvedFirm._id : null,
      cp: resolvedCp ? resolvedCp._id : null,
      caller: resolvedCaller ? resolvedCaller._id : null,
      firstVisitDate: visitDate,
      interactions: [initialInteraction],
      lastInteractionAt: interactionDate,
      lastSalesManager: resolvedSalesManager._id,
      status: 'in_progress',
      statusHistory: [
        {
          status: 'in_progress',
          changedAt: new Date(),
          changedBy: req.user._id,
          note: 'Initial visit'
        }
      ],
      createdBy: req.user._id
    });

    await client.save();

    const populated = await Client.findById(client._id)
      .populate('cpFirm', 'name')
      .populate('cp', 'name')
      .populate('caller', 'name')
      .populate('lastSalesManager', 'name')
      .populate('createdBy', 'displayName userId')
      .populate('interactions.salesManager', 'name')
      .populate('interactions.createdBy', 'displayName userId')
      .populate('statusHistory.changedBy', 'displayName userId');

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isArchived: false })
      .populate('cpFirm', 'name')
      .populate('cp', 'name')
      .populate('caller', 'name')
      .populate('lastSalesManager', 'name')
      .populate('createdBy', 'displayName userId')
      .populate('interactions.salesManager', 'name')
      .populate('interactions.createdBy', 'displayName userId')
      .populate('statusHistory.changedBy', 'displayName userId');

    if (!client) {
      return res.status(404).json({ message: 'Client not found.' });
    }

    if (req.user.role !== 'admin' && !client.createdBy._id.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied to this client.' });
    }

    res.json(client);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', validate(updateClientSchema), async (req, res, next) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isArchived: false });
    if (!client) {
      return res.status(404).json({ message: 'Client not found.' });
    }

    if (req.user.role !== 'admin' && !client.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied to edit this client.' });
    }

    const {
      clientName,
      clientPhone,
      projectName,
      firstVisitDate,
      leadSource,
      cpFirm,
      cp,
      caller,
      unitDetails,
      bookingDate,
      lostReason,
      lostNote
    } = req.body;

    if (clientName !== undefined) client.clientName = clientName;
    if (clientPhone !== undefined) client.clientPhone = clientPhone || undefined;
    if (projectName !== undefined) client.projectName = projectName || undefined;
    if (firstVisitDate !== undefined) client.firstVisitDate = new Date(firstVisitDate);
    if (unitDetails !== undefined) client.unitDetails = unitDetails || undefined;
    if (bookingDate !== undefined) client.bookingDate = bookingDate ? new Date(bookingDate) : undefined;
    if (lostReason !== undefined) client.lostReason = lostReason || undefined;
    if (lostNote !== undefined) client.lostNote = lostNote || undefined;

    if (leadSource !== undefined) {
      client.leadSource = leadSource;
    }

    if (cpFirm !== undefined) {
      if (!cpFirm) {
        return res.status(400).json({ message: 'CP firm is required.' });
      }
      const resolvedFirm = await resolveLookup({
        type: 'cp_firm',
        ref: cpFirm,
        userId: req.user._id
      });
      client.cpFirm = resolvedFirm._id;
    }

    if (cp !== undefined) {
      if (!cp) {
        return res.status(400).json({ message: 'Channel Partner name is required.' });
      }
      const resolvedCp = await resolveLookup({
        type: 'cp',
        ref: cp,
        parentId: client.cpFirm,
        userId: req.user._id
      });
      client.cp = resolvedCp._id;
    }

    const activeLeadSource = leadSource !== undefined ? leadSource : client.leadSource;
    if (activeLeadSource === 'calling') {
      if (caller !== undefined) {
        if (!caller) {
          return res.status(400).json({ message: 'Caller is required for Calling source.' });
        }
        const resolvedCaller = await resolveLookup({
          type: 'caller',
          ref: caller,
          userId: req.user._id
        });
        client.caller = resolvedCaller._id;
      }
    } else if (activeLeadSource === 'reference') {
      if (caller !== undefined) {
        if (caller && (caller.id || caller.name)) {
          const resolvedCaller = await resolveLookup({
            type: 'caller',
            ref: caller,
            userId: req.user._id
          });
          client.caller = resolvedCaller._id;
        } else {
          client.caller = null;
        }
      }
    }

    await client.save();

    const populated = await Client.findById(client._id)
      .populate('cpFirm', 'name')
      .populate('cp', 'name')
      .populate('caller', 'name')
      .populate('lastSalesManager', 'name')
      .populate('createdBy', 'displayName userId')
      .populate('interactions.salesManager', 'name')
      .populate('interactions.createdBy', 'displayName userId')
      .populate('statusHistory.changedBy', 'displayName userId');

    res.json(populated);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/interactions', validate(createInteractionSchema), async (req, res, next) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isArchived: false });
    if (!client) {
      return res.status(404).json({ message: 'Client not found.' });
    }

    if (req.user.role !== 'admin' && !client.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied to add interaction to this client.' });
    }

    const { kind, occurredAt, salesManager, feedback } = req.body;
    const resolvedSalesManager = await resolveLookup({
      type: 'sales_manager',
      ref: salesManager,
      userId: req.user._id
    });

    if (!resolvedSalesManager) {
      return res.status(400).json({ message: 'Sales manager is required.' });
    }

    const newInteraction = {
      kind: kind || 'site_visit',
      occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
      salesManager: resolvedSalesManager._id,
      feedback,
      createdBy: req.user._id
    };

    client.interactions.push(newInteraction);
    await client.save();

    const populated = await Client.findById(client._id)
      .populate('cpFirm', 'name')
      .populate('cp', 'name')
      .populate('caller', 'name')
      .populate('lastSalesManager', 'name')
      .populate('createdBy', 'displayName userId')
      .populate('interactions.salesManager', 'name')
      .populate('interactions.createdBy', 'displayName userId')
      .populate('statusHistory.changedBy', 'displayName userId');

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/interactions/:iid', validate(updateInteractionSchema), async (req, res, next) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isArchived: false });
    if (!client) {
      return res.status(404).json({ message: 'Client not found.' });
    }

    const interaction = client.interactions.id(req.params.iid);
    if (!interaction) {
      return res.status(404).json({ message: 'Interaction not found.' });
    }

    if (req.user.role !== 'admin') {
      if (!client.createdBy.equals(req.user._id)) {
        return res.status(403).json({ message: 'Access denied to this client.' });
      }
      if (interaction.createdBy && !interaction.createdBy.equals(req.user._id)) {
        return res.status(403).json({ message: 'You can only edit interactions you created.' });
      }
    }

    const { kind, occurredAt, salesManager, feedback } = req.body;

    if (kind !== undefined) interaction.kind = kind;
    if (occurredAt !== undefined) interaction.occurredAt = new Date(occurredAt);
    if (feedback !== undefined) interaction.feedback = feedback;

    if (salesManager !== undefined) {
      const resolved = await resolveLookup({
        type: 'sales_manager',
        ref: salesManager,
        userId: req.user._id
      });
      interaction.salesManager = resolved._id;
    }

    await client.save();

    const populated = await Client.findById(client._id)
      .populate('cpFirm', 'name')
      .populate('cp', 'name')
      .populate('caller', 'name')
      .populate('lastSalesManager', 'name')
      .populate('createdBy', 'displayName userId')
      .populate('interactions.salesManager', 'name')
      .populate('interactions.createdBy', 'displayName userId')
      .populate('statusHistory.changedBy', 'displayName userId');

    res.json(populated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/interactions/:iid', async (req, res, next) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isArchived: false });
    if (!client) {
      return res.status(404).json({ message: 'Client not found.' });
    }

    const interaction = client.interactions.id(req.params.iid);
    if (!interaction) {
      return res.status(404).json({ message: 'Interaction not found.' });
    }

    if (req.user.role !== 'admin') {
      if (!client.createdBy.equals(req.user._id)) {
        return res.status(403).json({ message: 'Access denied to this client.' });
      }
      if (interaction.createdBy && !interaction.createdBy.equals(req.user._id)) {
        return res.status(403).json({ message: 'You can only delete interactions you created.' });
      }
    }

    if (client.interactions.length <= 1) {
      return res.status(400).json({ message: 'Cannot delete the only interaction for a client.' });
    }

    client.interactions.pull({ _id: req.params.iid });
    await client.save();

    const populated = await Client.findById(client._id)
      .populate('cpFirm', 'name')
      .populate('cp', 'name')
      .populate('caller', 'name')
      .populate('lastSalesManager', 'name')
      .populate('createdBy', 'displayName userId')
      .populate('interactions.salesManager', 'name')
      .populate('interactions.createdBy', 'displayName userId')
      .populate('statusHistory.changedBy', 'displayName userId');

    res.json(populated);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/status', validate(updateStatusSchema), async (req, res, next) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isArchived: false });
    if (!client) {
      return res.status(404).json({ message: 'Client not found.' });
    }

    if (req.user.role !== 'admin' && !client.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied to update status for this client.' });
    }

    const { status, note, lostReason, lostNote, unitDetails, bookingDate } = req.body;

    client.status = status;

    if (status === 'lost') {
      client.lostReason = lostReason;
      client.lostNote = lostNote || undefined;
      client.unitDetails = undefined;
      client.bookingDate = undefined;
    } else if (status === 'booked') {
      client.unitDetails = unitDetails || undefined;
      client.bookingDate = bookingDate ? new Date(bookingDate) : new Date();
      client.lostReason = undefined;
      client.lostNote = undefined;
    } else if (status === 'in_progress') {
      client.lostReason = undefined;
      client.lostNote = undefined;
      client.unitDetails = undefined;
      client.bookingDate = undefined;
    }

    client.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: req.user._id,
      note: note || undefined
    });

    await client.save();

    const populated = await Client.findById(client._id)
      .populate('cpFirm', 'name')
      .populate('cp', 'name')
      .populate('caller', 'name')
      .populate('lastSalesManager', 'name')
      .populate('createdBy', 'displayName userId')
      .populate('interactions.salesManager', 'name')
      .populate('interactions.createdBy', 'displayName userId')
      .populate('statusHistory.changedBy', 'displayName userId');

    res.json(populated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found.' });
    }

    if (req.user.role !== 'admin' && !client.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete entries you created.' });
    }

    await Client.deleteOne({ _id: client._id });
    res.json({ message: 'Client entry deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/archive', requireAdmin, async (req, res, next) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, isArchived: false });
    if (!client) {
      return res.status(404).json({ message: 'Client not found.' });
    }

    client.isArchived = true;
    await client.save();

    res.json({ message: 'Client archived successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
