const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

process.env.MAILCHIMP_TRANSACTIONAL_API_KEY = env.MAILCHIMP_TRANSACTIONAL_API_KEY;
process.env.MANDRILL_API_KEY = env.MANDRILL_API_KEY;

// Since send-email.js uses import/export, we need to run it in a way that supports ES Modules or dynamic import
// Let's use dynamic import for send-email.js
async function run() {
  console.log('Running send-email handler locally with loaded env keys...');
  try {
    const module = await import('../api/send-email.js');
    const handler = module.default;

    const req = {
      method: 'POST',
      body: {
        email: 'straffitti@hotmail.com', // Let's send a test email to one of the admin emails
        username: 'Mandrill Test User',
        thirstyclub_id: 'T999-TEST',
        place_of_thirst: 'LAGOS',
        passport_image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      }
    };

    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        console.log(`Response status: ${this.statusCode}`);
        console.log('Response JSON:', data);
      }
    };

    await handler(req, res);
  } catch (err) {
    console.error('Handler threw exception:', err);
  }
}

run();
