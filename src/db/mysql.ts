import mysql from 'mysql2/promise';
import type {
  ExecuteValues,
  Pool,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2/promise';

import { dbConfig } from '../config/db.config.js';

let pool: Pool | null = null;

/**
 * Инициализация пула соединений.
 * Вызывается один раз при старте приложения.
 */
export function initPool(): Pool {
  if (pool) return pool;

  console.log({dbConfig});
  

  const newPool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

  pool = newPool;
  return newPool;
}
 

/**
 * Получить пул (с автоинициализацией).
 */
export function getPool(): Pool {
  return pool ?? initPool();
}

/**
 * Выполнить SELECT-запрос, вернуть типизированные строки.
 */
export async function query<T extends RowDataPacket = RowDataPacket>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const [rows] = await getPool().query<T[]>(sql, params);
  return rows;
}

/**
 * Выполнить INSERT / UPDATE / DELETE.
 * Возвращает ResultSetHeader (insertId, affectedRows и т.д.).
 */
export async function execute(
  sql: string,
  params: ExecuteValues[] = [] // было unknown[]
): Promise<ResultSetHeader> {
  const [result] = await getPool().execute<ResultSetHeader>(sql, params);
  return result;
}

/**
 * Выполнить произвольный код в рамках транзакции.
 * При ошибке — откат, иначе — commit.
 */
export async function withTransaction<T>(
  fn: (conn: PoolConnection) => Promise<T>
): Promise<T> {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Проверка соединения (полезно для healthcheck).
 */
export async function checkConnection(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

/**
 * Корректное закрытие пула при остановке приложения.
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}