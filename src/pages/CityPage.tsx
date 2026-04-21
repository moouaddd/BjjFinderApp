import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Star, Phone, Globe, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import type { GymRecord } from '../services/api';
import { slugToDisplay } from '../utils/citySlug';

function toSlug(city: string): string {
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface CityContent {
  city: string;
  slug: string;
  count: number;
  intro: string;
  training: string;
  faqs: Array<{ q: string; a: string }>;
  bestRated: { name: string; rating: number | null; address: string | null } | null;
}

export default function CityPage() {
  const { ciudad = '' } = useParams<{ ciudad: string }>();
  const [gyms, setGyms] = useState<GymRecord[]>([]);
  const [content, setContent] = useState<CityContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const displayName = slugToDisplay(ciudad);

  useEffect(() => {
    if (!ciudad) return;
    setLoading(true);
    setNotFound(false);
    setContent(null);
    setGyms([]);

    Promise.all([
      api.gyms.list({ limit: 600 }),
      api.seo.city(ciudad),
    ])
      .then(([gymsRes, cityData]) => {
        const matching = gymsRes.data.filter((g) => toSlug(g.city) === ciudad.toLowerCase());
        if (matching.length === 0) {
          setNotFound(true);
        } else {
          setGyms(matching);
          setContent(cityData);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [ciudad]);

  useEffect(() => {
    if (content) {
      document.title = `Academias de BJJ en ${content.city} | BJJ Spain`;
    }
    return () => { document.title = 'BJJ Spain'; };
  }, [content]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !content) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <h1 className="text-2xl font-bold text-white">Ciudad no encontrada</h1>
        <p className="text-gray-400">No hay academias de BJJ registradas para &ldquo;{displayName}&rdquo;.</p>
        <Link to="/academias-bjj-espana" className="text-gold-400 hover:text-gold-300 flex items-center gap-1">
          Ver todas las ciudades <ChevronRight size={16} />
        </Link>
      </div>
    );
  }

  const { city, count, intro, training, faqs, bestRated } = content;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link to="/" className="hover:text-gold-400">Inicio</Link>
        <ChevronRight size={14} />
        <Link to="/academias-bjj-espana" className="hover:text-gold-400">Ciudades</Link>
        <ChevronRight size={14} />
        <span className="text-gray-300">{city}</span>
      </nav>

      {/* Hero */}
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-dark-800 border border-white/10 rounded-full px-3 py-1 mb-4">
          <MapPin size={12} className="text-gold-400" /> {city}, España · {count} {count === 1 ? 'academia' : 'academias'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Academias de Brazilian Jiu-Jitsu en {city}
        </h1>
        <p className="text-gray-400 leading-relaxed">{intro}</p>
      </div>

      {/* Gym list */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-white mb-5 pb-2 border-b border-white/10">
          Academias de BJJ en {city}
        </h2>
        <div className="grid gap-4">
          {gyms.map((gym) => (
            <Link
              key={gym.id}
              to={`/?ciudad=${toSlug(gym.city)}`}
              className="bg-dark-800 border border-white/8 rounded-xl p-5 hover:border-gold-500/40 hover:-translate-y-0.5 transition-all duration-200 block"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-base mb-1 truncate">{gym.name}</h3>
                  {gym.address && (
                    <p className="text-gray-400 text-sm flex items-center gap-1.5 mb-1">
                      <MapPin size={12} className="shrink-0 text-gold-500/60" /> {gym.address}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-2">
                    {gym.rating && (
                      <span className="text-xs text-yellow-400 flex items-center gap-1">
                        <Star size={11} fill="currentColor" /> {gym.rating}
                        {gym.ratingCount ? ` (${gym.ratingCount})` : ''}
                      </span>
                    )}
                    {gym.phone && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone size={11} /> {gym.phone}
                      </span>
                    )}
                    {gym.website && (
                      <span className="text-xs text-gold-400 flex items-center gap-1">
                        <Globe size={11} /> Sitio web
                      </span>
                    )}
                  </div>
                </div>
                {(gym.openMatFriday || gym.openMatSaturday) && (
                  <span className="shrink-0 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-2 py-0.5">
                    Open Mat
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Training section */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-white/10">
          Entrenar BJJ en {city}
        </h2>
        <div className="bg-dark-800 border border-white/8 rounded-xl p-6 space-y-3">
          <p className="text-gray-400 leading-relaxed">{training}</p>
          {bestRated && (
            <p className="text-gray-400 leading-relaxed">
              Una de las academias más destacadas es{' '}
              <span className="text-white font-semibold">{bestRated.name}</span>
              {bestRated.address ? `, situada en ${bestRated.address}` : ''}
              {bestRated.rating ? `, con una valoración de ${bestRated.rating}/5` : ''}.
            </p>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-white mb-5 pb-2 border-b border-white/10">
          Preguntas frecuentes sobre BJJ en {city}
        </h2>
        <div className="space-y-3">
          {faqs.map((item, i) => (
            <div key={i} className="bg-dark-800 border border-white/8 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2 text-sm">{item.q}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Internal linking */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          to="/academias-bjj-espana"
          className="bg-dark-800 border border-white/10 rounded-xl p-4 text-center hover:border-gold-500/40 transition-colors"
        >
          <div className="text-gold-400 font-semibold mb-1 text-sm">Ver todas las ciudades</div>
          <div className="text-gray-500 text-xs">Directorio BJJ en España</div>
        </Link>
        <Link
          to="/openmats"
          className="bg-dark-800 border border-white/10 rounded-xl p-4 text-center hover:border-gold-500/40 transition-colors"
        >
          <div className="text-gold-400 font-semibold mb-1 text-sm">Open Mats</div>
          <div className="text-gray-500 text-xs">Sesiones libres de entrenamiento</div>
        </Link>
        <Link
          to="/eventos"
          className="bg-dark-800 border border-white/10 rounded-xl p-4 text-center hover:border-gold-500/40 transition-colors"
        >
          <div className="text-gold-400 font-semibold mb-1 text-sm">Eventos de BJJ</div>
          <div className="text-gray-500 text-xs">Seminarios y torneos en España</div>
        </Link>
      </div>
    </div>
  );
}
