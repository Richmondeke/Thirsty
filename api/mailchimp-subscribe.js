/**
 * /api/mailchimp-subscribe
 * Adds a new member to the Mailchimp Marketing audience (contacts list).
 * Called automatically on RSVP signup.
 *
 * Environment variable required:
 *   key  — your Mailchimp Transactional / Marketing API key (same one stored in Vercel)
 *
 * Mailchimp Marketing API uses a different base URL derived from the API key datacenter suffix.
 * The API key format is: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us1  (last part is the datacenter)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, username, thirstyclub_id, gender, place_of_thirst } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Read API key — stored in Vercel as env var "key"
  const apiKey = process.env.key || process.env.MAILCHIMP_API_KEY;
  if (!apiKey) {
    console.error('Mailchimp API key not configured');
    return res.status(500).json({ error: 'Mailchimp not configured' });
  }

  // Extract datacenter from API key (last segment after the dash)
  const dc = apiKey.split('-').pop();

  // Mailchimp Marketing audience list ID
  // You MUST set this env var in Vercel: MAILCHIMP_LIST_ID
  const listId = process.env.MAILCHIMP_LIST_ID;
  if (!listId) {
    console.error('MAILCHIMP_LIST_ID not configured');
    return res.status(500).json({ error: 'Mailchimp list ID not configured' });
  }

  try {
    const mcResponse = await fetch(
      `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Mailchimp uses HTTP Basic Auth: any string + ":" + apiKey
          Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
        },
        body: JSON.stringify({
          email_address: email,
          status: 'subscribed',
          merge_fields: {
            FNAME: username || '',
            THIRSTYID: thirstyclub_id || '',
            GENDER: gender || '',
            CITY: place_of_thirst || '',
          },
          tags: ['ThirstyClub999', 'Guestlist'],
        }),
      }
    );

    const result = await mcResponse.json();

    // 200 = new member, 400 with title "Member Exists" = already subscribed (not an error)
    if (mcResponse.ok) {
      return res.status(200).json({ success: true, id: result.id });
    } else if (result.title === 'Member Exists') {
      return res.status(200).json({ success: true, note: 'Already subscribed' });
    } else {
      console.error('Mailchimp subscribe error:', result);
      return res.status(500).json({ error: result.detail || 'Failed to add to Mailchimp' });
    }
  } catch (err) {
    console.error('mailchimp-subscribe exception:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
