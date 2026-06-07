const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://fftfnikbulfayrrjktuo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdGZuaWtidWxmYXlycmprdHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNjgxNzgsImV4cCI6MjA5Mjc0NDE3OH0.L8U8_f19ZeMSdqvMgk3h7MHqnm6a_X2wukEPoAgz7qA";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  const email = `testuser_${Date.now()}@example.com`;
  console.log('Signing up', email);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password: 'password123',
    options: { data: { username: 'Test User' } }
  });

  if (signUpError) {
    console.error('Signup error:', signUpError);
    return;
  }
  console.log('Signed up! User ID:', signUpData.user.id);

  console.log('Waiting 1500ms...');
  await new Promise(r => setTimeout(r, 1500));

  let refreshedProfile = null;
  for (let i = 0; i < 3; i++) {
    console.log(`Fetch attempt ${i+1}...`);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signUpData.session.user.id)
      .single();
    
    console.log('Result:', { data, error });
    if (data) {
      refreshedProfile = data;
      break;
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}

test();
