import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qnzszxukvugigprimlwi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_syk64tdKksD56BZDt7FmZA_0KgZ581e";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, username, thirstyclub_id, place_of_thirst, passport_image, custom_subject, custom_message, status } = req.body;

  if (!email || !username || !thirstyclub_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.MAILCHIMP_TRANSACTIONAL_API_KEY || process.env.MANDRILL_API_KEY || process.env.key;
  if (!apiKey) {
    console.error('Mailchimp Transactional API key is not configured');
    return res.status(500).json({ error: 'Email configuration error' });
  }

  try {
    // 1. Determine subject and message template
    let emailSubject = custom_subject || (status === 'PENDING' ? 'YOUR ENTRY PASS (PENDING) - ThirstyClub999' : 'YOUR ENTRY PASS GRANTED - ThirstyClub999');
    let welcomeMessage = custom_message || (status === 'PENDING' 
      ? 'Your RSVP for ThirstyClub999 is registered! Please confirm your email address to activate your ticket.' 
      : 'Your RSVP for ThirstyClub999 has been successfully confirmed and your passport is ready. Welcome to the Club.');

    // If not custom (i.e. this is the automatic signup email), try fetching the customized template saved in admin profiles
    if (!custom_subject && !custom_message) {
      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('socials')
        .in('email', [
          'guavanigeria@gmail.com',
          'richmond@guava.earth',
          'richmonde@guava.earth',
          'thirstynalia@gmail.com',
          'straffitti@hotmail.com',
          'bookthirsty234@gmail.com'
        ])
        .not('socials', 'is', null);

      if (adminProfiles && adminProfiles.length > 0) {
        // Find the first admin profile that has welcome email configurations
        for (const admin of adminProfiles) {
          if (admin.socials?.welcome_email_subject) {
            emailSubject = admin.socials.welcome_email_subject;
          }
          if (admin.socials?.welcome_email_message) {
            welcomeMessage = admin.socials.welcome_email_message;
          }
        }
      }
    }

    // Replace placeholders
    emailSubject = emailSubject
      .replace(/{username}/g, username)
      .replace(/{thirstyclub_id}/g, thirstyclub_id)
      .replace(/{place_of_thirst}/g, place_of_thirst || 'MANCHESTER');

    welcomeMessage = welcomeMessage
      .replace(/{username}/g, username)
      .replace(/{thirstyclub_id}/g, thirstyclub_id)
      .replace(/{place_of_thirst}/g, place_of_thirst || 'MANCHESTER');

    // 2. Prepare attachments if passport image is provided
    const attachments = [];
    if (passport_image && passport_image.startsWith('data:')) {
      const parts = passport_image.split(';base64,');
      if (parts.length === 2) {
        const attachmentType = parts[0].replace('data:', '');
        const attachmentContent = parts[1];
        const ext = attachmentType.split('/')[1] || 'png';
        attachments.push({
          type: attachmentType,
          name: `thirstyclub999-passport-${thirstyclub_id.toLowerCase()}.${ext}`,
          content: attachmentContent
        });
      }
    }

    // 3. Send via Mailchimp Transactional
    const response = await fetch('https://mandrillapp.com/api/1.0/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: apiKey,
        message: {
          from_email: 'info@thirstynalia.com',
          from_name: 'ThirstyClub999',
          subject: emailSubject,
          to: [
            {
              email: email,
              type: 'to'
            }
          ],
          html: `
            <div style="font-family: Arial, sans-serif; background-color: #050505; color: #ffffff; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid #ff3e3e;">
              <h2 style="color: #ff3e3e; text-align: center; font-size: 24px; letter-spacing: 2px;">THIRSTYCLUB999</h2>
              
              <div style="margin: 20px 0; padding: 12px; background-color: ${status === 'PENDING' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(76, 175, 80, 0.1)'}; border: 1px solid ${status === 'PENDING' ? '#ff9800' : '#4caf50'}; border-radius: 4px; text-align: center; color: ${status === 'PENDING' ? '#ff9800' : '#4caf50'}; font-weight: bold; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
                TICKET STATUS: ${status === 'PENDING' ? 'PENDING EMAIL VERIFICATION' : 'CONFIRMED'}
              </div>

              <p style="font-size: 16px; line-height: 1.6; color: #e0e0e0;">Hi <strong>${username}</strong>,</p>
              
              <div style="font-size: 16px; line-height: 1.6; color: #e0e0e0; margin: 20px 0; white-space: pre-line;">
                ${welcomeMessage}
              </div>
              
              <div style="background-color: #121212; padding: 20px; border-radius: 4px; margin: 25px 0; border: 1px dashed rgba(255, 62, 62, 0.4); text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Your Access ID</p>
                <h3 style="margin: 5px 0 0 0; font-size: 32px; color: #ffffff; letter-spacing: 3px; font-family: monospace;">${thirstyclub_id}</h3>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #e0e0e0;"><strong>Place of Thirst:</strong> ${place_of_thirst || 'MANCHESTER'}</p>
              
              ${status === 'PENDING' ? `
              <div style="font-size: 14px; line-height: 1.6; color: #ff9800; padding: 12px; background-color: rgba(255, 152, 0, 0.05); border-left: 3px solid #ff9800; margin: 20px 0; border-radius: 4px;">
                <strong>IMPORTANT:</strong> Please check your inbox for a separate confirmation email from ThirstyClub999 and click the link to verify your email. Once verified, your ticket will automatically be activated.
              </div>
              ` : ''}

              <p style="font-size: 14px; line-height: 1.6; color: #888888; margin-top: 30px;">Your entry passport card has been attached to this email. You can also view your live passport and entry pass QR code at any time by logging in to the clubhouse on our website.</p>
              
              <hr style="border: 0; border-top: 1px solid #333333; margin: 30px 0;" />
              <p style="font-size: 12px; color: #555555; text-align: center;">ThirstyClub999. Keep it safe.</p>
            </div>
          `,
          attachments: attachments
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
