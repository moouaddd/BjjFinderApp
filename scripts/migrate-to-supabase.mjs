/**
 * Migration script: gyms_export.csv → Supabase `gyms` table
 * Run: node scripts/migrate-to-supabase.mjs
 */

import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Credentials ────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Read & parse CSV ────────────────────────────────────────────────────────
const csvPath = join(__dirname, '../data/gyms_export.csv');
const raw = readFileSync(csvPath, 'utf-8');

const records = parse(raw, {
  columns: true,          // first row = headers
  skip_empty_lines: true,
  trim: true,
  relax_column_count: true,
});

console.log(`\n📄 CSV rows read: ${records.length}`);

// ── Transform to Supabase schema ────────────────────────────────────────────
function clean(val) {
  return val && val.trim() !== '' ? val.trim() : null;
}

function toFloat(val) {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

const gyms = records.map((r) => ({
  name:               clean(r.name),
  city:               clean(r.city),
  address:            clean(r.address),
  latitude:           toFloat(r.lat),
  longitude:          toFloat(r.lng),
  phone:              clean(r.phone),
  email:              clean(r.email),
  website:            clean(r.website),
  open_mat_friday:    false,
  open_mat_saturday:  false,
  open_mat_sunday:    false,
  // extra fields from CSV kept for reference
  rating:             toFloat(r.rating),
  rating_count:       r.rating_count ? parseInt(r.rating_count, 10) : null,
  source:             clean(r.source),
})).filter((g) => g.name !== null);   // skip rows without a name

console.log(`✅ Valid records after cleaning: ${gyms.length}`);

// ── Deduplicate by name + city (within the CSV itself) ──────────────────────
const seen = new Set();
const unique = gyms.filter((g) => {
  const key = `${g.name?.toLowerCase()}|${g.city?.toLowerCase()}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

const duplicatesRemoved = gyms.length - unique.length;
if (duplicatesRemoved > 0) {
  console.log(`⚠️  Duplicates removed from CSV: ${duplicatesRemoved}`);
}
console.log(`📦 Records to insert: ${unique.length}`);

// ── Batch insert into Supabase ──────────────────────────────────────────────
const BATCH_SIZE = 50;
let inserted = 0;
let skipped  = 0;
let errors   = 0;

for (let i = 0; i < unique.length; i += BATCH_SIZE) {
  const batch = unique.slice(i, i + BATCH_SIZE);
  const batchNum = Math.floor(i / BATCH_SIZE) + 1;
  const totalBatches = Math.ceil(unique.length / BATCH_SIZE);

  process.stdout.write(`  Batch ${batchNum}/${totalBatches} … `);

  const { data, error } = await supabase
    .from('gyms')
    .upsert(batch, {
      onConflict: 'name,city',   // skip true duplicates in Supabase
      ignoreDuplicates: true,
    })
    .select('id');

  if (error) {
    console.error(`\n  ❌ Error in batch ${batchNum}:`, error.message);
    errors += batch.length;
  } else {
    const count = data?.length ?? 0;
    inserted += count;
    skipped  += batch.length - count;
    console.log(`inserted ${count}, skipped ${batch.length - count}`);
  }
}

// ── Summary ─────────────────────────────────────────────────────────────────
console.log('\n─────────────────────────────────────────');
console.log('Migration complete');
console.log(`  Inserted : ${inserted}`);
console.log(`  Skipped  : ${skipped}  (already existed)`);
console.log(`  Errors   : ${errors}`);

// ── Verify final count in Supabase ──────────────────────────────────────────
const { count, error: countErr } = await supabase
  .from('gyms')
  .select('*', { count: 'exact', head: true });

if (countErr) {
  console.error('Could not verify final count:', countErr.message);
} else {
  console.log(`\n🏆 Total rows now in Supabase gyms table: ${count}`);
}
