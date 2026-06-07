const { Client } = require('pg');

const PASSWORDS = [
  'Sk1d061Wh33764?',
  '[Sk1d061Wh33764?]'
];

async function testNewPassword(password, port) {
  const config = {
    user: 'postgres.qnzszxukvugigprimlwi',
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
  console.log("Testing new project database connection with pooler...");
  for (const pw of PASSWORDS) {
    for (const port of [5432, 6543]) {
      const ok = await testNewPassword(pw, port);
      if (ok) {
        console.log(`🎉 SUCCESS! Correct password for NEW DB is: "${pw}" on port ${port}`);
        return;
      }
    }
  }
}

start();
