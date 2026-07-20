import { Pool } from "pg";

// Reuse one pool across hot-reloads / serverless invocations
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

export const db =
  global._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") {
  global._pgPool = db;
}
