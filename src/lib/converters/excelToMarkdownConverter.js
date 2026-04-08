/**
 * Excel/CSV to Markdown Table Converter
 * Converts pasted Excel data (tab-separated) or CSV to Markdown table format
 */

/**
 * Converts Excel/CSV data to Markdown table format
 * @param {string} input - Raw pasted data from Excel or CSV
 * @param {Object} options - Conversion options
 * @returns {Object} - Result object with success status and converted data
 */
export const convertToMarkdown = (input, options = {}) => {
  try {
    const { 
      hasHeaders = true, 
      delimiter = 'auto',
      alignment = 'left',
      trimWhitespace = true,
      skipEmptyRows = true 
    } = options;

    // Limit input size to prevent browser freeze
    const MAX_INPUT_SIZE = 4_500_000;
    if (input && input.length > MAX_INPUT_SIZE) {
      return { success: false, error: `Input too large. Maximum size is ${MAX_INPUT_SIZE / 1_000_000} MB` };
    }

    if (!input || !input.trim()) {
      return {
        success: false,
        error: 'Input data is empty'
      };
    }

    // Auto-detect delimiter if set to 'auto'
    let actualDelimiter = delimiter;
    if (delimiter === 'auto') {
      const tabCount = (input.match(/\t/g) || []).length;
      const commaCount = (input.match(/,/g) || []).length;
      const semicolonCount = (input.match(/;/g) || []).length;
      
      if (tabCount > commaCount && tabCount > semicolonCount) {
        actualDelimiter = '\t';
      } else if (commaCount > semicolonCount) {
        actualDelimiter = ',';
      } else {
        actualDelimiter = ';';
      }
    }

    // Split input into rows, handling multi-line cells properly
    let rows;
    
    if (actualDelimiter === '\t') {
      // For tab-delimited data (Excel paste), use smarter row splitting
      rows = smartRowSplit(input.trim(), actualDelimiter);
    } else {
      // For comma/semicolon delimited, use simple split (CSV files typically handle this differently)
      rows = input.trim().split('\n');
    }
    
    if (skipEmptyRows) {
      rows = rows.filter(row => row.trim());
    }

    if (rows.length === 0) {
      return {
        success: false,
        error: 'No valid rows found'
      };
    }

    // Parse each row into columns with detailed error tracking
    const parsedRows = [];
    const parseErrors = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNumber = i + 1;
      
      try {
        let columns;
        
        if (actualDelimiter === ',') {
          // Handle CSV parsing with quoted values
          columns = parseCSVRow(row);
        } else {
          // Simple split for tab or semicolon delimited
          columns = row.split(actualDelimiter);
        }

        if (trimWhitespace) {
          columns = columns.map(col => col.trim());
        }

        // Filter out empty columns only if they're all empty
        const nonEmptyColumns = columns.filter(col => col && col.trim());
        if (nonEmptyColumns.length === 0) {
          parseErrors.push({
            line: lineNumber,
            content: row,
            error: 'Row contains no data after parsing'
          });
          continue;
        }

        parsedRows.push({
          data: columns,
          originalLine: row,
          lineNumber: lineNumber
        });
        
      } catch (error) {
        parseErrors.push({
          line: lineNumber,
          content: row,
          error: error.message
        });
      }
    }

    // If we have parse errors, provide detailed feedback
    if (parseErrors.length > 0) {
      const errorDetails = parseErrors.map(err => 
        `Line ${err.line}: "${err.content}" - ${err.error}`
      ).join('\n');
      
      return {
        success: false,
        error: `Found ${parseErrors.length} problematic row(s):\n\n${errorDetails}`
      };
    }

    if (parsedRows.length === 0) {
      return {
        success: false,
        error: 'No valid rows found after parsing'
      };
    }

    // Find the maximum number of columns and validate consistency
    const columnCounts = parsedRows.map(row => row.data.length);
    const maxColumns = Math.max(...columnCounts);
    const minColumns = Math.min(...columnCounts);
    
    // Check for inconsistent column counts and warn about them
    const inconsistentRows = [];
    if (maxColumns !== minColumns) {
      parsedRows.forEach(row => {
        if (row.data.length !== maxColumns) {
          inconsistentRows.push({
            line: row.lineNumber,
            content: row.originalLine,
            columns: row.data.length,
            expected: maxColumns
          });
        }
      });
    }

    // Ensure all rows have the same number of columns
    const normalizedRows = parsedRows.map(row => {
      const rowData = [...row.data];
      while (rowData.length < maxColumns) {
        rowData.push('');
      }
      return rowData;
    });

    // Add warning about inconsistent rows to the result
    let warnings = [];
    if (inconsistentRows.length > 0) {
      const warningDetails = inconsistentRows.map(row => 
        `Line ${row.line} has ${row.columns} columns (expected ${row.expected}): "${row.content}"`
      ).join('\n');
      
      warnings.push(`Column count inconsistency detected:\n${warningDetails}`);
    }

    // Generate markdown table
    let markdown = '';
    
    if (normalizedRows.length === 0) {
      return {
        success: false,
        error: 'No data to convert'
      };
    }

    // Generate markdown table
    const alignmentChar = alignment === 'center' ? ':---:' : alignment === 'right' ? '---:' : '---';
    
    if (hasHeaders) {
      // First row is headers
      const headerRow = normalizedRows[0];
      markdown += '| ' + headerRow.map(cell => escapeMarkdownTableCell(cell)).join(' | ') + ' |\n';
      
      // Add separator row (only when we have headers)
      markdown += '|' + Array(maxColumns).fill(` ${alignmentChar} `).join('|') + '|\n';
      
      // Add data rows (skip first row since it's headers)
      const dataRows = normalizedRows.slice(1);
      dataRows.forEach(row => {
        markdown += '| ' + row.map(cell => escapeMarkdownTableCell(cell)).join(' | ') + ' |\n';
      });
    } else {
      // No headers - just output all rows as plain data without separator row
      // This creates a simple pipe-separated format without markdown table headers
      normalizedRows.forEach(row => {
        markdown += '| ' + row.map(cell => escapeMarkdownTableCell(cell)).join(' | ') + ' |\n';
      });
    }

    return {
      success: true,
      markdown: markdown.trim(),
      rowCount: normalizedRows.length,
      columnCount: maxColumns,
      delimiter: actualDelimiter,
      hasHeaders,
      warnings: warnings.length > 0 ? warnings : null
    };

  } catch (error) {
    return {
      success: false,
      error: `Conversion failed: ${error.message}`
    };
  }
};

/**
 * Smart row splitting for tab-delimited Excel data that handles multi-line cells
 * @param {string} input - Raw input text
 * @param {string} delimiter - The delimiter being used (should be tab)
 * @returns {Array} - Array of row strings
 */
function smartRowSplit(input, delimiter) {
  const rows = [];
  const lines = input.split('\n');
  let currentRow = '';
  let expectedColumns = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (currentRow) {
      // We're continuing a multi-line cell
      currentRow += '\n' + line;
    } else {
      currentRow = line;
    }
    
    // Count columns in current accumulated row
    const columnCount = currentRow.split(delimiter).length;
    
    // If this is the first row, establish expected column count
    if (expectedColumns === null && currentRow.trim()) {
      expectedColumns = columnCount;
    }
    
    // Check if we have the expected number of columns and the row seems complete
    if (expectedColumns !== null && columnCount >= expectedColumns) {
      // Additional check: see if the next line (if exists) starts what looks like a new row
      const nextLine = i + 1 < lines.length ? lines[i + 1] : null;
      let looksLikeNewRow = false;
      
      if (nextLine !== null) {
        // If next line starts with text and has multiple delimiters, it's likely a new row
        const nextLineColumns = nextLine.split(delimiter).length;
        looksLikeNewRow = nextLineColumns > 1 || nextLine.trim() === '';
      }
      
      if (nextLine === null || looksLikeNewRow) {
        // This row is complete
        rows.push(currentRow);
        currentRow = '';
      }
    }
  }
  
  // Add any remaining content as the last row
  if (currentRow.trim()) {
    rows.push(currentRow);
  }
  
  return rows;
}

/**
 * Parse a CSV row handling quoted values and escaped quotes
 * @param {string} row - CSV row string
 * @returns {Array} - Array of column values
 */
function parseCSVRow(row) {
  const columns = [];
  let currentColumn = '';
  let inQuotes = false;
  let i = 0;

  while (i < row.length) {
    const char = row[i];
    const nextChar = row[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentColumn += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Column separator
      columns.push(currentColumn);
      currentColumn = '';
      i++;
    } else {
      currentColumn += char;
      i++;
    }
  }

  // Add the last column
  columns.push(currentColumn);
  
  return columns;
}

/**
 * Escape special markdown characters in table cells
 * @param {string} cell - Cell content
 * @returns {string} - Escaped cell content
 */
function escapeMarkdownTableCell(cell) {
  if (!cell) return '';

  return cell
    .replace(/\r/g, '')       // Remove carriage returns
    .replace(/\n/g, ' ')      // Replace newlines with space (markdown tables are single-line)
    .replace(/\\/g, '\\\\')   // Escape backslashes
    .replace(/\|/g, '\\|')    // Escape pipe characters for markdown
    .trim();
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};