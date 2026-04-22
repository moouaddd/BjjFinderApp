import { useState, useEffect, useCallback } from 'react';
import { MapPin, Phone, Mail, Globe, Star, Search, Loader2, AlertCircle, ChevronDown, CheckCircle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, type GymRecord } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CityBanner from '../components/CityBanner';
import GymDetailModal from '../components/GymDetailModal';

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

export default function Home() {
  const [gyms, setGyms] = useState<GymRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [selectedGym, setSelectedGym] = useState<GymRecord | null>(null);

  const fetchGyms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, citiesRes] = await Promise.all([
        api.gyms.list({ limit: 600 }),
        api.gyms.cities(),
      ]);
      setGyms(res.data);
      setCities(citiesRes.cities);
    } catch {
      setError('No se pudo conectar con el servidor. ¿Está el backend corriendo?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGyms(); }, [fetchGyms]);

  const filtered = gyms.filter((g) => {
    const matchCity = !cityFilter || g.city === cityFilter;
    const matchSearch = !search ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.city.toLowerCase().includes(search.toLowerCase());
    return matchCity && matchSearch;
  });

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden bg-dark-800 border-b border-white/5">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #e6b800 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, #e6b800 0%, transparent 40%)`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-full px-3 py-1 mb-4">
              <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
              <span className="text-gold-400 text-xs font-medium uppercase tracking-widest">Brazilian Jiu-Jitsu · España</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
              Encuentra tu{' '}
              <span className="gradient-text">academia BJJ</span>{' '}
              en España
            </h1>
            <p className="text-gray-400 mt-4 text-base leading-relaxed">
              Todos los gimnasios de Brazilian Jiu-Jitsu de España en un solo lugar.
              {!loading && gyms.length > 0 && (
                <> <span className="text-gold-400 font-semibold">{gyms.length} academias</span> y creciendo.</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-16 z-40 bg-dark-900/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar academia o ciudad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-dark-700 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-gold-500/50 transition-colors"
            />
          </div>
          <div className="relative">
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="appearance-none bg-dark-700 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-sm text-white outline-none focus:border-gold-500/50 transition-colors cursor-pointer"
            >
              <option value="">Todas las ciudades</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {selectedGym && (
        <GymDetailModal gym={selectedGym} onClose={() => setSelectedGym(null)} />
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-500">
            <Loader2 size={36} className="animate-spin text-gold-500" />
            <p className="text-sm">Cargando academias...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-500">
            <AlertCircle size={36} className="text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={fetchGyms} className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-black font-bold text-sm rounded-xl transition-all">
              Reintentar
            </button>
          </div>
        ) : (
          <>
            {cityFilter && <CityBanner city={cityFilter} />}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-500 text-sm">
                <span className="text-white font-semibold">{filtered.length}</span>{' '}
                academia{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
                {cityFilter && <span className="text-gold-400"> en {cityFilter}</span>}
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-600">
                <p className="text-4xl mb-3">🥋</p>
                <p className="text-lg font-medium text-gray-500">No se encontraron academias</p>
                <p className="text-sm mt-1">Prueba con otro filtro o búsqueda</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((gym) => (
                  <GymCard key={gym.id} gym={gym} onSelect={setSelectedGym} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
