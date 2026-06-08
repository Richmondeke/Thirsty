const { Client } = require('pg');

const CONFIG = {
  user: 'postgres.qnzszxukvugigprimlwi',
  host: 'aws-0-eu-west-1.pooler.supabase.com',
  database: 'postgres',
  password: 'Sk1d061Wh33764?!',
  port: 6543,
  ssl: { rejectUnauthorized: false }
};

async function run() {
  const client = new Client(CONFIG);
  try {
    await client.connect();
    console.log('Connected to database.');

    // 1. Delete user ogunwuyi.olumide@yahoo.com
    const emailToDelete = 'ogunwuyi.olumide@yahoo.com';
    console.log(`Searching for user: ${emailToDelete}...`);
    const searchRes = await client.query('SELECT id FROM auth.users WHERE email = $1', [emailToDelete]);
    
    if (searchRes.rows.length === 0) {
      console.log(`User ${emailToDelete} not found in database.`);
    } else {
      const userId = searchRes.rows[0].id;
      console.log(`Found user ${emailToDelete} with ID: ${userId}. Deleting user...`);
      // Delete from auth.users (cascades to public.profiles and public.tickets)
      await client.query('DELETE FROM auth.users WHERE id = $1', [userId]);
      console.log(`Successfully deleted user ${emailToDelete} and all associated profiles/tickets.`);
    }

    // 2. Make bookthirsty234@gmail.com an admin
    const emailToAdmin = 'bookthirsty234@gmail.com';
    console.log(`Searching for user: ${emailToAdmin}...`);
    const adminSearchRes = await client.query('SELECT id FROM auth.users WHERE email = $1', [emailToAdmin]);
    
    if (adminSearchRes.rows.length === 0) {
      console.log(`User ${emailToAdmin} not found in database yet. They will be treated as admin via whitelisting once registered.`);
    } else {
      const userId = adminSearchRes.rows[0].id;
      console.log(`Found user ${emailToAdmin} with ID: ${userId}. Updating profile socials role to admin...`);
      await client.query(`
        UPDATE public.profiles
        SET socials = coalesce(socials, '{"instagram": "", "twitter": "", "discord": ""}'::jsonb) || '{"role": "admin"}'::jsonb
        WHERE id = $1
      `, [userId]);
      console.log(`Successfully made ${emailToAdmin} a database admin!`);
    }

  } catch (err) {
    console.error('Error running user management script:', err.message);
  } finally {
    await client.end();
  }
}

run();
