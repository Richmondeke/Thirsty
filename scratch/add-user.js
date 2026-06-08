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

    const email = 'ogunwuyi.olumide@yahoo.com';
    const username = 'Olumide Ogunwuyi';
    
    // Check if user already exists
    const searchRes = await client.query('SELECT id FROM auth.users WHERE email = $1', [email]);
    let userId;

    if (searchRes.rows.length > 0) {
      userId = searchRes.rows[0].id;
      console.log(`User ${email} already exists with ID: ${userId}.`);
    } else {
      console.log(`Creating user account for ${email}...`);
      // Enable pgcrypto if not enabled
      await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
      
      // Generate random uuid
      const uuidRes = await client.query('SELECT gen_random_uuid() as id;');
      userId = uuidRes.rows[0].id;
      
      const rawUserMetadata = JSON.stringify({ username });
      
      // Insert into auth.users (default temp password: ThirstyWelcome123!)
      const userInsertQuery = `
        INSERT INTO auth.users (
          id,
          instance_id,
          email,
          encrypted_password,
          email_confirmed_at,
          raw_app_meta_data,
          raw_user_meta_data,
          aud,
          role,
          created_at,
          updated_at
        ) VALUES (
          $1,
          '00000000-0000-0000-0000-000000000000',
          $2,
          crypt('ThirstyWelcome123!', gen_salt('bf')),
          now(),
          '{"provider": "email", "providers": ["email"]}'::jsonb,
          $3::jsonb,
          'authenticated',
          'authenticated',
          now(),
          now()
        );
      `;
      await client.query(userInsertQuery, [userId, email, rawUserMetadata]);
      console.log(`Created auth.users entry for ${email}.`);
    }

    // Now insert/update public.profiles
    // Generate a unique Thirsty999ID
    const thirstyclubId = 'T999-' + Math.floor(1000 + Math.random() * 9000);
    console.log(`Upserting profile with Thirsty999ID: ${thirstyclubId}...`);
    
    const profileUpsertQuery = `
      INSERT INTO public.profiles (
        id,
        username,
        email,
        thirstyclub_id,
        socials,
        created_at
      ) VALUES ($1, $2, $3, $4, '{"instagram": "", "twitter": "", "discord": "", "role": "admin"}'::jsonb, now())
      ON CONFLICT (id) DO UPDATE SET
        socials = coalesce(public.profiles.socials, '{"instagram": "", "twitter": "", "discord": ""}'::jsonb) || '{"role": "admin"}'::jsonb;
    `;
    await client.query(profileUpsertQuery, [userId, username, email, thirstyclubId]);
    console.log(`Upserted public.profiles for ${email}.`);

    // Insert ticket
    const ticketInsertQuery = `
      INSERT INTO public.tickets (user_id, status)
      VALUES ($1, 'VIP')
      ON CONFLICT DO NOTHING;
    `;
    await client.query(ticketInsertQuery, [userId]);
    console.log(`Ensured ticket entry exists for ${email}.`);
    
    console.log(`Successfully completed database setup for admin ${email}!`);

  } catch (err) {
    console.error('Error running add-user script:', err.message);
  } finally {
    await client.end();
  }
}

run();
