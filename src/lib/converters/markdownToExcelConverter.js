/**
 * Converts markdown tables to Excel-compatible formats
 */

/**
 * Parse a markdown table and convert it to various output formats
 * @param {string} markdownInput - The markdown table input
 * @param {Object} options - Configuration options
 * @returns {Object} - Result object with success/error status and data
 */
export function convertMarkdownToExcel(markdownInput, options = {}) {
  try {
    const {
      outputFormat = 'tsv', // 'tsv', 'csv', 'json'
      includeHeaders = true,
      trimWhitespace = true,
      skipEmptyRows = true
    } = options;

    // Limit input size to prevent browser freeze
    const MAX_INPUT_SIZE = 4_500_000;
    if (markdownInput && markdownInput.length > MAX_INPUT_SIZE) {
      return { success: false, error: `Input too large. Maximum size is ${MAX_INPUT_SIZE / 1_000_000} MB` };
    }

    if (!markdownInput || !markdownInput.trim()) {
      return {
        success: false,
        error: 'Input markdown is empty'
      };
    }

    const parseResult = parseMarkdownTable(markdownInput.trim(), {
      trimWhitespace,
      skipEmptyRows
    });

    if (!parseResult.success) {
      return parseResult;
    }

    const { headers, rows, hasHeaders } = parseResult;
    
    let outputData;
    let mimeType;
    let fileExtension;

    switch (outputFormat) {
      case 'csv':
        outputData = generateCSV(headers, rows, includeHeaders && hasHeaders);
        mimeType = 'text/csv';
        fileExtension = 'csv';
        break;
      case 'json':
        outputData = generateJSON(headers, rows, includeHeaders && hasHeaders);
        mimeType = 'application/json';
        fileExtension = 'json';
        break;
      case 'tsv':
      default:
        outputData = generateTSV(headers, rows, includeHeaders && hasHeaders);
        mimeType = 'text/tab-separated-values';
        fileExtension = 'tsv';
        break;
    }

    return {
      success: true,
      outputData,
      mimeType,
      fileExtension,
      rowCount: rows.length,
      columnCount: headers ? headers.length : (rows[0] ? rows[0].length : 0),
      hasHeaders: hasHeaders && includeHeaders
    };

  } catch (error) {
    return {
      success: false,
      error: `Conversion failed: ${error.message}`
    };
  }
}

/**
 * Parse markdown table text into structured data
 * @param {string} markdown - Markdown table text
 * @param {Object} options - Parsing options
 * @returns {Object} - Parse result with headers and rows
 */
function parseMarkdownTable(markdown, options) {
  const { trimWhitespace = true, skipEmptyRows = true } = options;
  
  const lines = markdown.split('\n').map(line => line.trim()).filter(line => {
    if (!skipEmptyRows) return true;
    return line.length > 0;
  });

  if (lines.length === 0) {
    return {
      success: false,
      error: 'No table rows found in markdown'
    };
  }

  // Find table rows (lines that start and end with |)
  const tableLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.startsWith('|') && trimmed.endsWith('|');
  });

  if (tableLines.length === 0) {
    return {
      success: false,
      error: 'No valid markdown table rows found. Rows must start and end with |'
    };
  }

  // Parse the first row to determine if we have headers
  const firstRowCells = parseTableRow(tableLines[0], trimWhitespace);
  let headers = null;
  let dataRows = [];
  let hasHeaders = false;

  // Check if second line is a separator (contains only |, -, :, and spaces)
  if (tableLines.length > 1) {
    const secondLine = tableLines[1].trim();
    const separatorPattern = /^\|(\s*:?-+:?\s*\|)+\s*$/;
    
    if (separatorPattern.test(secondLine)) {
      // We have headers
      hasHeaders = true;
      headers = firstRowCells;
      // Skip the separator row and process data rows
      dataRows = tableLines.slice(2).map(line => parseTableRow(line, trimWhitespace));
    } else {
      // No headers, all rows are data
      hasHeaders = false;
      dataRows = tableLines.map(line => parseTableRow(line, trimWhitespace));
    }
  } else {
    // Single row, treat as data
    hasHeaders = false;
    dataRows = [firstRowCells];
  }

  // Validate that all rows have the same number of columns
  const expectedColumns = hasHeaders ? headers.length : (dataRows[0] ? dataRows[0].length : 0);
  const inconsistentRows = [];

  dataRows.forEach((row, index) => {
    if (row.length !== expectedColumns) {
      inconsistentRows.push({
        rowIndex: index + (hasHeaders ? 3 : 1), // Adjust for header and separator
        expected: expectedColumns,
        actual: row.length,
        content: tableLines[index + (hasHeaders ? 2 : 0)]
      });
    }
  });

  if (inconsistentRows.length > 0) {
    const errorDetails = inconsistentRows.map(row => 
      `Row ${row.rowIndex}: Expected ${row.expected} columns, got ${row.actual} columns\n"${row.content}"`
    ).join('\n');
    
    return {
      success: false,
      error: `Inconsistent column count detected:\n\n${errorDetails}`
    };
  }

  return {
    success: true,
    headers,
    rows: dataRows,
    hasHeaders
  };
}

/**
 * Parse a single table row into individual cell values
 * @param {string} rowText - Raw table row text
 * @param {boolean} trimWhitespace - Whether to trim cell values
 * @returns {Array} - Array of cell values
 */
function parseTableRow(rowText, trimWhitespace = true) {
  // Remove leading and trailing |
  let cleaned = rowText.trim();
  if (cleaned.startsWith('|')) cleaned = cleaned.slice(1);
  if (cleaned.endsWith('|')) cleaned = cleaned.slice(0, -1);

  // Split by | and process each cell
  const cells = cleaned.split('|').map(cell => {
    let value = trimWhitespace ? cell.trim() : cell;

    // Handle escaped pipes and other markdown escapes
    value = value
      .replace(/\\\|/g, '|')  // Unescape pipes
      .replace(/\\n/g, '\n') // Handle escaped newlines
      .replace(/\\t/g, '\t') // Handle escaped tabs
      .replace(/\\\\/g, '\\'); // Handle escaped backslashes

    return value;
  });

  return cells;
}

/**
 * Generate TSV (Tab Separated Values) output
 * @param {Array|null} headers - Header row
 * @param {Array} rows - Data rows
 * @param {boolean} includeHeaders - Whether to include headers
 * @returns {string} - TSV formatted string
 */
function generateTSV(headers, rows, includeHeaders) {
  const lines = [];
  
  if (includeHeaders && headers) {
    lines.push(headers.join('\t'));
  }
  
  rows.forEach(row => {
    lines.push(row.join('\t'));
  });
  
  return lines.join('\n');
}

/**
 * Generate CSV output with proper escaping
 * @param {Array|null} headers - Header row
 * @param {Array} rows - Data rows
 * @param {boolean} includeHeaders - Whether to include headers
 * @returns {string} - CSV formatted string
 */
function generateCSV(headers, rows, includeHeaders) {
  const lines = [];
  
  if (includeHeaders && headers) {
    lines.push(headers.map(escapeCSVField).join(','));
  }
  
  rows.forEach(row => {
    lines.push(row.map(escapeCSVField).join(','));
  });
  
  return lines.join('\n');
}

/**
 * Generate JSON output
 * @param {Array|null} headers - Header row
 * @param {Array} rows - Data rows
 * @param {boolean} includeHeaders - Whether to use headers as keys
 * @returns {string} - JSON formatted string
 */
function generateJSON(headers, rows, includeHeaders) {
  if (includeHeaders && headers) {
    // Create array of objects using headers as keys
    const objects = rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
    return JSON.stringify(objects, null, 2);
  } else {
    // Create array of arrays
    const allRows = [];
    if (headers) allRows.push(headers);
    allRows.push(...rows);
    return JSON.stringify(allRows, null, 2);
  }
}

/**
 * Escape CSV field values
 * @param {string} field - Field value to escape
 * @returns {string} - Escaped field value
 */
function escapeCSVField(field) {
  if (typeof field !== 'string') {
    field = String(field);
  }

  // Security: Prevent CSV injection attacks
  // Prefix formulas with single quote to prevent execution
  if (/^[=+\-@\t\r]/.test(field)) {
    field = "'" + field;
  }

  // If field contains comma, newline, or quote, wrap in quotes and escape quotes
  if (field.includes(',') || field.includes('\n') || field.includes('"')) {
    return `"${field.replace(/"/g, '""')}"`;
  }

  return field;
}

/**
 * Generate sample markdown table for testing
 * @returns {string} - Sample markdown table
 */
export function generateSampleMarkdown() {
  return `| Name | Age | City | Country |
|------|-----|------|---------|
| John Doe | 25 | New York | USA |
| Jane Smith | 30 | London | UK |
| Bob Johnson | 35 | Tokyo | Japan |
| Alice Brown | 28 | Paris | France |`;
}