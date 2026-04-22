import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Clock, Phone, Globe, Calendar, Users, ChevronRight, Loader2, Star } from 'lucide-react';
import { api } from '../services/api';
import type { GymRecord } from '../services/api';
import type { CommunityEvent } from '../data/events';
import { categoryLabels, categoryColors, modalityLabels } from '../data/events';
import GymDetailModal from '../components/GymDetailModal';

function toSlug(city: string): string {
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

function getDayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][d.getDay()];
}

interface CityContent {
  city: string;
  count: number;
  intro: string;
  bestRated: { name: string; rating: number | null; address: string | null } | null;
}

export default function CityOpenMats() {
  const { slug = '' } = useParams<{ slug: string }>();

  // slug format: "alicantebjj" → city slug = "alicante"
  const citySlug = slug.replace(/bjj$/, '');

  const [content, setContent] = useState<CityContent | null>(null);
  const [gymSlots, setGymSlots] = useState<Array<{ gym: GymRecord; slots: Array<{ dia: string; hora: string; duracion: string }> }>>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedGym, setSelectedGym] = useState<GymRecord | null>(null);

  const fetchData = useCallback(async () => {
    if (!citySlug) return;
    setLoading(true);
    try {
      // Critical: gyms + events
      const [gymsRes, eventsRes] = await Promise.all([
        api.gyms.list({ limit: 600 }),
        api.events.list(),
      ]);

      const cityExists = gymsRes.data.some((g) => toSlug(g.city) === citySlug);
      if (!cityExists) {
        setNotFound(true);
        return;
      }

      const cityGyms = gymsRes.data.filter(
        (g) => toSlug(g.city) === citySlug && (g.openMatFriday || g.openMatSaturday),
      );
      const cityName = gymsRes.data.find((g) => toSlug(g.city) === citySlug)!.city;

      // Optional: SEO content
      let cityInfo: CityContent;
      try {
        const cityData = await api.seo.city(citySlug);
        cityInfo = { city: cityData.city, count: cityData.count, intro: cityData.intro, bestRated: cityData.bestRated };
      } catch {
        cityInfo = {
          city: cityName,
          count: gymsRes.data.filter((g) => toSlug(g.city) === citySlug).length,
          intro: `Sesiones de open mat de Brazilian Jiu-Jitsu en ${cityName}. Entrena con la comunidad BJJ local.`,
          bestRated: null,
        };
      }

      setContent(cityInfo);

      setGymSlots(
        cityGyms.map((g) => {
          const slots: Array<{ dia: string; hora: string; duracion: string }> = [];
          if (g.openMatFriday) slots.push({ dia: 'Viernes', hora: g.openMatFridayTime ?? '—', duracion: g.openMatFridayDuration ?? '' });
          if (g.openMatSaturday) slots.push({ dia: 'Sábado', hora: g.openMatSaturdayTime ?? '—', duracion: g.openMatSaturdayDuration ?? '' });
          return { gym: g, slots };
        }),
      );

      setEvents(eventsRes.filter((e) => e.type === 'openmat' && toSlug(e.city) === citySlug));
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [citySlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (content) document.title = `Open Mat BJJ en ${content.city} | BJJ Spain`;
    return () => { document.title = 'BJJ Spain'; };
  }, [content]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gold-500" />
      </div>
    );
  }

  if (notFound || !content) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-4xl">🥋</p>
        <h1 className="text-xl font-bold text-white">No se encontraron open mats</h1>
        <p className="text-gray-400">No hay open mats registrados para esta ciudad.</p>
        <Link to="/openmats" className="text-gold-400 hover:text-gold-300 flex items-center gap-1 text-sm">
          Ver todos los open mats <ChevronRight size={14} />
        </Link>
      </div>
    );
  }

  const { city, count, intro, bestRated } = content;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link to="/openmats" className="hover:text-gold-400">Open Mats</Link>
        <ChevronRight size={14} />
        <span className="text-gray-300">{city}</span>
      </nav>

      {/* Hero city block */}
      <div className="bg-dark-800 border border-gold-500/20 rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gold-500/15 flex items-center justify-center">
            <MapPin size={14} className="text-gold-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Open Mat BJJ en {city}</h1>
          <span className="text-xs text-gray-500 bg-dark-700 border border-white/8 rounded-full px-2 py-0.5">
            {count} {count === 1 ? 'academia' : 'academias'}
          </span>
        </div>
        <p className="text-gray-400 leading-relaxed text-sm">{intro}</p>
        {bestRated && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-3">
            <Star size={11} className="text-yellow-400 shrink-0" fill="currentColor" />
            Mejor valorada:{' '}
            <span className="text-gray-300 font-medium">{bestRated.name}</span>
            {bestRated.rating && <span className="text-yellow-400">{bestRated.rating}/5</span>}
          </div>
        )}
      </div>

      {/* Weekly gym open mats */}
      {gymSlots.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-2 h-2 rounded-full bg-gold-500" />
            <h2 className="text-white font-bold text-base">Horario semanal confirmado</h2>
            <span className="text-gray-600 text-sm">{gymSlots.length} {gymSlots.length === 1 ? 'academia' : 'academias'}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gymSlots.map(({ gym, slots }) => (
              <div
                key={gym.id}
                onClick={() => setSelectedGym(gym)}
                className="bg-dark-700 border border-white/8 rounded-2xl overflow-hidden cursor-pointer hover:border-gold-500/30 transition-colors"
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
                      {gym.address && (
                        <p className="text-gray-500 text-xs flex items-center gap-1">
                          <MapPin size={10} /> {gym.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {slots.map((slot, i) => (
                      <div key={i} className="flex items-center justify-between bg-gold-500/8 border border-gold-500/20 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gold-500/20 flex items-center justify-center">
                            <Clock size={15} className="text-gold-400" />
                          </div>
                          <div>
                            <p className="text-gold-400 font-bold text-sm">{slot.hora}</p>
                            <p className="text-gray-500 text-xs">{slot.dia}{slot.duracion ? ` · ${slot.duracion}` : ''}</p>
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
                        <Phone size={12} /> {gym.phone}
                      </a>
                    ) : gym.website ? (
                      <a
                        href={gym.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gold-400 transition-colors"
                      >
                        <Globe size={12} /> Sitio web
                      </a>
                    ) : <span />}
                    <span className="text-xs text-gray-600">
                      {gym.isVerified ? 'Confirmado por el propietario' : 'Sin verificar'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Community open mat events */}
      {events.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <h2 className="text-white font-bold text-base">Open mats de la comunidad</h2>
            <span className="text-gray-600 text-sm">{events.length} {events.length === 1 ? 'evento' : 'eventos'}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => (
              <div key={event.id} className="bg-dark-700 border border-white/8 rounded-2xl overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-emerald-600 to-emerald-400" />
                <div className="p-5">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[event.category]}`}>
                      {categoryLabels[event.category]}
                    </span>
                    <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">
                      {modalityLabels[event.modality]}
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-sm mb-1">{event.title}</h3>
                  <p className="text-gray-500 text-xs mb-3">{event.gym}</p>
                  <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <Calendar size={15} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-emerald-400 font-bold text-sm capitalize">{formatDate(event.date)}</p>
                      <p className="text-gray-500 text-xs">{event.time} · {event.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Users size={11} />
                      {event.spotsLeft != null ? `${event.spotsLeft} plazas` : 'Plazas libres'}
                    </span>
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

      {gymSlots.length === 0 && events.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🥋</p>
          <p className="text-gray-400 font-semibold">No hay open mats registrados en {city}</p>
          <p className="text-gray-600 text-sm mt-1">
            ¿Tu academia hace open mat?{' '}
            <Link to="/eventos" className="text-gold-400 hover:text-gold-300">Publícalo en Eventos</Link>
          </p>
        </div>
      )}

      <div className="mt-4">
        <Link to="/openmats" className="text-sm text-gray-500 hover:text-gold-400 flex items-center gap-1 transition-colors">
          ← Ver open mats de todas las ciudades
        </Link>
      </div>

      {selectedGym && (
        <GymDetailModal gym={selectedGym} onClose={() => setSelectedGym(null)} />
      )}
    </div>
  );
}
