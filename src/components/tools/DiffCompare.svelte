<script>
  import { computeDiff } from '../../lib/converters/diffEngine.js';
  import { copyToClipboard } from '../../lib/utils/clipboard.js';

  let original = $state('');
  let modified = $state('');
  let copySuccess = $state(false);
  let rawDiff = $derived(computeDiff(original, modified));
  let hasDiff = $derived(original.trim() !== '' && modified.trim() !== '' && rawDiff.changes.length > 0);
  let diffResult = $derived(rawDiff);

  const sampleOriginal = `function greet(name) {
  console.log("Hello, " + name);
  return true;
}

const users = ["Alice", "Bob"];
users.forEach(greet);`;

  const sampleModified = `function greet(name, greeting = "Hello") {
  console.log(greeting + ", " + name + "!");
  return { success: true, name };
}

const users = ["Alice", "Bob", "Charlie"];
users.forEach(u => greet(u));
console.log("Done");`;

  function loadSample() {
    original = sampleOriginal;
    modified = sampleModified;
  }

  function clearAll() {
    original = '';
    modified = '';
  }

  function swapSides() {
    const temp = original;
    original = modified;
    modified = temp;
  }

  async function copyUnifiedDiff() {
    if (!diffResult || !diffResult.changes.length) return;
    let output = '';
    for (const c of diffResult.changes) {
      if (c.type === 'equal') output += '  ' + c.oldLine + '\n';
      else if (c.type === 'remove') output += '- ' + c.oldLine + '\n';
      else if (c.type === 'add') output += '+ ' + c.newLine + '\n';
      else if (c.type === 'modify') {
        output += '- ' + c.oldLine + '\n';
        output += '+ ' + c.newLine + '\n';
      }
    }
    const ok = await copyToClipboard(output.trimEnd());
    if (ok) {
      copySuccess = true;
      setTimeout(() => { copySuccess = false; }, 2000);
    }
  }
</script>

<div class="tool-container">
  <header class="tool-header">
    <h1>Diff / Text Compare</h1>
  </header>

  <!-- Input Area -->
  <div class="input-grid">
    <div class="input-col">
      <h2>Original</h2>
      <textarea
        bind:value={original}
        placeholder="Paste original text here..."
        rows="10"
      ></textarea>
    </div>
    <div class="input-col">
      <h2>Modified</h2>
      <textarea
        bind:value={modified}
        placeholder="Paste modified text here..."
        rows="10"
      ></textarea>
    </div>
  </div>

  <div class="controls">
    <button class="secondary-button" onclick={loadSample}>Load Sample</button>
    <button class="secondary-button" onclick={swapSides}>Swap Sides</button>
    <button class="secondary-button" onclick={clearAll}>Clear</button>
    {#if hasDiff}
      <button class="primary-button copy-btn" class:success={copySuccess} onclick={copyUnifiedDiff}>
        {copySuccess ? 'Copied!' : 'Copy Unified Diff'}
      </button>
    {/if}
  </div>

  {#if diffResult && diffResult.error}
    <div class="error">{diffResult.error}</div>
  {/if}

  <!-- Stats Bar -->
  {#if hasDiff}
    <div class="stats-bar">
      <span class="stat stat-unchanged">{diffResult.stats.unchanged} unchanged</span>
      <span class="stat stat-added">+{diffResult.stats.added} added</span>
      <span class="stat stat-removed">-{diffResult.stats.removed} removed</span>
      <span class="stat stat-modified">~{diffResult.stats.modified} modified</span>
    </div>
  {/if}

  <!-- Diff Output -->
  {#if hasDiff}
    <div class="diff-container">
      <div class="diff-side diff-old">
        <div class="diff-header">Original</div>
        {#each diffResult.changes as change}
          <div class="diff-line {change.type === 'remove' ? 'line-removed' : change.type === 'modify' ? 'line-modified' : change.type === 'add' ? 'line-empty' : ''}">
            <span class="line-num">{change.oldNum || ''}</span>
            <span class="line-content">
              {#if change.type === 'modify' && change.oldSegments}
                {#each change.oldSegments as seg}
                  <span class={seg.type === 'remove' ? 'char-removed' : ''}>{seg.text}</span>
                {/each}
              {:else if change.type === 'add'}
                &nbsp;
              {:else}
                {change.oldLine}
              {/if}
            </span>
          </div>
        {/each}
      </div>
      <div class="diff-side diff-new">
        <div class="diff-header">Modified</div>
        {#each diffResult.changes as change}
          <div class="diff-line {change.type === 'add' ? 'line-added' : change.type === 'modify' ? 'line-modified-new' : change.type === 'remove' ? 'line-empty' : ''}">
            <span class="line-num">{change.newNum || ''}</span>
            <span class="line-content">
              {#if change.type === 'modify' && change.newSegments}
                {#each change.newSegments as seg}
                  <span class={seg.type === 'add' ? 'char-added' : ''}>{seg.text}</span>
                {/each}
              {:else if change.type === 'remove'}
                &nbsp;
              {:else}
                {change.newLine}
              {/if}
            </span>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="empty-state">
      Paste text into both sides to see the differences highlighted
    </div>
  {/if}
</div>

<style>
  .tool-container {
    max-width: 1200px;
    margin: 0 auto;
    overflow: hidden;
  }

  .input-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .input-col h2 {
    margin: 0 0 0.5rem 0;
    font-size: 0.95rem;
  }

  .input-col textarea {
    width: 100%;
    min-height: 180px;
    resize: vertical;
    overflow: auto;
    box-sizing: border-box;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    line-height: 1.6;
  }

  .controls {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .copy-btn {
    margin-left: auto;
  }

  .copy-btn.success {
    background-color: var(--success-color);
  }

  /* Stats Bar */
  .stats-bar {
    display: flex;
    gap: 1rem;
    padding: 0.6rem 1rem;
    background: var(--panel-bg);
    border: var(--panel-border);
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    animation: fadeInUp 200ms var(--ease-out) both;
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .stat { font-weight: 500; }
  .stat-unchanged { color: var(--text-secondary); }
  .stat-added { color: #34d399; }
  .stat-removed { color: #f87171; }
  .stat-modified { color: #fbbf24; }

  /* Diff Container */
  .diff-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
    background: var(--border-color);
    border: var(--panel-border);
    border-radius: 0.75rem;
    overflow: hidden;
  }

  .diff-side {
    background: var(--panel-bg);
    overflow-x: auto;
  }

  .diff-header {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
    background: var(--secondary-bg);
    border-bottom: var(--panel-border);
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .diff-line {
    display: flex;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    line-height: 1.7;
    min-height: 1.7em;
    border-bottom: 1px solid var(--border-color);
  }

  .line-num {
    flex-shrink: 0;
    width: 3rem;
    text-align: right;
    padding: 0 0.5rem;
    color: var(--placeholder-color);
    user-select: none;
    font-size: 0.7rem;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .line-content {
    flex: 1;
    padding: 0 0.75rem;
    white-space: pre;
    overflow-x: auto;
  }

  /* Line-level colors */
  .line-removed {
    background: rgba(248, 113, 113, 0.08);
  }

  .line-added {
    background: rgba(52, 211, 153, 0.08);
  }

  .line-modified {
    background: rgba(251, 191, 36, 0.06);
  }

  .line-modified-new {
    background: rgba(52, 211, 153, 0.06);
  }

  .line-empty {
    background: var(--secondary-bg);
    opacity: 0.5;
  }

  /* Character-level highlights */
  .char-removed {
    background: rgba(248, 113, 113, 0.25);
    border-radius: 2px;
    padding: 0 1px;
  }

  .char-added {
    background: rgba(52, 211, 153, 0.25);
    border-radius: 2px;
    padding: 0 1px;
  }

  .line-removed .line-num { color: #f87171; }
  .line-added .line-num { color: #34d399; }
  .line-modified .line-num,
  .line-modified-new .line-num { color: #fbbf24; }

  /* Responsive */
  @media (max-width: 768px) {
    .input-grid,
    .diff-container {
      grid-template-columns: 1fr;
    }
  }
</style>
