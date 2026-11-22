import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dwbgxzrcnqxntfskpxzo.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'site-banner';
const OBJECT_PATH = 'barangay-services-banner-official.png';

if (!SERVICE_ROLE_KEY) {
  throw new Error('Set SUPABASE_SERVICE_ROLE_KEY in your shell before running npm run seed:banner. Never commit this key.');
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: buckets, error: listError } = await supabase.storage.listBuckets();
if (listError) throw listError;

const existingBucket = buckets.find((bucket) => bucket.name === BUCKET);
const bucketResult = existingBucket
  ? await supabase.storage.updateBucket(BUCKET, {
      public: true,
      fileSizeLimit: '5MB',
      allowedMimeTypes: ['image/png'],
    })
  : await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: '5MB',
      allowedMimeTypes: ['image/png'],
    });
if (bucketResult.error) throw bucketResult.error;

const banner = await readFile(new URL('../assets/barangay-services-banner-official.png', import.meta.url));
const { error: uploadError } = await supabase.storage.from(BUCKET).upload(OBJECT_PATH, banner, {
  contentType: 'image/png',
  cacheControl: '3600',
  upsert: true,
});
if (uploadError) throw uploadError;

const { data } = supabase.storage.from(BUCKET).getPublicUrl(OBJECT_PATH);
console.log(`Banner seeded to Supabase Storage: ${data.publicUrl}`);
