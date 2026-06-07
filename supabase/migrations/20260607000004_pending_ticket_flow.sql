-- Alter the default status for tickets table to 'PENDING'
alter table public.tickets alter column status set default 'PENDING'::text;

-- Update existing trigger function handle_new_user to set ticket status to 'PENDING' explicitly
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
    coalesce(new.raw_user_meta_data->>'username', 'THIRSTYZOID'),
    new.email,
    generated_id,
    avatar_val,
    jsonb_build_object(
      'instagram', coalesce(new.raw_user_meta_data->>'instagram', ''),
      'twitter', coalesce(new.raw_user_meta_data->>'twitter', ''),
      'discord', coalesce(new.raw_user_meta_data->>'discord', ''),
      'place_of_thirst', coalesce(new.raw_user_meta_data->>'place_of_thirst', 'LAGOS'),
      'gender', coalesce(new.raw_user_meta_data->>'gender', 'F'),
      'signature', coalesce(new.raw_user_meta_data->>'signature', 'Thirstyzoid'),
      'welcome_email_sent', true
    )
  );

  -- Insert default ticket with PENDING status
  insert into public.tickets (user_id, status)
  values (new.id, 'PENDING');

  return new;
end;
$$ language plpgsql security definer;

-- Enable update policy for users on tickets table
drop policy if exists "Users can update their own tickets" on public.tickets;
create policy "Users can update their own tickets" on public.tickets
  for update using (auth.uid() = user_id);
