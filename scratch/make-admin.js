const { Client } = require('pg');

const CONFIG = {
  user: 'postgres.qnzszxukvugigprimlwi',
  host: 'aws-0-eu-west-1.pooler.supabase.com',
  database: 'postgres',
  password: 'Sk1d061Wh33764?!',
  port: 6543,
  ssl: { rejectUnauthorized: false }
};

async function makeAdmin() {
  const client = new Client(CONFIG);
  try {
    await client.connect();
    console.log('Connected to database.');

    // Check if user exists in auth.users
    const userRes = await client.query("SELECT id FROM auth.users WHERE email = 'godliverse@gmail.com';");
    
    if (userRes.rows.length === 0) {
      console.log("User 'godliverse@gmail.com' does not exist in the database yet.");
      console.log("They will automatically become an admin when they register because of our updates in main.js.");
    } else {
      const userId = userRes.rows[0].id;
      console.log(`User exists with ID: ${userId}. Updating profile to admin role...`);
      
      // Update public.profiles
      await client.query(`
        UPDATE public.profiles
        SET 
          socials = coalesce(socials, '{"instagram": "", "twitter": "", "discord": ""}'::jsonb) || '{"role": "admin"}'::jsonb
        WHERE id = $1;
      `, [userId]);
      
      console.log("Database update completed successfully! Profile role is now 'admin'.");
    }

  } catch (err) {
    console.error('Error making user admin:', err.message);
  } finally {
    await client.end();
  }
}

makeAdmin();
