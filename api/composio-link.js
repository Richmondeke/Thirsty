export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;
  if (!COMPOSIO_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error: Missing COMPOSIO_API_KEY' });
  }

  const { provider, entityId, redirectUrl } = req.body;

  if (!provider || !entityId) {
    return res.status(400).json({ error: 'Missing required fields: provider, entityId' });
  }

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': COMPOSIO_API_KEY
  };

  try {
    // Step 1: Look up the auth_config_id for this toolkit
    const configsRes = await fetch(
      `https://backend.composio.dev/api/v3/auth_configs?toolkit_slug=${encodeURIComponent(provider)}`,
      { headers }
    );
    const configsData = await configsRes.json();

    let authConfigId = null;

    if (configsRes.ok && configsData.items && configsData.items.length > 0) {
      // Use the first matching auth config
      authConfigId = configsData.items[0].id;
    }

    if (!authConfigId) {
      // No existing auth config — try to create one with Composio-managed credentials
      const createRes = await fetch('https://backend.composio.dev/api/v3/auth_configs', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          toolkit: { slug: provider },
          name: `auth_config_${provider}_thirsty`,
          auth_scheme: 'OAUTH2',
          type: 'default'
        })
      });
      const createData = await createRes.json();

      if (createRes.ok && createData.id) {
        authConfigId = createData.id;
      } else {
        // Composio doesn't manage this toolkit — return a user-friendly error
        return res.status(400).json({
          error: `Composio does not have managed OAuth credentials for "${provider}". You need to set up custom OAuth credentials in the Composio dashboard (app.composio.dev).`,
          details: createData
        });
      }
    }

    // Step 2: Generate the connect link using the auth_config_id
    const linkRes = await fetch('https://backend.composio.dev/api/v3/connected_accounts/link', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        auth_config_id: authConfigId,
        user_id: entityId,
        redirect_url: redirectUrl || 'https://thirsty.guava.earth'
      })
    });

    const linkData = await linkRes.json();

    if (!linkRes.ok) {
      console.error('Composio Link Error:', linkData);
      return res.status(linkRes.status).json({ error: 'Failed to generate Composio link', details: linkData });
    }

    return res.status(200).json({
      ...linkData,
      // Normalize: frontend expects camelCase "redirectUrl"
      redirectUrl: linkData.redirect_url || linkData.redirectUrl || linkData.url
    });
  } catch (err) {
    console.error('Error proxying Composio request:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err?.message || err?.toString() });
  }
}
