<script>
  import { convertFeatureFormat, toCSV } from '../../lib/converters/featureFormatConverter.js';
  import { copyToClipboard } from '../../lib/utils/clipboard.js';

  // Sample data
  const sampleData = `| featureName | featureParameter | featureType | featureUnits | configKey | configValue | configValueDefault |
|-------------|------------------|-------------|--------------|-----------|-------------|--------------------|
| dataMetric  | threshold        | integer     | units        | min       | 10          | 10                 |
| dataMetric  | threshold        | integer     | units        | mid       | 50          | 50                 |
| dataMetric  | threshold        | integer     | units        | max       | 100         | 100                |
| dataMetric  | intervalValue    | integer     | units        | min       | 5           | 5                  |
| dataMetric  | intervalValue    | integer     | units        | mid       | 25          | 25                 |
| dataMetric  | intervalValue    | integer     | units        | max       | 50          | 50                 |`;

  // State variables
  let inputTable = $state('');
  let outputTable = $state('');
  let outputFormat = $state('table');
  let transformedData = $state(null);
  let conversionError = $state(null);
  let conversionSuccess = $state(null);

  // Configuration variables
  let paramGroupName = $state('FEAT_PARAM');
  let configGroupName = $state('FEAT_CONFIG');
  let idParamPrefix = $state('FP');
  let idConfigPrefix = $state('FPC');
  let defaultIsActive = $state('FALSE');
  let defaultIsDeleted = $state('FALSE');
  
  // Load sample data
  function loadSample() {
    inputTable = sampleData;
    conversionError = null;
  }
  
  // Clear input
  function clearInput() {
    inputTable = '';
    conversionError = null;
    conversionSuccess = null;
  }
  
  // Convert input to output format
  function handleTransform() {
    try {
      const input = inputTable.trim();
      if (!input) {
        conversionError = 'Please enter input data';
        return;
      }
      
      // Get configuration
      const config = {
        paramGroupName,
        configGroupName,
        idParamPrefix,
        idConfigPrefix,
        isActiveValue: defaultIsActive,
        isDeletedValue: defaultIsDeleted
      };
      
      // Perform conversion
      const result = convertFeatureFormat(input, config);
      
      if (result.success) {
        transformedData = result;
        displayOutput(result);
        conversionError = null;
        conversionSuccess = `Successfully converted ${result.recordsProcessed} records to ${result.recordsGenerated} records.`;
      } else {
        conversionError = result.error;
        conversionSuccess = null;
      }
    } catch (error) {
      conversionError = `Error: ${error.message}`;
      conversionSuccess = null;
    }
  }
  
  // Display output in selected format
  function displayOutput(data) {
    switch(outputFormat) {
      case 'table':
        outputTable = data.outputData;
        break;
      case 'json':
        outputTable = JSON.stringify(data.outputRows, null, 2);
        break;
      case 'csv':
        outputTable = toCSV(data.outputRows);
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
  
  // Copy output to clipboard
  async function handleCopy() {
    if (!outputTable) return;
    
    const copied = await copyToClipboard(outputTable);
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
</script>

<div class="tool-container">
  <header class="tool-header">
    <h1>Feature Format Transformer</h1>
  </header>
  
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
          <option value="FALSE">FALSE</option>
          <option value="TRUE">TRUE</option>
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
      <h2>Input Format</h2>
      <p>Enter your table in the format below:</p>
      <div class="sample-input">
        | featureName | featureParameter | featureType | featureUnits | configKey | configValue | configValueDefault |
      </div>
      <textarea bind:value={inputTable} placeholder="Paste your table or use sample data..."></textarea>
      <div class="controls">
        <button onclick={loadSample} class="secondary-button">Load Sample Data</button>
        <button onclick={clearInput} class="secondary-button">Clear</button>
        <button onclick={handleTransform} class="primary-button transform-button">Convert to Second Format</button>
      </div>
    </div>
    
    <div class="panel output-panel">
      <h2>Output Format</h2>
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
      <textarea bind:value={outputTable} readonly placeholder="Converted data will appear here..."></textarea>
      <div class="controls">
        <button onclick={handleCopy} class="primary-button copy-button" disabled={!outputTable}>
          Copy to Clipboard
        </button>
      </div>
    </div>
  </div>
  
  {#if conversionError}
    <div class="error">{conversionError}</div>
  {/if}
  
  {#if conversionSuccess}
    <div class="success">{conversionSuccess}</div>
  {/if}
</div>

<style>
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
  
  .sample-input {
    background-color: var(--secondary-bg);
    padding: 10px;
    border-radius: 4px;
    font-size: 0.8rem;
    margin-top: 5px;
    margin-bottom: 10px;
    color: var(--text-secondary);
    font-family: monospace;
    overflow-x: auto;
  }
  
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
  
  @media (max-width: 768px) {
    .config-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (max-width: 480px) {
    .config-grid {
      grid-template-columns: 1fr;
    }
  }
</style>