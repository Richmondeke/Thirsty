// Test if the new publishable key works with the new Supabase project
const { createClient } = require('@supabase/supabase-js');

const NEW_URL = "https://qnzszxukvugigprimlwi.supabase.co";
const NEW_KEY = "sb_publishable_syk64tdKksD56BZDt7FmZA_0KgZ581e";

const OLD_URL = "https://fftfnikbulfayrrjktuo.supabase.co";
const OLD_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdGZuaWtidWxmYXlycmprdHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNjgxNzgsImV4cCI6MjA5Mjc0NDE3OH0.L8U8_f19ZeMSdqvMgk3h7MHqnm6a_X2wukEPoAgz7qA";

async function test() {
  // Test old project (should work)
  console.log("=== Testing OLD project (should work) ===");
  const oldSupa = createClient(OLD_URL, OLD_KEY);
  const { data: oldData, error: oldErr } = await oldSupa.from('profiles').select('id, email, username, thirstyclub_id').limit(5);
  console.log("Old project profiles:", oldErr ? `ERROR: ${oldErr.message}` : `${oldData?.length} rows found`);
  if (oldData) {
    oldData.forEach(r => console.log(`  ${r.thirstyclub_id} | ${r.email} | ${r.username}`));
  }

  // Count total users
  const { count: totalUsers } = await oldSupa.from('profiles').select('*', { count: 'exact', head: true });
  console.log(`Total users in old project: ${totalUsers}`);
  
  // Count total tickets
  const { count: totalTickets } = await oldSupa.from('tickets').select('*', { count: 'exact', head: true });
  console.log(`Total tickets in old project: ${totalTickets}`);

  // Test new project
  console.log("\n=== Testing NEW project ===");
  const newSupa = createClient(NEW_URL, NEW_KEY);
  const { data: newData, error: newErr } = await newSupa.from('profiles').select('id').limit(1);
  console.log("New project test:", newErr ? `ERROR: ${newErr.message}` : `OK - ${newData?.length} rows`);
  
  // Test new project health
  try {
    const res = await fetch(`${NEW_URL}/rest/v1/`, {
      headers: { 
        'apikey': NEW_KEY,
        'Authorization': `Bearer ${NEW_KEY}`
      }
    });
    console.log(`New project REST API status: ${res.status}`);
    const body = await res.text();
    console.log(`New project REST API body: ${body.substring(0, 200)}`);
  } catch (e) {
    console.log(`New project REST API error: ${e.message}`);
  }
}

test();
