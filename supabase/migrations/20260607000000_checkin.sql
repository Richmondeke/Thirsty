-- Create the check_in_user RPC function
create or replace function public.check_in_user(target_id text)
returns jsonb
language plpgsql
security definer -- Runs with superuser privileges, bypassing RLS
as $$
declare
  caller_email text;
  caller_socials jsonb;
  is_caller_admin boolean := false;
  target_user_id uuid;
  current_socials jsonb;
begin
  -- 1. Check if caller is authenticated
  if auth.uid() is null then
    return jsonb_build_object('success', false, 'message', 'Not authenticated');
  end if;

  -- 2. Determine if the caller is an Admin
  -- Try to get email from JWT first
  caller_email := auth.jwt() ->> 'email';
  
  if caller_email is null then
    select email, socials into caller_email, caller_socials from public.profiles where id = auth.uid();
  else
    select socials into caller_socials from public.profiles where id = auth.uid();
  end if;

  if caller_email ilike 'admin@%' 
     or caller_email ilike '%@thirstyclub999.com' 
     or (caller_socials->>'role') = 'admin' then
    is_caller_admin := true;
  end if;

  if not is_caller_admin then
    return jsonb_build_object('success', false, 'message', 'Only administrators can check in guests.');
  end if;

  -- 3. Find the target user profile
  select id, socials into target_user_id, current_socials 
  from public.profiles 
  where thirstyclub_id = target_id;

  if target_user_id is null then
    return jsonb_build_object('success', false, 'message', 'ThirstyID not found.');
  end if;

  -- 4. Update the socials JSONB field to set checked_in = true
  -- We merge the new checked_in key into socials
  update public.profiles
  set socials = current_socials || '{"checked_in": true}'::jsonb
  where id = target_user_id;

  return jsonb_build_object('success', true, 'message', 'User checked in successfully.');
end;
$$;
