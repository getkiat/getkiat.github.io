/**
 * Sanitizes input to prevent XSS attacks
 * @param {string} input - Raw input string
 * @returns {string} Sanitized string
 */
const sanitizeForDisplay = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>&"']/g, (char) => {
      const entities = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#x27;'
      };
      return entities[char] || char;
    });
};

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
 * Converts data from the first table format to the second format
 * @param {string} inputData - Input table data in pipe-separated format
 * @param {object} config - Configuration overrides for output formatting
 * @returns {object} Object containing success status, output data and metadata
 */
export const convertTableFormat = (inputData, config = {}) => {
    try {
      // Merge user config with defaults
      const defaultConfig = {
        paramGroupName: 'FEAT_POI_PARAM',
        configGroupName: 'FEAT_POI_CONFIG',
        idParamPrefix: 'FPP',
        idConfigPrefix: 'FPPC',
        isActiveValue: 'TRUE',
        isDeletedValue: 'FALSE'
      };
      const mergedConfig = { ...defaultConfig, ...config };

      // Security: Limit input size to prevent resource exhaustion (4.5MB)
      const MAX_INPUT_SIZE = 4500000;
      if (inputData.length > MAX_INPUT_SIZE) {
        return {
          success: false,
          error: `Input too large. Maximum size is ${MAX_INPUT_SIZE / 1000}KB`
        };
      }
      // Trim input and check for empty
      const trimmedInput = inputData.trim();
      if (!trimmedInput) {
        return { success: false, error: "Input data is empty" };
      }
      
      // Split input into lines with a maximum limit to prevent DoS
      const MAX_LINES = 45000;
      const allLines = trimmedInput.split('\n').filter(line => line.trim());
      
      if (allLines.length > MAX_LINES) {
        return {
          success: false,
          error: `Too many lines. Maximum ${MAX_LINES} lines allowed`
        };
      }
      
      const lines = allLines;
      
      if (lines.length === 0) {
        return { success: false, error: "No valid rows found in input data" };
      }
      
      // Parse first format (pipe-separated table) with detailed error tracking
      const inputRows = [];
      const parseErrors = [];
      
      lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();
        
        try {
          const cells = line.split('|')
            .map(cell => cell.trim())
            .filter(cell => cell !== '');

          // Check if row has minimum required columns
          if (cells.length < 3) {
            parseErrors.push({
              line: lineNumber,
              content: sanitizeForDisplay(trimmedLine),
              actualColumns: cells.length,
              expectedColumns: "at least 3",
              error: `Row has only ${cells.length} column(s), expected at least 3 (linkedFeature, triggerCategory, triggerName, [dbReference])`
            });
            return;
          }

          // Check for empty critical fields
          if (!cells[0] || !cells[1] || !cells[2]) {
            const emptyFields = [];
            if (!cells[0]) emptyFields.push("linkedFeature (column 1)");
            if (!cells[1]) emptyFields.push("triggerCategory (column 2)");
            if (!cells[2]) emptyFields.push("triggerName (column 3)");

            parseErrors.push({
              line: lineNumber,
              content: sanitizeForDisplay(trimmedLine),
              actualColumns: cells.length,
              error: `Required fields are empty: ${emptyFields.join(", ")}`
            });
            return;
          }

          // Escape special characters in cell data to prevent injection
          const escapedCells = cells.map(cell => escapeCellData(cell));

          inputRows.push({
            data: escapedCells,
            originalLine: trimmedLine,
            lineNumber: lineNumber
          });
          
        } catch (error) {
          parseErrors.push({
            line: lineNumber,
            content: sanitizeForDisplay(trimmedLine),
            error: `Parse error: ${sanitizeForDisplay(error.message)}`
          });
        }
      });
      
      // If we have parse errors, provide detailed feedback
      if (parseErrors.length > 0) {
        const errorDetails = parseErrors.map(err => 
          `Line ${err.line}: "${err.content}" - ${err.error}`
        ).join('\n');
        
        return {
          success: false,
          error: `Found ${parseErrors.length} problematic row(s):\n\n${errorDetails}\n\nExpected format: | linkedFeature | triggerCategory | triggerName | dbReference |`
        };
      }
      
      if (inputRows.length === 0) {
        return {
          success: false,
          error: 'No valid rows found after parsing. Please check your data format.'
        };
      }
      
      // Generate IDs and current date for new records
      const today = new Date();
      const dateStr = today.getFullYear() + 
                     ('0' + (today.getMonth() + 1)).slice(-2) + 
                     ('0' + today.getDate()).slice(-2);
      
      // Transform to second format
      const outputRows = [];
      let paramCounter = 10;
      let configCounter = 1;
      
      // Get unique combinations of LinkedFeature + trigger category for FEAT_POI_PARAM rows
      const uniqueParamCombinations = [];
      const seenCombinations = new Set();
      
      inputRows.forEach(row => {
        const linkedFeature = row.data[0];      // "name", "address", etc.
        const triggerCategory = row.data[1];    // "PRE-ARRIVAL TRIGGERS", etc.
        const combinationKey = `${linkedFeature}|${triggerCategory}`;
        
        if (!seenCombinations.has(combinationKey)) {
          seenCombinations.add(combinationKey);
          uniqueParamCombinations.push({
            linkedFeature,
            triggerCategory
          });
        }
      });
      
      // Create PARAM rows for unique LinkedFeature + trigger category combinations
      uniqueParamCombinations.forEach((combination) => {
        const paramId = `${mergedConfig.idParamPrefix}-${dateStr}-${String(paramCounter).padStart(6, '0')}`;
        outputRows.push([
          paramId,
          mergedConfig.paramGroupName,
          combination.triggerCategory,
          'string',
          '',
          '',
          combination.triggerCategory,
          combination.linkedFeature,
          combination.linkedFeature,
          mergedConfig.isActiveValue,
          mergedConfig.isDeletedValue,
          ''
        ]);
        paramCounter++;
      });

      // Create CONFIG rows for each specific trigger
      inputRows.forEach(row => {
        const linkedFeature = row.data[0];      // "name", "address", etc.
        const triggerCategory = row.data[1];    // "PRE-ARRIVAL TRIGGERS", etc.
        const triggerName = row.data[2];        // "APS Trigger", etc.
        const dbReference = row.data.length > 3 ? row.data[3] : '';

        const configId = `${mergedConfig.idConfigPrefix}-${dateStr}-${String(configCounter).padStart(6, '0')}`;
        outputRows.push([
          configId,
          mergedConfig.configGroupName,
          triggerName,
          'string',
          '',
          '',
          '',
          triggerCategory,
          linkedFeature,
          mergedConfig.isActiveValue,
          mergedConfig.isDeletedValue,
          dbReference
        ]);
        configCounter++;
      });
      
      // Create header row
      const headers = [
        'ID', 'FeatureGroup', 'Name', 'DataType', 'FeatureUnits', 
        'Remarks', 'Description', 'RefGroup', 'LinkedFeature', 
        'IsActive', 'IsDeleted', 'FeatureValue'
      ];
      
      // Create separator row for markdown tables
      const separator = headers.map(() => '---');
      
      // Combine all rows
      const allRows = [headers, separator, ...outputRows];
      
      // Format output as a pipe table
      const outputData = allRows
        .map(row => '| ' + row.join(' | ') + ' |')
        .join('\n');
      
      // Check for duplicates in the generated output rows
      const duplicateInfo = findOutputDuplicates(outputRows, sanitizeForDisplay);
      
      // Convert outputRows to structured data for different output formats
      const outputRowsStructured = outputRows.map(row => ({
        ID: row[0],
        FeatureGroup: row[1],
        Name: row[2],
        DataType: row[3],
        FeatureUnits: row[4],
        Remarks: row[5],
        Description: row[6],
        RefGroup: row[7],
        LinkedFeature: row[8],
        IsActive: row[9],
        IsDeleted: row[10],
        FeatureValue: row[11]
      }));

      return {
        success: true,
        outputData,
        outputRows: outputRowsStructured, // Include structured data for JSON/CSV export
        recordsProcessed: inputRows.length,
        recordsGenerated: outputRows.length,
        duplicates: duplicateInfo
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to convert: ${error.message}`
      };
    }
  };

/**
 * Find duplicate rows in the generated output data
 * @param {Array} outputRows - Array of generated output rows
 * @param {Function} sanitizer - Function to sanitize output for display
 * @returns {object} Object containing duplicate information
 */
function findOutputDuplicates(outputRows, sanitizer = (x) => x) {
  const seen = new Map();
  const duplicates = [];
  
  outputRows.forEach((row, index) => {
    // Create a key from the row data excluding the first column (ID)
    // since IDs should be unique but the rest of the data might be duplicated
    const dataWithoutId = row.slice(1); // Skip first column (ID)
    const rowKey = dataWithoutId.join('|').toLowerCase().trim();
    
    if (seen.has(rowKey)) {
      // Found a duplicate in output (same data except for ID)
      const originalRow = seen.get(rowKey);
      duplicates.push({
        content: sanitizer('| ' + row.join(' | ') + ' |'), // Sanitized table row
        currentRowIndex: index,
        originalRowIndex: originalRow.index,
        currentId: sanitizer(row[0]),
        originalId: sanitizer(originalRow.row[0]),
        rowData: row.map(cell => sanitizer(cell))
      });
    } else {
      seen.set(rowKey, { row: row, index: index });
    }
  });
  
  return {
    found: duplicates.length > 0,
    count: duplicates.length,
    details: duplicates
  };
}

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
        const strValue = String(value);
        
        // Security: Prevent CSV injection attacks
        // Prefix formulas with single quote to prevent execution
        if (/^[=+\-@\t\r]/.test(strValue)) {
          value = "'" + strValue;
        }
        
        // Escape quotes and wrap values in quotes
        return `"${strValue.replace(/"/g, '""')}"`;
      }).join(',');
    })
  ];
  
  return csvRows.join('\n');
};