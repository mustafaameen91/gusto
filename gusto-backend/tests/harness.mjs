// Test harness: a throw-away copy of the database (gusto_test) and its own backend on port 3999.
// The real database (gusto_db) is never touched.
import { spawn } from "node:child_process";
import { readFileSync, openSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

const here = path.dirname(fileURLToPath(import.meta.url));
const backend = path.resolve(here, "..");
const env = dotenv.parse(readFileSync(path.join(backend, ".env")));
const TEST_DB = "gusto_test";
const PORT = 3999;
export const LOG_FILE = path.join(here, ".server.log");
const API = `http://localhost:${PORT}/api`;

const dbConfig = {
  host: String(env.host || env.DB_HOST || "localhost").replace(/'/g, ""),
  user: String(env.user || env.DB_USER || "root").replace(/'/g, ""),
  password: String(env.password || env.DB_PASSWORD || "").replace(/'/g, ""),
  port: Number(String(env.port || env.DB_PORT || 3306).replace(/'/g, "")),
  multipleStatements: true,
  dateStrings: ["DATE"],
};

let conn;
async function connection() {
  if (!conn) conn = await mysql.createConnection(dbConfig);
  return conn;
}

const sqlFile = (name) => readFileSync(path.join(backend, "database", name), "utf8").replaceAll("gusto_db", TEST_DB);

// Fresh database: full schema + test data
export async function resetDb() {
  const c = await connection();
  await c.query(`DROP DATABASE IF EXISTS \`${TEST_DB}\``);
  await c.query(sqlFile("schema.sql"));
  await c.query(sqlFile("seed-test-data.sql"));
  await c.query(`USE \`${TEST_DB}\``);
}

// Run SQL in the test database and return rows as arrays of plain values
export async function sql(query, params = []) {
  const c = await connection();
  const [rows] = await c.query(query, params);
  return rows;
}
export async function one(query, params = []) {
  const rows = await sql(query, params);
  const row = rows[0];
  return row ? Object.values(row)[0] : undefined;
}

let server;
export async function startServer() {
  const out = openSync(LOG_FILE, "w");
  server = spawn(process.execPath, ["server.js"], {
    cwd: backend,
    env: { ...process.env, DB_NAME: TEST_DB, PORT: String(PORT), TZ: env.TZ || process.env.TZ || "Asia/Baghdad" },
    stdio: ["ignore", out, out],
  });
  for (let i = 0; i < 60; i++) {
    try {
      await fetch(`${API}/health`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw new Error("test server did not start; see " + LOG_FILE);
}
export async function stopServer() {
  if (server) server.kill();
  if (conn) await conn.end();
}

export async function call(method, urlPath, body, token) {
  const r = await fetch(API + urlPath, {
    method,
    headers: { "Content-Type": "application/json", ...(token && { Authorization: "Bearer " + token }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: r.status, data };
}

export const login = async (email, password = "123456") =>
  (await call("POST", "/auth/login", { email, password })).data.token;

let failures = 0;
export const failed = () => failures;
export function check(label, ok, detail = "") {
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail !== "" ? "  — " + detail : ""}`);
}

// Business date of now (07:00 → 02:59) in the restaurant's time zone
export const today = () => {
  const d = new Date();
  if (d.getHours() < 3) d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Shared helpers for scenarios
export async function ctx() {
  const A = await login("admin@gusto.com", "admin123");
  const items = (await call("GET", "/menu", null, A)).data;
  const m = (n) => items.find((i) => i.itemName === n);
  const shift = async () => {
    const r = await call("GET", "/daily-receipts/current", null, A);
    if (r.status === 200) return r.data.data || r.data;
    // open one if none (the app opens shifts automatically from the shift screen)
    const o = await call("POST", "/daily-receipts", { openingCash: 0, cashierId: 1, notes: "test" }, A);
    if (o.status >= 300) throw new Error("could not open shift: " + JSON.stringify(o.data));
    return (await call("GET", "/daily-receipts/current", null, A)).data;
  };
  const order = (its, { orderType = "cashier", saleType = "cash", discount = 0, discountType = "amount", customerId = null, token = A } = {}) => {
    const sub = its.reduce((s, [it, q, p]) => s + (p ?? Number(it.basePrice)) * q, 0);
    const net = discountType === "percentage" ? sub - (sub * discount) / 100 : sub - discount;
    return call("POST", "/orders", {
      orderType, saleType, customerId, totalAmount: net, subtotal: sub, discount, discountType,
      orderItems: its.map(([it, q, p, sizeId]) => ({ menuItemId: it.idMenuItem, quantity: q, price: p ?? Number(it.basePrice), itemSizeId: sizeId ?? null, specialInstructions: "" })),
    }, token);
  };
  const close = (id, closingCash, token = A) => call("PUT", `/daily-receipts/${id}/close`, { closingCash, notes: "test", nextShiftOpeningCash: 0 }, token);
  const shiftLines = async (id) => (await sql(
    `SELECT a.code, jl.debit, jl.credit FROM JournalLines jl JOIN JournalEntries je ON je.idJournalEntry = jl.journalEntryId
     JOIN Accounts a ON a.idAccount = jl.accountId WHERE je.sourceType = 'SHIFT_POST' AND je.dailyReceiptId = ? ORDER BY jl.idJournalLine`, [id]
  )).map((l) => ({ code: l.code, debit: +l.debit, credit: +l.credit }));
  const sumBy = (lines, code, side) => Math.round(lines.filter((l) => l.code === code).reduce((s, l) => s + l[side], 0) * 100) / 100;
  return { A, m, shift, order, close, shiftLines, sumBy };
}
