const { Client } = require('pg');

const PASSWORDS = [
  'Rich1996?',
  'Rich1996?!',
  'Sk1d061Wh33764?!',
  'Sk1d061Wh33764?',
  '[Rich1996?]',
  '[Rich1996?!]',
  '[Sk1d061Wh33764?!]',
  '[Sk1d061Wh33764?]'
];

async function testPassword(pw) {
  const config = {
    user: 'postgres.fftfnikbulfayrrjktuo',
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    database: 'postgres',
    password: pw,
    port: 6543,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 3000
  };
  
  const client = new Client(config);
  try {
    await client.connect();
    return true;
  } catch (err) {
    console.log(`  Password "${pw}" failed: ${err.message}`);
    return false;
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
}

async function start() {
  console.log("Testing bracketed passwords for new database...");
  for (const pw of PASSWORDS) {
    const ok = await testPassword(pw);
    if (ok) {
      console.log(`🎉 SUCCESS! The correct password is: "${pw}"`);
      break;
    }
  }
}

start();
