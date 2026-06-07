const { Client } = require('pg');

const config = {
  user: 'postgres.qnzszxukvugigprimlwi',
  host: 'aws-0-eu-west-1.pooler.supabase.com',
  database: 'postgres',
  password: 'Sk1d061Wh33764?!',
  port: 5432,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000
};

const sql = `
create or replace function public.handle_new_user()
returns trigger as $$
declare
  generated_id text;
  avatar_val text;
begin
  -- Generate a unique Thirsty999ID
  generated_id := public.generate_unique_thirsty_id();
  
  -- Extract avatar if passed
  avatar_val := new.raw_user_meta_data->>'avatar_url';

  -- Insert profile
  insert into public.profiles (id, username, email, thirstyclub_id, avatar_url, socials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    generated_id,
    avatar_val,
    jsonb_build_object(
      'instagram', coalesce(new.raw_user_meta_data->>'instagram', ''),
      'twitter', coalesce(new.raw_user_meta_data->>'twitter', ''),
      'discord', coalesce(new.raw_user_meta_data->>'discord', ''),
      'place_of_thirst', coalesce(new.raw_user_meta_data->>'place_of_thirst', 'MANCHESTER'),
      'gender', coalesce(new.raw_user_meta_data->>'gender', 'F'),
      'signature', coalesce(new.raw_user_meta_data->>'signature', 'A. Palmerston')
    )
  );

  -- Insert default ticket
  insert into public.tickets (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;
`;

async function main() {
  const client = new Client(config);
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected. Running trigger update query...');
    await client.query(sql);
    console.log('🎉 Trigger function updated successfully!');
  } catch (err) {
    console.error('❌ Failed:', err.message);
  } finally {
    await client.end();
  }
}

main();
