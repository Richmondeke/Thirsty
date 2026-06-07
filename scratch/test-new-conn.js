const { Client } = require('pg');

async function testSingle() {
  const config = {
    user: 'postgres.qnzszxukvugigprimlwi',
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    database: 'postgres',
    password: 'Sk1d061Wh33764?!',
    port: 5432,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  };
  
  const client = new Client(config);
  try {
    console.log('Attempting to connect to NEW DB...');
    await client.connect();
    console.log('🎉 SUCCESS! Connected to new database via pooler.');
    
    // Let's run a query to verify
    const res = await client.query('SELECT now();');
    console.log('Query result:', res.rows[0]);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  } finally {
    await client.end();
  }
}

testSingle();
