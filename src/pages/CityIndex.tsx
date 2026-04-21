import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, ChevronRight, Search } from 'lucide-react';
import { api } from '../services/api';
import type { GymRecord } from '../services/api';

function toSlug(city: string): string {
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function CityIndex() {
  const [cityMap, setCityMap] = useState<Map<string, GymRecord[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.gyms
      .list({ limit: 600 })
      .then((res) => {
        const map = new Map<string, GymRecord[]>();
        res.data.forEach((g) => {
          const arr = map.get(g.city) ?? [];
          arr.push(g);
          map.set(g.city, arr);
        });
        setCityMap(map);
      })
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...cityMap.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .filter(([city]) => !search || city.toLowerCase().includes(search.toLowerCase()));

  const totalGyms = [...cityMap.values()].reduce((s, a) => s + a.length, 0);

  return (
    <>
      <Helmet>
        <title>Academias de BJJ en España por ciudad | BJJ Spain</title>
        <meta
          name="description"
          content={`Directorio completo de academias de Brazilian Jiu-Jitsu en España. Encuentra gimnasios de BJJ en Madrid, Barcelona, Valencia, Sevilla y más de ${cityMap.size} ciudades.`}
        />
        <link rel="canonical" href="https://bjjspain.es/academias-bjj-espana" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-gold-400">Inicio</Link>
          <ChevronRight size={14} />
          <span className="text-gray-300">Academias de BJJ en España</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Academias de BJJ en España
        </h1>
        <p className="text-gray-400 mb-8">
          Directorio de {totalGyms} academias de Brazilian Jiu-Jitsu en {cityMap.size} ciudades de España.
          Selecciona tu ciudad para ver todas las opciones disponibles.
        </p>

        {/* Search */}
        <div className="relative mb-8">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ciudad..."
            className="w-full max-w-sm bg-dark-800 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500/60"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <p className="text-gray-500 py-10 text-center">No se encontraron ciudades para "{search}"</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {sorted.map(([city, gyms]) => (
              <Link
                key={city}
                to={`/bjj-${toSlug(city)}`}
                className="bg-dark-800 border border-white/8 rounded-xl p-4 hover:border-gold-500/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center shrink-0">
                    <MapPin size={14} className="text-gold-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-white truncate">{city}</div>
                    <div className="text-xs text-gray-500">
                      {gyms.length} {gyms.length === 1 ? 'academia' : 'academias'}
                    </div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-600 group-hover:text-gold-400 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
