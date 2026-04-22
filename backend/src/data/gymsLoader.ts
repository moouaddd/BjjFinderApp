import { createClient } from '@supabase/supabase-js';

export interface GymRecord {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  rating: number | null;
  ratingCount: number | null;
}

// ── Supabase client ─────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

// ── Helpers ─────────────────────────────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── In-memory cache ──────────────────────────────────────────────────────────
let _cache: GymRecord[] | null = null;

async function fetchFromSupabase(): Promise<GymRecord[]> {
  const PAGE = 1000;
  const rows: Record<string, unknown>[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('gyms')
      .select('name,city,address,latitude,longitude,phone,email,website,rating,rating_count')
      .range(from, from + PAGE - 1)
      .order('city', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw new Error(`Supabase error: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...(data as Record<string, unknown>[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }

  const seen = new Set<string>();
  const gyms: GymRecord[] = [];

  for (const row of rows) {
    const name = (row.name as string)?.trim();
    if (!name) continue;

    const lat = row.latitude as number | null;
    const lng = row.longitude as number | null;
    if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) continue;

    const key = `${name}|${lat.toFixed(5)}|${lng.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const baseSlug = slugify(name);
    let id = baseSlug;
    let suffix = 2;
    while (gyms.some((g) => g.id === id)) {
      id = `${baseSlug}-${suffix++}`;
    }

    const ratingRaw = row.rating as number | null;
    const ratingCountRaw = row.rating_count as number | null;

    gyms.push({
      id,
      name,
      city:       (row.city as string)?.trim() ?? '',
      country:    'ES',
      lat,
      lng,
      phone:      (row.phone as string) || null,
      email:      (row.email as string) || null,
      website:    (row.website as string) || null,
      address:    (row.address as string) || null,
      rating:     ratingRaw && ratingRaw > 0 ? Math.round(ratingRaw * 10) / 10 : null,
      ratingCount: ratingCountRaw && ratingCountRaw > 0 ? ratingCountRaw : null,
    });
  }

  return gyms;
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Loads gyms from Supabase and warms the cache. Call once at startup. */
export async function initGyms(): Promise<void> {
  const gyms = await fetchFromSupabase();
  _cache = gyms;
  console.log(`  ✅ Loaded ${gyms.length} gyms from Supabase`);

  // Refresh cache every 10 minutes so Supabase edits are reflected without restart
  setInterval(async () => {
    try {
      _cache = await fetchFromSupabase();
      console.log(`  🔄 Gyms cache refreshed (${_cache.length} records)`);
    } catch (err) {
      console.error('  ⚠️  Failed to refresh gyms cache:', err);
    }
  }, 10 * 60 * 1000);
}

/** Returns the in-memory gym cache synchronously. Requires initGyms() to have been called first. */
export function loadGyms(): GymRecord[] {
  if (!_cache) throw new Error('Gyms cache not initialised — await initGyms() at startup');
  return _cache;
}

export function getGymById(id: string): GymRecord | undefined {
  return loadGyms().find((g) => g.id === id);
}

export function getCities(): string[] {
  const cities = [...new Set(loadGyms().map((g) => g.city))];
  return cities.sort((a, b) => a.localeCompare(b, 'es'));
}
