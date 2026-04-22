import { useState, useEffect, useCallback } from 'react';
import { MapPin, Clock, Phone, ChevronDown, Calendar, Users, Globe, Loader2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, type GymRecord } from '../services/api';
import type { CommunityEvent } from '../data/events';
import { categoryLabels, categoryColors, modalityLabels } from '../data/events';
import GymDetailModal from '../components/GymDetailModal';

function toSlug(city: string): string {
  return city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

type DayFilter = 'viernes' | 'sabado' | 'todos';

const DAY_OPTIONS: { value: DayFilter; label: string }[] = [
  { value: 'todos', label: 'Todos los días' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sabado', label: 'Sábado' },
];

function getDayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][d.getDay()];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

interface OpenMatSlot { dia: 'viernes' | 'sabado'; hora: string; duracion: string }

function gymToSlots(gym: GymRecord): OpenMatSlot[] {
  const slots: OpenMatSlot[] = [];
  if (gym.openMatFriday) slots.push({ dia: 'viernes', hora: gym.openMatFridayTime ?? '—', duracion: gym.openMatFridayDuration ?? '' });
  if (gym.openMatSaturday) slots.push({ dia: 'sabado', hora: gym.openMatSaturdayTime ?? '—', duracion: gym.openMatSaturdayDuration ?? '' });
  return slots;
}

export default function OpenMats() {
  const navigate = useNavigate();
  const [dayFilter, setDayFilter] = useState<DayFilter>('todos');
  const [cityFilter, setCityFilter] = useState('');
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [apiGyms, setApiGyms] = useState<GymRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGym, setSelectedGym] = useState<GymRecord | null>(null);

  const [allCitiesList, setAllCitiesList] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [eventsData, gymsData, citiesData] = await Promise.all([
        api.events.list(),
        api.gyms.list({ limit: 600 }),
        api.gyms.cities(),
      ]);
      setEvents(eventsData.filter((e) => e.type === 'openmat'));
      setApiGyms(gymsData.data.filter((g) => g.openMatFriday || g.openMatSaturday));
      setAllCitiesList(citiesData.cities);
    } catch {
      // show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // All cities for dropdown (from full gym list, sorted)
  const allCities = allCitiesList.length > 0
    ? allCitiesList
    : [...new Set([...apiGyms.map((g) => g.city), ...events.map((e) => e.city)])].sort((a, b) => a.localeCompare(b, 'es'));

  // Filtered gym results (owner-confirmed weekly open mats)
  const gymResults = apiGyms
    .filter((g) => {
      const hasDay =
        dayFilter === 'todos'
          ? true
          : (dayFilter === 'viernes' ? g.openMatFriday : g.openMatSaturday);
      const matchCity = !cityFilter || g.city === cityFilter;
      return hasDay && matchCity;
    })
    .map((g) => ({
      gym: g,
      slots: dayFilter === 'todos' ? gymToSlots(g) : gymToSlots(g).filter((s) => s.dia === dayFilter),
    }));

  // Filtered community event results
  const eventResults = events.filter((e) => {
    const matchDay = dayFilter === 'todos' || getDayOfWeek(e.date) === dayFilter;
    const matchCity = !cityFilter || e.city === cityFilter;
    return matchDay && matchCity;
  });

  const total = gymResults.length + eventResults.length;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-dark-800 border-b border-white/5 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #e6b800 0%, transparent 50%)' }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-full px-3 py-1 mb-4">
            <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
            <span className="text-gold-400 text-xs font-medium uppercase tracking-widest">Entrena libre</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white">
            Open <span className="gradient-text">Mats</span>
          </h1>
          <p className="text-gray-400 mt-3 text-base max-w-xl">
            Academias con open mat confirmado y eventos de la comunidad. Filtra por día y ciudad.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-16 z-40 bg-dark-900/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 flex-wrap">
          {/* Day toggle */}
          <div className="flex gap-1.5 bg-dark-800 border border-white/8 rounded-xl p-1">
            {DAY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDayFilter(opt.value)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  dayFilter === opt.value
                    ? 'bg-gold-500 text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* City select */}
          <div className="relative">
            <select
              value={cityFilter}
              onChange={(e) => {
                const city = e.target.value;
                if (city) {
                  navigate(`/horarios/${toSlug(city)}bjj`);
                } else {
                  setCityFilter('');
                }
              }}
              className="appearance-none bg-dark-700 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-sm text-white outline-none focus:border-gold-500/50 transition-colors cursor-pointer"
            >
              <option value="">Todas las ciudades</option>
              {allCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <p className="text-gray-600 text-sm ml-auto">
            <span className="text-white font-semibold">{total}</span> resultado{total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* === SECTION 1: Weekly gym open mats (owner-confirmed) === */}
        {gymResults.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gold-500" />
                <h2 className="text-white font-bold text-base">Horario semanal confirmado</h2>
              </div>
              <span className="text-gray-600 text-sm">
                {gymResults.length} academia{gymResults.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {gymResults.map(({ gym, slots }) => (
                <div
                  key={gym.id}
                  onClick={() => setSelectedGym(gym)}
                  className="bg-dark-700 border border-white/8 rounded-2xl overflow-hidden card-hover animate-fadeInUp cursor-pointer hover:border-gold-500/30 transition-colors"
                >
                  <div className="h-1 w-full bg-gradient-to-r from-gold-600 to-gold-400" />

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-bold text-sm leading-tight truncate">{gym.name}</h3>
                          {gym.isVerified && (
                            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full shrink-0">✓</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-gray-500 text-xs">
                          <MapPin size={11} className="text-gold-500/70 shrink-0" />
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/horarios/${toSlug(gym.city)}bjj`); }}
                            className="text-gold-400/70 hover:text-gold-400 transition-colors shrink-0"
                          >
                            {gym.city}
                          </button>
                          {gym.address && <span className="truncate">· {gym.address}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {slots.map((slot, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-gold-500/8 border border-gold-500/20 rounded-xl px-4 py-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gold-500/20 flex items-center justify-center">
                              <Clock size={15} className="text-gold-400" />
                            </div>
                            <div>
                              <p className="text-gold-400 font-bold text-sm">{slot.hora}</p>
                              <p className="text-gray-500 text-xs capitalize">{slot.dia}{slot.duracion ? ` · ${slot.duracion}` : ''}</p>
                            </div>
                          </div>
                          <span className="text-xs text-emerald-400 font-medium">Semanal</span>
                        </div>
                      ))}
                      {gym.openMatNotes && (
                        <p className="text-gray-600 text-xs px-1 pt-1">{gym.openMatNotes}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                      {gym.phone ? (
                        <a
                          href={`tel:${gym.phone.replace(/\s/g, '')}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gold-400 transition-colors"
                        >
                          <Phone size={12} />
                          {gym.phone}
                        </a>
                      ) : gym.website ? (
                        <a
                          href={gym.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gold-400 transition-colors"
                        >
                          <Globe size={12} />
                          Sitio web
                        </a>
                      ) : (
                        <span className="text-xs text-gray-700">—</span>
                      )}
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        {gym.isVerified ? 'Confirmado por el propietario' : 'Sin verificar'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* === SECTION 2: Community events === */}
        {!loading && eventResults.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <h2 className="text-white font-bold text-base">Open mats de la comunidad</h2>
              </div>
              <span className="text-gray-600 text-sm">
                {eventResults.length} evento{eventResults.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {eventResults.map((event) => (
                <div
                  key={event.id}
                  className="bg-dark-700 border border-white/8 rounded-2xl overflow-hidden card-hover animate-fadeInUp"
                >
                  <div className="h-1 w-full bg-gradient-to-r from-emerald-600 to-emerald-400" />

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[event.category]}`}>
                            {categoryLabels[event.category]}
                          </span>
                          <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">
                            {modalityLabels[event.modality]}
                          </span>
                        </div>
                        <h3 className="text-white font-bold text-sm leading-tight">{event.title}</h3>
                        <div className="flex items-center gap-1.5 mt-1 text-gray-500 text-xs">
                          <MapPin size={11} className="text-gold-500/70 shrink-0" />
                          <span className="truncate">{event.gym} · </span>
                          <button
                            onClick={() => navigate(`/horarios/${toSlug(event.city)}bjj`)}
                            className="text-gold-400/70 hover:text-gold-400 transition-colors shrink-0"
                          >
                            {event.city}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <Calendar size={15} className="text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-emerald-400 font-bold text-sm capitalize">{formatDate(event.date)}</p>
                        <p className="text-gray-500 text-xs">{event.time} · {event.duration}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Users size={12} />
                        {event.spotsLeft != null ? `${event.spotsLeft} plazas libres` : 'Plazas libres'}
                      </div>
                      <span className={`text-xs font-bold ${event.price === 0 ? 'text-emerald-400' : 'text-gold-400'}`}>
                        {event.price === 0 ? 'Gratuito' : `${event.price} €`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-3 text-gray-600 text-sm py-4">
            <Loader2 size={16} className="animate-spin text-gold-500" />
            Cargando eventos de la comunidad...
          </div>
        )}

        {/* Empty */}
        {!loading && total === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🥋</p>
            <p className="text-gray-400 font-semibold text-lg">No hay open mats</p>
            <p className="text-gray-600 text-sm mt-1">
              No se encontraron open mats
              {dayFilter !== 'todos' && <> el {DAY_OPTIONS.find(d => d.value === dayFilter)?.label.toLowerCase()}</>}
              {cityFilter && <> en {cityFilter}</>}
            </p>
            <button
              onClick={() => { setDayFilter('todos'); setCityFilter(''); }}
              className="mt-4 px-4 py-2 text-sm text-gold-400 border border-gold-500/30 rounded-xl hover:bg-gold-500/10 transition-all"
            >
              Ver todos
            </button>
          </div>
        )}

        {/* Info note */}
        {total > 0 && (
          <div className="flex items-start gap-2 text-xs text-gray-600 bg-white/3 border border-white/5 rounded-xl p-4">
            <Info size={14} className="shrink-0 mt-0.5" />
            <p>
              Los horarios semanales son confirmados por las academias. Para open mats de la comunidad, contacta al organizador antes de ir.
              ¿Tu academia hace open mat? Publícalo en la sección de <strong className="text-gray-400">Eventos</strong>.
            </p>
          </div>
        )}
      </div>

      {/* Gym detail modal */}
      {selectedGym && (
        <GymDetailModal gym={selectedGym} onClose={() => setSelectedGym(null)} />
      )}
    </div>
  );
}
