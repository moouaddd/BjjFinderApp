import { useState, useEffect, useCallback } from 'react';
import { Calendar, MapPin, Clock, Users, Tag, Tent, BookOpen, Mail, Loader2 } from 'lucide-react';
import { seminars, type Seminar, type EventType } from '../data/seminars';
import { api } from '../services/api';
import type { CommunityEvent } from '../data/events';
import PaymentModal from '../components/PaymentModal';

// ─── Static seminar card (famous instructors) ──────────────────────────────

function SpotsBar({ total, left }: { total: number; left: number }) {
  const pct = Math.round(((total - left) / total) * 100);
  const color = left <= 5 ? '#ef4444' : left <= 15 ? '#f59e0b' : '#22c55e';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">{total - left} inscritos</span>
        <span style={{ color }} className="font-medium">
          {left <= 0 ? '¡Agotado!' : `${left} plazas libres`}
        </span>
      </div>
      <div className="h-1.5 bg-dark-900 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function SeminarCard({ seminar, onPay }: { seminar: Seminar; onPay: (s: Seminar) => void }) {
  const isCamp = seminar.type === 'campamento';
  const dateStr = new Date(seminar.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  const endStr = seminar.endDate
    ? new Date(seminar.endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="bg-dark-700 border border-white/8 rounded-2xl overflow-hidden card-hover animate-fadeInUp flex flex-col">
      <div className={`h-1.5 w-full ${isCamp ? 'bg-gradient-to-r from-emerald-600 to-teal-400' : 'bg-gradient-to-r from-gold-600 to-gold-400'}`} />
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
            isCamp
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : 'bg-gold-500/15 text-gold-400 border-gold-500/30'
          }`}>
            {isCamp ? <Tent size={11} /> : <BookOpen size={11} />}
            {isCamp ? 'Campamento' : 'Seminario'}
          </span>
          {seminar.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="flex items-center gap-1 text-[10px] text-gray-500 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">
              <Tag size={9} />{tag}
            </span>
          ))}
        </div>

        <h3 className="text-white font-bold text-base leading-snug mb-1">{seminar.title}</h3>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-black font-black text-xs shrink-0">
            {seminar.instructor.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-none">{seminar.instructor}</p>
            <p className="text-gray-500 text-xs">{seminar.instructorBelt} · {seminar.instructorTeam}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-2 text-xs text-gray-400">
            <Calendar size={13} className="text-gold-500/70 mt-0.5 shrink-0" />
            <span>{dateStr}{endStr ? ` — ${endStr}` : ''} · {seminar.time}h</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-gray-400">
            <MapPin size={13} className="text-gold-500/70 mt-0.5 shrink-0" />
            <span>{seminar.gym} · {seminar.city}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock size={13} className="text-gold-500/70 shrink-0" />
            <span>Duración: {seminar.duration}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Users size={13} className="text-gold-500/70 shrink-0" />
            <span>{seminar.spotsTotal} plazas totales</span>
          </div>
        </div>

        <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-3 flex-1">{seminar.description}</p>

        <div className="mb-4">
          <SpotsBar total={seminar.spotsTotal} left={seminar.spotsLeft} />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div>
            <p className="text-gold-400 font-black text-2xl leading-none">{seminar.price}€</p>
            <p className="text-gray-600 text-[10px] mt-0.5">por persona</p>
          </div>
          <button
            onClick={() => onPay(seminar)}
            disabled={seminar.spotsLeft <= 0}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              seminar.spotsLeft <= 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : isCamp
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-gold-500 hover:bg-gold-400 text-black shadow-lg shadow-gold-500/25'
            }`}
          >
            {seminar.spotsLeft <= 0 ? 'Agotado' : 'Inscribirse'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Community event card (seminarios/campamentos from API) ─────────────────

function CommunityCard({ event }: { event: CommunityEvent }) {
  const isCamp = event.type === 'campamento';
  const dateStr = new Date(event.date + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const contactHref = event.organizerContact.startsWith('@')
    ? `https://instagram.com/${event.organizerContact.slice(1)}`
    : `mailto:${event.organizerContact}`;

  return (
    <div className="bg-dark-700 border border-white/8 rounded-2xl overflow-hidden card-hover animate-fadeInUp flex flex-col">
      <div className={`h-1.5 w-full ${isCamp ? 'bg-gradient-to-r from-blue-600 to-blue-400' : 'bg-gradient-to-r from-gold-600 to-gold-400'}`} />
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
            isCamp
              ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
              : 'bg-gold-500/15 text-gold-400 border-gold-500/30'
          }`}>
            {isCamp ? <Tent size={11} /> : <BookOpen size={11} />}
            {isCamp ? 'Campamento' : 'Seminario'}
          </span>
          <span className="text-[10px] font-medium text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
            Comunidad
          </span>
          {Array.isArray(event.tags) && event.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="flex items-center gap-1 text-[10px] text-gray-500 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">
              <Tag size={9} />{tag}
            </span>
          ))}
        </div>

        <h3 className="text-white font-bold text-base leading-snug mb-1">{event.title}</h3>

        {event.instructor ? (
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-black font-black text-xs shrink-0">
              {event.instructor.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-none">{event.instructor}</p>
              {event.instructorBelt && <p className="text-gray-500 text-xs">Cinturón {event.instructorBelt}</p>}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-xs mb-4">Organizado por <span className="text-gray-400">{event.organizer}</span></p>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-2 text-xs text-gray-400">
            <Calendar size={13} className="text-gold-500/70 mt-0.5 shrink-0" />
            <span className="capitalize">{dateStr} · {event.time}</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-gray-400">
            <MapPin size={13} className="text-gold-500/70 mt-0.5 shrink-0" />
            <span>{event.gym} · {event.city}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock size={13} className="text-gold-500/70 shrink-0" />
            <span>Duración: {event.duration}</span>
          </div>
          {event.spotsTotal != null && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Users size={13} className="text-gold-500/70 shrink-0" />
              <span>{event.spotsLeft ?? event.spotsTotal} plazas disponibles</span>
            </div>
          )}
        </div>

        <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-3 flex-1">{event.description}</p>

        <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
          <div>
            {event.price === 0 ? (
              <p className="text-emerald-400 font-black text-2xl leading-none">Gratis</p>
            ) : (
              <>
                <p className="text-gold-400 font-black text-2xl leading-none">{event.price}€</p>
                <p className="text-gray-600 text-[10px] mt-0.5">por persona</p>
              </>
            )}
          </div>
          <a
            href={contactHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/30 text-gold-400 transition-all"
          >
            <Mail size={13} />
            Contactar
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function Seminars() {
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');
  const [payingFor, setPayingFor] = useState<Seminar | null>(null);
  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const fetchCommunityEvents = useCallback(async () => {
    try {
      const all = await api.events.list();
      setCommunityEvents(all.filter((e) => e.type === 'seminario' || e.type === 'campamento'));
    } catch {
      // no API — show only static seminars
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => { fetchCommunityEvents(); }, [fetchCommunityEvents]);

  const filteredStatic = seminars.filter((s) => typeFilter === 'all' || s.type === typeFilter);

  const filteredCommunity = communityEvents.filter((e) => typeFilter === 'all' || e.type === typeFilter);

  const total = filteredStatic.length + filteredCommunity.length;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-dark-800 border-b border-white/5 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 60%, #10b981 0%, transparent 40%), radial-gradient(circle at 80% 30%, #e6b800 0%, transparent 40%)' }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-4">
            <BookOpen size={12} className="text-emerald-400" />
            <span className="text-emerald-400 text-xs font-medium uppercase tracking-widest">Formación BJJ</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white">
            Seminarios &{' '}
            <span className="gradient-text">Campamentos</span>
          </h1>
          <p className="text-gray-400 mt-3 text-base max-w-xl">
            Instructores de referencia y eventos de la comunidad. Seminarios y campamentos en toda España.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-16 z-40 bg-dark-900/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex gap-3 flex-wrap items-center">
          <div className="flex gap-2">
            {(['all', 'seminario', 'campamento'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${
                  typeFilter === t
                    ? t === 'campamento'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-gold-500/15 text-gold-400 border-gold-500/30'
                    : 'text-gray-400 border-white/10 hover:text-white'
                }`}
              >
                {t === 'all' ? 'Todos' : t === 'seminario' ? <><BookOpen size={11} />Seminarios</> : <><Tent size={11} />Campamentos</>}
              </button>
            ))}
          </div>
          <p className="text-gray-600 text-sm ml-auto">
            <span className="text-white font-semibold">{total}</span> evento{total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* Featured seminars — shown when data is available */}
        {filteredStatic.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-gold-500" />
              <h2 className="text-white font-bold text-base">Instructores destacados</h2>
              <span className="text-gray-600 text-sm">{filteredStatic.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredStatic.map((s) => (
                <SeminarCard key={s.id} seminar={s} onPay={setPayingFor} />
              ))}
            </div>
          </section>
        )}

        {/* Community seminars/camps */}
        {!loadingEvents && filteredCommunity.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <h2 className="text-white font-bold text-base">De la comunidad</h2>
              <span className="text-gray-600 text-sm">{filteredCommunity.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredCommunity.map((e) => (
                <CommunityCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        )}

        {loadingEvents && (
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <Loader2 size={14} className="animate-spin text-gold-500" />
            Cargando eventos de la comunidad...
          </div>
        )}

        {!loadingEvents && total === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🎓</p>
            <p className="text-gray-400 font-semibold text-lg">No hay eventos disponibles</p>
            <p className="text-gray-600 text-sm mt-1">Prueba con otro filtro</p>
          </div>
        )}
      </div>

      {payingFor && (
        <PaymentModal
          isOpen={true}
          onClose={() => setPayingFor(null)}
          title={payingFor.title}
          description={`${payingFor.instructor} · ${payingFor.city} · ${new Date(payingFor.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`}
          amount={payingFor.price}
          type={payingFor.type === 'campamento' ? 'camp' : 'seminar'}
        />
      )}
    </div>
  );
}
