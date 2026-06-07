const { createClient } = require('@supabase/supabase-js');

const URLS = [
  'https://fftfnikbulfayrrjktuo.supabase.co',
  'https://qnzszxukvugigprimlwi.supabase.co'
];

const KEYS = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdGZuaWtidWxmYXlycmprdHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNjgxNzgsImV4cCI6MjA5Mjc0NDE3OH0.L8U8_f19ZeMSdqvMgk3h7MHqnm6a_X2wukEPoAgz7qA',
  'sb_publishable_syk64tdKksD56BZDt7FmZA_0KgZ581e'
];

async function check(url, key) {
  const supabase = createClient(url, key);
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    console.log(`URL: ${url}`);
    console.log(`Key: ${key.substring(0, 20)}...`);
    if (error) {
      console.log(`❌ Result: ${error.message}\n`);
    } else {
      console.log(`✅ SUCCESS! Found ${data.length} rows.\n`);
    }
  } catch (e) {
    console.log(`💥 Exception: ${e.message}\n`);
  }
}

async function start() {
  for (const url of URLS) {
    for (const key of KEYS) {
      await check(url, key);
    }
  }
}

start();
