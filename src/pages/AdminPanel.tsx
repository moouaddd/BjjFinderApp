import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, Users, Building2, Loader2, AlertCircle, ShieldCheck, UserCheck, Trash2, EyeOff, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, type OrganizerRequest, type GymRecord } from '../services/api';
import type { CommunityEvent } from '../data/events';
import { useNavigate } from 'react-router-dom';

interface Claim {
  id: string;
  gymId: string;
  status: string;
  message: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string };
  gym: { id: string; name: string; city?: string };
}

interface Stats {
  users: number;
  pendingClaims: number;
  approvedClaims: number;
  claimedGyms: number;
  pendingOrganizers: number;
}

export default function AdminPanel() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [claims, setClaims] = useState<Claim[]>([]);
  const [orgRequests, setOrgRequests] = useState<OrganizerRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  // Events management
  const [allEvents, setAllEvents] = useState<CommunityEvent[]>([]);
  const [deletingEvent, setDeletingEvent] = useState<string | null>(null);
  const [eventSearch, setEventSearch] = useState('');

  // Gyms management
  const [gymSearch, setGymSearch] = useState('');
  const [gymResults, setGymResults] = useState<GymRecord[]>([]);
  const [searchingGyms, setSearchingGyms] = useState(false);
  const [hidingGym, setHidingGym] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [c, s, orgs, evts] = await Promise.all([
        api.admin.getClaims(),
        api.admin.getStats(),
        api.admin.getOrganizerRequests(),
        api.events.list(),
      ]);
      setClaims(c as Claim[]);
      setStats(s);
      setOrgRequests(orgs);
      setAllEvents(evts);
    } catch {
      // handled below
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('¿Eliminar este evento?')) return;
    setDeletingEvent(id);
    try {
      await api.events.delete(id);
      setAllEvents((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeletingEvent(null);
    }
  };

  const searchGyms = async () => {
    if (!gymSearch.trim()) return;
    setSearchingGyms(true);
    try {
      const res = await api.gyms.list({ search: gymSearch.trim(), limit: 20 });
      setGymResults(res.data);
    } finally {
      setSearchingGyms(false);
    }
  };

  const handleHideGym = async (gymId: string) => {
    if (!confirm('¿Ocultar esta academia de la plataforma?')) return;
    setHidingGym(gymId);
    try {
      await api.gyms.delete(gymId);
      setGymResults((prev) => prev.filter((g) => g.id !== gymId));
    } finally {
      setHidingGym(null);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/', { replace: true });
    } else if (!authLoading) {
      fetchData();
    }
  }, [authLoading, isAdmin, navigate, fetchData]);

  const handleAction = async (claimId: string, action: 'approve' | 'reject') => {
    setProcessing(claimId);
    try {
      if (action === 'approve') await api.admin.approveClaim(claimId);
      else await api.admin.rejectClaim(claimId);
      await fetchData();
    } finally {
      setProcessing(null);
    }
  };

  const handleOrgAction = async (reqId: string, action: 'approve' | 'reject') => {
    setProcessing(reqId);
    try {
      if (action === 'approve') await api.admin.approveOrganizerRequest(reqId);
      else await api.admin.rejectOrganizerRequest(reqId);
      await fetchData();
    } finally {
      setProcessing(null);
    }
  };

  const pending = claims.filter((c) => c.status === 'pending');
  const resolved = claims.filter((c) => c.status !== 'pending');

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-dark-800 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-1">
            <ShieldCheck size={22} className="text-gold-400" />
            <h1 className="text-2xl font-black text-white">Panel de Administración</h1>
          </div>
          <p className="text-gray-500 text-sm">Gestiona las solicitudes de reclamación de academias</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: 'Usuarios', value: stats.users, icon: Users, color: 'text-blue-400' },
              { label: 'Solicitudes gym pendientes', value: stats.pendingClaims, icon: Clock, color: 'text-yellow-400' },
              { label: 'Gyms aprobadas', value: stats.approvedClaims, icon: CheckCircle, color: 'text-emerald-400' },
              { label: 'Academias reclamadas', value: stats.claimedGyms, icon: Building2, color: 'text-gold-400' },
              { label: 'Organizadores pendientes', value: stats.pendingOrganizers, icon: UserCheck, color: 'text-purple-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-dark-700 border border-white/8 rounded-2xl p-4">
                <Icon size={18} className={`${color} mb-2`} />
                <p className="text-white font-black text-2xl">{value}</p>
                <p className="text-gray-500 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Pending claims */}
        <div>
          <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
            <Clock size={16} className="text-yellow-400" />
            Solicitudes pendientes
            {pending.length > 0 && (
              <span className="bg-yellow-400/15 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>
            )}
          </h2>

          {pending.length === 0 ? (
            <div className="bg-dark-700 border border-white/8 rounded-2xl p-8 text-center text-gray-600">
              <CheckCircle size={32} className="mx-auto mb-2 text-emerald-500/40" />
              <p className="text-sm">No hay solicitudes pendientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((claim) => (
                <div key={claim.id} className="bg-dark-700 border border-white/8 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-bold text-sm">{claim.gym?.name ?? claim.gymId}</span>
                        {claim.gym?.city && (
                          <span className="text-xs text-gray-500">— {claim.gym.city}</span>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs">
                        Solicitado por <span className="text-white">{claim.user.name}</span> ({claim.user.email})
                      </p>
                      {claim.message && (
                        <p className="text-gray-500 text-xs mt-2 bg-dark-800 rounded-lg px-3 py-2 border border-white/5">
                          "{claim.message}"
                        </p>
                      )}
                      <p className="text-gray-700 text-xs mt-2">
                        {new Date(claim.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleAction(claim.id, 'reject')}
                        disabled={processing === claim.id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                      >
                        {processing === claim.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                        Rechazar
                      </button>
                      <button
                        onClick={() => handleAction(claim.id, 'approve')}
                        disabled={processing === claim.id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                      >
                        {processing === claim.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                        Aprobar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Organizer requests */}
        {(() => {
          const pendingOrgs = orgRequests.filter((r) => r.status === 'pending');
          const resolvedOrgs = orgRequests.filter((r) => r.status !== 'pending');
          return (
            <div>
              <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                <UserCheck size={16} className="text-purple-400" />
                Solicitudes de Organizador
                {pendingOrgs.length > 0 && (
                  <span className="bg-purple-400/15 text-purple-400 text-xs font-bold px-2 py-0.5 rounded-full">{pendingOrgs.length}</span>
                )}
              </h2>

              {pendingOrgs.length === 0 && resolvedOrgs.length === 0 ? (
                <div className="bg-dark-700 border border-white/8 rounded-2xl p-8 text-center text-gray-600">
                  <UserCheck size={32} className="mx-auto mb-2 text-purple-500/40" />
                  <p className="text-sm">No hay solicitudes de organizador</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingOrgs.map((req) => (
                    <div key={req.id} className="bg-dark-700 border border-white/8 rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm">{req.user?.name}</p>
                          <p className="text-gray-400 text-xs">{req.user?.email}</p>
                          {req.message && (
                            <p className="text-gray-500 text-xs mt-2 bg-dark-800 rounded-lg px-3 py-2 border border-white/5">
                              "{req.message}"
                            </p>
                          )}
                          <p className="text-gray-700 text-xs mt-2">
                            {new Date(req.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleOrgAction(req.id, 'reject')}
                            disabled={processing === req.id}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                          >
                            {processing === req.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                            Rechazar
                          </button>
                          <button
                            onClick={() => handleOrgAction(req.id, 'approve')}
                            disabled={processing === req.id}
                            className="flex items-center gap-1.5 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                          >
                            {processing === req.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                            Aprobar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {resolvedOrgs.map((req) => (
                    <div key={req.id} className="bg-dark-700/50 border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-white text-sm font-medium">{req.user?.name}</p>
                        <p className="text-gray-600 text-xs">{req.user?.email}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        req.status === 'approved'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {req.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Resolved gym claims */}
        {claims.filter((c) => c.status !== 'pending').length > 0 && (
          <div>
            <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <AlertCircle size={16} className="text-gray-500" />
              Historial — Academias
            </h2>
            <div className="space-y-2">
              {claims.filter((c) => c.status !== 'pending').map((claim) => (
                <div key={claim.id} className="bg-dark-700/50 border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white text-sm font-medium">{claim.gym?.name ?? claim.gymId}</p>
                    <p className="text-gray-600 text-xs">{claim.user.name} · {claim.user.email}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    claim.status === 'approved'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {claim.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EVENTS MANAGEMENT ── */}
        <div>
          <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
            <Trash2 size={16} className="text-red-400" />
            Gestión de Eventos
            <span className="text-gray-600 text-sm font-normal">({allEvents.length})</span>
          </h2>

          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Filtrar por título, ciudad, tipo..."
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
              className="w-full bg-dark-700 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold-500/40"
            />
          </div>

          {allEvents.length === 0 ? (
            <div className="bg-dark-700 border border-white/8 rounded-2xl p-8 text-center text-gray-600">
              <p className="text-sm">No hay eventos publicados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allEvents
                .filter((e) => {
                  const q = eventSearch.toLowerCase();
                  return !q || e.title.toLowerCase().includes(q) || e.city.toLowerCase().includes(q) || e.type.includes(q);
                })
                .map((event) => (
                  <div key={event.id} className="bg-dark-700 border border-white/8 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gold-500/15 text-gold-400 border border-gold-500/20">
                          {event.type === 'openmat' ? 'Open Mat' : event.type === 'seminario' ? 'Seminario' : 'Campamento'}
                        </span>
                        <p className="text-white text-sm font-medium truncate">{event.title}</p>
                        <span className="text-gray-600 text-xs shrink-0">{event.city} · {event.date}</span>
                      </div>
                      <p className="text-gray-600 text-xs mt-0.5">Por: {event.organizer}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      disabled={deletingEvent === event.id}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                    >
                      {deletingEvent === event.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      Eliminar
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* ── GYMS MANAGEMENT ── */}
        <div>
          <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
            <EyeOff size={16} className="text-orange-400" />
            Gestión de Academias
          </h2>
          <p className="text-gray-500 text-xs mb-4">Busca una academia y ocúltala de la plataforma (mapa, directorio, open mats).</p>

          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Nombre o ciudad..."
                value={gymSearch}
                onChange={(e) => setGymSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchGyms()}
                className="w-full bg-dark-700 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold-500/40"
              />
            </div>
            <button
              onClick={searchGyms}
              disabled={searchingGyms}
              className="px-4 py-2 bg-dark-700 border border-white/10 hover:border-white/20 text-gray-300 text-sm rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {searchingGyms ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
              Buscar
            </button>
          </div>

          {gymResults.length > 0 && (
            <div className="space-y-2">
              {gymResults.map((gym) => (
                <div key={gym.id} className="bg-dark-700 border border-white/8 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{gym.name}</p>
                    <p className="text-gray-600 text-xs">{gym.city}{gym.address ? ` · ${gym.address}` : ''}</p>
                  </div>
                  <button
                    onClick={() => handleHideGym(gym.id)}
                    disabled={hidingGym === gym.id}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                  >
                    {hidingGym === gym.id ? <Loader2 size={12} className="animate-spin" /> : <EyeOff size={12} />}
                    Ocultar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
