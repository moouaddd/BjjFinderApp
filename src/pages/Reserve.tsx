import { useState, useEffect, useCallback } from 'react';
import { MapPin, Phone, Mail, Clock, Globe, Instagram, ChevronDown, ChevronUp, ArrowLeft, Star, Loader2, AlertCircle, Search } from 'lucide-react';
import { api, type GymRecord } from '../services/api';

export default function Reserve() {
  const [gyms, setGyms] = useState<GymRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [selectedGym, setSelectedGym] = useState<GymRecord | null>(null);
  const [infoOpen, setInfoOpen] = useState(true);

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

  const filteredGyms = gyms.filter((g) => {
    const matchCity = !cityFilter || g.city === cityFilter;
    const matchSearch = !citySearch || g.name.toLowerCase().includes(citySearch.toLowerCase()) || g.city.toLowerCase().includes(citySearch.toLowerCase());
    return matchCity && matchSearch;
  });

  const handleSelectGym = (gym: GymRecord) => {
    setSelectedGym(gym);
    setInfoOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-dark-800 border-b border-white/5 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #e6b800 0%, transparent 50%)' }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-4xl font-black text-white">
            Contacta tu <span className="gradient-text">academia</span>
          </h1>
          <p className="text-gray-400 mt-2 text-base">
            Consulta información y contacta directamente con la academia de tu elección.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* LOADING */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-500">
            <Loader2 size={36} className="animate-spin text-gold-500" />
            <p className="text-sm">Cargando academias...</p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <AlertCircle size={36} className="text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={fetchGyms} className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-black font-bold text-sm rounded-xl">
              Reintentar
            </button>
          </div>
        )}

        {/* ACADEMY DETAIL VIEW */}
        {!loading && !error && selectedGym && (
          <div>
            <button
              onClick={() => setSelectedGym(null)}
              className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              Volver a la lista
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left: main info */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-dark-700 border border-white/8 rounded-2xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gold-500/15 flex items-center justify-center shrink-0">
                      <MapPin size={22} className="text-gold-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-white font-black text-xl">{selectedGym.name}</h2>
                      <p className="text-gold-400 text-sm mt-0.5">{selectedGym.city}</p>
                      {selectedGym.address && (
                        <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
                          <MapPin size={12} className="shrink-0" />
                          {selectedGym.address}
                        </p>
                      )}
                      {selectedGym.rating && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <Star size={13} className="text-yellow-400" fill="currentColor" />
                          <span className="text-gray-400 text-sm">{selectedGym.rating}</span>
                          {selectedGym.ratingCount && (
                            <span className="text-gray-600 text-xs">({selectedGym.ratingCount} reseñas)</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Horarios — coming soon */}
                <div className="bg-dark-700 border border-white/8 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setInfoOpen(!infoOpen)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gold-500" />
                      <span className="text-white font-semibold text-sm">Horarios y clases</span>
                    </div>
                    {infoOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </button>
                  {infoOpen && (
                    <div className="px-5 pb-5 border-t border-white/5">
                      <div className="mt-4 bg-gold-500/5 border border-gold-500/15 rounded-xl p-4">
                        <p className="text-gold-400 text-xs font-semibold uppercase tracking-widest mb-1">Próximamente</p>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          Los horarios detallados estarán disponibles cuando la academia se registre en la plataforma.
                          Mientras tanto, contacta directamente con ellos.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: contact + CTA */}
              <div className="space-y-4">
                <div className="bg-dark-700 border border-white/8 rounded-2xl p-5">
                  <h3 className="text-white font-bold text-sm mb-4">Contacto</h3>
                  <div className="space-y-3">
                    {selectedGym.phone && (
                      <a href={`tel:${selectedGym.phone.replace(/\s/g, '')}`} className="flex items-center gap-3 text-gray-400 hover:text-gold-400 transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-gold-500/15 flex items-center justify-center shrink-0 transition-colors">
                          <Phone size={14} />
                        </div>
                        <span className="text-sm">{selectedGym.phone}</span>
                      </a>
                    )}
                    {selectedGym.email && (
                      <a href={`mailto:${selectedGym.email}`} className="flex items-center gap-3 text-gray-400 hover:text-gold-400 transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-gold-500/15 flex items-center justify-center shrink-0 transition-colors">
                          <Mail size={14} />
                        </div>
                        <span className="text-sm truncate">{selectedGym.email}</span>
                      </a>
                    )}
                    {selectedGym.website && (
                      <a href={selectedGym.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-400 hover:text-gold-400 transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-gold-500/15 flex items-center justify-center shrink-0 transition-colors">
                          <Globe size={14} />
                        </div>
                        <span className="text-sm">Sitio web</span>
                      </a>
                    )}
                    {selectedGym.website?.includes('instagram.com') && (
                      <a href={selectedGym.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-400 hover:text-gold-400 transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-gold-500/15 flex items-center justify-center shrink-0 transition-colors">
                          <Instagram size={14} />
                        </div>
                        <span className="text-sm">Instagram</span>
                      </a>
                    )}
                    {!selectedGym.phone && !selectedGym.email && !selectedGym.website && (
                      <p className="text-gray-600 text-xs italic">Sin datos de contacto disponibles aún</p>
                    )}
                  </div>
                </div>

                <div className="bg-dark-700 border border-white/8 rounded-2xl p-5">
                  <h3 className="text-white font-bold text-sm mb-3">Precios</h3>
                  {selectedGym.pricePerClass || selectedGym.monthlyFee ? (
                    <div className="space-y-2">
                      {selectedGym.pricePerClass != null && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-xs">Clase suelta</span>
                          <span className="text-gold-400 font-bold text-sm">{selectedGym.pricePerClass} €</span>
                        </div>
                      )}
                      {selectedGym.monthlyFee != null && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-xs">Mensualidad</span>
                          <span className="text-gold-400 font-bold text-sm">{selectedGym.monthlyFee} €/mes</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs leading-relaxed">
                      Consulta precios directamente con la academia.
                    </p>
                  )}
                </div>

                <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 border border-gold-500/25 rounded-2xl p-5">
                  <p className="text-gold-400 text-xs font-semibold uppercase tracking-widest mb-2">Próximamente</p>
                  <p className="text-white font-bold text-sm mb-2">¿Eres esta academia?</p>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Regístrate como organizer para gestionar tus clases, precios y reservas directamente desde la plataforma.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GYM LIST */}
        {!loading && !error && !selectedGym && (
          <div>
            <div className="mb-5">
              <h2 className="text-white font-bold text-xl mb-4">
                ¿A qué academia quieres ir?
                <span className="text-gray-500 font-normal text-sm ml-2">({filteredGyms.length})</span>
              </h2>
              <div className="flex gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px] relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar academia..."
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
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
                    {cities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredGyms.map((gym) => (
                <button
                  key={gym.id}
                  onClick={() => handleSelectGym(gym)}
                  className="bg-dark-700 border border-white/8 rounded-2xl p-4 text-left hover:border-gold-500/40 hover:bg-dark-600 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm group-hover:text-gold-400 transition-colors truncate">
                        {gym.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-gray-500 text-xs">
                        <MapPin size={11} className="text-gold-500/60 shrink-0" />
                        <span className="truncate">{gym.city}</span>
                        {gym.rating && (
                          <>
                            <span className="text-gray-700">·</span>
                            <Star size={10} className="text-yellow-400 shrink-0" fill="currentColor" />
                            <span>{gym.rating}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-gold-500/60 text-xs shrink-0 ml-3 font-medium">Ver info →</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
