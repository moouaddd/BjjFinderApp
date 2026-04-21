import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, X, Calendar, MapPin, Clock, Trash2, Loader2,
  Star, Users, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { CommunityEvent, CommunityEventType, EventCategory, EventModality } from '../data/events';
import { categoryLabels, modalityLabels, EVENT_CITIES } from '../data/events';

const EMPTY_FORM = {
  type: 'openmat' as CommunityEventType,
  title: '',
  organizer: '',
  organizerContact: '',
  gym: '',
  address: '',
  city: 'Madrid',
  date: '',
  time: '',
  duration: '',
  price: '0',
  category: 'mixto' as EventCategory,
  modality: 'gi' as EventModality,
  description: '',
  spotsTotal: '',
  instructor: '',
  instructorBelt: '',
  tags: '',
};

function typeLabel(t: CommunityEventType) {
  return t === 'openmat' ? 'Open Mat' : t === 'seminario' ? 'Seminario' : 'Campamento';
}

function ic(hasErr: boolean) {
  return `w-full bg-dark-700 border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold-500/60 transition-colors ${hasErr ? 'border-red-500/60' : 'border-white/10'}`;
}
const selectCls = 'w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500/60 transition-colors';

function F({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function OrganizerDashboard() {
  const { user, canPublishEvents, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !canPublishEvents)) {
      navigate('/', { replace: true });
    }
  }, [authLoading, user, canPublishEvents, navigate]);

  useEffect(() => {
    if (user?.name) {
      setForm((f) => ({ ...f, organizer: user.name }));
    }
  }, [user]);

  const fetchMyEvents = useCallback(async () => {
    if (!user) return;
    try {
      const all = await api.events.list();
      setEvents(all.filter((e) => (e as CommunityEvent & { organizerId?: string }).organizerId === user.id));
    } catch {
      // ignore
    } finally {
      setLoadingEvents(false);
    }
  }, [user]);

  useEffect(() => { fetchMyEvents(); }, [fetchMyEvents]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Obligatorio';
    if (!form.organizer.trim()) e.organizer = 'Obligatorio';
    if (!form.organizerContact.trim()) e.organizerContact = 'Obligatorio';
    if (!form.gym.trim()) e.gym = 'Obligatorio';
    if (!form.address.trim()) e.address = 'Obligatorio';
    if (!form.date) e.date = 'Obligatorio';
    if (!form.time) e.time = 'Obligatorio';
    if (!form.duration.trim()) e.duration = 'Obligatorio';
    if (!form.description.trim()) e.description = 'Obligatorio';
    if (Number(form.price) < 0) e.price = 'Precio inválido';
    if (form.type === 'seminario' && !form.instructor.trim()) e.instructor = 'Obligatorio';
    return e;
  }

  async function handleSubmit(evt: React.FormEvent) {
    evt.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const created = await api.events.create({
        type: form.type,
        title: form.title.trim(),
        organizer: form.organizer.trim(),
        organizerContact: form.organizerContact.trim(),
        gym: form.gym.trim(),
        address: form.address.trim(),
        city: form.city,
        date: form.date,
        time: form.time,
        duration: form.duration.trim(),
        price: Number(form.price),
        category: form.category,
        modality: form.modality,
        description: form.description.trim(),
        spotsTotal: form.spotsTotal ? Number(form.spotsTotal) : null,
        spotsLeft: form.spotsTotal ? Number(form.spotsTotal) : null,
        instructor: form.instructor.trim() || undefined,
        instructorBelt: form.instructorBelt.trim() || undefined,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setEvents((prev) => [created, ...prev]);
      setShowForm(false);
      setForm((f) => ({ ...EMPTY_FORM, organizer: f.organizer }));
      setErrors({});
    } catch (err: unknown) {
      setErrors({ submit: err instanceof Error ? err.message : 'Error al publicar' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este evento?')) return;
    setDeleting(id);
    try {
      await api.events.delete(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  if (authLoading || !user) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 size={32} className="animate-spin text-gold-500" /></div>;
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-dark-800 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gold-400 bg-gold-500/10 border border-gold-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                  Organizador
                </span>
              </div>
              <h1 className="text-2xl font-black text-white">Mis Eventos</h1>
              <p className="text-gray-400 text-sm mt-1">Gestiona los eventos que has publicado</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
            >
              <Plus size={16} />
              Nuevo Evento
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* My events list */}
        {loadingEvents ? (
          <div className="flex items-center gap-3 text-gray-500 text-sm">
            <Loader2 size={16} className="animate-spin text-gold-500" />
            Cargando tus eventos...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <Calendar size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No has publicado ningún evento aún</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-gold-400 hover:text-gold-300 text-sm underline"
            >
              Publicar tu primer evento
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="bg-dark-700 border border-white/8 rounded-2xl p-5 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gold-500/15 text-gold-400 border border-gold-500/20">
                      {typeLabel(event.type)}
                    </span>
                    <span className="text-gray-600 text-xs">{event.city}</span>
                  </div>
                  <h3 className="text-white font-bold text-sm">{event.title}</h3>
                  <div className="flex flex-wrap gap-3 mt-2 text-gray-500 text-xs">
                    <span className="flex items-center gap-1"><Calendar size={11} className="text-gold-500" /> {event.date}</span>
                    <span className="flex items-center gap-1"><Clock size={11} className="text-gold-500" /> {event.time} · {event.duration}</span>
                    <span className="flex items-center gap-1"><MapPin size={11} className="text-gold-500" /> {event.gym}</span>
                    {event.spotsLeft != null && <span className="flex items-center gap-1"><Users size={11} className="text-gold-500" /> {event.spotsLeft} plazas</span>}
                    <span className="flex items-center gap-1"><Star size={11} className="text-gold-500" /> {event.price === 0 ? 'Gratis' : `${event.price} €`}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(event.id)}
                  disabled={deleting === event.id}
                  className="shrink-0 p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                  title="Eliminar evento"
                >
                  {deleting === event.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create event modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-dark-800 z-10">
              <div>
                <h2 className="text-white font-bold text-lg">Publicar Evento</h2>
                <p className="text-gray-400 text-xs mt-0.5">Visible para toda la comunidad BJJ</p>
              </div>
              <button onClick={() => { setShowForm(false); setErrors({}); }}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {errors.submit && (
                <div className="bg-red-900/30 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">{errors.submit}</div>
              )}

              {/* Tipo */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Tipo de evento</label>
                <div className="flex gap-2 flex-wrap">
                  {(['openmat', 'seminario', 'campamento'] as CommunityEventType[]).map((t) => (
                    <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, type: t }))}
                      className={`flex-1 min-w-[110px] py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        form.type === t
                          ? t === 'openmat' ? 'bg-emerald-900/40 text-emerald-300 border-emerald-500/50'
                            : t === 'seminario' ? 'bg-gold-500/20 text-gold-300 border-gold-500/50'
                            : 'bg-blue-900/40 text-blue-300 border-blue-500/50'
                          : 'bg-dark-700 text-gray-400 border-white/10 hover:border-white/20'
                      }`}>
                      {t === 'openmat' ? '🥋 Open Mat' : t === 'seminario' ? '📚 Seminario' : '🏕️ Campamento'}
                    </button>
                  ))}
                </div>
              </div>

              <F label="Título *" error={errors.title}>
                <input type="text" value={form.title} onChange={(e) => { setForm((f) => ({ ...f, title: e.target.value })); setErrors((er) => ({ ...er, title: '' })); }} placeholder="Ej: Open Mat Femenino — Madrid" className={ic(!!errors.title)} />
              </F>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Organizador *" error={errors.organizer}>
                  <input type="text" value={form.organizer} onChange={(e) => { setForm((f) => ({ ...f, organizer: e.target.value })); setErrors((er) => ({ ...er, organizer: '' })); }} className={ic(!!errors.organizer)} />
                </F>
                <F label="Contacto (email o @instagram) *" error={errors.organizerContact}>
                  <input type="text" value={form.organizerContact} onChange={(e) => { setForm((f) => ({ ...f, organizerContact: e.target.value })); setErrors((er) => ({ ...er, organizerContact: '' })); }} placeholder="@bjj_madrid" className={ic(!!errors.organizerContact)} />
                </F>
              </div>

              {form.type === 'seminario' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <F label="Instructor *" error={errors.instructor}>
                    <input type="text" value={form.instructor} onChange={(e) => { setForm((f) => ({ ...f, instructor: e.target.value })); setErrors((er) => ({ ...er, instructor: '' })); }} className={ic(!!errors.instructor)} />
                  </F>
                  <F label="Cinturón instructor">
                    <select value={form.instructorBelt} onChange={(e) => setForm((f) => ({ ...f, instructorBelt: e.target.value }))} className={selectCls}>
                      <option value="">Seleccionar...</option>
                      {['Blanco', 'Azul', 'Morado', 'Marrón', 'Negro'].map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </F>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Academia / Lugar *" error={errors.gym}>
                  <input type="text" value={form.gym} onChange={(e) => { setForm((f) => ({ ...f, gym: e.target.value })); setErrors((er) => ({ ...er, gym: '' })); }} placeholder="Nombre del lugar" className={ic(!!errors.gym)} />
                </F>
                <F label="Dirección *" error={errors.address}>
                  <input type="text" value={form.address} onChange={(e) => { setForm((f) => ({ ...f, address: e.target.value })); setErrors((er) => ({ ...er, address: '' })); }} placeholder="Calle, número" className={ic(!!errors.address)} />
                </F>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Ciudad">
                  <div className="relative">
                    <select value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className={selectCls}>
                      {EVENT_CITIES.filter((c) => c !== 'Todas').map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </F>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Fecha *</label>
                    <input type="date" value={form.date} onChange={(e) => { setForm((f) => ({ ...f, date: e.target.value })); setErrors((er) => ({ ...er, date: '' })); }} className={ic(!!errors.date)} style={{ colorScheme: 'dark' }} />
                    {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Hora *</label>
                    <input type="time" value={form.time} onChange={(e) => { setForm((f) => ({ ...f, time: e.target.value })); setErrors((er) => ({ ...er, time: '' })); }} className={ic(!!errors.time)} style={{ colorScheme: 'dark' }} />
                    {errors.time && <p className="text-red-400 text-xs mt-1">{errors.time}</p>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <F label="Duración *" error={errors.duration}>
                  <input type="text" value={form.duration} onChange={(e) => { setForm((f) => ({ ...f, duration: e.target.value })); setErrors((er) => ({ ...er, duration: '' })); }} placeholder="2 horas" className={ic(!!errors.duration)} />
                </F>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Categoría</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as EventCategory }))} className={selectCls}>
                    {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Modalidad</label>
                  <select value={form.modality} onChange={(e) => setForm((f) => ({ ...f, modality: e.target.value as EventModality }))} className={selectCls}>
                    {Object.entries(modalityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <F label="Precio € (0 = Gratis)" error={errors.price}>
                  <input type="number" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className={ic(!!errors.price)} />
                </F>
                <F label="Plazas (vacío = ilimitado)">
                  <input type="number" min="1" value={form.spotsTotal} onChange={(e) => setForm((f) => ({ ...f, spotsTotal: e.target.value }))} placeholder="30" className={ic(false)} />
                </F>
              </div>

              <F label="Descripción *" error={errors.description}>
                <textarea value={form.description} onChange={(e) => { setForm((f) => ({ ...f, description: e.target.value })); setErrors((er) => ({ ...er, description: '' })); }} rows={4} placeholder="Nivel recomendado, qué se trabajará..." className={`${ic(!!errors.description)} resize-none`} />
              </F>

              <F label="Etiquetas (separadas por comas)">
                <input type="text" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="Gi, Principiantes, Femenino..." className={ic(false)} />
              </F>

              <button type="submit" disabled={submitting}
                className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-60 text-black font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                {submitting && <Loader2 size={15} className="animate-spin" />}
                {submitting ? 'Publicando...' : 'Publicar Evento'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
