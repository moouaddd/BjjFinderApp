import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Phone, Mail, Globe, Star, Search, Loader2,
  ChevronDown, ChevronRight, CheckCircle, Users,
} from 'lucide-react';
import { api, type GymRecord } from '../services/api';
import { useAuth } from '../context/AuthContext';
import GymDetailModal from '../components/GymDetailModal';

function toSlug(city: string): string {
  return city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function OpenMatBadge({ day, verified }: { day: string; verified: boolean }) {
  return (
    <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
      verified
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
        : 'bg-white/5 text-gray-400 border-white/10'
    }`}>
      <CheckCircle size={9} />
      Open Mat {day}
    </span>
  );
}

function GymCard({ gym, onSelect }: { gym: GymRecord; onSelect: (g: GymRecord) => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const handleClaim = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { navigate('/login', { state: { from: '/' } }); return; }
    setClaiming(true);
    try {
      await api.gyms.claim(gym.id, 'Solicito reclamar esta academia como propietario.');
      setClaimed(true);
    } catch {
      // already claimed or error
    } finally {
      setClaiming(false);
    }
  };

  const hasOpenMat = gym.openMatFriday || gym.openMatSaturday;

  return (
    <div
      onClick={() => onSelect(gym)}
      className="bg-dark-700 border border-white/8 rounded-2xl overflow-hidden card-hover animate-fadeInUp flex flex-col cursor-pointer hover:border-gold-500/30 transition-colors"
    >
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-medium bg-gold-500/15 text-gold-400 border border-gold-500/20 px-2 py-0.5 rounded-full">
                {gym.city}
              </span>
              {gym.isVerified && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <CheckCircle size={9} /> Verificada
                </span>
              )}
              {gym.rating && (
                <div className="flex items-center gap-1 text-yellow-400 text-xs">
                  <Star size={11} fill="currentColor" />
                  <span className="text-gray-400">{gym.rating}</span>
                </div>
              )}
            </div>
            <h3 className="text-white font-bold text-base leading-tight">{gym.name}</h3>
            {gym.address && (
              <div className="flex items-center gap-1.5 mt-1.5 text-gray-500 text-xs">
                <MapPin size={12} className="text-gold-500/70 shrink-0" />
                <span className="truncate">{gym.address}</span>
              </div>
            )}
          </div>
        </div>

        {hasOpenMat && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {gym.openMatFriday && <OpenMatBadge day="Viernes" verified={gym.isVerified} />}
            {gym.openMatSaturday && <OpenMatBadge day="Sábado" verified={gym.isVerified} />}
            {!gym.isVerified && <span className="text-[10px] text-gray-600 self-center">(comunidad)</span>}
          </div>
        )}
        {gym.openMatNotes && (
          <p className="text-gray-600 text-xs mb-3 leading-relaxed">{gym.openMatNotes}</p>
        )}

        <div className="flex flex-wrap gap-3">
          {gym.phone && (
            <a href={`tel:${gym.phone.replace(/\s/g, '')}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-gray-500 hover:text-gold-400 text-xs transition-colors">
              <Phone size={12} />{gym.phone}
            </a>
          )}
          {gym.email && (
            <a href={`mailto:${gym.email}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-gray-500 hover:text-gold-400 text-xs transition-colors">
              <Mail size={12} /><span className="truncate max-w-[160px]">{gym.email}</span>
            </a>
          )}
          {gym.website && (
            <a href={gym.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-gray-500 hover:text-gold-400 text-xs transition-colors">
              <Globe size={12} />Sitio web
            </a>
          )}
        </div>
      </div>

      {(gym.pricePerClass != null || gym.monthlyFee != null) && (
        <div className="px-5 pb-2 flex flex-wrap gap-3">
          {gym.pricePerClass != null && (
            <span className="text-xs text-gray-500">Clase: <span className="text-gold-400 font-semibold">{gym.pricePerClass} €</span></span>
          )}
          {gym.monthlyFee != null && (
            <span className="text-xs text-gray-500">Mensual: <span className="text-gold-400 font-semibold">{gym.monthlyFee} €</span></span>
          )}
        </div>
      )}

      <div className="px-5 pb-4 pt-3 border-t border-white/5">
        {gym.claimedByOwner ? (
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-500/60 font-medium">
            <Users size={10} /> Gestionada por el propietario
          </span>
        ) : claimed ? (
          <span className="text-[10px] text-gold-400">Solicitud enviada ✓</span>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); handleClaim(e); }}
            disabled={claiming}
            className="text-[10px] text-gray-600 hover:text-gold-400 transition-colors disabled:opacity-50"
          >
            {claiming ? 'Enviando...' : '¿Es tu academia? Reclamar perfil →'}
          </button>
        )}
      </div>
    </div>
  );
}

interface CityContent {
  city: string;
  count: number;
  intro: string;
  training: string;
  faqs: Array<{ q: string; a: string }>;
  bestRated: { name: string; rating: number | null; address: string | null } | null;
}

export default function CityPage() {
  const { ciudad = '' } = useParams<{ ciudad: string }>();
  const navigate = useNavigate();

  const [gyms, setGyms] = useState<GymRecord[]>([]);
  const [content, setContent] = useState<CityContent | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedGym, setSelectedGym] = useState<GymRecord | null>(null);

  const fetchData = useCallback(async () => {
    if (!ciudad) return;
    setLoading(true);
    setNotFound(false);
    setGyms([]);
    setContent(null);

    try {
      const [gymsRes, citiesRes] = await Promise.all([
        api.gyms.list({ limit: 600 }),
        api.gyms.cities(),
      ]);

      const matching = gymsRes.data.filter((g) => toSlug(g.city) === ciudad.toLowerCase());

      if (matching.length === 0) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setGyms(matching);
      setCities(citiesRes.cities);

      // Try to get SEO content; fall back to basic content if it fails
      let cityContent: CityContent;
      try {
        const seoData = await api.seo.city(ciudad);
        cityContent = {
          city: seoData.city,
          count: seoData.count,
          intro: seoData.intro,
          training: seoData.training,
          faqs: seoData.faqs,
          bestRated: seoData.bestRated,
        };
      } catch {
        const name = matching[0].city;
        cityContent = {
          city: name,
          count: matching.length,
          intro: `Encuentra las ${matching.length} academias de Brazilian Jiu-Jitsu en ${name}. Consulta horarios, precios y contacto.`,
          training: `Entrena BJJ en ${name} con instructores certificados para todos los niveles.`,
          faqs: [],
          bestRated: null,
        };
      }

      setContent(cityContent);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [ciudad]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (content) document.title = `Academias de BJJ en ${content.city} | BJJ Spain`;
    return () => { document.title = 'BJJ Spain'; };
  }, [content]);

  const filtered = gyms.filter((g) =>
    !search ||
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.city.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={36} className="animate-spin text-gold-500" />
      </div>
    );
  }

  if (notFound || !content) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-5xl">🥋</p>
        <h1 className="text-2xl font-bold text-white">Ciudad no encontrada</h1>
        <p className="text-gray-400 text-sm">No hay academias registradas para esta ciudad.</p>
        <Link to="/" className="mt-2 flex items-center gap-1 text-gold-400 hover:text-gold-300 text-sm transition-colors">
          ← Volver al inicio
        </Link>
      </div>
    );
  }

  const { city, count, intro, training, faqs, bestRated } = content;

  return (
    <div className="min-h-screen">

      {/* Hero */}
      <div className="bg-dark-800 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-5">
            <Link to="/" className="hover:text-gold-400 transition-colors">Inicio</Link>
            <ChevronRight size={12} />
            <Link to="/academias-bjj-espana" className="hover:text-gold-400 transition-colors">Ciudades</Link>
            <ChevronRight size={12} />
            <span className="text-gray-300">{city}</span>
          </nav>

          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-full px-3 py-1 mb-4">
              <MapPin size={12} className="text-gold-400" />
              <span className="text-gold-400 text-xs font-medium uppercase tracking-widest">
                {city} · {count} {count === 1 ? 'academia' : 'academias'}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
              BJJ en{' '}
              <span className="gradient-text">{city}</span>
            </h1>
            <p className="text-gray-400 mt-4 text-base leading-relaxed">{intro}</p>
            {bestRated && (
              <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
                <Star size={11} className="text-yellow-400 shrink-0" fill="currentColor" />
                Mejor valorada:{' '}
                <span className="text-gray-300 font-medium">{bestRated.name}</span>
                {bestRated.rating != null && <span className="text-yellow-400 ml-1">{bestRated.rating}/5</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sticky filters — same as Home */}
      <div className="sticky top-16 z-40 bg-dark-900/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder={`Buscar academia en ${city}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-dark-700 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-gold-500/50 transition-colors"
            />
          </div>
          {cities.length > 0 && (
            <div className="relative">
              <select
                defaultValue={ciudad}
                onChange={(e) => { if (e.target.value) navigate(`/bjj-${toSlug(e.target.value)}`); }}
                className="appearance-none bg-dark-700 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-sm text-white outline-none focus:border-gold-500/50 transition-colors cursor-pointer"
              >
                {cities.map((c) => (
                  <option key={c} value={toSlug(c)}>{c}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {selectedGym && (
        <GymDetailModal gym={selectedGym} onClose={() => setSelectedGym(null)} />
      )}

      {/* Gym grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-500 text-sm">
            <span className="text-white font-semibold">{filtered.length}</span>{' '}
            academia{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
            <span className="text-gold-400"> en {city}</span>
          </p>
          <Link to="/" className="text-xs text-gray-500 hover:text-gold-400 transition-colors">
            ← Ver todas
          </Link>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🥋</p>
            <p className="text-lg font-medium text-gray-500">No se encontraron academias</p>
            <p className="text-sm text-gray-600 mt-1">Prueba con otro término</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((gym) => (
              <GymCard key={gym.id} gym={gym} onSelect={setSelectedGym} />
            ))}
          </div>
        )}

        {/* SEO text below grid */}
        <div className="mt-14 max-w-3xl space-y-8 pb-8">
          <section>
            <h2 className="text-lg font-bold text-white mb-3 pb-2 border-b border-white/10">
              Entrenar BJJ en {city}
            </h2>
            <p className="text-gray-400 leading-relaxed text-sm bg-dark-800 border border-white/8 rounded-xl p-5">
              {training}
            </p>
          </section>

          {faqs.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-white mb-4 pb-2 border-b border-white/10">
                Preguntas frecuentes — BJJ en {city}
              </h2>
              <div className="space-y-3">
                {faqs.map((item, i) => (
                  <div key={i} className="bg-dark-800 border border-white/8 rounded-xl p-5">
                    <h3 className="text-white font-semibold text-sm mb-2">{item.q}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link to="/academias-bjj-espana" className="bg-dark-800 border border-white/10 rounded-xl p-4 text-center hover:border-gold-500/40 transition-colors">
              <p className="text-gold-400 font-semibold text-sm mb-1">Todas las ciudades</p>
              <p className="text-gray-500 text-xs">Directorio BJJ España</p>
            </Link>
            <Link to="/openmats" className="bg-dark-800 border border-white/10 rounded-xl p-4 text-center hover:border-gold-500/40 transition-colors">
              <p className="text-gold-400 font-semibold text-sm mb-1">Open Mats</p>
              <p className="text-gray-500 text-xs">Sesiones libres</p>
            </Link>
            <Link to="/eventos" className="bg-dark-800 border border-white/10 rounded-xl p-4 text-center hover:border-gold-500/40 transition-colors">
              <p className="text-gold-400 font-semibold text-sm mb-1">Eventos</p>
              <p className="text-gray-500 text-xs">Seminarios y torneos</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
