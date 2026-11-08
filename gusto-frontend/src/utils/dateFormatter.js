/**
 * Date formatting utilities for the restaurant management system
 * All dates are formatted as dd/mm/yyyy
 */

/**
 * Format a date to dd/mm/yyyy format
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string (dd/mm/yyyy)
 */
export const formatDate = (date) => {
  if (!date) return '-'
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  
  return `${day}/${month}/${year}`
}

/**
 * Format a date with time to dd/mm/yyyy HH:mm format
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date-time string
 */
export const formatDateTime = (date) => {
  if (!date) return '-'
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

/**
 * Format current date in Arabic with day name
 * @returns {string} Formatted current date
 */
export const formatCurrentDateArabic = () => {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()
  
  const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
  const dayName = dayNames[now.getDay()]
  
  return `${dayName}, ${day}/${month}/${year}`
}

