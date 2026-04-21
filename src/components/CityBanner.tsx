import { useEffect, useState } from 'react';
import { MapPin, Star } from 'lucide-react';
import { api } from '../services/api';

function toSlug(city: string): string {
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface CityData {
  city: string;
  slug: string;
  count: number;
  intro: string;
  bestRated: { name: string; rating: number | null; address: string | null } | null;
}

export default function CityBanner({ city }: { city: string }) {
  const [data, setData] = useState<CityData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!city) { setData(null); return; }
    setLoading(true);
    api.seo
      .city(toSlug(city))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [city]);

  if (!city || loading || !data) return null;

  return (
    <div className="bg-dark-800 border border-gold-500/20 rounded-2xl p-5 mb-6 animate-fadeInUp">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-gold-500/15 flex items-center justify-center">
              <MapPin size={13} className="text-gold-400" />
            </div>
            <h2 className="text-white font-bold text-base">BJJ en {data.city}</h2>
            <span className="text-xs text-gray-500 bg-dark-700 border border-white/8 rounded-full px-2 py-0.5">
              {data.count} {data.count === 1 ? 'academia' : 'academias'}
            </span>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed mb-3">{data.intro}</p>
          {data.bestRated && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
              <Star size={11} className="text-yellow-400 shrink-0" fill="currentColor" />
              Mejor valorada: <span className="text-gray-300 font-medium">{data.bestRated.name}</span>
              {data.bestRated.rating && <span className="text-yellow-400">{data.bestRated.rating}/5</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
