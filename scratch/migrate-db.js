const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Old project configuration (uses HTTP API via anon key)
const OLD_URL = "https://fftfnikbulfayrrjktuo.supabase.co";
const OLD_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdGZuaWtidWxmYXlycmprdHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNjgxNzgsImV4cCI6MjA5Mjc0NDE3OH0.L8U8_f19ZeMSdqvMgk3h7MHqnm6a_X2wukEPoAgz7qA";
const oldSupa = createClient(OLD_URL, OLD_KEY);

// 2. New project configuration (uses direct pooler connection)
const NEW_CONFIG = {
  user: 'postgres.qnzszxukvugigprimlwi',
  host: 'aws-0-eu-west-1.pooler.supabase.com',
  database: 'postgres',
  password: 'Sk1d061Wh33764?!',
  port: 6543,
  ssl: { rejectUnauthorized: false }
};

async function runMigration() {
  const newClient = new Client(NEW_CONFIG);

  try {
    console.log('Fetching profiles from old database via HTTP API...');
    const { data: oldProfiles, error: fetchErr } = await oldSupa
      .from('profiles')
      .select('*');
      
    if (fetchErr) {
      throw new Error(`Failed to fetch profiles from old database: ${fetchErr.message}`);
    }
    console.log(`Successfully fetched ${oldProfiles.length} profiles from old database.`);

    console.log('Connecting to new database via pooler...');
    await newClient.connect();
    console.log('Connected to new database successfully.');

    // 1. Clean up existing tables on the new database to ensure a clean migration
    console.log('Dropping existing triggers and tables on the new database (if any)...');
    await newClient.query('DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;');
    await newClient.query('DROP TABLE IF EXISTS public.tickets CASCADE;');
    await newClient.query('DROP TABLE IF EXISTS public.profiles CASCADE;');
    console.log('Clean up complete.');

    // 2. Read and apply local schema migrations
    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Apply in alphabetical/chronological order

    console.log('Applying local migrations to the new database...');
    for (const file of migrationFiles) {
      console.log(`Applying migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await newClient.query(sql);
    }
    
    // 3. Add the missing insert policy for fallback profiles
    console.log('Applying fallback profile insert policy...');
    await newClient.query(`
      CREATE POLICY "Users can insert their own profile" ON public.profiles
        FOR INSERT WITH CHECK (auth.uid() = id);
    `);
    console.log('Migrations applied successfully.');

    // 4. Temporarily disable triggers by setting replication role to 'replica'
    console.log('Temporarily setting session_replication_role to replica...');
    await newClient.query("SET session_replication_role = 'replica';");

    // Enable pgcrypto extension for password hashing
    console.log('Enabling pgcrypto extension...');
    await newClient.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

    // 5. Migrate auth.users and profiles
    console.log('Migrating user accounts and profiles...');
    for (const profile of oldProfiles) {
      const userId = profile.id;
      const email = profile.email || `${profile.username.toLowerCase().replace(/\s+/g, '')}@example.com`;
      const username = profile.username;
      
      console.log(`Migrating user: ${email} (${userId})`);
      
      const rawUserMetadata = JSON.stringify({ username });
      
      // Insert user account into auth.users (with temporary placeholder password)
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
          $4,
          now()
        ) ON CONFLICT (id) DO NOTHING;
      `;
      await newClient.query(userInsertQuery, [userId, email, rawUserMetadata, profile.created_at]);

      // Insert profile into public.profiles
      const profileInsertQuery = `
        INSERT INTO public.profiles (
          id,
          username,
          email,
          thirstyclub_id,
          avatar_url,
          socials,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          email = EXCLUDED.email,
          thirstyclub_id = EXCLUDED.thirstyclub_id,
          avatar_url = EXCLUDED.avatar_url,
          socials = EXCLUDED.socials;
      `;
      await newClient.query(profileInsertQuery, [
        userId,
        username,
        profile.email,
        profile.thirstyclub_id,
        profile.avatar_url,
        JSON.stringify(profile.socials),
        profile.created_at
      ]);

      // Insert default ticket for user
      const ticketInsertQuery = `
        INSERT INTO public.tickets (user_id)
        VALUES ($1)
        ON CONFLICT DO NOTHING;
      `;
      await newClient.query(ticketInsertQuery, [userId]);
    }
    console.log('Migrated all user accounts, profiles, and tickets successfully.');

    // 6. Restore triggers by setting replication role back to 'origin'
    console.log('Restoring session_replication_role to origin...');
    await newClient.query("SET session_replication_role = 'origin';");

    // 7. Update admin roles to make sure they are active
    console.log('Ensuring admin roles are updated correctly...');
    await newClient.query(`
      UPDATE public.profiles
      SET socials = coalesce(socials, '{"instagram": "", "twitter": "", "discord": ""}'::jsonb) || '{"role": "admin"}'::jsonb
      WHERE email IN ('richmond@guava.earth', 'richmonde@guava.earth');
    `);
    console.log('Admin roles updated.');

    console.log('\nMigration completed successfully! 🎉');

  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await newClient.end();
  }
}

runMigration();
