// The restaurant's business day runs from 07:00 to 02:59:59 the next morning.
// Every "today" and every date range in the app goes through these helpers so that
// a day's report, a week's report and the shift screen all agree.
const DAY_START = "07:00:00";
const DAY_END = "02:59:59";
const CUTOFF_HOUR = 3; // before 03:00 still belongs to the previous business day

const pad = (n) => String(n).padStart(2, "0");

// YYYY-MM-DD plus n days, done on the calendar (independent of the server time zone)
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

// Business date of a moment in the restaurant's local time (process TZ, set in .env)
function businessDateOf(date = new Date()) {
  const local = new Date(date.getTime());
  if (local.getHours() < CUTOFF_HOUR) local.setDate(local.getDate() - 1);
  return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`;
}

const todayBusinessDate = () => businessDateOf(new Date());

// MySQL DATETIME bounds covering the business days startDate..endDate (inclusive)
function businessWindow(startDate, endDate = startDate) {
  return {
    startDateTime: `${startDate} ${DAY_START}`,
    endDateTime: `${addDays(endDate, 1)} ${DAY_END}`,
  };
}

module.exports = { addDays, businessDateOf, todayBusinessDate, businessWindow };
