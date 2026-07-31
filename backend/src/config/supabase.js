const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabaseBucket = process.env.SUPABASE_BUCKET || 'sekar-dairy';

const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

let supabase = null;
if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase Storage initialized successfully.');
  } catch (err) {
    console.error('Error initializing Supabase client:', err.message);
  }
} else {
  console.log('⚠️ Supabase environment variables missing. Uploader will fall back to local disk storage.');
}

module.exports = {
  supabase,
  supabaseBucket,
  isSupabaseConfigured
};
