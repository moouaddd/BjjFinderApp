import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, Clock, MapPin, Phone, Globe, Mail, Save, Loader2,
  AlertCircle, Calendar, Euro, List, Megaphone, ChevronDown, Plus, X,
  Trash2, Star,
} from 'lucide-react';
import type { CommunityEvent } from '../data/events';
import { useAuth } from '../context/AuthContext';
import { api, type GymRecord } from '../services/api';
import { useNavigate } from 'react-router-dom';

type Tab = 'openmat' | 'horario' | 'contacto' | 'publicar' | 'eventos';

const DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const DAY_LABELS: Record<string, string> = {
  lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves',
  viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo',
};

function SaveButton({ saving, saved, onClick }: { saving: boolean; saved: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onClick}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-black font-bold rounded-xl text-sm transition-all"
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
      {saved && (
        <span className="text-emerald-400 text-sm flex items-center gap-1.5">
          <CheckCircle size={14} /> Guardado
        </span>
      )}
    </div>
  );
}

function Toggle({ value, onChange, label, sub }: { value: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <label className="flex items-center justify-between p-4 bg-dark-800 border border-white/8 rounded-xl cursor-pointer hover:border-white/15 transition-colors">
      <div>
        <p className="text-white font-semibold text-sm">{label}</p>
        {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
      </div>
      <div onClick={() => onChange(!value)} className={`w-12 h-6 rounded-full relative transition-all ${value ? 'bg-gold-500' : 'bg-dark-600 border border-white/15'}`}>
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${value ? 'left-7' : 'left-1'}`} />
      </div>
    </label>
  );
}

export default function OwnerDashboard() {
  const { user, isOwner, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('openmat');
  const [gym, setGym] = useState<GymRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Open mat state ──
  const [friday, setFriday] = useState(false);
  const [fridayTime, setFridayTime] = useState('');
  const [fridayDuration, setFridayDuration] = useState('');
  const [saturday, setSaturday] = useState(false);
  const [saturdayTime, setSaturdayTime] = useState('');
  const [saturdayDuration, setSaturdayDuration] = useState('');
  const [openMatNotes, setOpenMatNotes] = useState('');

  // ── Schedule state ──
  const [schedule, setSchedule] = useState<Record<string, string[]>>(
    Object.fromEntries(DAYS.map((d) => [d, []]))
  );

  // ── Contact & price state ──
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [pricePerClass, setPricePerClass] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('');
  const [description, setDescription] = useState('');

  // ── Publish event state ──
  const [evtType, setEvtType] = useState<'openmat' | 'seminario' | 'campamento'>('seminario');
  const [evtTitle, setEvtTitle] = useState('');
  const [evtDate, setEvtDate] = useState('');
  const [evtTime, setEvtTime] = useState('');
  const [evtDuration, setEvtDuration] = useState('');
  const [evtPrice, setEvtPrice] = useState('0');
  const [evtSpots, setEvtSpots] = useState('');
  const [evtInstructor, setEvtInstructor] = useState('');
  const [evtDescription, setEvtDescription] = useState('');
  const [evtContact, setEvtContact] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  // ── My events state ──
  const [myEvents, setMyEvents] = useState<CommunityEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<string | null>(null);
  const [deletingGym, setDeletingGym] = useState(false);
  const [gymDeleted, setGymDeleted] = useState(false);

  const fetchGym = useCallback(async () => {
    if (!user?.gymId) { setLoading(false); return; }
    try {
      const g = await api.gyms.get(user.gymId);
      setGym(g);
      setFriday(g.openMatFriday);
      setFridayTime(g.openMatFridayTime ?? '');
      setFridayDuration(g.openMatFridayDuration ?? '');
      setSaturday(g.openMatSaturday);
      setSaturdayTime(g.openMatSaturdayTime ?? '');
      setSaturdayDuration(g.openMatSaturdayDuration ?? '');
      setOpenMatNotes(g.openMatNotes ?? '');
      setPhone(g.phone ?? '');
      setEmail(g.email ?? '');
      setWebsite(g.website ?? '');
      setPricePerClass(g.pricePerClass != null ? String(g.pricePerClass) : '');
      setMonthlyFee(g.monthlyFee != null ? String(g.monthlyFee) : '');
      setDescription(g.description ?? '');
      if (g.scheduleJson) {
        try {
          const parsed = JSON.parse(g.scheduleJson) as Record<string, string[]>;
          setSchedule(Object.fromEntries(DAYS.map((d) => [d, parsed[d] ?? []])));
        } catch { /* ignore */ }
      }
    } catch { setError('No se pudo cargar la información de la academia.'); }
    finally { setLoading(false); }
  }, [user?.gymId]);

  useEffect(() => {
    if (!authLoading && !isOwner && !isAdmin) navigate('/login', { state: { from: '/mi-academia' } });
    else if (!authLoading) fetchGym();
  }, [authLoading, isOwner, isAdmin, navigate, fetchGym]);

  const flash = (fn: () => Promise<void>) => async () => {
    setSaving(true); setSaved(false); setError(null);
    try { await fn(); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    catch (e) { setError(e instanceof Error ? e.message : 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const saveOpenMat = flash(async () => {
    if (!gym) return;
    await api.gyms.updateOpenMat(gym.id, {
      openMatFriday: friday,
      openMatFridayTime: fridayTime || undefined,
      openMatFridayDuration: fridayDuration || undefined,
      openMatSaturday: saturday,
      openMatSaturdayTime: saturdayTime || undefined,
      openMatSaturdayDuration: saturdayDuration || undefined,
      openMatNotes: openMatNotes || undefined,
    });
    // Refetch so local gym state reflects the saved open mat data
    const updated = await api.gyms.get(gym.id);
    setGym(updated);
  });

  const saveProfile = flash(async () => {
    if (!gym) return;
    await api.gyms.updateProfile(gym.id, {
      phoneOverride: phone, emailOverride: email, websiteOverride: website,
      pricePerClass: pricePerClass === '' ? '' : Number(pricePerClass),
      monthlyFee: monthlyFee === '' ? '' : Number(monthlyFee),
      scheduleJson: JSON.stringify(schedule),
      description,
    });
  });

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gym) return;
    setPublishing(true);
    try {
      await api.events.create({
        type: evtType,
        title: evtTitle,
        organizer: user!.name,
        organizerContact: evtContact,
        gym: gym.name,
        address: gym.address ?? '',
        city: gym.city,
        date: evtDate,
        time: evtTime,
        duration: evtDuration,
        price: Number(evtPrice) || 0,
        category: 'mixto',
        modality: 'gi',
        description: evtDescription,
        spotsTotal: evtSpots ? Number(evtSpots) : null,
        spotsLeft: evtSpots ? Number(evtSpots) : null,
        instructor: evtInstructor || undefined,
        tags: [],
      });
      setPublished(true);
      setEvtTitle(''); setEvtDate(''); setEvtTime(''); setEvtDuration('');
      setEvtPrice('0'); setEvtSpots(''); setEvtInstructor(''); setEvtDescription(''); setEvtContact('');
      setTimeout(() => setPublished(false), 4000);
    } catch (e) { setError(e instanceof Error ? e.message : 'Error al publicar'); }
    finally { setPublishing(false); }
  };

  const fetchMyEvents = useCallback(async () => {
    if (!user) return;
    setLoadingEvents(true);
    try {
      const all = await api.events.list();
      setMyEvents(all.filter((e) => (e as CommunityEvent & { organizerId?: string }).organizerId === user.id));
    } finally {
      setLoadingEvents(false);
    }
  }, [user]);

  useEffect(() => {
    if (tab === 'eventos') fetchMyEvents();
  }, [tab, fetchMyEvents]);

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('¿Eliminar este evento?')) return;
    setDeletingEvent(id);
    try {
      await api.events.delete(id);
      setMyEvents((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeletingEvent(null);
    }
  };

  const handleDeleteGym = async () => {
    if (!gym) return;
    if (!confirm(`¿Seguro que quieres eliminar "${gym.name}" de la plataforma? Esta acción ocultará la academia del directorio.`)) return;
    setDeletingGym(true);
    try {
      await api.gyms.delete(gym.id);
      setGymDeleted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setDeletingGym(false);
    }
  };

  // Schedule helpers
  const addSlot = (day: string) => setSchedule((s) => ({ ...s, [day]: [...s[day], ''] }));
  const removeSlot = (day: string, i: number) => setSchedule((s) => ({ ...s, [day]: s[day].filter((_, j) => j !== i) }));
  const updateSlot = (day: string, i: number, val: string) => setSchedule((s) => ({ ...s, [day]: s[day].map((v, j) => j === i ? val : v) }));

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen"><Loader2 size={32} className="animate-spin text-gold-500" /></div>
  );

  if (!user?.gymId) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="text-5xl mb-4">🥋</p>
      <h2 className="text-white font-bold text-xl mb-2">Sin academia asignada</h2>
      <p className="text-gray-400 text-sm mb-6">Reclama tu academia desde el directorio. El admin la verificará.</p>
      <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-xl text-sm">Ir al directorio</button>
    </div>
  );

  const tabs: { id: Tab; label: string; icon: typeof Save }[] = [
    { id: 'openmat', label: 'Open Mat', icon: Clock },
    { id: 'horario', label: 'Horario', icon: List },
    { id: 'contacto', label: 'Contacto & Precios', icon: Phone },
    { id: 'publicar', label: 'Publicar Evento', icon: Megaphone },
    { id: 'eventos', label: 'Mis Eventos', icon: Star },
  ];

  if (gymDeleted) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="text-5xl mb-4">✅</p>
      <h2 className="text-white font-bold text-xl mb-2">Academia eliminada</h2>
      <p className="text-gray-400 text-sm mb-6">Tu academia ya no aparece en el directorio.</p>
      <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-xl text-sm">Volver al inicio</button>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-dark-800 border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #e6b800 0%, transparent 50%)' }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gold-400 text-xs font-semibold uppercase tracking-widest mb-1">Panel de propietario</p>
          <h1 className="text-2xl font-black text-white">{gym?.name ?? 'Mi Academia'}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {gym?.isVerified ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
                <CheckCircle size={12} />Academia verificada
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                <Clock size={12} />Pendiente de verificación
              </span>
            )}
            {gym?.city && (
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin size={11} />{gym.city}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/5 bg-dark-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setTab(id); setSaved(false); setError(null); }}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  tab === id ? 'text-gold-400 border-gold-500' : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm mb-6">
            <AlertCircle size={16} />{error}
          </div>
        )}

        {/* ── TAB: OPEN MAT ── */}
        {tab === 'openmat' && (
          <div className="max-w-lg space-y-4">
            <Toggle value={friday} onChange={setFriday} label="Open Mat los Viernes" sub="¿Haces open mat los viernes?" />
            {friday && (
              <div className="grid grid-cols-2 gap-3 pl-2">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Hora de inicio</label>
                  <input type="time" value={fridayTime} onChange={(e) => setFridayTime(e.target.value)}
                    className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-gold-500/50" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Duración (ej: 2h)</label>
                  <input type="text" placeholder="2h" value={fridayDuration} onChange={(e) => setFridayDuration(e.target.value)}
                    className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-gold-500/50" />
                </div>
              </div>
            )}

            <Toggle value={saturday} onChange={setSaturday} label="Open Mat los Sábados" sub="¿Haces open mat los sábados?" />
            {saturday && (
              <div className="grid grid-cols-2 gap-3 pl-2">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Hora de inicio</label>
                  <input type="time" value={saturdayTime} onChange={(e) => setSaturdayTime(e.target.value)}
                    className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-gold-500/50" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Duración (ej: 2h)</label>
                  <input type="text" placeholder="2h" value={saturdayDuration} onChange={(e) => setSaturdayDuration(e.target.value)}
                    className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-gold-500/50" />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Notas (precio, requisitos, etc.)</label>
              <textarea rows={3} value={openMatNotes} onChange={(e) => setOpenMatNotes(e.target.value)}
                placeholder="Ej: Abierto a todos los niveles, 5€ matrícula"
                className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-gold-500/50 resize-none" />
            </div>

            <SaveButton saving={saving} saved={saved} onClick={saveOpenMat} />
          </div>
        )}

        {/* ── TAB: HORARIO ── */}
        {tab === 'horario' && (
          <div className="space-y-3">
            <p className="text-gray-400 text-sm mb-4">Añade los horarios de tus clases. Formato: <span className="text-white">19:00-20:30</span> o <span className="text-white">19:00-20:30 (No-Gi)</span></p>
            {DAYS.map((day) => (
              <div key={day} className="bg-dark-700 border border-white/8 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-dark-800 border-b border-white/5">
                  <span className="text-white font-semibold text-sm">{DAY_LABELS[day]}</span>
                  <button onClick={() => addSlot(day)} className="flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300 transition-colors">
                    <Plus size={13} />Añadir
                  </button>
                </div>
                <div className="p-3 space-y-2">
                  {schedule[day].length === 0 ? (
                    <p className="text-gray-700 text-xs italic px-1">Sin clases este día</p>
                  ) : (
                    schedule[day].map((slot, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={slot}
                          onChange={(e) => updateSlot(day, i, e.target.value)}
                          placeholder="19:00-20:30"
                          className="flex-1 bg-dark-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-gold-500/50"
                        />
                        <button onClick={() => removeSlot(day, i)} className="text-gray-600 hover:text-red-400 transition-colors">
                          <X size={15} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
            <div className="pt-2">
              <SaveButton saving={saving} saved={saved} onClick={saveProfile} />
            </div>
          </div>
        )}

        {/* ── TAB: CONTACTO & PRECIOS ── */}
        {tab === 'contacto' && (
          <div className="max-w-lg space-y-5">
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">Los campos que rellenes reemplazarán los datos del directorio.</p>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5"><Phone size={12} />Teléfono</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="600 000 000"
                  className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-gold-500/50" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5"><Mail size={12} />Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="academia@ejemplo.com"
                  className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-gold-500/50" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5"><Globe size={12} />Sitio web</label>
                <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://miacademia.com"
                  className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-gold-500/50" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5"><Euro size={12} />Precio por clase (dejar vacío = Consultar)</label>
                <input type="number" min="0" value={pricePerClass} onChange={(e) => setPricePerClass(e.target.value)} placeholder="15"
                  className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-gold-500/50" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5"><Euro size={12} />Cuota mensual (dejar vacío = Consultar)</label>
                <input type="number" min="0" value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} placeholder="60"
                  className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-gold-500/50" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Descripción de la academia</label>
                <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe tu academia, equipo, enfoque..."
                  className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-gold-500/50 resize-none" />
              </div>
            </div>
            <SaveButton saving={saving} saved={saved} onClick={saveProfile} />

            {/* Danger zone */}
            <div className="mt-8 pt-6 border-t border-red-500/20">
              <p className="text-red-400 text-xs font-semibold uppercase tracking-widest mb-3">Zona de peligro</p>
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <p className="text-white font-semibold text-sm mb-1">Eliminar academia de la plataforma</p>
                <p className="text-gray-500 text-xs mb-4 leading-relaxed">
                  Tu academia dejará de aparecer en el directorio, mapa y open mats. Esta acción se puede revertir contactando con el administrador.
                </p>
                <button
                  onClick={handleDeleteGym}
                  disabled={deletingGym}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold text-sm rounded-xl transition-all disabled:opacity-50"
                >
                  {deletingGym ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Eliminar mi academia
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: PUBLICAR EVENTO ── */}
        {tab === 'publicar' && (
          <div className="max-w-lg">
            <p className="text-gray-400 text-sm mb-5">Publica un seminario, campamento u open mat especial vinculado a tu academia.</p>
            <form onSubmit={handlePublish} className="space-y-4">
              {/* Type */}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Tipo de evento</label>
                <div className="relative">
                  <select value={evtType} onChange={(e) => setEvtType(e.target.value as typeof evtType)}
                    className="appearance-none w-full bg-dark-700 border border-white/10 rounded-lg pl-3 pr-8 py-2.5 text-sm text-white outline-none focus:border-gold-500/50 cursor-pointer">
                    <option value="seminario">Seminario</option>
                    <option value="campamento">Campamento</option>
                    <option value="openmat">Open Mat especial</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Título</label>
                <input type="text" value={evtTitle} onChange={(e) => setEvtTitle(e.target.value)} required
                  placeholder={evtType === 'seminario' ? 'Seminario de Guard Passing' : evtType === 'campamento' ? 'Campamento de Verano BJJ' : 'Open Mat Especial'}
                  className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-gold-500/50" />
              </div>

              {evtType === 'seminario' && (
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Instructor / Ponente</label>
                  <input type="text" value={evtInstructor} onChange={(e) => setEvtInstructor(e.target.value)}
                    placeholder="Nombre del instructor"
                    className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-gold-500/50" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5"><Calendar size={11} />Fecha</label>
                  <input type="date" value={evtDate} onChange={(e) => setEvtDate(e.target.value)} required
                    className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-gold-500/50" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5"><Clock size={11} />Hora</label>
                  <input type="time" value={evtTime} onChange={(e) => setEvtTime(e.target.value)} required
                    className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-gold-500/50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Duración</label>
                  <input type="text" value={evtDuration} onChange={(e) => setEvtDuration(e.target.value)}
                    placeholder="3h / 2 días"
                    className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-gold-500/50" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5"><Euro size={11} />Precio (€, 0 = gratis)</label>
                  <input type="number" min="0" value={evtPrice} onChange={(e) => setEvtPrice(e.target.value)}
                    className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-gold-500/50" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5"><MapPin size={11} />Contacto / inscripciones</label>
                <input type="text" value={evtContact} onChange={(e) => setEvtContact(e.target.value)}
                  placeholder="email, Instagram, WhatsApp..."
                  className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-gold-500/50" />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Descripción</label>
                <textarea rows={4} value={evtDescription} onChange={(e) => setEvtDescription(e.target.value)} required
                  placeholder="Describe el evento, qué se va a trabajar, a quién va dirigido..."
                  className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-gold-500/50 resize-none" />
              </div>

              <button type="submit" disabled={publishing}
                className="flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-black font-bold rounded-xl text-sm transition-all w-full justify-center">
                {publishing ? <Loader2 size={15} className="animate-spin" /> : <Megaphone size={15} />}
                {publishing ? 'Publicando...' : 'Publicar evento'}
              </button>

              {published && (
                <p className="text-emerald-400 text-sm flex items-center gap-1.5">
                  <CheckCircle size={14} />Evento publicado correctamente. Ya aparece en la sección Eventos.
                </p>
              )}
            </form>
          </div>
        )}

        {/* ── TAB: MIS EVENTOS ── */}
        {tab === 'eventos' && (
          <div>
            <p className="text-gray-400 text-sm mb-5">Eventos publicados por tu academia. Puedes eliminar los que ya no sean relevantes.</p>
            {loadingEvents ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Loader2 size={16} className="animate-spin text-gold-500" />
                Cargando eventos...
              </div>
            ) : myEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <Calendar size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No has publicado ningún evento aún.</p>
                <button onClick={() => setTab('publicar')} className="mt-3 text-gold-400 hover:text-gold-300 text-sm underline">
                  Publicar un evento
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myEvents.map((event) => (
                  <div key={event.id} className="bg-dark-700 border border-white/8 rounded-2xl p-4 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gold-500/15 text-gold-400 border border-gold-500/20">
                          {event.type === 'openmat' ? 'Open Mat' : event.type === 'seminario' ? 'Seminario' : 'Campamento'}
                        </span>
                        <span className="text-gray-600 text-xs">{event.city}</span>
                      </div>
                      <p className="text-white font-bold text-sm">{event.title}</p>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-gray-500 text-xs">
                        <span className="flex items-center gap-1"><Calendar size={11} className="text-gold-500" />{event.date}</span>
                        <span className="flex items-center gap-1"><Clock size={11} className="text-gold-500" />{event.time} · {event.duration}</span>
                        <span className="text-gold-400 font-semibold">{event.price === 0 ? 'Gratis' : `${event.price} €`}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      disabled={deletingEvent === event.id}
                      className="shrink-0 p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                      title="Eliminar evento"
                    >
                      {deletingEvent === event.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
