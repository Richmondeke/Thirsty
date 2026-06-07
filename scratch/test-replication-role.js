const { Client } = require('pg');

const NEW_CONFIG = {
  user: 'postgres.qnzszxukvugigprimlwi',
  host: 'aws-0-eu-west-1.pooler.supabase.com',
  database: 'postgres',
  password: 'Sk1d061Wh33764?!',
  port: 6543,
  ssl: { rejectUnauthorized: false }
};

async function test() {
  const client = new Client(NEW_CONFIG);
  try {
    await client.connect();
    console.log('Testing SET session_replication_role...');
    await client.query("SET session_replication_role = 'replica';");
    console.log('✅ SUCCESS! session_replication_role can be set.');
    await client.query("SET session_replication_role = 'origin';");
  } catch (err) {
    console.log('❌ Failed:', err.message);
  } finally {
    await client.end();
  }
}

test();
