<script>
  import { convertTableFormat, toCSV } from '../../lib/converters/tableConverter.js';
  import { copyToClipboard } from '../../lib/utils/clipboard.js';

  let tableInputData = $state('');
  let tableOutputData = $state('');
  let outputFormat = $state('table');
  let transformedData = $state(null);
  let tableActiveTab = $state('converter');
  let isConverting = $state(false);
  let conversionError = $state(null);
  let conversionSuccess = $state(null);
  let duplicateWarning = $state(null);

  // Configuration variables with validation
  let paramGroupName = $state('FEAT_POI_PARAM');
  let configGroupName = $state('FEAT_POI_CONFIG');
  let idParamPrefix = $state('FPP');
  let idConfigPrefix = $state('FPPC');
  let defaultIsActive = $state('TRUE');
  let defaultIsDeleted = $state('FALSE');
  
  // Validate configuration inputs
  function validateConfig(value) {
    // Allow only alphanumeric, underscore, and dash
    return /^[A-Za-z0-9_\-]{1,50}$/.test(value);
  }
  
  // Sample data
  const sampleData = `| fieldName | CATEGORY_A | Trigger_A1      | Historical data from field A1 |
| fieldName | CATEGORY_A | Trigger_A2      | Historical data from field A2 |
| fieldName | CATEGORY_B | Trigger_B1      | Historical data from field B1 |
| fieldName | CATEGORY_C | Trigger_C1      | Historical data from field C1 |
| otherField| CATEGORY_D | Trigger_D1      | Historical data from field D1 |`;
  
  // Load sample data
  function loadSample() {
    tableInputData = sampleData;
    conversionError = null;
    conversionSuccess = null;
    duplicateWarning = null;
  }
  
  // Clear input
  function clearInput() {
    tableInputData = '';
    tableOutputData = '';
    conversionError = null;
    conversionSuccess = null;
    duplicateWarning = null;
  }
  
  // Switch between converter tabs
  function setTableActiveTab(tab) {
    tableActiveTab = tab;
    conversionError = null;
    conversionSuccess = null;
    duplicateWarning = null;
  }
  
  // Handle conversion
  async function handleConvert() {
    if (!tableInputData.trim()) {
      conversionError = "Please enter input data first";
      return;
    }
    
    isConverting = true;
    conversionError = null;
    conversionSuccess = null;
    duplicateWarning = null;
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Validate and get configuration
      if (!validateConfig(paramGroupName) || !validateConfig(configGroupName) ||
          !validateConfig(idParamPrefix) || !validateConfig(idConfigPrefix)) {
        conversionError = "Invalid configuration values. Use only letters, numbers, underscore, and dash (max 50 chars)";
        isConverting = false;
        return;
      }
      
      const config = {
        paramGroupName,
        configGroupName,
        idParamPrefix,
        idConfigPrefix,
        isActiveValue: defaultIsActive,
        isDeletedValue: defaultIsDeleted
      };
      
      const result = convertTableFormat(tableInputData, config);
      
      if (result.success) {
        transformedData = result;
        displayOutput(result);
        
        // Check for duplicates and show warning
        if (result.duplicates && result.duplicates.found) {
          duplicateWarning = {
            count: result.duplicates.count,
            details: result.duplicates.details
          };
        }
        
        let successMsg = `Successfully converted ${result.recordsProcessed} input records to ${result.recordsGenerated} output records`;
        if (result.uniqueTriggerCategories) {
          successMsg += ` (${result.uniqueTriggerCategories} unique trigger categories).`;
        } else {
          successMsg += '.';
        }
        
        conversionSuccess = successMsg;
      } else {
        conversionError = result.error;
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
    if (!tableOutputData) return;
    
    const copied = await copyToClipboard(tableOutputData);
    if (copied) {
      conversionSuccess = "Copied to clipboard!";
      setTimeout(() => {
        if (conversionSuccess === "Copied to clipboard!") {
          conversionSuccess = null;
        }
      }, 2000);
    } else {
      conversionError = "Failed to copy to clipboard. Please select and copy manually.";
    }
  }
  
  // Display output in selected format
  function displayOutput(data) {
    switch(outputFormat) {
      case 'table':
        tableOutputData = data.outputData;
        break;
      case 'json':
        tableOutputData = JSON.stringify(data.outputRows, null, 2);
        break;
      case 'csv':
        tableOutputData = toCSV(data.outputRows);
        break;
    }
  }
  
  // Change output format
  function changeOutputFormat(format) {
    outputFormat = format;
    if (transformedData) {
      displayOutput(transformedData);
    }
  }

  // Dismiss duplicate warning
  function dismissDuplicateWarning() {
    duplicateWarning = null;
  }
</script>

<div class="tool-container">
  <header class="tool-header">
    <h1>Table Format Converter</h1>
  </header>
  
  <div class="converter-tabs" role="tablist">
    <button 
      type="button"
      class="converter-tab" 
      role="tab"
      aria-selected={tableActiveTab === 'converter'}
      class:active={tableActiveTab === 'converter'}
      onclick={() => setTableActiveTab('converter')}
    >
      Converter
    </button>
    <button 
      type="button"
      class="converter-tab" 
      role="tab"
      aria-selected={tableActiveTab === 'help'}
      class:active={tableActiveTab === 'help'}
      onclick={() => setTableActiveTab('help')}
    >
      Help
    </button>
  </div>
  
  {#if tableActiveTab === 'converter'}
    <div class="converter-section">
      <div class="configuration">
        <h2>Configuration</h2>
        <div class="config-grid">
          <div class="config-item">
            <label for="paramGroupName">Parameter Group Name:</label>
            <input type="text" id="paramGroupName" bind:value={paramGroupName}>
          </div>
          <div class="config-item">
            <label for="configGroupName">Config Group Name:</label>
            <input type="text" id="configGroupName" bind:value={configGroupName}>
          </div>
          <div class="config-item">
            <label for="idParamPrefix">Parameter ID Prefix:</label>
            <input type="text" id="idParamPrefix" bind:value={idParamPrefix}>
          </div>
          <div class="config-item">
            <label for="idConfigPrefix">Config ID Prefix:</label>
            <input type="text" id="idConfigPrefix" bind:value={idConfigPrefix}>
          </div>
          <div class="config-item">
            <label for="defaultIsActive">Default IsActive Value:</label>
            <select id="defaultIsActive" bind:value={defaultIsActive}>
              <option value="TRUE">TRUE</option>
              <option value="FALSE">FALSE</option>
            </select>
          </div>
          <div class="config-item">
            <label for="defaultIsDeleted">Default IsDeleted Value:</label>
            <select id="defaultIsDeleted" bind:value={defaultIsDeleted}>
              <option value="FALSE">FALSE</option>
              <option value="TRUE">TRUE</option>
            </select>
          </div>
        </div>
      </div>
      
      <div class="split-container">
        <div class="panel input-panel">
          <h2>Input: First Table Format</h2>
          <p>Enter your table in the format below:</p>
          <div class="sample-input">
            | linkedFeature | triggerCategory | triggerName | dbReference |
          </div>
          <textarea
            bind:value={tableInputData}
            placeholder="Paste your table or use sample data..."
            disabled={isConverting}
          ></textarea>
          
          <div class="controls">
            <button onclick={loadSample} class="secondary-button">Load Sample Data</button>
            <button onclick={clearInput} class="secondary-button">Clear</button>
            <button
              class="primary-button transform-button"
              onclick={handleConvert}
              disabled={isConverting || !tableInputData}
            >
              {#if isConverting}
                <span class="loading">Converting...</span>
              {:else}
                Convert to Second Format
              {/if}
            </button>
          </div>
        </div>
        
        <div class="panel results-panel">
          <h2>Output: Second Table Format</h2>
          <div class="output-tabs">
            <button 
              class:active={outputFormat === 'table'}
              onclick={() => changeOutputFormat('table')}
            >
              Table
            </button>
            <button 
              class:active={outputFormat === 'json'}
              onclick={() => changeOutputFormat('json')}
            >
              JSON
            </button>
            <button 
              class:active={outputFormat === 'csv'}
              onclick={() => changeOutputFormat('csv')}
            >
              CSV
            </button>
          </div>
          <textarea 
            bind:value={tableOutputData} 
            readonly 
            placeholder="Converted table will appear here in the format: | ID | FeatureGroup | Name | DataType | FeatureUnits | ..."
          ></textarea>
          
          <div class="controls">
            <button 
              class="primary-button copy-button"
              onclick={handleCopy}
              disabled={!tableOutputData}
            >
              Copy to Clipboard
            </button>
          </div>
        </div>
      </div>
      
      <!-- Duplicate Warning Alert -->
      {#if duplicateWarning}
        <div class="warning duplicate-alert">
          <div class="alert-header">
            <span class="warning-icon">⚠️</span>
            <span class="alert-title">Duplicate Rows Found</span>
            <button class="close-button" onclick={dismissDuplicateWarning}>×</button>
          </div>
          <div class="alert-content">
            <p>Found <strong>{duplicateWarning.count}</strong> duplicate row{duplicateWarning.count !== 1 ? 's' : ''} in the generated output (excluding ID column):</p>
            <div class="duplicate-details">
              {#each duplicateWarning.details as duplicate}
                <div class="duplicate-item">
                  <!-- Use textContent binding to prevent XSS -->
                  <pre class="duplicate-content">{duplicate.content}</pre>
                  <div class="duplicate-location">
                    Row {duplicate.currentRowIndex + 1} (ID: {duplicate.currentId}) duplicates Row {duplicate.originalRowIndex + 1} (ID: {duplicate.originalId})
                  </div>
                </div>
              {/each}
            </div>
            <p class="duplicate-note">
              <strong>Note:</strong> These duplicates were found in the generated output table. This may indicate patterns in your input data that result in similar output rows.
            </p>
          </div>
        </div>
      {/if}
      
      {#if conversionError}
        <div class="error">
          <!-- Use text content to prevent XSS -->
          <div class="error-message">{conversionError}</div>
        </div>
      {/if}
      
      {#if conversionSuccess}
        <div class="success">{conversionSuccess}</div>
      {/if}
    </div>
  {:else}
    <div class="panel help-section">
      <h3>How to Use This Converter</h3>
      <p>This tool converts the first table format to the second table format with the following features:</p>
      <ol>
        <li>Configure the output format using the Configuration section</li>
        <li>Paste your table in the first text area (input)</li>
        <li>Click "Convert to Second Format"</li>
        <li>The converted table will appear in the second text area (output)</li>
        <li>The tool will create unique FEAT_POI_PARAM entries for each trigger category</li>
        <li>Click "Copy to Clipboard" to copy the converted table</li>
      </ol>
      
      <h3>Duplicate Detection</h3>
      <p>The converter automatically detects duplicate rows in the generated output table and will show a warning if any are found. Duplicates are identified by comparing all column values except the ID column (case-insensitive). This helps identify potential issues in the conversion logic or input data patterns.</p>
      
      <h3>Input Format Example</h3>
      <div class="sample-data">
| fieldName | CATEGORY_A   | Trigger_A1                | Historical data reference.... |
| fieldName | CATEGORY_A   | Trigger_A2           | Historical data reference..... |
| fieldName | CATEGORY_B | Trigger_B1 | Historical data reference.... (ref) |
      </div>
      
      <h3>Output Format Example</h3>
      <div class="sample-data">
| ID                  | FeatureGroup    | Name                    | DataType | FeatureUnits | Remarks | Description          | RefGroup             | LinkedFeature | IsActive | IsDeleted | FeatureValue                                  |
|---------------------|-----------------|-------------------------|----------|--------------|---------|----------------------|----------------------|---------------|----------|-----------|-----------------------------------------------|
| FPP-20250101-000010 | FEAT_POI_PARAM  | CATEGORY_A   | string   |              |         | CATEGORY_A | fieldName             | fieldName      | TRUE     | FALSE     |                                               |
| FPP-20250101-000011 | FEAT_POI_PARAM  | CATEGORY_B    | string   |              |         | CATEGORY_B | fieldName           | fieldName      | TRUE     | FALSE     |                                               |
| FPPC-20250101-000001| FEAT_POI_CONFIG | Trigger_A1   | string   |              |         |                      | CATEGORY_A | fieldName      | TRUE     | FALSE     | Historical data reference.... |
| FPPC-20250101-000002| FEAT_POI_CONFIG | Trigger_A2    | string   |              |         |                      | CATEGORY_A | fieldName      | TRUE     | FALSE     | Historical data reference.... |
| FPPC-20250101-000003| FEAT_POI_CONFIG | Trigger_B1   | string   |              |         |                      | CATEGORY_B  | fieldName      | TRUE     | FALSE     | Historical data reference.... (ref) |
      </div>
    </div>
  {/if}
</div>

<style>
  /* Tabs */
  .converter-tabs {
    display: flex;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid var(--border-color);
  }
  
  .converter-tab {
    padding: 0.75rem 1.5rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 200ms var(--ease-out), color 200ms var(--ease-out), border-color 200ms var(--ease-out);
  }
  
  .converter-tab.active {
    border-bottom: 2px solid var(--primary-button-bg);
    color: var(--primary-button-bg);
    font-weight: 500;
  }
  
  .converter-tab:hover {
    background-color: var(--sidebar-hover);
  }
  
  .converter-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  /* Converter Actions */
  .controls {
    display: flex;
    gap: 10px;
    margin-top: 15px;
  }
  
  .transform-button {
    background-color: var(--accent);
    margin-left: auto;
  }

  @media (hover: hover) and (pointer: fine) {
    .transform-button:hover {
      background-color: var(--accent-hover);
    }
  }
  
  .copy-button {
    width: 100%;
  }

  .output-tabs {
    display: flex;
    margin-bottom: 10px;
    border-bottom: 1px solid var(--border-color);
  }
  
  .output-tabs button {
    padding: 8px 15px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition: background-color 200ms var(--ease-out), color 200ms var(--ease-out), border-color 200ms var(--ease-out);
  }
  
  .output-tabs button.active {
    border-bottom: 2px solid var(--primary-button-bg);
    color: var(--primary-button-bg);
    font-weight: 500;
  }
  
  .output-tabs button:hover:not(.active) {
    background-color: var(--sidebar-hover);
  }
  
  /* Sample Input Display */
  .sample-input {
    background-color: var(--secondary-bg);
    padding: 10px;
    border-radius: 4px;
    font-size: 0.8rem;
    margin-top: 5px;
    margin-bottom: 10px;
    color: var(--text-secondary);
    font-family: var(--font-mono);
    overflow-x: auto;
  }
  
  /* Configuration styles */
  .configuration {
    background-color: var(--panel-bg);
    padding: 15px;
    border-radius: 0.5rem;
    margin-bottom: 20px;
    border: 1px solid var(--border-color);
  }
  
  .configuration h2 {
    font-size: 1.1rem;
    margin-top: 0;
    margin-bottom: 15px;
  }
  
  .config-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
  }
  
  .config-item {
    display: flex;
    flex-direction: column;
  }
  
  .config-item label {
    margin-bottom: 5px;
    font-weight: 600;
    color: var(--text-color);
    font-size: 0.85rem;
  }
  
  .config-item input,
  .config-item select {
    padding: 8px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 0.9rem;
    background-color: var(--primary-bg);
    color: var(--text-color);
  }
  
  /* Duplicate Alert Styles */
  .duplicate-alert {
    background-color: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: 0.5rem;
    padding: 1rem;
    margin: 1rem 0;
    color: var(--text-color);
  }

  .alert-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .warning-icon {
    font-size: 1.2rem;
  }

  .alert-title {
    font-weight: 600;
    font-size: 1rem;
    flex-grow: 1;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: inherit;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 200ms var(--ease-out);
  }

  .close-button:hover {
    background-color: var(--sidebar-hover);
  }

  .alert-content p {
    margin: 0.5rem 0;
  }

  .duplicate-details {
    max-height: 200px;
    overflow-y: auto;
    margin: 0.75rem 0;
    border-left: 3px solid rgba(245, 158, 11, 0.4);
    padding-left: 0.75rem;
  }

  .duplicate-item {
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  .duplicate-item:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }

  .duplicate-content, pre.duplicate-content {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    background-color: var(--secondary-bg);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    margin: 0 0 0.25rem 0;
    overflow-x: auto;
    white-space: pre;
  }

  .duplicate-location {
    font-size: 0.8rem;
    opacity: 0.8;
  }

  .duplicate-note {
    font-size: 0.9rem;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border-color);
  }
  
  /* Help section */
  .help-section {
    padding: 1.5rem;
  }
  
  .help-section h3 {
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    color: var(--text-color);
    font-size: 1.1rem;
  }
  
  .help-section h3:first-child {
    margin-top: 0;
  }
  
  .help-section ol {
    padding-left: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .help-section li {
    margin-bottom: 0.5rem;
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
  }
  
  /* Error and success messages */
  .error {
    background-color: var(--error-bg);
    border-left: 3px solid var(--error-color);
    color: var(--error-color);
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    margin: 10px 0;
    font-size: 0.875rem;
  }

  .error-message {
    margin: 0;
    white-space: pre-wrap;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: inherit;
  }

  .success {
    background-color: var(--accent-subtle);
    border-left: 3px solid var(--success-color);
    color: var(--success-color);
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    margin: 10px 0;
    font-size: 0.875rem;
  }

  /* Ensure textarea scrolling */
  textarea {
    overflow: auto !important;
    resize: vertical;
  }
  
  /* Responsive design */
  @media (max-width: 768px) {
    .config-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .duplicate-details {
      max-height: 150px;
    }
    
    .duplicate-content {
      font-size: 0.8rem;
      word-break: break-all;
    }
  }
  
  @media (max-width: 480px) {
    .config-grid {
      grid-template-columns: 1fr;
    }
  }
</style>