const { Client } = require('pg');

const PASSWORDS = [
  'Sk1d061Wh33764?',
  'sk1d061wh33764?',
  'Sk1dO61Wh33764?',
  'Sk1d061Wh33764',
  '[Sk1d061Wh33764?]'
];

async function testOldPassword(password, port) {
  const config = {
    user: 'postgres.fftfnikbulfayrrjktuo',
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    database: 'postgres',
    password: password,
    port: port,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 3000
  };
  
  const client = new Client(config);
  try {
    await client.connect();
    return true;
  } catch (err) {
    console.log(`  Password "${password}" on port ${port} failed: ${err.message}`);
    return false;
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
}

async function start() {
  console.log("Testing old project database connection with pooler...");
  for (const pw of PASSWORDS) {
    for (const port of [5432, 6543]) {
      const ok = await testOldPassword(pw, port);
      if (ok) {
        console.log(`🎉 SUCCESS! Correct password for OLD DB is: "${pw}" on port ${port}`);
        return;
      }
    }
  }
}

start();
