function normalizeName(name) {
  if (typeof name !== 'string') {
    return '';
  }
  return name.trim().replace(/\s+/g, ' ');
}

function normalizeKey(name) {
  return normalizeName(name).toLowerCase();
}

module.exports = {
  normalizeName,
  normalizeKey
};
