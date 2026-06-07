const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://qnzszxukvugigprimlwi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_syk64tdKksD56BZDt7FmZA_0KgZ581e";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('profiles').select('id, thirstyclub_id').limit(1);
  console.log('Profiles check:', { data, error });
}
check();
