-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text not null,
  email text,
  thirstyclub_id text unique,
  avatar_url text,
  socials jsonb default '{"instagram": "", "twitter": "", "discord": ""}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Create tickets table
create table public.tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  event_date date default '2026-06-14'::date not null,
  status text default 'VIP' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on tickets
alter table public.tickets enable row level security;

-- Function to generate a unique Thirsty999ID (T999-XXXX)
create or replace function public.generate_unique_thirsty_id()
returns text as $$
declare
  new_id text;
  exists_already boolean;
begin
  loop
    new_id := 'T999-' || floor(random() * 9000 + 1000)::text;
    select exists(select 1 from public.profiles where thirstyclub_id = new_id) into exists_already;
    if not exists_already then
      return new_id;
    end if;
  end loop;
end;
$$ language plpgsql security definer;

-- Trigger function to automatically create a profile and ticket on signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  generated_id text;
begin
  -- Generate a unique Thirsty999ID
  generated_id := public.generate_unique_thirsty_id();

  -- Insert profile
  insert into public.profiles (id, username, email, thirstyclub_id, avatar_url, socials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    generated_id,
    null,
    '{"instagram": "", "twitter": "", "discord": ""}'::jsonb
  );

  -- Insert default ticket
  insert into public.tickets (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

-- Bind the trigger to auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create RLS Policies for Profiles
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Create RLS Policies for Tickets
create policy "Users can view their own tickets" on public.tickets
  for select using (auth.uid() = user_id);

create policy "Users can insert their own tickets" on public.tickets
  for insert with check (auth.uid() = user_id);
