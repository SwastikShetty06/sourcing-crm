const Lookup = require('../models/Lookup');
const { normalizeName, normalizeKey } = require('../utils/normalize');

async function resolveLookup({ type, ref, parentId = null, userId }) {
  if (!ref || (!ref.id && !ref.name)) {
    return null;
  }

  if (ref.id) {
    const lookup = await Lookup.findOne({
      _id: ref.id,
      createdBy: userId
    });
    if (!lookup || lookup.type !== type || !lookup.isActive) {
      const err = new Error(`Invalid or inactive option for ${type.replace('_', ' ')}.`);
      err.statusCode = 400;
      throw err;
    }

    if (type === 'cp' && parentId) {
      const firmIdString = parentId.toString ? parentId.toString() : String(parentId);
      const lookupParentString = lookup.parentId ? lookup.parentId.toString() : '';
      if (lookupParentString !== firmIdString) {
        const err = new Error('Selected Channel Partner does not belong to the selected firm.');
        err.statusCode = 400;
        throw err;
      }
    }

    lookup.useCount += 1;
    lookup.lastUsedAt = new Date();
    await lookup.save();
    return lookup;
  }

  const name = normalizeName(ref.name);
  if (name.length < 2 || name.length > 80) {
    const err = new Error(`Name for ${type.replace('_', ' ')} must be between 2 and 80 characters.`);
    err.statusCode = 400;
    throw err;
  }

  const nameKey = normalizeKey(name);
  const targetParentId = type === 'cp' ? parentId : null;

  let lookup = await Lookup.findOne({
    type,
    nameKey,
    parentId: targetParentId,
    createdBy: userId
  });

  if (lookup) {
    if (!lookup.isActive) {
      lookup.isActive = true;
    }
    lookup.useCount += 1;
    lookup.lastUsedAt = new Date();
    await lookup.save();
    return lookup;
  }

  lookup = await Lookup.create({
    type,
    name,
    nameKey,
    parentId: targetParentId,
    createdBy: userId,
    useCount: 1,
    lastUsedAt: new Date()
  });

  return lookup;
}

module.exports = {
  resolveLookup
};
