import { closePool, initPool, query } from './db/mysql.js';

async function main(): Promise<void> {
  initPool();

  try {
    await getProduct(18744);
  } finally {
    await closePool();
  }
}

main().catch((error: unknown) => {
  console.error('Ошибка при запросе к БД:', error);
  process.exitCode = 1;
});

async function getProduct(idProduct: number) {
  console.log({ idProduct });
  const rows = await query('select * from chbfs_products cp where id = ?', [18744]);
  console.log('SELECT 1:', rows);
}