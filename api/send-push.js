const webpush = require('web-push');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify admin auth token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '');

  // Verify the token is from an admin via Supabase
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qnzszxukvugigprimlwi.supabase.co';
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server misconfigured: missing service role key' });
  }

  // Verify admin user via Supabase auth
  try {
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      }
    });

    if (!userRes.ok) {
      return res.status(401).json({ error: 'Invalid auth token' });
    }

    const user = await userRes.json();
    const adminEmails = [
      'admin@', '@thirstyclub999.com',
      'richmond@guava.earth', 'richmonde@guava.earth',
      'guavanigeria@gmail.com', 'thirstynalia@gmail.com',
      'straffitti@hotmail.com', 'bookthirsty234@gmail.com',
      'godliverse@gmail.com', 'ogunwuyi.olumide@yahoo.com',
      'gclef40@gmail.com'
    ];

    const isAdmin = adminEmails.some(pattern => {
      if (pattern.startsWith('@')) return user.email?.endsWith(pattern);
      if (pattern.endsWith('@')) return user.email?.startsWith(pattern);
      return user.email === pattern;
    });

    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Auth verification failed', details: err.message });
  }

  // Parse notification payload
  const { title, body, url } = req.body || {};
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  // Configure VAPID
  const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
  const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:gclef40@gmail.com';

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return res.status(500).json({ error: 'Server misconfigured: missing VAPID keys' });
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  // Fetch all push subscriptions from Supabase
  try {
    const subsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?select=id,endpoint,keys_p256dh,keys_auth`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!subsRes.ok) {
      const errText = await subsRes.text();
      return res.status(500).json({ error: 'Failed to fetch subscriptions', details: errText });
    }

    const subscriptions = await subsRes.json();

    if (!subscriptions.length) {
      return res.status(200).json({ success: true, sent: 0, message: 'No subscribers found' });
    }

    const payload = JSON.stringify({ title, body, url: url || '/' });

    let sent = 0;
    let failed = 0;
    const expiredIds = [];

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys_p256dh,
            auth: sub.keys_auth
          }
        };

        try {
          await webpush.sendNotification(pushSubscription, payload);
          sent++;
        } catch (err) {
          failed++;
          // 410 Gone or 404 means subscription expired — clean up
          if (err.statusCode === 410 || err.statusCode === 404) {
            expiredIds.push(sub.id);
          }
        }
      })
    );

    // Clean up expired subscriptions
    if (expiredIds.length > 0) {
      for (const id of expiredIds) {
        await fetch(
          `${SUPABASE_URL}/rest/v1/push_subscriptions?id=eq.${id}`,
          {
            method: 'DELETE',
            headers: {
              'apikey': SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
          }
        );
      }
    }

    return res.status(200).json({
      success: true,
      sent,
      failed,
      expired_cleaned: expiredIds.length,
      total_subscribers: subscriptions.length
    });

  } catch (err) {
    return res.status(500).json({ error: 'Push send failed', details: err.message });
  }
};
