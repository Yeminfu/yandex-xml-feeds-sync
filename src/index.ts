import { closePool, initPool, query } from './db/mysql';

async function main(): Promise<void> {
  initPool();

  try {
    const rows = await query('SELECT 1');
    console.log('SELECT 1:', rows);
  } finally {
    await closePool();
  }
}

main().catch((error: unknown) => {
  console.error('Ошибка при запросе к БД:', error);
  process.exitCode = 1;
});
