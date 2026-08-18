import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { config } from "../config";

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

export async function ensureDatabase(connectionString: string): Promise<void> {
  const url = new URL(connectionString);
  const database = url.pathname.replace(/^\//, "");
  if (!/^[a-zA-Z0-9_]+$/.test(database)) {
    throw new Error(`Unsafe database name: ${database}`);
  }

  const adminUrl = new URL(connectionString);
  adminUrl.pathname = "/postgres";
  const admin = new Pool({ connectionString: adminUrl.toString() });
  try {
    const existing = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [
      database,
    ]);
    if (existing.rowCount === 0) {
      await admin.query(`CREATE DATABASE ${database}`);
    }
  } finally {
    await admin.end();
  }
}

export async function migrate(connectionString = config.databaseUrl): Promise<void> {
  await ensureDatabase(connectionString);
  const pool = new Pool({ connectionString });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const applied = await pool.query("SELECT 1 FROM schema_migrations WHERE id = $1", [
        file,
      ]);
      if ((applied.rowCount ?? 0) > 0) {
        continue;
      }
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      await pool.query(sql);
      await pool.query("INSERT INTO schema_migrations (id) VALUES ($1)", [file]);
    }
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  migrate()
    .then(() => {
      console.log("Migrations applied");
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
