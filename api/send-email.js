export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, username, thirstyclub_id, place_of_thirst } = req.body;

  if (!email || !username || !thirstyclub_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.key || process.env.MAILCHIMP_TRANSACTIONAL_API_KEY || process.env.MANDRILL_API_KEY;
  if (!apiKey) {
    console.error('Mailchimp Transactional API key is not configured (checked process.env.key, process.env.MAILCHIMP_TRANSACTIONAL_API_KEY, process.env.MANDRILL_API_KEY)');
    return res.status(500).json({ error: 'Email configuration error' });
  }

  try {
    const response = await fetch('https://mandrillapp.com/api/1.0/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: apiKey,
        message: {
          from_email: 'hello@thirstyclub999.com',
          from_name: 'ThirstyClub999',
          subject: 'YOUR ENTRY PASS GRANTED - ThirstyClub999',
          to: [
            {
              email: email,
              type: 'to'
            }
          ],
          html: `
            <div style="font-family: Arial, sans-serif; background-color: #050505; color: #ffffff; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid #ff3e3e;">
              <h2 style="color: #ff3e3e; text-align: center; font-size: 24px; letter-spacing: 2px;">YOU'RE IN THE CLUB</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #e0e0e0;">Hi <strong>${username}</strong>,</p>
              <p style="font-size: 16px; line-height: 1.6; color: #e0e0e0;">Your RSVP for ThirstyClub999 has been successfully confirmed and your passport is ready.</p>
              
              <div style="background-color: #121212; padding: 20px; border-radius: 4px; margin: 25px 0; border: 1px dashed rgba(255, 62, 62, 0.4); text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Your Access ID</p>
                <h3 style="margin: 5px 0 0 0; font-size: 32px; color: #ffffff; letter-spacing: 3px; font-family: monospace;">${thirstyclub_id}</h3>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #e0e0e0;"><strong>Place of Thirst:</strong> ${place_of_thirst || 'MANCHESTER'}</p>
              
              <p style="font-size: 14px; line-height: 1.6; color: #888888; margin-top: 30px;">To view your live passport and entry pass QR code at any time, log in to the clubhouse using your credentials or your Access ID on our website.</p>
              
              <hr style="border: 0; border-top: 1px solid #333333; margin: 30px 0;" />
              <p style="font-size: 12px; color: #555555; text-align: center;">ThirstyClub999. Keep it safe.</p>
            </div>
          `
        }
      })
    });

    const result = await response.json();
    if (!response.ok || (result && result[0] && result[0].status === 'rejected')) {
      console.error('Mailchimp Transactional send error:', result);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true, status: result[0]?.status });
  } catch (err) {
    console.error('Mailchimp Transactional function exception:', err);
    return res.status(500).json({ error: 'Internal server error sending email' });
  }
}
