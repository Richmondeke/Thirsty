const { createClient } = require('@supabase/supabase-js');

const OLD_URL = "https://fftfnikbulfayrrjktuo.supabase.co";
const OLD_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdGZuaWtidWxmYXlycmprdHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNjgxNzgsImV4cCI6MjA5Mjc0NDE3OH0.L8U8_f19ZeMSdqvMgk3h7MHqnm6a_X2wukEPoAgz7qA";

async function run() {
  const oldSupa = createClient(OLD_URL, OLD_KEY);
  
  console.log("Fetching all profiles from old database via anon API...");
  const { data: profiles, error: err } = await oldSupa
    .from('profiles')
    .select('*');
    
  if (err) {
    console.error("Error fetching profiles:", err.message);
  } else {
    console.log(`Successfully fetched ${profiles.length} profiles!`);
    if (profiles.length > 0) {
      console.log("Sample profile:", profiles[0]);
    }
  }

  console.log("Fetching all tickets from old database via anon API...");
  const { data: tickets, error: ticketErr } = await oldSupa
    .from('tickets')
    .select('*');
    
  if (ticketErr) {
    console.error("Error fetching tickets:", ticketErr.message);
  } else {
    console.log(`Successfully fetched ${tickets.length} tickets!`);
    if (tickets.length > 0) {
      console.log("Sample ticket:", tickets[0]);
    }
  }
}

run();
