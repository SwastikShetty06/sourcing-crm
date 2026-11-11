const express = require('express');
const Client = require('../models/Client');
const Lookup = require('../models/Lookup');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/summary', async (req, res, next) => {
  try {
    const baseFilter = { isArchived: false, createdBy: req.user._id };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [inProgressCount, bookedCount, lostCount] = await Promise.all([
      Client.countDocuments({ ...baseFilter, status: 'in_progress' }),
      Client.countDocuments({ ...baseFilter, status: 'booked' }),
      Client.countDocuments({ ...baseFilter, status: 'lost' })
    ]);

    const overdueClientsDocs = await Client.find({
      ...baseFilter,
      status: 'in_progress',
      lastInteractionAt: { $lte: sevenDaysAgo }
    })
      .sort({ lastInteractionAt: 1 })
      .populate('cpFirm', 'name')
      .populate('cp', 'name')
      .populate('caller', 'name')
      .populate('lastSalesManager', 'name');

    const nowTime = Date.now();
    const overdueClients = overdueClientsDocs.map(c => {
      const firm = c.cpFirm ? c.cpFirm.name : 'Unknown Firm';
      const partner = c.cp ? c.cp.name : 'Unknown CP';
      let sourceText = `${firm}, ${partner}`;
      if (c.leadSource === 'calling') {
        const callerName = c.caller ? c.caller.name : 'Caller';
        sourceText += ` (Calling: ${callerName})`;
      } else if (c.caller) {
        sourceText += ` (Ref: ${c.caller.name})`;
      } else {
        sourceText += ' (Reference)';
      }

      const diffMs = nowTime - new Date(c.lastInteractionAt).getTime();
      const daysSince = Math.max(7, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      return {
        id: c._id.toString(),
        clientName: c.clientName,
        sourceText,
        lastSalesManager: c.lastSalesManager ? c.lastSalesManager.name : 'Unassigned',
        daysSinceLastInteraction: daysSince,
        lastInteractionAt: c.lastInteractionAt
      };
    });

    const clientsWithRecentInteractions = await Client.find(baseFilter)
      .populate('interactions.salesManager', 'name')
      .select('clientName interactions');

    const allInteractions = [];
    for (const c of clientsWithRecentInteractions) {
      for (const i of c.interactions) {
        allInteractions.push({
          id: i._id.toString(),
          clientId: c._id.toString(),
          clientName: c.clientName,
          kind: i.kind,
          occurredAt: i.occurredAt,
          salesManager: i.salesManager ? i.salesManager.name : 'Unassigned',
          feedbackSnippet: i.feedback ? i.feedback.slice(0, 90) : ''
        });
      }
    }

    allInteractions.sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
    const recentEntries = allInteractions.slice(0, 10);

    const visitsLast7Days = allInteractions.filter(
      i => new Date(i.occurredAt) >= sevenDaysAgo
    ).length;

    res.json({
      counts: {
        in_progress: inProgressCount,
        booked: bookedCount,
        lost: lostCount
      },
      visitsLast7Days,
      overdueCount: overdueClients.length,
      overdueClients,
      recentEntries
    });
  } catch (err) {
    next(err);
  }
});

router.get('/partners', async (req, res, next) => {
  try {
    const { by = 'cp_firm' } = req.query;
    const validBy = ['cp_firm', 'cp', 'caller', 'sales_manager'];
    if (!validBy.includes(by)) {
      return res.status(400).json({ message: 'Invalid partner type requested.' });
    }

    const baseFilter = { isArchived: false, createdBy: req.user._id };

    let fieldKey = 'cpFirm';
    if (by === 'cp') fieldKey = 'cp';
    else if (by === 'caller') fieldKey = 'caller';
    else if (by === 'sales_manager') fieldKey = 'lastSalesManager';

    const lookups = await Lookup.find({ type: by, createdBy: req.user._id }).populate('parentId', 'name');

    const clients = await Client.find({
      ...baseFilter,
      [fieldKey]: { $ne: null }
    }).select(`status ${fieldKey}`);

    const statsMap = new Map();
    for (const l of lookups) {
      statsMap.set(l._id.toString(), {
        id: l._id.toString(),
        name: l.name,
        type: l.type,
        firmName: l.parentId ? l.parentId.name : null,
        isActive: l.isActive,
        total: 0,
        in_progress: 0,
        booked: 0,
        lost: 0
      });
    }

    for (const c of clients) {
      const refId = c[fieldKey] ? c[fieldKey].toString() : null;
      if (refId && statsMap.has(refId)) {
        const item = statsMap.get(refId);
        item.total += 1;
        if (c.status === 'in_progress') item.in_progress += 1;
        else if (c.status === 'booked') item.booked += 1;
        else if (c.status === 'lost') item.lost += 1;
      }
    }

    const rows = Array.from(statsMap.values()).map(row => {
      const decided = row.booked + row.lost;
      const conversion = decided > 0 ? Math.round((row.booked / decided) * 100) : 0;
      return {
        ...row,
        conversion
      };
    });

    rows.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
