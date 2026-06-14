require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  let allData = [];
  let from = 0;
  const step = 1000;
  let fetchMore = true;

  while (fetchMore) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username', { count: 'exact' })
      .range(from, from + step - 1);

    if (error) {
      console.error(error);
      break;
    }
    console.log(`Fetched ${data.length} records. From: ${from}`);
    if (data && data.length > 0) {
      allData = allData.concat(data);
      from += step;
      if (data.length < step) {
        fetchMore = false;
      }
    } else {
      fetchMore = false;
    }
  }
  console.log(`Total fetched: ${allData.length}`);
})();
