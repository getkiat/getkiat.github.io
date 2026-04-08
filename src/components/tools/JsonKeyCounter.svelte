<script>
  import { onMount } from 'svelte';

  // Sample JSON for users to try
  const sampleJson = `{
  "data": [
    { "id": 1, "name": "Item1", "type": "primary", "enabled": true },
    { "id": 2, "name": "Item2", "type": "secondary", "enabled": false },
    { "id": 3, "name": "Item3", "type": "secondary", "enabled": true }
  ],
  "config": {
    "maxItems": 10,
    "types": ["primary", "secondary", "tertiary"],
    "settings": {
      "feature1": true,
      "feature2": false
    }
  },
  "version": "1.0.0"
}`;

  // JSON Key Counter Tool Logic
  let jsonInput = $state('');
  let results = $state({});
  let errorMessage = $state('');
  let isValidJson = $state(false);
  let parsedJson = $state(null);
  let textarea = $state();

  // Sort results by key or count
  let sortBy = $state('key'); // 'key' or 'count'
  let sortOrder = $state('asc'); // 'asc' or 'desc'

  let sortedResults = $derived(Object.entries(results).sort((a, b) => {
    const aValue = sortBy === 'key' ? a[0] : a[1].count;
    const bValue = sortBy === 'key' ? b[0] : b[1].count;

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  }));

  // Function to load sample JSON
  function loadSample() {
    jsonInput = sampleJson;
    processJson();
  }

  // Process JSON input
  function processJson() {
    try {
      // Reset values
      errorMessage = '';
      results = {};

      if (!jsonInput.trim()) {
        isValidJson = false;
        return;
      }

      // Parse JSON
      parsedJson = JSON.parse(jsonInput);
      isValidJson = true;

      // Count keys
      countKeys(parsedJson);
    } catch (error) {
      errorMessage = `Error: ${error.message}`;
      isValidJson = false;
    }
  }

  // Count all keys in JSON object recursively
  function countKeys(obj, path = '') {
    if (obj === null || typeof obj !== 'object') {
      return;
    }

    if (Array.isArray(obj)) {
      // If it's an array, process each item
      obj.forEach((item, index) => {
        const newPath = path ? `${path}[${index}]` : `[${index}]`;
        countKeys(item, newPath);
      });
    } else {
      // Process object keys
      Object.keys(obj).forEach(key => {
        // Count the key
        if (!results[key]) {
          results[key] = {
            count: 0,
            paths: []
          };
        }

        results[key].count += 1;

        const newPath = path ? `${path}.${key}` : key;
        results[key].paths.push(newPath);

        // Recursively process nested objects
        countKeys(obj[key], newPath);
      });
    }
  }

  // Clear the input
  function clearInput() {
    jsonInput = '';
    results = {};
    errorMessage = '';
    isValidJson = false;
    parsedJson = null;
  }

  function toggleSort(field) {
    if (sortBy === field) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy = field;
      sortOrder = 'asc';
    }
  }

  // Auto-resize textarea (debounced + rAF to avoid layout thrashing)
  function adjustTextareaHeight() {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }

  let resizeTimer;
  $effect(() => {
    jsonInput;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      requestAnimationFrame(adjustTextareaHeight);
    }, 50);
    return () => clearTimeout(resizeTimer);
  });

  onMount(() => {
    adjustTextareaHeight();
    if (!jsonInput) {
      loadSample();
    }
  });
</script>

<div class="tool-container">
  <header class="tool-header">
    <h1>JSON Key Counter</h1>
  </header>

  <div class="split-container">
    <!-- JSON Input Panel -->
    <div class="panel input-panel">
      <h2>JSON Input</h2>
      <textarea
        bind:this={textarea}
        bind:value={jsonInput}
        placeholder="Paste your JSON here..."
        oninput={adjustTextareaHeight}
      ></textarea>

      <div class="controls">
        <button onclick={loadSample} class="secondary-button">Load Sample</button>
        <button onclick={clearInput} class="secondary-button">Clear</button>
        <button onclick={processJson} class="primary-button analyze-button">Analyze JSON</button>
      </div>

      {#if errorMessage}
        <div class="error">{errorMessage}</div>
      {/if}

      {#if isValidJson && parsedJson}
        <div class="json-structure">
          <h3>Parsed Structure</h3>
          <pre>{JSON.stringify(parsedJson, null, 2)}</pre>
        </div>
      {/if}
    </div>

    <!-- Results Panel -->
    <div class="panel results-panel">
      <h2>Analysis Results</h2>

      {#if isValidJson && Object.keys(results).length > 0}
        <div class="summary">
          <p>Found <strong>{Object.keys(results).length}</strong> unique keys in the JSON.</p>
          <p>Total key occurrences: <strong>{Object.values(results).reduce((sum, item) => sum + item.count, 0)}</strong></p>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th onclick={() => toggleSort('key')}
                    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSort('key'); } }}
                    class="sortable"
                    tabindex="0"
                    role="columnheader"
                    aria-sort={sortBy === 'key' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  Key Name
                  {#if sortBy === 'key'}
                    <span class="sort-icon" aria-hidden="true">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  {/if}
                </th>
                <th onclick={() => toggleSort('count')}
                    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSort('count'); } }}
                    class="sortable"
                    tabindex="0"
                    role="columnheader"
                    aria-sort={sortBy === 'count' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  Count
                  {#if sortBy === 'count'}
                    <span class="sort-icon" aria-hidden="true">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  {/if}
                </th>
                <th>Paths</th>
              </tr>
            </thead>
            <tbody>
              {#each sortedResults as [key, data]}
                <tr>
                  <td>{key}</td>
                  <td class="count">{data.count}</td>
                  <td class="paths">
                    <details>
                      <summary>View {data.paths.length} path{data.paths.length !== 1 ? 's' : ''}</summary>
                      <ul>
                        {#each data.paths as path}
                          <li>{path}</li>
                        {/each}
                      </ul>
                    </details>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else if !errorMessage}
        <div class="empty-state">
          Enter JSON data and click "Analyze JSON" to see results
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .controls {
    display: flex;
    gap: 10px;
    margin-top: 15px;
  }

  .analyze-button {
    background-color: var(--accent);
    margin-left: auto;
  }

  @media (hover: hover) and (pointer: fine) {
    .analyze-button:hover {
      background-color: var(--accent-hover);
    }
  }

  .json-structure {
    margin-top: 1rem;
  }

  .summary {
    margin-bottom: 1.5rem;
    padding: 0.75rem;
    background-color: var(--highlight-bg);
    border-radius: 0.375rem;
    animation: fadeInUp 250ms var(--ease-out) both;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .summary p {
    margin: 0.25rem 0;
  }

  .table-container {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
  }

  th, td {
    padding: 0.75rem 0.5rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
    font-size: 0.9rem;
  }

  th {
    background-color: var(--secondary-bg);
    font-weight: 600;
  }

  th.sortable {
    cursor: pointer;
    user-select: none;
    transition: background-color 200ms var(--ease-out);
  }

  th.sortable:active {
    background-color: var(--sidebar-active);
  }

  @media (hover: hover) and (pointer: fine) {
    th.sortable:hover {
      background-color: var(--sidebar-hover);
    }
  }

  .sort-icon {
    margin-left: 0.25rem;
  }

  td.count {
    text-align: center;
    font-weight: 600;
  }

  .paths ul {
    margin-top: 0.5rem;
    padding-left: 1.5rem;
    font-family: monospace;
    font-size: 0.85rem;
  }

  details {
    margin: 0.25rem 0;
  }

  summary {
    cursor: pointer;
    color: var(--primary-button-bg);
    transition: color 150ms var(--ease-out);
  }

  summary:active {
    opacity: 0.7;
  }

  @media (hover: hover) and (pointer: fine) {
    summary:hover {
      text-decoration: underline;
    }
  }
</style>
