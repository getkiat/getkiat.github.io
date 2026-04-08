<script>
  import { convertToMarkdown, copyToClipboard } from '../../lib/converters/excelToMarkdownConverter.js';

  // Component state
  let inputData = $state('');
  let outputMarkdown = $state('');
  let conversionResult = $state(null);
  let isConverting = $state(false);
  let copySuccess = $state(false);
  let errorMessage = $state('');
  let warningMessages = $state([]);

  // Configuration options
  let hasHeaders = $state(true);
  let delimiter = $state('auto');
  let alignment = $state('left');
  let trimWhitespace = $state(true);
  let skipEmptyRows = $state(true);

  // Sample data for demonstration
  const sampleData = `Name\tAge\tCity\tCountry
John Doe\t25\tNew York\tUSA
Jane Smith\t30\tLondon\tUK
Bob Johnson\t35\tTokyo\tJapan`;

  // Load sample data
  function loadSample() {
    inputData = sampleData;
    errorMessage = '';
    conversionResult = null;
    outputMarkdown = '';
  }

  // Clear all data
  function clearAll() {
    inputData = '';
    outputMarkdown = '';
    conversionResult = null;
    errorMessage = '';
    copySuccess = false;
  }

  // Convert Excel/CSV to Markdown
  async function convertData() {
    if (!inputData.trim()) {
      errorMessage = 'Please enter some data to convert';
      return;
    }

    isConverting = true;
    errorMessage = '';
    warningMessages = [];
    copySuccess = false;

    try {
      const options = {
        hasHeaders,
        delimiter,
        alignment,
        trimWhitespace,
        skipEmptyRows
      };

      const result = convertToMarkdown(inputData, options);
      conversionResult = result;

      if (result.success) {
        outputMarkdown = result.markdown;
        errorMessage = '';
        
        // Display warnings if any
        if (result.warnings) {
          warningMessages = result.warnings;
        }
      } else {
        errorMessage = result.error;
        outputMarkdown = '';
        warningMessages = [];
      }
    } catch (error) {
      errorMessage = `Conversion failed: ${error.message}`;
      outputMarkdown = '';
      warningMessages = [];
    } finally {
      isConverting = false;
    }
  }

  // Copy markdown to clipboard
  async function copyMarkdown() {
    if (!outputMarkdown) return;

    const success = await copyToClipboard(outputMarkdown);
    
    if (success) {
      copySuccess = true;
      setTimeout(() => {
        copySuccess = false;
      }, 2000);
    } else {
      errorMessage = 'Failed to copy to clipboard. Please copy manually.';
    }
  }

  // Auto-convert when input changes (with debounce)
  let debounceTimer;
  $effect(() => {
    clearTimeout(debounceTimer);
    if (inputData && inputData.trim()) {
      debounceTimer = setTimeout(() => {
        convertData();
      }, 500);
    }
    return () => clearTimeout(debounceTimer);
  });

  // Parse markdown table into structured data for safe rendering (no {@html})
  function parseMarkdownTable(markdown) {
    if (!markdown) return null;
    const lines = markdown.trim().split('\n');
    if (lines.length < 3) return null;

    const headers = lines[0].split('|').slice(1, -1).map(c => c.trim());
    const rows = [];
    for (let i = 2; i < lines.length; i++) {
      const cells = lines[i].split('|').slice(1, -1).map(c => c.trim());
      if (cells.length > 0) rows.push(cells);
    }
    return { headers, rows };
  }

  let previewData = $derived(parseMarkdownTable(outputMarkdown));
</script>

<div class="tool-container">
  <header class="tool-header">
    <h1>Excel to Markdown Converter</h1>
  </header>

  <!-- Configuration Section -->
  <div class="configuration">
    <h2>Conversion Options</h2>
    <div class="config-grid">
      <div class="config-item">
        <label for="delimiter">Delimiter:</label>
        <select id="delimiter" bind:value={delimiter}>
          <option value="auto">Auto-detect</option>
          <option value="\t">Tab</option>
          <option value=",">Comma</option>
          <option value=";">Semicolon</option>
        </select>
      </div>

      <div class="config-item">
        <label for="alignment">Column Alignment:</label>
        <select id="alignment" bind:value={alignment}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>

      <div class="config-item checkbox-item">
        <label>
          <input type="checkbox" bind:checked={hasHeaders} />
          First row contains headers
        </label>
      </div>

      <div class="config-item checkbox-item">
        <label>
          <input type="checkbox" bind:checked={trimWhitespace} />
          Trim whitespace from cells
        </label>
      </div>

      <div class="config-item checkbox-item">
        <label>
          <input type="checkbox" bind:checked={skipEmptyRows} />
          Skip empty rows
        </label>
      </div>
    </div>
  </div>

  <div class="split-container">
    <!-- Input Panel -->
    <div class="panel input-panel">
      <h2>Input: Excel/CSV Data</h2>
      <p>Paste your data from Excel, CSV, or any tab/comma-separated format:</p>
      <textarea 
        bind:value={inputData} 
        placeholder="Paste your Excel or CSV data here...&#10;&#10;You can:&#10;• Copy cells directly from Excel&#10;• Paste CSV data&#10;• Use tab or comma-separated values"
        rows="12"
      ></textarea>
      
      <div class="controls">
        <button class="secondary-button" onclick={loadSample}>
          Load Sample
        </button>
        <button class="secondary-button" onclick={clearAll}>
          Clear All
        </button>
        <button class="primary-button convert-button" onclick={convertData} disabled={isConverting || !inputData.trim()}>
          {#if isConverting}
            <span class="loading">Converting...</span>
          {:else}
            Convert to Markdown
          {/if}
        </button>
      </div>
      
      {#if errorMessage}
        <div class="error-message">
          <pre>{errorMessage}</pre>
        </div>
      {/if}

      {#if warningMessages.length > 0}
        <div class="warning-message">
          <strong>⚠️ Warnings:</strong>
          {#each warningMessages as warning}
            <pre>{warning}</pre>
          {/each}
        </div>
      {/if}
      
      {#if conversionResult && conversionResult.success}
        <div class="conversion-info">
          <small>
            Detected: {conversionResult.delimiter === '\t' ? 'Tab' : conversionResult.delimiter === ',' ? 'Comma' : 'Semicolon'} delimiter, 
            {conversionResult.rowCount} rows, {conversionResult.columnCount} columns
          </small>
        </div>
      {/if}
    </div>

    <!-- Output Panel -->
    <div class="panel output-panel">
      <div class="output-header">
        <h2>Output: Markdown Table</h2>
        {#if outputMarkdown}
          <button class="copy-button" class:success={copySuccess} onclick={copyMarkdown}>
            {copySuccess ? 'Copied!' : 'Copy Markdown'}
          </button>
        {/if}
      </div>
      
      <textarea 
        bind:value={outputMarkdown} 
        readonly 
        placeholder="Markdown table will appear here..."
        rows="12"
      ></textarea>

      {#if previewData}
        <div class="preview-section">
          <h3>Preview:</h3>
          <div class="markdown-preview">
            <table class="preview-table">
              <thead>
                <tr>
                  {#each previewData.headers as header}
                    <th>{header}</th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each previewData.rows as row}
                  <tr>
                    {#each row as cell}
                      <td>{cell}</td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Help Section -->
  <div class="help-section">
    <h3>How to Use</h3>
    <ol>
      <li><strong>Copy from Excel:</strong> Select cells in Excel and copy (Ctrl+C/Cmd+C), then paste here</li>
      <li><strong>CSV Data:</strong> Paste comma-separated values directly</li>
      <li><strong>Configure Options:</strong> Adjust delimiter detection, alignment, and formatting options</li>
      <li><strong>Get Results:</strong> The tool auto-converts as you type or click "Convert to Markdown"</li>
      <li><strong>Copy Results:</strong> Click "Copy Markdown" to copy the result to your clipboard</li>
    </ol>
    
    <h3>Supported Formats</h3>
    <ul>
      <li>Excel copied data (tab-separated)</li>
      <li>CSV files (comma-separated)</li>
      <li>TSV files (tab-separated)</li>
      <li>Semicolon-separated values</li>
      <li>Mixed formats with auto-detection</li>
    </ul>
  </div>
</div>


<style>
  .tool-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .tool-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding-bottom: 15px;
    border-bottom: 2px solid var(--border-color);
  }

  .tool-header h1 {
    margin: 0;
    color: var(--text-color);
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.025em;
  }

  .controls {
    display: flex;
    gap: 10px;
    margin-top: 15px;
  }
  
  .convert-button {
    background-color: var(--accent);
    margin-left: auto;
  }

  @media (hover: hover) and (pointer: fine) {
    .convert-button:hover {
      background-color: var(--accent-hover);
    }
  }

  .primary-button, .secondary-button {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 200ms var(--ease-out), transform 160ms var(--ease-out), opacity 200ms var(--ease-out);
  }

  .primary-button {
    background-color: var(--primary-button-bg);
    color: white;
  }

  .primary-button:disabled {
    background-color: var(--placeholder-color);
    cursor: not-allowed;
    opacity: 0.5;
  }

  .secondary-button {
    background-color: var(--secondary-button-bg);
    color: var(--text-color);
    border: 1px solid var(--border-color);
  }

  @media (hover: hover) and (pointer: fine) {
    .primary-button:hover:not(:disabled) {
      background-color: var(--primary-button-hover);
    }

    .secondary-button:hover {
      background-color: var(--secondary-button-hover);
    }
  }

  .loading {
    display: inline-flex;
    align-items: center;
  }

  /* Configuration Section */
  .configuration {
    background-color: var(--panel-bg);
    padding: 1.25rem;
    border-radius: 0.75rem;
    margin-bottom: 1.25rem;
    border: var(--panel-border);
  }

  .configuration h2 {
    margin: 0 0 15px 0;
    color: var(--text-color);
    font-size: 18px;
  }

  .config-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
  }

  .config-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .config-item.checkbox-item {
    flex-direction: row;
    align-items: center;
  }

  .config-item label {
    font-weight: 600;
    color: var(--text-color);
  }

  .config-item select {
    padding: 8px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 14px;
  }

  .config-item input[type="checkbox"] {
    margin-right: 8px;
  }

  /* Split Container */
  .split-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }

  .panel {
    background-color: var(--panel-bg);
    border: var(--panel-border);
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: var(--shadow-elevation);
  }

  .panel h2 {
    margin: 0 0 10px 0;
    color: var(--text-color);
    font-size: 18px;
  }

  .panel p {
    margin: 0 0 15px 0;
    color: var(--text-secondary);
    font-size: 14px;
  }

  .panel textarea {
    width: 100%;
    padding: 12px;
    border: var(--panel-border);
    border-radius: 0.5rem;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    line-height: 1.6;
    resize: vertical;
    min-height: 300px;
    background-color: var(--primary-bg);
    color: var(--text-color);
    transition: border-color 200ms var(--ease-out), box-shadow 200ms var(--ease-out);
  }

  .panel textarea:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-subtle);
  }

  .output-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .copy-button {
    padding: 8px 16px;
    background-color: var(--accent);
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 0.8rem;
    font-weight: 600;
    transition: background-color 200ms var(--ease-out), transform 160ms var(--ease-out);
  }

  .copy-button:active {
    transform: scale(0.95);
  }

  .copy-button.success {
    background-color: var(--success-color);
    animation: copyPulse 250ms var(--ease-out);
  }

  @keyframes copyPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.04); }
    100% { transform: scale(1); }
  }

  @media (hover: hover) and (pointer: fine) {
    .copy-button:hover {
      background-color: var(--accent-hover);
    }
  }

  .error-message {
    background-color: var(--error-bg);
    border: 1px solid var(--error-color);
    color: var(--error-color);
    padding: 10px;
    border-radius: 4px;
    margin-top: 10px;
    font-size: 14px;
    animation: fadeInUp 200ms var(--ease-out) both;
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

  .error-message pre {
    margin: 0;
    white-space: pre-wrap;
    font-family: var(--font-mono);
    font-size: 12px;
  }

  .warning-message {
    background-color: rgba(245, 158, 11, 0.1);
    border-left: 3px solid #f59e0b;
    color: var(--text-color);
    padding: 10px;
    border-radius: 0.5rem;
    margin-top: 10px;
    font-size: 0.875rem;
    animation: fadeInUp 200ms var(--ease-out) both;
  }

  .warning-message pre {
    margin: 5px 0 0 0;
    white-space: pre-wrap;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .conversion-info {
    margin-top: 10px;
    padding: 8px 12px;
    background-color: var(--accent-subtle);
    border-left: 3px solid var(--accent);
    border-radius: 0.5rem;
    animation: fadeInUp 200ms var(--ease-out) both;
    animation-delay: 50ms;
  }

  .conversion-info small {
    color: var(--text-color);
    font-size: 12px;
  }

  /* Preview Section */
  .preview-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid var(--border-color);
  }

  .preview-section h3 {
    margin: 0 0 10px 0;
    color: var(--text-color);
    font-size: 0.95rem;
  }

  .markdown-preview {
    max-height: 300px;
    overflow: auto;
    border: var(--panel-border);
    border-radius: 0.5rem;
    padding: 15px;
    background-color: var(--primary-bg);
  }

  .preview-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0;
  }

  .preview-table th,
  .preview-table td {
    border: 1px solid var(--border-color);
    padding: 8px 12px;
    text-align: left;
    font-size: 0.85rem;
  }

  .preview-table th {
    background-color: var(--secondary-bg);
    font-weight: 600;
  }

  .preview-table tr:nth-child(even) {
    background-color: var(--secondary-bg);
  }

  /* Help Section */
  .help-section {
    background: var(--panel-bg);
    padding: 1.25rem;
    border-radius: 0.75rem;
    border: var(--panel-border);
    border-left: 3px solid var(--accent);
    font-size: 0.9rem;
  }

  .help-section h3 {
    margin: 0 0 12px 0;
    color: var(--text-color);
    font-size: 0.95rem;
  }

  .help-section ol,
  .help-section ul {
    margin: 0 0 16px 0;
    padding-left: 20px;
  }

  .help-section li {
    margin-bottom: 6px;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  /* Preview */
  .markdown-preview {
    background-color: var(--primary-bg);
    border: var(--panel-border);
    border-radius: 0.5rem;
  }

  :global(.preview-table th) {
    background-color: var(--secondary-bg);
  }

  :global(.preview-table tr:nth-child(even)) {
    background-color: var(--secondary-bg);
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .split-container {
      grid-template-columns: 1fr;
    }

    .tool-header {
      flex-direction: column;
      gap: 15px;
      align-items: stretch;
    }

    .config-grid {
      grid-template-columns: 1fr;
    }
  }
</style>