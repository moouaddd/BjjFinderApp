import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function nullIfEmpty(val: string): string | null {
  const trimmed = val?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

let _cache: GymRecord[] | null = null;

export function loadGyms(): GymRecord[] {
  if (_cache) return _cache;

  const csvPath = path.resolve(__dirname, '../../../data/gyms_export.csv');
  const raw = fs.readFileSync(csvPath, 'utf-8');

  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
  }) as Record<string, string>[];

  const seen = new Set<string>();
  const gyms: GymRecord[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = row.name?.trim();
    if (!name) continue;

    const lat = parseFloat(row.lat);
    const lng = parseFloat(row.lng);
    if (isNaN(lat) || isNaN(lng)) continue;

    // Deduplicate by name + lat + lng
    const key = `${name}|${lat.toFixed(5)}|${lng.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const baseSlug = slugify(name);
    let id = baseSlug;
    let suffix = 2;
    while (gyms.some((g) => g.id === id)) {
      id = `${baseSlug}-${suffix++}`;
    }

    const ratingRaw = parseFloat(row.rating ?? '');
    const ratingCountRaw = parseInt(row.rating_count ?? '', 10);

    gyms.push({
      id,
      name,
      city: row.city?.trim() ?? '',
      country: row.country?.trim() ?? 'ES',
      lat,
      lng,
      phone: nullIfEmpty(row.phone),
      email: nullIfEmpty(row.email),
      website: nullIfEmpty(row.website),
      address: nullIfEmpty(row.address),
      rating: isNaN(ratingRaw) || ratingRaw === 0 ? null : Math.round(ratingRaw * 10) / 10,
      ratingCount: isNaN(ratingCountRaw) || ratingCountRaw === 0 ? null : ratingCountRaw,
    });
  }

  gyms.sort((a, b) => a.city.localeCompare(b.city, 'es') || a.name.localeCompare(b.name, 'es'));

  _cache = gyms;
  console.log(`  Loaded ${gyms.length} gyms from CSV`);
  return gyms;
}

export function getGymById(id: string): GymRecord | undefined {
  return loadGyms().find((g) => g.id === id);
}

export function getCities(): string[] {
  const cities = [...new Set(loadGyms().map((g) => g.city))];
  return cities.sort((a, b) => a.localeCompare(b, 'es'));
}
