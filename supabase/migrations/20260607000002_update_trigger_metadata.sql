-- Update handle_new_user trigger function to populate profile fields from raw_user_meta_data on signup
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
