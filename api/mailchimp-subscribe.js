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
    const crypto = await import('crypto');
    const subscriberHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');

    // 1. Upsert member into Mailchimp Audience (creates if new, updates merge fields if existing)
    const mcResponse = await fetch(
      `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
        },
        body: JSON.stringify({
          email_address: email,
          status_if_new: 'subscribed', // Required for PUT upsert
          merge_fields: {
            FNAME: username || '',
            THIRSTYID: thirstyclub_id || '',
            GENDER: gender || '',
            CITY: place_of_thirst || '',
          },
        }),
      }
    );

    const result = await mcResponse.json();

    if (!mcResponse.ok) {
      console.error('Mailchimp member upsert error:', result);
      return res.status(500).json({ error: result.detail || 'Failed to add/update contact in Mailchimp' });
    }

    // 2. Add tags to the member (PUT doesn't support inline tags array updates)
    try {
      await fetch(
        `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}/tags`,
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
            ]
          }),
        }
      );
    } catch (tagErr) {
      console.error('Mailchimp tags update exception:', tagErr);
    }

    // 3. Trigger Customer Journey
    let journeyTriggered = false;
    let journeyError = null;

    try {
      const triggerUrl = 'https://us12.api.mailchimp.com/3.0/customer-journeys/journeys/772/steps/2503/actions/trigger';
      const triggerResponse = await fetch(triggerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
        },
        body: JSON.stringify({
          email_address: email,
        }),
      });
      const triggerResult = await triggerResponse.json();
      if (triggerResponse.ok) {
        journeyTriggered = true;
      } else {
        journeyError = triggerResult;
        console.error('Mailchimp journey trigger API error:', triggerResult);
      }
    } catch (triggerErr) {
      journeyError = triggerErr.message;
      console.error('Mailchimp journey trigger exception:', triggerErr);
    }

    return res.status(200).json({
      success: true,
      id: result.id,
      journeyTriggered,
      journeyError
    });
  } catch (err) {
    console.error('mailchimp-subscribe exception:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
