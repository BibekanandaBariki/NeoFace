// Utility functions for 12-hour time format (Indian time)

/**
 * Convert 24-hour format to 12-hour format with AM/PM
 * @param {string} time24 - Time in 24-hour format (HH:mm)
 * @returns {string} - Time in 12-hour format (HH:mm AM/PM)
 */
export const convertTo12Hour = (time24) => {
  if (!time24) return '';
  
  const [hours, minutes] = time24.split(':').map(Number);
  
  if (isNaN(hours) || isNaN(minutes)) return time24;
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Convert 12-hour format to 24-hour format
 * @param {string} time12 - Time in 12-hour format (HH:mm AM/PM or HH:mm)
 * @returns {string} - Time in 24-hour format (HH:mm)
 */
export const convertTo24Hour = (time12) => {
  if (!time12) return '';
  
  // If already in 24-hour format (no AM/PM)
  if (!time12.match(/[AP]M/i)) {
    return time12;
  }
  
  const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return time12;
  
  let hours = parseInt(match[1]);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

/**
 * Format time for display in Indian format
 * @param {string} time - Time in any format
 * @returns {string} - Formatted time
 */
export const formatTimeForDisplay = (time) => {
  if (!time) return '';
  const time24 = convertTo24Hour(time);
  return convertTo12Hour(time24);
};

