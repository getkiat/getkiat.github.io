/**
 * Diff Engine — LCS-based text comparison with character-level granularity
 */

/**
 * Compute the longest common subsequence table for two arrays
 * @param {string[]} a - First array of lines
 * @param {string[]} b - Second array of lines
 * @returns {number[][]} LCS table
 */
function lcsTable(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp;
}

/**
 * Backtrack through LCS table to produce diff operations
 * @param {number[][]} dp - LCS table
 * @param {string[]} a - Original lines
 * @param {string[]} b - Modified lines
 * @returns {Array<{type: string, oldLine?: string, newLine?: string, oldNum?: number, newNum?: number}>}
 */
function backtrack(dp, a, b) {
  const result = [];
  let i = a.length;
  let j = b.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.unshift({ type: 'equal', oldLine: a[i - 1], newLine: b[j - 1], oldNum: i, newNum: j });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'add', newLine: b[j - 1], newNum: j });
      j--;
    } else {
      result.unshift({ type: 'remove', oldLine: a[i - 1], oldNum: i });
      i--;
    }
  }
  return result;
}

/**
 * Character-level diff between two strings using simple LCS
 * Returns arrays of {text, type} segments for both old and new lines
 */
function charDiff(oldStr, newStr) {
  const oldChars = [...oldStr];
  const newChars = [...newStr];

  // For very long lines, skip char diff (performance)
  if (oldChars.length > 500 || newChars.length > 500) {
    return {
      oldSegments: [{ text: oldStr, type: 'remove' }],
      newSegments: [{ text: newStr, type: 'add' }]
    };
  }

  const dp = lcsTable(oldChars, newChars);
  const ops = backtrack(dp, oldChars, newChars);

  const oldSegments = [];
  const newSegments = [];
  let oldBuf = { text: '', type: null };
  let newBuf = { text: '', type: null };

  function flush(buf, arr) {
    if (buf.text) {
      arr.push({ text: buf.text, type: buf.type });
      buf.text = '';
      buf.type = null;
    }
  }

  for (const op of ops) {
    if (op.type === 'equal') {
      if (oldBuf.type !== 'equal') { flush(oldBuf, oldSegments); oldBuf.type = 'equal'; }
      if (newBuf.type !== 'equal') { flush(newBuf, newSegments); newBuf.type = 'equal'; }
      oldBuf.text += op.oldLine;
      newBuf.text += op.newLine;
    } else if (op.type === 'remove') {
      if (oldBuf.type !== 'remove') { flush(oldBuf, oldSegments); oldBuf.type = 'remove'; }
      oldBuf.text += op.oldLine;
    } else if (op.type === 'add') {
      if (newBuf.type !== 'add') { flush(newBuf, newSegments); newBuf.type = 'add'; }
      newBuf.text += op.newLine;
    }
  }
  flush(oldBuf, oldSegments);
  flush(newBuf, newSegments);

  return { oldSegments, newSegments };
}

/**
 * Pair adjacent remove+add operations as "modified" lines with char-level diff
 */
function pairModifications(ops) {
  const result = [];
  let i = 0;

  while (i < ops.length) {
    if (ops[i].type === 'remove' && i + 1 < ops.length && ops[i + 1].type === 'add') {
      const { oldSegments, newSegments } = charDiff(ops[i].oldLine, ops[i + 1].newLine);
      result.push({
        type: 'modify',
        oldLine: ops[i].oldLine,
        newLine: ops[i + 1].newLine,
        oldNum: ops[i].oldNum,
        newNum: ops[i + 1].newNum,
        oldSegments,
        newSegments
      });
      i += 2;
    } else {
      result.push(ops[i]);
      i++;
    }
  }
  return result;
}

/**
 * Main diff function
 * @param {string} original - Original text
 * @param {string} modified - Modified text
 * @returns {{ changes: Array, stats: { added: number, removed: number, modified: number, unchanged: number } }}
 */
export function computeDiff(original, modified) {
  // Input size guard
  const MAX_SIZE = 2_000_000;
  if ((original && original.length > MAX_SIZE) || (modified && modified.length > MAX_SIZE)) {
    return { changes: [], stats: { added: 0, removed: 0, modified: 0, unchanged: 0 }, error: 'Input too large (max 2MB per side)' };
  }

  const oldLines = (original || '').split('\n');
  const newLines = (modified || '').split('\n');

  const dp = lcsTable(oldLines, newLines);
  const rawOps = backtrack(dp, oldLines, newLines);
  const changes = pairModifications(rawOps);

  const stats = { added: 0, removed: 0, modified: 0, unchanged: 0 };
  for (const c of changes) {
    stats[c.type === 'equal' ? 'unchanged' : c.type === 'add' ? 'added' : c.type === 'remove' ? 'removed' : 'modified']++;
  }

  return { changes, stats };
}
