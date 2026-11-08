const db = require("./db");

/**
 * List journal entries (قيود الترحيل) with optional limit.
 * Returns each entry with its lines; each line includes account code/name when available.
 */
function getAll(limit, result) {
  const limitVal = Math.min(parseInt(limit, 10) || 50, 200);
  const query = `
    SELECT
      je.idJournalEntry,
      je.entryDate,
      je.dailyReceiptId,
      je.sourceType,
      je.status,
      je.memo,
      je.createdBy,
      je.postedBy,
      je.postedAt,
      je.createdAt
    FROM JournalEntries je
    ORDER BY je.entryDate DESC, je.idJournalEntry DESC
    LIMIT ?
  `;
  db.query(query, [limitVal], (err, rows) => {
    if (err) {
      result(err, null);
      return;
    }
    if (!rows || rows.length === 0) {
      result(null, []);
      return;
    }
    const entryIds = rows.map((r) => r.idJournalEntry);
    const placeholders = entryIds.map(() => "?").join(",");
    const lineQuery = `
      SELECT
        jl.idJournalLine,
        jl.journalEntryId,
        jl.accountId,
        jl.debit,
        jl.credit,
        jl.lineMemo,
        a.code AS accountCode,
        a.name AS accountName
      FROM JournalLines jl
      LEFT JOIN Accounts a ON a.idAccount = jl.accountId
      WHERE jl.journalEntryId IN (${placeholders})
      ORDER BY jl.journalEntryId, jl.idJournalLine
    `;
    db.query(lineQuery, entryIds, (errLines, lineRows) => {
      if (errLines) {
        result(errLines, null);
        return;
      }
      const linesByEntry = {};
      (lineRows || []).forEach((l) => {
        if (!linesByEntry[l.journalEntryId]) linesByEntry[l.journalEntryId] = [];
        linesByEntry[l.journalEntryId].push({
          idJournalLine: l.idJournalLine,
          accountId: l.accountId,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
          lineMemo: l.lineMemo,
          accountCode: l.accountCode,
          accountName: l.accountName
        });
      });
      const list = rows.map((e) => ({
        idJournalEntry: e.idJournalEntry,
        entryDate: e.entryDate,
        dailyReceiptId: e.dailyReceiptId,
        sourceType: e.sourceType,
        status: e.status,
        memo: e.memo,
        createdBy: e.createdBy,
        postedBy: e.postedBy,
        postedAt: e.postedAt,
        createdAt: e.createdAt,
        lines: linesByEntry[e.idJournalEntry] || []
      }));
      result(null, list);
    });
  });
}

module.exports = { getAll };
