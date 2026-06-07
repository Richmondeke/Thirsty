const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://qnzszxukvugigprimlwi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_syk64tdKksD56BZDt7FmZA_0KgZ581e";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  const email = `testuser_${Date.now()}@example.com`;
  console.log('Signing up', email);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password: 'password123',
    options: {
      data: {
        username: 'Test User',
      }
    }
  });

  if (signUpError) {
    console.error('Signup error:', signUpError);
    return;
  }
  console.log('Signed up! User ID:', signUpData.user.id);

  // Wait a bit to see if trigger is slow?
  // await new Promise(r => setTimeout(r, 1000));

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      username: 'Updated User',
    })
    .eq('id', signUpData.session.user.id);

  console.log('Update error:', updateError);

  const { data: refreshedProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', signUpData.session.user.id)
    .single();

  console.log('Fetch error:', fetchError);
  console.log('Profile:', refreshedProfile);
}

test();
