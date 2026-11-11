const express = require('express');
const { z } = require('zod');
const Lookup = require('../models/Lookup');
const Client = require('../models/Client');
const { validate } = require('../middleware/validate');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { normalizeName, normalizeKey } = require('../utils/normalize');

const router = express.Router();

router.use(requireAuth);

const patchLookupSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  isActive: z.boolean().optional()
}).strict();

const mergeLookupSchema = z.object({
  intoId: z.string().min(1, 'Target ID is required')
}).strict();

router.get('/', async (req, res, next) => {
  try {
    const { type, parentId, includeInactive } = req.query;
    const filter = { createdBy: req.user._id };

    if (type) {
      filter.type = type;
    }

    if (parentId) {
      filter.parentId = parentId;
    }

    if (includeInactive !== 'true' && includeInactive !== true) {
      filter.isActive = true;
    }

    const lookups = await Lookup.find(filter)
      .sort({ useCount: -1, lastUsedAt: -1, name: 1 });

    const formatted = lookups.map(l => ({
      id: l._id.toString(),
      name: l.name,
      type: l.type,
      parentId: l.parentId ? l.parentId.toString() : null,
      useCount: l.useCount,
      lastUsedAt: l.lastUsedAt,
      isActive: l.isActive
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', validate(patchLookupSchema), async (req, res, next) => {
  try {
    const lookup = await Lookup.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });
    if (!lookup) {
      return res.status(404).json({ message: 'Lookup option not found.' });
    }

    if (req.body.name) {
      const name = normalizeName(req.body.name);
      const nameKey = normalizeKey(name);

      const existing = await Lookup.findOne({
        _id: { $ne: lookup._id },
        type: lookup.type,
        nameKey,
        parentId: lookup.parentId,
        createdBy: req.user._id
      });

      if (existing) {
        return res.status(409).json({ message: 'An entry with this name already exists in your account.' });
      }

      lookup.name = name;
      lookup.nameKey = nameKey;
    }

    if (req.body.isActive !== undefined) {
      lookup.isActive = req.body.isActive;
    }

    await lookup.save();
    res.json(lookup);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/merge', validate(mergeLookupSchema), async (req, res, next) => {
  try {
    const { intoId } = req.body;
    if (req.params.id === intoId) {
      return res.status(400).json({ message: 'Cannot merge an item into itself.' });
    }

    const source = await Lookup.findOne({ _id: req.params.id, createdBy: req.user._id });
    const target = await Lookup.findOne({ _id: intoId, createdBy: req.user._id });

    if (!source || !target) {
      return res.status(404).json({ message: 'Source or target option not found in your account.' });
    }

    if (source.type !== target.type) {
      return res.status(400).json({ message: 'Cannot merge items of different types.' });
    }

    if (source.type === 'cp') {
      const sourceParent = source.parentId ? source.parentId.toString() : null;
      const targetParent = target.parentId ? target.parentId.toString() : null;
      if (sourceParent !== targetParent) {
        return res.status(400).json({ message: 'Cannot merge Channel Partners from different firms.' });
      }
    }

    if (source.type === 'cp_firm') {
      await Client.updateMany({ cpFirm: source._id }, { cpFirm: target._id });
      await Lookup.updateMany({ parentId: source._id }, { parentId: target._id });
    } else if (source.type === 'cp') {
      await Client.updateMany({ cp: source._id }, { cp: target._id });
    } else if (source.type === 'caller') {
      await Client.updateMany({ caller: source._id }, { caller: target._id });
    } else if (source.type === 'sales_manager') {
      await Client.updateMany({ lastSalesManager: source._id }, { lastSalesManager: target._id });
      await Client.updateMany(
        { 'interactions.salesManager': source._id },
        { $set: { 'interactions.$[elem].salesManager': target._id } },
        { arrayFilters: [{ 'elem.salesManager': source._id }] }
      );
    }

    target.useCount += source.useCount;
    if (source.lastUsedAt && (!target.lastUsedAt || source.lastUsedAt > target.lastUsedAt)) {
      target.lastUsedAt = source.lastUsedAt;
    }
    await target.save();

    source.isActive = false;
    await source.save();

    res.json({
      message: 'Merged successfully.',
      sourceId: source._id,
      intoId: target._id
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
