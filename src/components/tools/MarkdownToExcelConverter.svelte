<script>
  import { convertMarkdownToExcel, generateSampleMarkdown } from '../../lib/converters/markdownToExcelConverter.js';
  import { copyToClipboard } from '../../lib/utils/clipboard.js';

  let markdownInput = $state('');
  let excelOutput = $state('');
  let isConverting = $state(false);
  let copySuccess = $state(false);
  let conversionError = $state(null);
  let conversionSuccess = $state(null);
  let conversionResult = $state(null);

  // Configuration options
  let outputFormat = $state('tsv'); // tsv, csv, json
  let includeHeaders = $state(true);
  let trimWhitespace = $state(true);
  let skipEmptyRows = $state(true);

  // Load sample data
  function loadSampleData() {
    markdownInput = generateSampleMarkdown();
    conversionError = null;
    conversionSuccess = null;
    copySuccess = false;
  }

  // Clear all data
  function clearAll() {
    markdownInput = '';
    excelOutput = '';
    conversionError = null;
    conversionSuccess = null;
    conversionResult = null;
    copySuccess = false;
  }

  // Handle conversion
  async function handleConvert() {
    if (!markdownInput.trim()) {
      conversionError = "Please enter markdown table data first";
      return;
    }

    isConverting = true;
    conversionError = null;
    conversionSuccess = null;
    copySuccess = false;

    try {
      // Simulate processing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = convertMarkdownToExcel(markdownInput, {
        outputFormat,
        includeHeaders,
        trimWhitespace,
        skipEmptyRows
      });

      if (result.success) {
        excelOutput = result.outputData;
        conversionResult = result;
        conversionSuccess = `Successfully converted ${result.rowCount} rows with ${result.columnCount} columns to ${outputFormat.toUpperCase()} format.`;
      } else {
        conversionError = result.error;
        excelOutput = '';
        conversionResult = null;
      }
    } catch (err) {
      conversionError = `Unexpected error: ${err.message}`;
      console.error(err);
    } finally {
      isConverting = false;
    }
  }

  // Handle copy to clipboard
  async function handleCopy() {
    if (!excelOutput) return;

    const copied = await copyToClipboard(excelOutput);
    if (copied) {
      copySuccess = true;
      conversionSuccess = "Copied to clipboard! You can now paste directly into Excel.";
      setTimeout(() => {
        copySuccess = false;
        if (conversionSuccess === "Copied to clipboard! You can now paste directly into Excel.") {
          conversionSuccess = null;
        }
      }, 3000);
    } else {
      conversionError = "Failed to copy to clipboard. Please select and copy manually.";
    }
  }

  // Auto-convert when input changes (with debouncing)
  let convertTimeout;
  $effect(() => {
    clearTimeout(convertTimeout);
    if (markdownInput && markdownInput.trim()) {
      convertTimeout = setTimeout(() => {
        handleConvert();
      }, 500);
    }
    return () => clearTimeout(convertTimeout);
  });
</script>

<div class="tool-container">
  <header class="tool-header">
    <h1>Markdown to Excel Converter</h1>
  </header>

  <div class="converter-container">
    <!-- Configuration Panel -->
    <div class="configuration">
      <h2>Configuration</h2>
      <div class="config-grid">
        <div class="config-item">
          <label for="outputFormat">Output Format:</label>
          <select id="outputFormat" bind:value={outputFormat}>
            <option value="tsv">TSV (Tab-Separated) - Best for Excel</option>
            <option value="csv">CSV (Comma-Separated)</option>
            <option value="json">JSON</option>
          </select>
        </div>
        
        <div class="config-item checkbox-item">
          <label>
            <input type="checkbox" bind:checked={includeHeaders}>
            Include headers in output
          </label>
        </div>
        
        <div class="config-item checkbox-item">
          <label>
            <input type="checkbox" bind:checked={trimWhitespace}>
            Trim whitespace from cells
          </label>
        </div>
        
        <div class="config-item checkbox-item">
          <label>
            <input type="checkbox" bind:checked={skipEmptyRows}>
            Skip empty rows
          </label>
        </div>
      </div>
    </div>

    <!-- Main Conversion Interface -->
    <div class="split-container">
      <!-- Input Panel -->
      <div class="panel input-panel">
        <h2>Input: Markdown Table</h2>
        <p>Paste your markdown table here:</p>
        <div class="sample-input">
          | Column1 | Column2 | Column3 |<br>
          |---------|---------|---------|<br>
          | Data1   | Data2   | Data3   |
        </div>
        
        <textarea
          bind:value={markdownInput}
          placeholder="Paste your markdown table here... You can use the sample data to get started."
          rows="12"
        ></textarea>
        
        <div class="controls">
          <button onclick={loadSampleData} class="secondary-button">Load Sample Data</button>
          <button onclick={clearAll} class="secondary-button">Clear All</button>
          <button
            class="primary-button convert-button"
            onclick={handleConvert}
            disabled={isConverting || !markdownInput.trim()}
          >
            {#if isConverting}
              <span class="loading">Converting...</span>
            {:else}
              Convert to {outputFormat.toUpperCase()}
            {/if}
          </button>
        </div>
      </div>
      
      <!-- Output Panel -->
      <div class="panel output-panel">
        <div class="output-header">
          <h2>Output: {outputFormat.toUpperCase()} Format</h2>
          {#if conversionResult}
            <div class="conversion-info">
              <small>
                Converted: {conversionResult.rowCount} rows, {conversionResult.columnCount} columns
                {#if conversionResult.hasHeaders}(with headers){/if}
              </small>
            </div>
          {/if}
        </div>
        
        <textarea 
          bind:value={excelOutput} 
          readonly 
          placeholder="Converted data will appear here. For Excel: TSV format works best - you can paste directly into Excel."
          rows="12"
        ></textarea>
        
        <div class="controls">
          <button 
            class="primary-button copy-button"
            class:success={copySuccess}
            onclick={handleCopy}
            disabled={!excelOutput}
          >
            {copySuccess ? 'Copied!' : 'Copy for Excel'}
          </button>
        </div>
      </div>
    </div>

    <!-- Status Messages -->
    {#if conversionError}
      <div class="error-message">
        <pre>{conversionError}</pre>
      </div>
    {/if}

    {#if conversionSuccess}
      <div class="success-message">{conversionSuccess}</div>
    {/if}
  </div>

  <!-- Help Section -->
  <div class="help-section">
    <h3>How to Use This Converter</h3>
    <ol>
      <li><strong>Input Markdown:</strong> Paste your markdown table in the input area</li>
      <li><strong>Choose Format:</strong> Select TSV for Excel, CSV for general use, or JSON for data processing</li>
      <li><strong>Configure Options:</strong> Toggle headers, whitespace trimming, and empty row handling</li>
      <li><strong>Convert:</strong> The tool auto-converts as you type, or click "Convert" manually</li>
      <li><strong>Copy & Paste:</strong> Click "Copy for Excel" and paste directly into Excel or other applications</li>
    </ol>

    <h3>Supported Formats</h3>
    <ul>
      <li><strong>TSV (Recommended for Excel):</strong> Tab-separated values that paste cleanly into Excel</li>
      <li><strong>CSV:</strong> Comma-separated values for general spreadsheet use</li>
      <li><strong>JSON:</strong> Structured data format for programming and data processing</li>
    </ul>

    <h3>Markdown Table Format</h3>
    <div class="sample-data">
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| More 1   | More 2   | More 3   |
    </div>
    
    <h3>Tips</h3>
    <ul>
      <li>TSV format works best for pasting into Excel - no quotation marks needed</li>
      <li>The converter automatically detects headers by looking for separator rows (|---|---|)</li>
      <li>Escaped pipes (\\|) in cells are properly handled</li>
      <li>Empty rows and extra whitespace are automatically cleaned up</li>
    </ul>
  </div>
</div>

<style>
  .converter-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* Configuration */
  .configuration {
    background-color: var(--panel-bg);
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border-color);
  }

  .configuration h2 {
    font-size: 1.1rem;
    margin: 0 0 1rem 0;
    color: var(--text-color);
  }

  .config-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 1rem;
    align-items: center;
  }

  .config-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .config-item.checkbox-item {
    flex-direction: row;
    align-items: center;
  }

  .config-item label {
    font-weight: 500;
    color: var(--text-color);
    font-size: 0.875rem;
  }

  .config-item input,
  .config-item select {
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 0.25rem;
    background: var(--primary-bg);
    color: var(--text-color);
    font-size: 0.875rem;
  }

  .config-item input[type="checkbox"] {
    margin-right: 0.5rem;
    width: auto;
  }

  /* Main Interface */
  .split-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    min-height: 500px;
  }

  .panel {
    background: var(--panel-bg);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
  }

  .panel h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
    color: var(--text-color);
  }

  .panel p {
    margin: 0 0 0.5rem 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .sample-input {
    background-color: var(--secondary-bg);
    padding: 0.75rem;
    border-radius: 0.25rem;
    font-size: 0.8rem;
    margin-bottom: 0.75rem;
    color: var(--text-secondary);
    font-family: var(--font-mono);
    border: 1px solid var(--border-color);
  }

  textarea {
    flex: 1;
    width: 100%;
    padding: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    background: var(--primary-bg);
    color: var(--text-color);
    font-family: var(--font-mono);
    font-size: 0.875rem;
    resize: vertical;
    min-height: 200px;
  }

  textarea:focus {
    outline: none;
    border-color: var(--primary-button-bg);
  }

  .output-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 0.5rem;
  }

  .conversion-info {
    text-align: right;
  }

  .conversion-info small {
    color: var(--text-secondary);
    font-size: 0.75rem;
  }

  .controls {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .convert-button {
    margin-left: auto;
  }

  .copy-button {
    width: 100%;
    transition: background-color 200ms var(--ease-out), transform 160ms var(--ease-out);
  }

  .copy-button.success {
    background-color: var(--success-color);
  }

  .loading {
    color: var(--text-secondary);
  }

  /* Status Messages */
  .error-message {
    background-color: var(--error-bg);
    border-left: 3px solid var(--error-color);
    color: var(--error-color);
    padding: 1rem;
    border-radius: 0.5rem;
    margin: 1rem 0;
    animation: fadeInUp 200ms var(--ease-out) both;
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .error-message pre {
    margin: 0;
    white-space: pre-wrap;
    font-family: var(--font-mono);
    font-size: 0.875rem;
  }

  .success-message {
    background-color: var(--accent-subtle);
    border-left: 3px solid var(--success-color);
    color: var(--success-color);
    padding: 1rem;
    border-radius: 0.5rem;
    margin: 1rem 0;
    font-size: 0.875rem;
    animation: fadeInUp 200ms var(--ease-out) both;
  }

  /* Help Section */
  .help-section {
    background: var(--panel-bg);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-top: 1rem;
  }

  .help-section h3 {
    margin: 1.5rem 0 0.75rem 0;
    color: var(--text-color);
    font-size: 1.1rem;
  }

  .help-section h3:first-child {
    margin-top: 0;
  }

  .help-section ol,
  .help-section ul {
    padding-left: 1.5rem;
    margin-bottom: 1rem;
  }

  .help-section li {
    margin-bottom: 0.5rem;
    line-height: 1.4;
  }

  .sample-data {
    margin: 1rem 0;
    padding: 1rem;
    background-color: var(--code-bg);
    color: var(--code-color);
    border-radius: 0.375rem;
    font-family: var(--font-mono);
    font-size: 0.85rem;
    overflow-x: auto;
    white-space: pre;
    border: 1px solid var(--border-color);
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .config-grid {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
    
    .split-container {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .controls {
      flex-direction: column;
    }
    
    .convert-button {
      margin-left: 0;
    }
  }
</style>