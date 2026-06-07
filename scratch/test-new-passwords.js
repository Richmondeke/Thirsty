const { Client } = require('pg');

const PASSWORDS = [
  'Rich1996?',
  'Rich1996?!',
  'Sk1d061Wh33764?!',
  'Sk1d061Wh33764?'
];

const PROJECTS = [
  { name: 'Old DB', user: 'postgres.fftfnikbulfayrrjktuo' },
  { name: 'New DB', user: 'postgres.qnzszxukvugigprimlwi' }
];

async function testPassword(project, password, port) {
  const config = {
    user: project.user,
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
    console.log(`  [${project.name}] Password "${password}" on port ${port} failed: ${err.message}`);
    return false;
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
}

async function start() {
  console.log("Starting password test for old and new databases...");
  for (const project of PROJECTS) {
    console.log(`\nTesting for project: ${project.name}`);
    for (const pw of PASSWORDS) {
      for (const port of [5432, 6543]) {
        const ok = await testPassword(project, pw, port);
        if (ok) {
          console.log(`🎉 SUCCESS! Correct password for ${project.name} is: "${pw}" on port ${port}`);
          break;
        }
      }
    }
  }
}

start();
