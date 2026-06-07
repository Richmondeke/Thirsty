const { Client } = require('pg');

async function testSingle() {
  const config = {
    user: 'postgres.qnzszxukvugigprimlwi',
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    database: 'postgres',
    password: 'Sk1d061Wh33764?',
    port: 6543,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  };
  
  const client = new Client(config);
  try {
    console.log('Attempting to connect with Sk1d061Wh33764?...');
    await client.connect();
    console.log('🎉 SUCCESS!');
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  } finally {
    await client.end();
  }
}

testSingle();
