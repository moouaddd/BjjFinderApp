import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Calendar, MapPin, Clock, Users, Plus, X, Search,
  ChevronDown, User, Mail, Loader2, Lock,
} from 'lucide-react';
import type { OrganizerRequest } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  CommunityEvent, CommunityEventType, EventCategory, EventModality,
  categoryLabels, categoryColors, modalityLabels, EVENT_CITIES,
} from '../data/events';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

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

export default function Eventos() {
  const { user, canPublishEvents } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [orgRequest, setOrgRequest] = useState<OrganizerRequest | null | undefined>(undefined);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [filterType, setFilterType] = useState<'todos' | CommunityEventType>('todos');
  const [filterCategory, setFilterCategory] = useState<'todas' | EventCategory>('todas');
  const [filterCity, setFilterCity] = useState('Todas');
  const [filterModality, setFilterModality] = useState<'todos' | EventModality>('todos');
  const [search, setSearch] = useState('');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      const data = await api.events.list();
      setEvents(data);
    } catch {
      setApiError('No se pudo conectar con el servidor. ¿Está el backend corriendo?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    if (user && user.role === 'user') {
      api.organizers.myRequest().then(setOrgRequest).catch(() => setOrgRequest(null));
    } else {
      setOrgRequest(null);
    }
  }, [user]);

  async function submitOrganizerRequest() {
    setRequestSubmitting(true);
    setRequestError('');
    try {
      const req = await api.organizers.submitRequest(requestMessage.trim() || undefined);
      setOrgRequest(req);
      setShowRequestModal(false);
      setRequestMessage('');
    } catch (err: unknown) {
      setRequestError(err instanceof Error ? err.message : 'Error al enviar la solicitud');
    } finally {
      setRequestSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (filterType !== 'todos' && e.type !== filterType) return false;
      if (filterCategory !== 'todas' && e.category !== filterCategory) return false;
      if (filterCity !== 'Todas' && e.city !== filterCity) return false;
      if (filterModality !== 'todos' && e.modality !== filterModality) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.organizer.toLowerCase().includes(q) ||
          e.gym.toLowerCase().includes(q) ||
          e.city.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [events, filterType, filterCategory, filterCity, filterModality, search]);

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
      const newEvent = await api.events.create({
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
      setEvents((prev) => [...prev, newEvent].sort((a, b) => a.date.localeCompare(b.date)));
      setSubmitted(true);
      setTimeout(() => {
        setShowModal(false);
        setSubmitted(false);
        setForm(EMPTY_FORM);
        setErrors({});
      }, 2000);
    } catch (err: unknown) {
      setErrors({ submit: err instanceof Error ? err.message : 'Error al publicar el evento' });
    } finally {
      setSubmitting(false);
    }
  }

  const selectCls =
    'w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500/60 transition-colors';

  function ic(hasErr: boolean) {
    return `w-full bg-dark-700 border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold-500/60 transition-colors ${hasErr ? 'border-red-500/60' : 'border-white/10'}`;
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Hero */}
      <div className="bg-gradient-to-b from-dark-800 to-dark-900 border-b border-white/5 pt-10 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-gold-500 text-xs font-semibold uppercase tracking-widest mb-2">
                Comunidad BJJ España
              </p>
              <h1 className="text-3xl font-bold text-white">Eventos de la Comunidad</h1>
              <p className="text-gray-400 mt-2 text-sm max-w-xl">
                Open mats y seminarios organizados por la comunidad. Publica tu evento en minutos.
              </p>
            </div>
            {!user ? (
              <button
                onClick={() => navigate('/login', { state: { from: '/eventos' } })}
                className="flex items-center gap-2 bg-dark-700 hover:bg-dark-600 border border-white/10 text-gray-300 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
              >
                <Lock size={15} />
                Acceder para publicar
              </button>
            ) : canPublishEvents ? (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
              >
                <Plus size={16} />
                Publicar Evento
              </button>
            ) : orgRequest?.status === 'pending' ? (
              <span className="flex items-center gap-2 text-yellow-400 text-sm font-medium bg-yellow-400/10 border border-yellow-400/20 px-4 py-2.5 rounded-xl shrink-0">
                <Clock size={14} />
                Solicitud pendiente de aprobación
              </span>
            ) : orgRequest?.status === 'rejected' ? (
              <span className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 px-4 py-2.5 rounded-xl shrink-0">
                Solicitud rechazada — contacta al admin
              </span>
            ) : (
              <button
                onClick={() => setShowRequestModal(true)}
                className="flex items-center gap-2 bg-dark-700 hover:bg-dark-600 border border-gold-500/30 text-gold-400 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
              >
                <Plus size={16} />
                Quiero ser organizador
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar evento, academia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-dark-800 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold-500/40"
            />
          </div>
          <Select value={filterType} onChange={(v) => setFilterType(v as typeof filterType)}
            options={[{ value: 'todos', label: 'Todos los tipos' }, { value: 'openmat', label: 'Open Mats' }, { value: 'seminario', label: 'Seminarios' }, { value: 'campamento', label: 'Campamentos' }]} />
          <Select value={filterCategory} onChange={(v) => setFilterCategory(v as typeof filterCategory)}
            options={[{ value: 'todas', label: 'Todas las categorías' }, ...Object.entries(categoryLabels).map(([k, v]) => ({ value: k, label: v }))]} />
          <Select value={filterCity} onChange={setFilterCity}
            options={EVENT_CITIES.map((c) => ({ value: c, label: c }))} />
          <Select value={filterModality} onChange={(v) => setFilterModality(v as typeof filterModality)}
            options={[{ value: 'todos', label: 'Todas las modalidades' }, { value: 'gi', label: 'Gi' }, { value: 'nogi', label: 'No-Gi' }, { value: 'ambos', label: 'Gi + No-Gi' }]} />
        </div>
        {!loading && !apiError && (
          <p className="text-gray-500 text-xs mt-3">
            {filtered.length} evento{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500 gap-3">
            <Loader2 size={20} className="animate-spin" />
            <span>Cargando eventos...</span>
          </div>
        ) : apiError ? (
          <div className="text-center py-20">
            <p className="text-red-400 text-sm">{apiError}</p>
            <button onClick={fetchEvents} className="mt-4 text-gold-400 hover:text-gold-300 text-sm underline">
              Reintentar
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Calendar size={40} className="mx-auto mb-3 opacity-30" />
            <p>No hay eventos con esos filtros.</p>
            <button onClick={() => setShowModal(true)} className="mt-4 text-gold-400 hover:text-gold-300 text-sm underline">
              Sé el primero en publicar un evento
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      {/* Organizer request modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-white font-bold text-lg">Solicitar ser Organizador</h2>
                <p className="text-gray-400 text-xs mt-0.5">El admin revisará tu solicitud y te dará acceso</p>
              </div>
              <button onClick={() => { setShowRequestModal(false); setRequestMessage(''); setRequestError(''); }}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gold-500/8 border border-gold-500/20 rounded-xl p-4 text-sm text-gray-300 leading-relaxed space-y-2">
                <p className="text-gold-400 font-semibold text-xs uppercase tracking-widest mb-2">¿Qué es un organizador?</p>
                <p>Puedes organizar open mats, seminarios y campamentos sin ser propietario de una academia.</p>
                <p className="text-gray-500 text-xs">Una vez aprobado, podrás publicar eventos en cualquier fecha y lugar.</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Cuéntanos quién eres y qué quieres organizar</label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  rows={4}
                  placeholder="Ej: Organizo open mats femeninos en Madrid, llevo 2 años haciéndolo y quiero publicarlos aquí..."
                  className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold-500/60 resize-none transition-colors"
                />
              </div>
              {requestError && (
                <p className="text-red-400 text-sm">{requestError}</p>
              )}
              <button
                onClick={submitOrganizerRequest}
                disabled={requestSubmitting}
                className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-60 text-black font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {requestSubmitting && <Loader2 size={15} className="animate-spin" />}
                {requestSubmitting ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event creation modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-dark-800 z-10">
              <div>
                <h2 className="text-white font-bold text-lg">Publicar Evento</h2>
                <p className="text-gray-400 text-xs mt-0.5">Open mat, seminario o campamento — visible para toda la comunidad</p>
              </div>
              <button onClick={() => { setShowModal(false); setErrors({}); setForm(EMPTY_FORM); }}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            {submitted ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-emerald-400">✓</span>
                </div>
                <h3 className="text-white font-semibold text-lg">¡Evento publicado!</h3>
                <p className="text-gray-400 text-sm mt-1">Ya aparece en el listado.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {errors.submit && (
                  <div className="bg-red-900/30 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                    {errors.submit}
                  </div>
                )}

                {/* Tipo */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Tipo de evento</label>
                  <div className="flex gap-2 flex-wrap">
                    {(['openmat', 'seminario', 'campamento'] as CommunityEventType[]).map((t) => (
                      <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, type: t }))}
                        className={`flex-1 min-w-[120px] py-2.5 rounded-xl text-sm font-medium border transition-all ${
                          form.type === t
                            ? t === 'openmat'
                              ? 'bg-emerald-900/40 text-emerald-300 border-emerald-500/50'
                              : t === 'seminario'
                              ? 'bg-gold-500/20 text-gold-300 border-gold-500/50'
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
                    <input type="text" value={form.organizer} onChange={(e) => { setForm((f) => ({ ...f, organizer: e.target.value })); setErrors((er) => ({ ...er, organizer: '' })); }} placeholder="Tu nombre o academia" className={ic(!!errors.organizer)} />
                  </F>
                  <F label="Contacto (email o @instagram) *" error={errors.organizerContact}>
                    <input type="text" value={form.organizerContact} onChange={(e) => { setForm((f) => ({ ...f, organizerContact: e.target.value })); setErrors((er) => ({ ...er, organizerContact: '' })); }} placeholder="@bjj_madrid" className={ic(!!errors.organizerContact)} />
                  </F>
                </div>

                {form.type === 'seminario' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <F label="Instructor *" error={errors.instructor}>
                      <input type="text" value={form.instructor} onChange={(e) => { setForm((f) => ({ ...f, instructor: e.target.value })); setErrors((er) => ({ ...er, instructor: '' })); }} placeholder="Nombre del instructor" className={ic(!!errors.instructor)} />
                    </F>
                    <F label="Cinturón instructor" error="">
                      <select value={form.instructorBelt} onChange={(e) => setForm((f) => ({ ...f, instructorBelt: e.target.value }))} className={selectCls}>
                        <option value="">Seleccionar...</option>
                        {['Blanco', 'Azul', 'Morado', 'Marrón', 'Negro'].map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </F>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <F label="Academia / Lugar *" error={errors.gym}>
                    <input type="text" value={form.gym} onChange={(e) => { setForm((f) => ({ ...f, gym: e.target.value })); setErrors((er) => ({ ...er, gym: '' })); }} placeholder="Nombre de la academia" className={ic(!!errors.gym)} />
                  </F>
                  <F label="Dirección *" error={errors.address}>
                    <input type="text" value={form.address} onChange={(e) => { setForm((f) => ({ ...f, address: e.target.value })); setErrors((er) => ({ ...er, address: '' })); }} placeholder="Calle, número" className={ic(!!errors.address)} />
                  </F>
                </div>

                <F label="Ciudad" error="">
                  <select value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className={selectCls}>
                    {EVENT_CITIES.filter((c) => c !== 'Todas').map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </F>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <F label="Duración *" error={errors.duration}>
                    <input type="text" value={form.duration} onChange={(e) => { setForm((f) => ({ ...f, duration: e.target.value })); setErrors((er) => ({ ...er, duration: '' })); }} placeholder="2 horas" className={ic(!!errors.duration)} />
                  </F>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Categoría</label>
                    <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as EventCategory }))} className={selectCls}>
                      {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Modalidad</label>
                    <select value={form.modality} onChange={(e) => setForm((f) => ({ ...f, modality: e.target.value as EventModality }))} className={selectCls}>
                      <option value="gi">Gi</option>
                      <option value="nogi">No-Gi</option>
                      <option value="ambos">Gi + No-Gi</option>
                    </select>
                  </div>
                  <F label="Precio € (0 = Gratis)" error={errors.price}>
                    <input type="number" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className={ic(!!errors.price)} />
                  </F>
                </div>

                <F label="Plazas (vacío = ilimitado)" error="">
                  <input type="number" min="1" value={form.spotsTotal} onChange={(e) => setForm((f) => ({ ...f, spotsTotal: e.target.value }))} placeholder="30" className={ic(false)} />
                </F>

                <F label="Descripción *" error={errors.description}>
                  <textarea value={form.description} onChange={(e) => { setForm((f) => ({ ...f, description: e.target.value })); setErrors((er) => ({ ...er, description: '' })); }} rows={4} placeholder="Nivel recomendado, qué se trabajará..." className={`${ic(!!errors.description)} resize-none`} />
                </F>

                <F label="Etiquetas (separadas por comas)" error="">
                  <input type="text" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="Gi, Principiantes, Competición..." className={ic(false)} />
                </F>

                <button type="submit" disabled={submitting}
                  className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-60 text-black font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                  {submitting && <Loader2 size={15} className="animate-spin" />}
                  {submitting ? 'Publicando...' : 'Publicar Evento'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, error, children }: { label: string; error: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-dark-800 border border-white/10 text-sm text-gray-300 rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-gold-500/40 cursor-pointer">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
    </div>
  );
}

function typeStyle(type: CommunityEventType) {
  if (type === 'openmat') return { border: 'border-t-emerald-500', badge: 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/30', label: 'Open Mat' };
  if (type === 'campamento') return { border: 'border-t-blue-500', badge: 'bg-blue-900/60 text-blue-300 border border-blue-500/30', label: 'Campamento' };
  return { border: 'border-t-gold-500', badge: 'bg-gold-500/20 text-gold-400 border border-gold-500/30', label: 'Seminario' };
}

function EventCard({ event }: { event: CommunityEvent }) {
  const ts = typeStyle(event.type);
  return (
    <div className={`bg-dark-800 border border-white/8 border-t-2 ${ts.border} rounded-xl p-5 flex flex-col gap-3 hover:border-white/15 transition-all hover:-translate-y-0.5`}>
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ts.badge}`}>
          {ts.label}
        </span>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${categoryColors[event.category]}`}>
          {categoryLabels[event.category]}
        </span>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-700/60 text-gray-400">
          {modalityLabels[event.modality]}
        </span>
      </div>
      <h3 className="text-white font-semibold leading-snug">{event.title}</h3>
      {event.instructor && (
        <div className="flex items-center gap-1.5 text-gray-400 text-xs">
          <User size={12} className="text-gold-500 shrink-0" />
          <span>{event.instructor}{event.instructorBelt && <span className="text-gray-500"> · {event.instructorBelt}</span>}</span>
        </div>
      )}
      <div className="flex items-start gap-1.5 text-gray-400 text-xs">
        <MapPin size={12} className="text-gold-500 shrink-0 mt-0.5" />
        <span>{event.gym} · {event.city}</span>
      </div>
      <div className="flex items-center gap-1.5 text-gray-400 text-xs">
        <Calendar size={12} className="text-gold-500 shrink-0" />
        <span className="capitalize">{formatDate(event.date)}</span>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1"><Clock size={11} className="text-gold-500" />{event.time} · {event.duration}</span>
        {event.spotsTotal !== null && (
          <span className="flex items-center gap-1"><Users size={11} className="text-gold-500" />{event.spotsLeft}/{event.spotsTotal} plazas</span>
        )}
      </div>
      <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{event.description}</p>
      {Array.isArray(event.tags) && event.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {event.tags.slice(0, 4).map((t) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 bg-white/5 text-gray-500 rounded">{t}</span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
        <span className={`font-bold text-sm ${event.price === 0 ? 'text-emerald-400' : 'text-white'}`}>
          {event.price === 0 ? 'Gratis' : `${event.price} €`}
        </span>
        <a
          href={event.organizerContact.startsWith('@') ? `https://instagram.com/${event.organizerContact.slice(1)}` : `mailto:${event.organizerContact}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-medium text-gold-400 hover:text-gold-300 bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/20 px-3 py-1.5 rounded-lg transition-all">
          <Mail size={11} />
          Contactar
        </a>
      </div>
    </div>
  );
}
