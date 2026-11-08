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


// ---------------------------------------------------------------------------
// Business days (same rule as the server): a day runs 03:00 → 02:59 next morning.
// Use these instead of new Date().toISOString(), which gives the UTC date and is
// a day off in Baghdad between midnight and 03:00.
// ---------------------------------------------------------------------------

/** Local calendar date as YYYY-MM-DD (for date inputs and API parameters) */
export const toYMD = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Today's business date (before 03:00 still counts as the previous day) */
export const todayBusinessDate = () => {
  const d = new Date()
  if (d.getHours() < 3) d.setDate(d.getDate() - 1)
  return toYMD(d)
}

/** YYYY-MM-DD plus n days */
export const addDaysYMD = (ymd, n) => {
  const [y, m, d] = ymd.split('-').map(Number)
  return toYMD(new Date(y, m - 1, d + n))
}

/** First day of the business date's month */
export const firstOfMonthYMD = (ymd = todayBusinessDate()) => ymd.slice(0, 8) + '01'

/** A DATE value from the API ('YYYY-MM-DD' or ISO) as YYYY-MM-DD for a date input */
export const dateInputValue = (value) => {
  if (!value) return ''
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return toYMD(new Date(value))
}
