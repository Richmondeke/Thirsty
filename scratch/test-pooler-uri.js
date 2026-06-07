const { Client } = require('pg');

const PASSWORDS = [
  'Rich1996?',
  'Rich1996?!',
  'Sk1d061Wh33764?!',
  'Sk1d061Wh33764?'
];

const REF = 'qnzszxukvugigprimlwi';

async function testUri(pw) {
  // Try both transaction mode (6543) and session mode (5432) via URI
  for (const port of [6543, 5432]) {
    const connectionString = `postgresql://postgres.${REF}:${encodeURIComponent(pw)}@aws-0-eu-west-1.pooler.supabase.com:${port}/postgres`;
    const client = new Client({ 
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
    try {
      await client.connect();
      console.log(`🎉 SUCCESS! Connected with password "${pw}" on port ${port}`);
      await client.end();
      return true;
    } catch (err) {
      console.log(`  Password "${pw}" on port ${port} failed: ${err.message}`);
    }
  }
  return false;
}

async function start() {
  console.log("Testing new passwords using URL connection string...");
  for (const pw of PASSWORDS) {
    const ok = await testUri(pw);
    if (ok) break;
  }
}

start();
