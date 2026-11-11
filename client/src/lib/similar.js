export function levenshtein(a, b) {
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

export function findSimilarOption(input, options, maxDistance = 2) {
  if (!input || !options || options.length === 0) return null;
  const trimmed = input.trim();
  if (trimmed.length < 3) return null;

  let closest = null;
  let minDistance = maxDistance + 1;

  for (const opt of options) {
    const optName = opt.name || '';
    if (optName.toLowerCase() === trimmed.toLowerCase()) {
      continue;
    }
    const dist = levenshtein(trimmed, optName);
    if (dist <= maxDistance && dist < minDistance) {
      minDistance = dist;
      closest = opt;
    }
  }

  return closest;
}
