/**
 * /api/mailchimp-sync
 * Bulk-syncs ALL registered users from Supabase profiles to Mailchimp audience.
 * Uses Mailchimp batch subscribe/update endpoint to handle both new and existing contacts.
 *
 * POST body: { admin_email: string } — simple guard to ensure only admins call this
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fftfnikbulfayrrjktuo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdGZuaWtidWxmYXlycmprdHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNjgxNzgsImV4cCI6MjA5Mjc0NDE3OH0.L8U8_f19ZeMSdqvMgk3h7MHqnm6a_X2wukEPoAgz7qA";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_EMAILS = [
  'richmond@guava.earth',
  'richmonde@guava.earth',
  'guavanigeria@gmail.com',
  'thirstynalia@gmail.com',
  'straffitti@hotmail.com',
  'ogunwuyi.olumide@yahoo.com',
  'bookthirsty234@gmail.com'
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { admin_email } = req.body;
  if (!admin_email || !ADMIN_EMAILS.includes(admin_email)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.key || process.env.MAILCHIMP_API_KEY;
  const listId = process.env.MAILCHIMP_LIST_ID;

  if (!apiKey) return res.status(500).json({ error: 'Mailchimp API key not configured' });
  if (!listId) return res.status(500).json({ error: 'MAILCHIMP_LIST_ID not configured' });

  const dc = apiKey.split('-').pop();

  try {
    // 1. Fetch ALL profiles from Supabase
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('email, username, thirstyclub_id, socials');

    if (error) {
      console.error('Supabase fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch users from database' });
    }

    if (!profiles || profiles.length === 0) {
      return res.status(200).json({ success: true, synced: 0, message: 'No users found' });
    }

    // 2. Build Mailchimp batch members array
    const members = profiles
      .filter(p => p.email) // skip any profiles without email
      .map(p => ({
        email_address: p.email,
        status_if_new: 'subscribed',   // subscribe new contacts
        status: 'subscribed',           // update existing contacts
        merge_fields: {
          FNAME: p.username || '',
          THIRSTYID: p.thirstyclub_id || '',
          GENDER: p.socials?.gender || '',
          CITY: p.socials?.place_of_thirst || '',
        },
      }));

    // 3. Use Mailchimp batch subscribe/update endpoint (handles up to 500 per call)
    // Split into chunks of 500 if needed
    const chunkSize = 500;
    let totalAdded = 0;
    let totalUpdated = 0;
    let totalErrors = 0;

    for (let i = 0; i < members.length; i += chunkSize) {
      const chunk = members.slice(i, i + chunkSize);

      const mcResponse = await fetch(
        `https://${dc}.api.mailchimp.com/3.0/lists/${listId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
          },
          body: JSON.stringify({
            members: chunk,
            update_existing: true,
          }),
        }
      );

      const result = await mcResponse.json();

      if (mcResponse.ok) {
        totalAdded += result.new_members?.length || 0;
        totalUpdated += result.updated_members?.length || 0;
        totalErrors += result.errors?.length || 0;

        if (result.errors && result.errors.length > 0) {
          console.warn('Mailchimp batch errors:', result.errors.slice(0, 5));
        }
      } else {
        console.error('Mailchimp batch error:', result);
        totalErrors += chunk.length;
      }
    }

    return res.status(200).json({
      success: true,
      total_profiles: profiles.length,
      new_subscribers: totalAdded,
      updated: totalUpdated,
      errors: totalErrors,
    });

  } catch (err) {
    console.error('mailchimp-sync exception:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
