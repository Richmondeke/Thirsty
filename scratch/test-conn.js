const { Client } = require('pg');

const PASSWORDS = [
  'Sk1d061Wh33764?',
  'sk1d061wh33764?',
  'Sk1dO61Wh33764?',
  'Sk1d061Wh33764',
  'Sk1d061wh33764',
  'Sk1dO61Wh33764',
  'Sk1dO61wh33764?',
  'Sk1dO61wh33764',
  
  // '1' as 'l'
  'Skld061Wh33764?',
  'SkldO61Wh33764?',
  'Skld061Wh33764',
  'SkldO61Wh33764',
  'Skld061wh33764?',
  'Skld061wh33764',
  'SkldO61wh33764?',
  'SkldO61wh33764',
  'skld061wh33764?',
  'skld061wh33764',
  'skldO61wh33764?',
  'skldO61wh33764',
  
  // '0' as 'o'
  'Sk1do61Wh33764?',
  'sk1do61wh33764?',
  'Sk1do61Wh33764',
  
  // Literal brackets
  '[Sk1d061Wh33764?]',
  '[Sk1dO61Wh33764?]',
  '[Skld061Wh33764?]'
];

const PROJECT = { name: 'New DB', user: 'postgres.qnzszxukvugigprimlwi' };

async function testPassword(password) {
  const config = {
    user: PROJECT.user,
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    database: 'postgres',
    password: password,
    port: 5432,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 3000
  };
  
  const client = new Client(config);
  try {
    await client.connect();
    return true;
  } catch (err) {
    return false;
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
}

async function start() {
  console.log(`Testing ${PASSWORDS.length} passwords for ${PROJECT.name}...`);
  for (const password of PASSWORDS) {
    const ok = await testPassword(password);
    console.log(`  Password: "${password}" -> ${ok ? 'SUCCESS' : 'FAILED'}`);
    if (ok) {
      console.log(`🎉 SUCCESS! The correct password is: "${password}"`);
      break;
    }
  }
}

start();
