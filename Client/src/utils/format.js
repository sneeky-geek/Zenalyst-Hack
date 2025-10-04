/**
 * Format a number as currency
 * @param {number} value - The number to format
 * @param {string} currency - The currency symbol
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (value, currency = '₹') => {
  if (value === undefined || value === null) return `${currency}0.00`;
  
  return `${currency}${parseFloat(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Format a date string
 * @param {string} dateString - Date string to format
 * @param {string} format - Format style (short, medium, long)
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateString, format = 'medium') => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  if (isNaN(date)) {
    return dateString;
  }
  
  try {
    const options = {
      short: { month: 'numeric', day: 'numeric', year: '2-digit' },
      medium: { month: 'short', day: 'numeric', year: 'numeric' },
      long: { month: 'long', day: 'numeric', year: 'numeric' }
    };
    
    return date.toLocaleDateString('en-US', options[format] || options.medium);
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString;
  }
};

/**
 * Truncate text to a specific length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} - Truncated text
 */
export const truncateText = (text, length = 30) => {
  if (!text) return '';
  
  if (text.length <= length) return text;
  
  return `${text.substring(0, length)}...`;
};