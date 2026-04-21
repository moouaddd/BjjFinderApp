import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  MapPin, Clock, Laptop, Plus, X, ChevronDown,
  Instagram, Mail, CheckCircle, Users, Loader2,
} from 'lucide-react';
import { api } from '../services/api';
import {
  PrivateInstructor, BeltColor, ClassModality,
  beltDisplay, INSTRUCTOR_CITIES,
} from '../data/instructors';

const EMPTY_FORM = {
  name: '',
  belt: 'negro' as BeltColor,
  stripes: '0',
  team: '',
  city: 'Madrid',
  gym: '',
  bio: '',
  specialties: '',
  modalities: [] as ClassModality[],
  pricePerHour: '',
  pricePerSession: '',
  online: false,
  inPerson: false,
  instagram: '',
  contact: '',
  experience: '',
  languages: '',
  availability: '',
};

function BeltBadge({ belt, stripes }: { belt: BeltColor; stripes: number }) {
  const d = beltDisplay[belt];
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${d.bg} border ${d.border}`}>
      <span className="text-white text-xs font-semibold capitalize">{belt}</span>
      {stripes > 0 && (
        <span className="flex gap-0.5">
          {Array.from({ length: stripes }).map((_, i) => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/60" />
          ))}
        </span>
      )}
    </div>
  );
}

export default function Instructores() {
  const [instructors, setInstructors] = useState<PrivateInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [filterCity, setFilterCity] = useState('Todas');
  const [filterBelt, setFilterBelt] = useState<'todos' | BeltColor>('todos');
  const [filterModality, setFilterModality] = useState<'todos' | ClassModality>('todos');
  const [filterOnline, setFilterOnline] = useState<'todos' | 'online' | 'presencial'>('todos');

  const fetchInstructors = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      const data = await api.instructors.list();
      setInstructors(data);
    } catch {
      setApiError('No se pudo conectar con el servidor. ¿Está el backend corriendo?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInstructors(); }, [fetchInstructors]);

  const filtered = useMemo(() => {
    return instructors.filter((ins) => {
      if (filterCity !== 'Todas' && ins.city !== filterCity) return false;
      if (filterBelt !== 'todos' && ins.belt !== filterBelt) return false;
      if (filterModality !== 'todos' && !ins.modalities.includes(filterModality)) return false;
      if (filterOnline === 'online' && !ins.online) return false;
      if (filterOnline === 'presencial' && !ins.inPerson) return false;
      return true;
    });
  }, [instructors, filterCity, filterBelt, filterModality, filterOnline]);

  function toggleModality(m: ClassModality) {
    setForm((f) => ({
      ...f,
      modalities: f.modalities.includes(m) ? f.modalities.filter((x) => x !== m) : [...f.modalities, m],
    }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Obligatorio';
    if (!form.team.trim()) e.team = 'Obligatorio';
    if (!form.bio.trim()) e.bio = 'Obligatorio';
    if (!form.contact.trim()) e.contact = 'Obligatorio';
    if (!form.pricePerHour) e.pricePerHour = 'Obligatorio';
    if (form.modalities.length === 0) e.modalities = 'Selecciona al menos una';
    if (!form.online && !form.inPerson) e.format = 'Selecciona al menos un formato';
    if (!form.availability.trim()) e.availability = 'Obligatorio';
    return e;
  }

  async function handleSubmit(evt: React.FormEvent) {
    evt.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const newIns = await api.instructors.create({
        name: form.name.trim(),
        belt: form.belt,
        stripes: Number(form.stripes),
        team: form.team.trim(),
        city: form.city,
        gym: form.gym.trim() || undefined,
        bio: form.bio.trim(),
        specialties: form.specialties.split(',').map((s) => s.trim()).filter(Boolean),
        modalities: form.modalities,
        pricePerHour: Number(form.pricePerHour),
        pricePerSession: form.pricePerSession ? Number(form.pricePerSession) : undefined,
        online: form.online,
        inPerson: form.inPerson,
        instagram: form.instagram.trim() || undefined,
        contact: form.contact.trim(),
        experience: form.experience.trim(),
        languages: form.languages.split(',').map((l) => l.trim()).filter(Boolean),
        availability: form.availability.trim(),
      });
      setInstructors((prev) => [...prev, newIns]);
      setSubmitted(true);
      setTimeout(() => {
        setShowModal(false);
        setSubmitted(false);
        setForm(EMPTY_FORM);
        setErrors({});
      }, 2000);
    } catch (err: unknown) {
      setErrors({ submit: err instanceof Error ? err.message : 'Error al publicar el perfil' });
    } finally {
      setSubmitting(false);
    }
  }

  const selectCls = 'w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500/60 transition-colors';

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
              <p className="text-gold-500 text-xs font-semibold uppercase tracking-widest mb-2">Aprende con los mejores</p>
              <h1 className="text-3xl font-bold text-white">Clases Privadas</h1>
              <p className="text-gray-400 mt-2 text-sm max-w-xl">
                Instructores disponibles en toda España. Online y presencial. ¿Eres instructor? Regístrate gratis.
              </p>
            </div>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0">
              <Plus size={16} />
              Ofrecer Clases Privadas
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={filterCity} onChange={setFilterCity} options={INSTRUCTOR_CITIES.map((c) => ({ value: c, label: c }))} />
          <Select value={filterBelt} onChange={(v) => setFilterBelt(v as typeof filterBelt)}
            options={[{ value: 'todos', label: 'Todos los cinturones' }, { value: 'azul', label: 'Azul' }, { value: 'morado', label: 'Morado' }, { value: 'marrón', label: 'Marrón' }, { value: 'negro', label: 'Negro' }]} />
          <Select value={filterModality} onChange={(v) => setFilterModality(v as typeof filterModality)}
            options={[{ value: 'todos', label: 'Todas las modalidades' }, { value: 'gi', label: 'Gi' }, { value: 'nogi', label: 'No-Gi' }, { value: 'ambos', label: 'Gi + No-Gi' }]} />
          <Select value={filterOnline} onChange={(v) => setFilterOnline(v as typeof filterOnline)}
            options={[{ value: 'todos', label: 'Online + Presencial' }, { value: 'online', label: 'Solo Online' }, { value: 'presencial', label: 'Solo Presencial' }]} />
        </div>
        {!loading && !apiError && (
          <p className="text-gray-500 text-xs mt-3">
            {filtered.length} instructor{filtered.length !== 1 ? 'es' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500 gap-3">
            <Loader2 size={20} className="animate-spin" />
            <span>Cargando instructores...</span>
          </div>
        ) : apiError ? (
          <div className="text-center py-20">
            <p className="text-red-400 text-sm">{apiError}</p>
            <button onClick={fetchInstructors} className="mt-4 text-gold-400 hover:text-gold-300 text-sm underline">Reintentar</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p>No hay instructores con esos filtros.</p>
            <button onClick={() => setShowModal(true)} className="mt-4 text-gold-400 hover:text-gold-300 text-sm underline">
              Sé el primero en ofrecer clases en tu ciudad
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((ins) => <InstructorCard key={ins.id} instructor={ins} />)}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-dark-800 z-10">
              <div>
                <h2 className="text-white font-bold text-lg">Registrarse como Instructor</h2>
                <p className="text-gray-400 text-xs mt-0.5">Ofrece clases privadas a la comunidad BJJ</p>
              </div>
              <button onClick={() => { setShowModal(false); setErrors({}); setForm(EMPTY_FORM); }}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            {submitted ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={28} className="text-emerald-400" />
                </div>
                <h3 className="text-white font-semibold text-lg">¡Perfil publicado!</h3>
                <p className="text-gray-400 text-sm mt-1">Ya apareces en el directorio.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {errors.submit && (
                  <div className="bg-red-900/30 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">{errors.submit}</div>
                )}

                <F label="Nombre completo *" error={errors.name}>
                  <input type="text" value={form.name} onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors((er) => ({ ...er, name: '' })); }} placeholder="Tu nombre" className={ic(!!errors.name)} />
                </F>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Cinturón</label>
                    <select value={form.belt} onChange={(e) => setForm((f) => ({ ...f, belt: e.target.value as BeltColor }))} className={selectCls}>
                      <option value="azul">Azul</option>
                      <option value="morado">Morado</option>
                      <option value="marrón">Marrón</option>
                      <option value="negro">Negro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Rayas</label>
                    <select value={form.stripes} onChange={(e) => setForm((f) => ({ ...f, stripes: e.target.value }))} className={selectCls}>
                      {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} {n === 0 ? '(sin rayas)' : n === 1 ? 'raya' : 'rayas'}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <F label="Equipo / Academia *" error={errors.team}>
                    <input type="text" value={form.team} onChange={(e) => { setForm((f) => ({ ...f, team: e.target.value })); setErrors((er) => ({ ...er, team: '' })); }} placeholder="Alliance, Checkmat..." className={ic(!!errors.team)} />
                  </F>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Ciudad</label>
                    <select value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className={selectCls}>
                      {INSTRUCTOR_CITIES.filter((c) => c !== 'Todas').map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <F label="Academia donde entrenas (opcional)" error="">
                  <input type="text" value={form.gym} onChange={(e) => setForm((f) => ({ ...f, gym: e.target.value }))} placeholder="Nombre de la academia" className={ic(false)} />
                </F>

                <F label="Bio / Presentación *" error={errors.bio}>
                  <textarea value={form.bio} onChange={(e) => { setForm((f) => ({ ...f, bio: e.target.value })); setErrors((er) => ({ ...er, bio: '' })); }} rows={3} placeholder="Tu experiencia, logros y enfoque..." className={`${ic(!!errors.bio)} resize-none`} />
                </F>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <F label="Especialidades (comas)" error="">
                    <input type="text" value={form.specialties} onChange={(e) => setForm((f) => ({ ...f, specialties: e.target.value }))} placeholder="Guard, Leg Locks, Wrestling..." className={ic(false)} />
                  </F>
                  <F label="Experiencia" error="">
                    <input type="text" value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))} placeholder="8 años, CN 1 raya" className={ic(false)} />
                  </F>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Modalidades *</label>
                  <div className="flex gap-3">
                    {(['gi', 'nogi', 'ambos'] as ClassModality[]).map((m) => (
                      <button key={m} type="button" onClick={() => { toggleModality(m); setErrors((er) => ({ ...er, modalities: '' })); }}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${form.modalities.includes(m) ? 'bg-gold-500/20 text-gold-300 border-gold-500/50' : 'bg-dark-700 text-gray-400 border-white/10 hover:border-white/20'}`}>
                        {m === 'gi' ? 'Gi' : m === 'nogi' ? 'No-Gi' : 'Gi + No-Gi'}
                      </button>
                    ))}
                  </div>
                  {errors.modalities && <p className="text-red-400 text-xs mt-1">{errors.modalities}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Formato *</label>
                  <div className="flex gap-3">
                    {[{ key: 'inPerson' as const, label: 'Presencial' }, { key: 'online' as const, label: 'Online' }].map(({ key, label }) => (
                      <button key={key} type="button" onClick={() => { setForm((f) => ({ ...f, [key]: !f[key] })); setErrors((er) => ({ ...er, format: '' })); }}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${form[key] ? 'bg-emerald-900/40 text-emerald-300 border-emerald-500/50' : 'bg-dark-700 text-gray-400 border-white/10 hover:border-white/20'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {errors.format && <p className="text-red-400 text-xs mt-1">{errors.format}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <F label="€/hora *" error={errors.pricePerHour}>
                    <input type="number" min="0" value={form.pricePerHour} onChange={(e) => { setForm((f) => ({ ...f, pricePerHour: e.target.value })); setErrors((er) => ({ ...er, pricePerHour: '' })); }} placeholder="45" className={ic(!!errors.pricePerHour)} />
                  </F>
                  <F label="€/sesión (opcional)" error="">
                    <input type="number" min="0" value={form.pricePerSession} onChange={(e) => setForm((f) => ({ ...f, pricePerSession: e.target.value }))} placeholder="65 (1.5h)" className={ic(false)} />
                  </F>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <F label="Instagram (opcional)" error="">
                    <input type="text" value={form.instagram} onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))} placeholder="@usuario" className={ic(false)} />
                  </F>
                  <F label="Email de contacto *" error={errors.contact}>
                    <input type="email" value={form.contact} onChange={(e) => { setForm((f) => ({ ...f, contact: e.target.value })); setErrors((er) => ({ ...er, contact: '' })); }} placeholder="tu@email.com" className={ic(!!errors.contact)} />
                  </F>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <F label="Idiomas (comas)" error="">
                    <input type="text" value={form.languages} onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))} placeholder="Español, Inglés..." className={ic(false)} />
                  </F>
                  <F label="Disponibilidad *" error={errors.availability}>
                    <input type="text" value={form.availability} onChange={(e) => { setForm((f) => ({ ...f, availability: e.target.value })); setErrors((er) => ({ ...er, availability: '' })); }} placeholder="Tardes entre semana..." className={ic(!!errors.availability)} />
                  </F>
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-60 text-black font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                  {submitting && <Loader2 size={15} className="animate-spin" />}
                  {submitting ? 'Publicando...' : 'Publicar Perfil de Instructor'}
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

function InstructorCard({ instructor: ins }: { instructor: PrivateInstructor }) {
  const initials = ins.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="bg-dark-800 border border-white/8 rounded-xl p-5 flex flex-col gap-3 hover:border-white/15 transition-all hover:-translate-y-0.5">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-500/30 to-gold-700/20 border border-gold-500/20 flex items-center justify-center shrink-0">
          <span className="text-gold-400 font-bold text-sm">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold leading-tight">{ins.name}</h3>
          <p className="text-gray-500 text-xs">{ins.team}</p>
        </div>
        <BeltBadge belt={ins.belt} stripes={ins.stripes} />
      </div>
      <div className="flex items-center gap-1.5 text-gray-400 text-xs">
        <MapPin size={11} className="text-gold-500 shrink-0" />
        <span>{ins.city}{ins.gym ? ` · ${ins.gym}` : ''}</span>
      </div>
      <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">{ins.bio}</p>
      {Array.isArray(ins.specialties) && ins.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {ins.specialties.slice(0, 4).map((s) => (
            <span key={s} className="text-[10px] px-1.5 py-0.5 bg-white/5 text-gray-400 rounded">{s}</span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {Array.isArray(ins.modalities) && ins.modalities.map((m) => (
          <span key={m} className="text-[11px] px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20 font-medium">
            {m === 'gi' ? 'Gi' : m === 'nogi' ? 'No-Gi' : 'Gi + No-Gi'}
          </span>
        ))}
        {ins.online && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-300 border border-blue-500/20 font-medium flex items-center gap-1">
            <Laptop size={10} />Online
          </span>
        )}
        {ins.inPerson && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-300 border border-emerald-500/20 font-medium">
            Presencial
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-gray-500 text-xs">
        <Clock size={11} className="text-gold-500 shrink-0" />
        <span>{ins.availability}</span>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-auto">
        <div>
          <span className="text-white font-bold text-sm">{ins.pricePerHour}€</span>
          <span className="text-gray-500 text-xs">/hora</span>
          {ins.pricePerSession && <span className="text-gray-500 text-xs ml-2">· {ins.pricePerSession}€/sesión</span>}
        </div>
        <div className="flex gap-2">
          {ins.instagram && (
            <a href={`https://instagram.com/${ins.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
              className="p-1.5 text-gray-400 hover:text-pink-400 hover:bg-pink-500/10 rounded-lg transition-all" title="Instagram">
              <Instagram size={14} />
            </a>
          )}
          <a href={`mailto:${ins.contact}`}
            className="flex items-center gap-1.5 text-xs font-medium text-gold-400 hover:text-gold-300 bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/20 px-3 py-1.5 rounded-lg transition-all">
            <Mail size={11} />
            Contactar
          </a>
        </div>
      </div>
    </div>
  );
}
