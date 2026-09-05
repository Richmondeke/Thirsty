import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const apiKey = process.env.key || process.env.MAILCHIMP_API_KEY || process.env.MAILCHIMP_TRANSACTIONAL_API_KEY;
  const listId = process.env.MAILCHIMP_LIST_ID;

  if (!apiKey || !listId) {
    return res.status(500).json({ error: 'Mailchimp API key or List ID not configured', hasKey: !!apiKey, hasListId: !!listId });
  }

  const dc = apiKey.split('-').pop();
  const url = `https://${dc}.api.mailchimp.com/3.0/lists/${listId}`;
  const authHeader = `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`;

  try {
    if (req.method === 'GET') {
      const response = await fetch(url, {
        headers: { Authorization: authHeader }
      });
      const data = await response.json();
      return res.status(200).json({
        id: data.id,
        name: data.name,
        notify_on_subscribe: data.notify_on_subscribe,
        notify_on_unsubscribe: data.notify_on_unsubscribe,
        full_response: data
      });
    }

    if (req.method === 'POST' || req.method === 'PATCH') {
      // Clear notify_on_subscribe and notify_on_unsubscribe
      const patchResponse = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader
        },
        body: JSON.stringify({
          notify_on_subscribe: '',
          notify_on_unsubscribe: ''
        })
      });
      const patchData = await patchResponse.json();
      return res.status(200).json({
        success: patchResponse.ok,
        notify_on_subscribe: patchData.notify_on_subscribe,
        notify_on_unsubscribe: patchData.notify_on_unsubscribe,
        result: patchData
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
