/**
 * Escapes special characters in cell data to prevent injection attacks
 * @param {string} input - Raw cell data
 * @returns {string} Escaped string safe for output
 */
const escapeCellData = (input) => {
  if (typeof input !== 'string') return '';
  return input
    // Escape backslashes first (before other escapes)
    .replace(/\\/g, '\\\\')
    // Escape pipe characters that could break table formatting
    .replace(/\|/g, '\\|')
    // Escape newlines and tabs
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
};

/**
 * Converts data from the feature table format to the second format
 * @param {string} inputData - Input table data in pipe-separated format
 * @param {object} config - Configuration options for the transformation
 * @returns {object} Object containing success status, output data and metadata
 */
export const convertFeatureFormat = (inputData, config = {}) => {
    try {
      // Default configuration
      const defaultConfig = {
        paramGroupName: 'FEAT_PARAM',
        configGroupName: 'FEAT_CONFIG',
        idParamPrefix: 'FP',
        idConfigPrefix: 'FPC',
        isActiveValue: 'FALSE',
        isDeletedValue: 'FALSE'
      };
      
      // Merge with provided config
      const mergedConfig = { ...defaultConfig, ...config };
      
      // Limit input size to prevent browser freeze
      const MAX_INPUT_SIZE = 4_500_000;
      if (inputData && inputData.length > MAX_INPUT_SIZE) {
        return { success: false, error: `Input too large. Maximum size is ${MAX_INPUT_SIZE / 1_000_000} MB` };
      }

      // Trim input and check for empty
      const trimmedInput = inputData.trim();
      if (!trimmedInput) {
        return { success: false, error: "Input data is empty" };
      }
      
      // Split input into lines
      const lines = trimmedInput.split('\n').filter(line => line.trim());
      
      if (lines.length < 3) { // Header + separator + at least one data row
        return { success: false, error: "Not enough rows in the table (need header + separator + data)" };
      }
      
      // Parse table
      const headers = lines[0].split('|')
        .map(cell => cell.trim())
        .filter(cell => cell !== '');
      
      if (headers.length < 6) {
        return {
          success: false,
          error: "Invalid input format. Table must have all required columns including: featureName, featureParameter, featureType, featureUnits, configKey, configValue"
        };
      }

      // Validate expected header names exist
      const requiredHeaders = ['featureName', 'featureParameter', 'featureType', 'featureUnits', 'configKey', 'configValue'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        return {
          success: false,
          error: `Missing required columns: ${missingHeaders.join(', ')}. Found columns: ${headers.join(', ')}`
        };
      }
      
      // Parse data rows (skip header and separator row)
      const dataRows = [];
      for (let i = 2; i < lines.length; i++) {
        const cells = lines[i].split('|')
          .map(cell => cell.trim())
          .filter(cell => cell !== '');

        if (cells.length !== headers.length) {
          return {
            success: false,
            error: `Row ${i-1} has ${cells.length} columns, but header has ${headers.length} columns. All rows must have the same number of columns.`
          };
        }

        // Escape special characters in cell data to prevent injection
        const escapedCells = cells.map(cell => escapeCellData(cell));

        const row = {};
        headers.forEach((header, index) => {
          row[header] = escapedCells[index];
        });

        dataRows.push(row);
      }
      
      // Generate current date for IDs
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      
      // Get unique feature parameters
      const uniqueParams = [...new Set(dataRows.map(row => row.featureParameter))];
      
      // Create output rows
      const outputRows = [];
      
      // Create FEAT_PARAM rows
      uniqueParams.forEach((param, index) => {
        const paramRow = dataRows.find(row => row.featureParameter === param);
        outputRows.push({
          ID: `${mergedConfig.idParamPrefix}-${dateStr}-${String(index + 1).padStart(6, '0')}`,
          FeatureGroup: mergedConfig.paramGroupName,
          Name: param,
          DataType: paramRow.featureType,
          FeatureUnits: paramRow.featureUnits,
          Remarks: '',
          Description: '',
          RefGroup: paramRow.featureName,
          LinkedFeature: paramRow.featureName,
          IsActive: mergedConfig.isActiveValue,
          IsDeleted: mergedConfig.isDeletedValue,
          FeatureValue: '',
          FeatureValueDefault: ''
        });
      });
      
      // Create FEAT_CONFIG rows
      let configIndex = 1;
      uniqueParams.forEach(param => {
        const paramRows = dataRows.filter(row => row.featureParameter === param);
        
        paramRows.forEach(row => {
          outputRows.push({
            ID: `${mergedConfig.idConfigPrefix}-${dateStr}-${String(configIndex).padStart(6, '0')}`,
            FeatureGroup: mergedConfig.configGroupName,
            Name: row.configKey.toUpperCase(),
            DataType: row.featureType,
            FeatureUnits: row.featureUnits,
            Remarks: '',
            Description: '',
            RefGroup: row.featureParameter,
            LinkedFeature: row.featureName,
            IsActive: mergedConfig.isActiveValue,
            IsDeleted: mergedConfig.isDeletedValue,
            FeatureValue: row.configValue,
            FeatureValueDefault: row.configValueDefault
          });
          configIndex++;
        });
      });
      
      // Guard against empty output
      if (outputRows.length === 0) {
        return { success: false, error: 'No output rows generated. Check that the featureParameter column is populated.' };
      }

      // Get headers for output table
      const outputHeaders = Object.keys(outputRows[0]);
      
      // Create separator row
      const separator = outputHeaders.map(() => '---');
      
      // Format as markdown table
      const formattedRows = [
        outputHeaders,
        separator,
        ...outputRows.map(row => Object.values(row))
      ].map(row => '| ' + row.join(' | ') + ' |');
      
      // Join rows with newlines
      const outputTable = formattedRows.join('\n');
      
      return {
        success: true,
        outputData: outputTable,
        recordsProcessed: dataRows.length,
        recordsGenerated: outputRows.length,
        outputRows: outputRows // Include raw data for JSON/CSV export
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to convert: ${error.message}`
      };
    }
  };
  
  /**
   * Convert output rows to CSV format
   * @param {Array} rows - Array of output objects
   * @returns {string} CSV formatted string
   */
  export const toCSV = (rows) => {
    if (!rows || !rows.length) return '';

    const headers = Object.keys(rows[0]);
    const csvRows = [
      headers.join(','),
      ...rows.map(row => {
        return headers.map(header => {
          let value = row[header] ?? '';
          let stringValue = String(value);

          // Security: Prevent CSV injection attacks
          // Prefix formulas with single quote to prevent execution
          if (/^[=+\-@\t\r]/.test(stringValue)) {
            stringValue = "'" + stringValue;
          }

          // Only quote values that need it: contains comma, quotes, or newlines
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            // Escape any existing quotes by doubling them, then wrap in quotes
            return `"${stringValue.replace(/"/g, '""')}"`;
          }

          // Return value as-is if no special characters
          return stringValue;
        }).join(',');
      })
    ];

    return csvRows.join('\n');
  };