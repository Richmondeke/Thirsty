try {
  const parse = require('pg-connection-string').parse;
  const str = 'postgresql://postgres:[Sk1d061Wh33764?]@db.qnzszxukvugigprimlwi.supabase.co:5432/postgres';
  const config = parse(str);
  console.log('Parsed config:', config);
} catch (e) {
  console.log('Error parsing:', e.message);
}
