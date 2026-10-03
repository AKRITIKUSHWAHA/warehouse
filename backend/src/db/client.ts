import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

export interface DbConnectionStatus {
  connected: boolean;
  databaseName?: string;
  error?: string;
}

export async function testDbConnection(): Promise<DbConnectionStatus> {
  let client: pg.PoolClient | null = null;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT current_database() AS db_name');
    return {
      connected: true,
      databaseName: result.rows[0]?.db_name,
    };
  } catch (error) {
    const errorMsg = (error as Error).message;
    console.error('PostgreSQL connection check failed:', errorMsg);
    return {
      connected: false,
      error: errorMsg,
    };
  } finally {
    if (client) {
      client.release();
    }
  }
}

