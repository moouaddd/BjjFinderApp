export function toSlug(city: string): string {
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function slugToDisplay(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Maps slug → canonical city name from CSV (populated at runtime via API)
// Used in CityPage to find the real city name for API queries
export function normalizeCitySlug(slug: string): string {
  return slug.toLowerCase().trim();
}
