/**
 * /api/mailchimp-sync
 * Bulk-syncs ALL registered users from Supabase profiles to Mailchimp audience.
 * Uses Mailchimp batch subscribe/update endpoint to handle both new and existing contacts.
 *
 * POST body: { admin_email: string } — simple guard to ensure only admins call this
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qnzszxukvugigprimlwi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_syk64tdKksD56BZDt7FmZA_0KgZ581e";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_EMAILS = [
  'richmond@guava.earth',
  'richmonde@guava.earth',
  'guavanigeria@gmail.com',
  'thirstynalia@gmail.com',
  'straffitti@hotmail.com',
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

    // 4. Apply 'Thirstclub999app' tag to all synced members (triggers Mailchimp automation)
    const crypto = await import('crypto');
    let taggedCount = 0;
    for (const member of members) {
      try {
        const emailHash = crypto.createHash('md5').update(member.email_address.toLowerCase()).digest('hex');
        await fetch(
          `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members/${emailHash}/tags`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
            },
            body: JSON.stringify({
              tags: [
                { name: 'ThirstyClub999', status: 'active' },
                { name: 'Guestlist', status: 'active' },
                { name: 'Thirstclub999app', status: 'active' }
              ],
            }),
          }
        );
        taggedCount++;
      } catch (tagErr) {
        console.warn('Tag apply error for', member.email_address, tagErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      total_profiles: profiles.length,
      new_subscribers: totalAdded,
      updated: totalUpdated,
      errors: totalErrors,
      tagged: taggedCount,
    });

  } catch (err) {
    console.error('mailchimp-sync exception:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
