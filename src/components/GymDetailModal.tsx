import { useEffect } from 'react';
import { X, MapPin, Phone, Mail, Globe, Star, Clock, Euro, CheckCircle, ExternalLink } from 'lucide-react';
import type { GymRecord } from '../services/api';

const DAY_LABELS: Record<string, string> = {
  lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
  jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo',
};

function parseSchedule(json: string | null): Record<string, string[]> | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as Record<string, string[]>;
    const hasAny = Object.values(parsed).some((slots) => slots.length > 0);
    return hasAny ? parsed : null;
  } catch {
    return null;
  }
}

interface Props {
  gym: GymRecord;
  onClose: () => void;
}

export default function GymDetailModal({ gym, onClose }: Props) {
  const schedule = parseSchedule(gym.scheduleJson ?? null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full sm:max-w-lg bg-dark-800 border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-white/8 flex items-start justify-between gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              {gym.isVerified && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <CheckCircle size={9} /> Verificada
                </span>
              )}
              {(gym.openMatFriday || gym.openMatSaturday) && (
                <span className="text-[10px] font-semibold text-gold-400 bg-gold-500/10 border border-gold-500/20 px-2 py-0.5 rounded-full">
                  Open Mat
                </span>
              )}
            </div>
            <h2 className="text-white font-bold text-lg leading-tight">{gym.name}</h2>
            {gym.address && (
              <p className="text-gray-400 text-xs flex items-center gap-1.5 mt-1">
                <MapPin size={11} className="text-gold-500/70 shrink-0" />
                {gym.address}, {gym.city}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

          {/* Rating */}
          {gym.rating && (
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={14}
                  className={n <= Math.round(gym.rating!) ? 'text-yellow-400' : 'text-gray-700'}
                  fill={n <= Math.round(gym.rating!) ? 'currentColor' : 'none'}
                />
              ))}
              <span className="text-white font-semibold text-sm">{gym.rating}</span>
              {gym.ratingCount && (
                <span className="text-gray-500 text-xs">({gym.ratingCount} reseñas)</span>
              )}
            </div>
          )}

          {/* Description */}
          {gym.description && (
            <p className="text-gray-400 text-sm leading-relaxed">{gym.description}</p>
          )}

          {/* Open Mat schedule */}
          {(gym.openMatFriday || gym.openMatSaturday) && (
            <div>
              <h3 className="text-white font-semibold text-xs uppercase tracking-widest mb-2.5 flex items-center gap-2">
                <Clock size={12} className="text-gold-400" /> Open Mat semanal
              </h3>
              <div className="space-y-2">
                {gym.openMatFriday && (
                  <div className="flex items-center justify-between bg-gold-500/8 border border-gold-500/20 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gold-500/20 flex items-center justify-center">
                        <Clock size={13} className="text-gold-400" />
                      </div>
                      <div>
                        <p className="text-gold-400 font-bold text-sm">
                          {gym.openMatFridayTime ?? '—'}
                        </p>
                        <p className="text-gray-500 text-xs">
                          Viernes{gym.openMatFridayDuration ? ` · ${gym.openMatFridayDuration}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-400 font-medium">Semanal</span>
                  </div>
                )}
                {gym.openMatSaturday && (
                  <div className="flex items-center justify-between bg-gold-500/8 border border-gold-500/20 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gold-500/20 flex items-center justify-center">
                        <Clock size={13} className="text-gold-400" />
                      </div>
                      <div>
                        <p className="text-gold-400 font-bold text-sm">
                          {gym.openMatSaturdayTime ?? '—'}
                        </p>
                        <p className="text-gray-500 text-xs">
                          Sábado{gym.openMatSaturdayDuration ? ` · ${gym.openMatSaturdayDuration}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-400 font-medium">Semanal</span>
                  </div>
                )}
                {gym.openMatNotes && (
                  <p className="text-gray-500 text-xs px-1">{gym.openMatNotes}</p>
                )}
              </div>
            </div>
          )}

          {/* Weekly class schedule */}
          {schedule && (
            <div>
              <h3 className="text-white font-semibold text-xs uppercase tracking-widest mb-2.5 flex items-center gap-2">
                <Clock size={12} className="text-gold-400" /> Horario de clases
              </h3>
              <div className="bg-dark-700 border border-white/8 rounded-xl overflow-hidden">
                {Object.entries(DAY_LABELS).map(([key, label]) => {
                  const slots = schedule[key];
                  if (!slots || slots.length === 0) return null;
                  return (
                    <div key={key} className="flex items-start gap-3 px-4 py-2.5 border-b border-white/5 last:border-0">
                      <span className="text-gray-400 text-xs font-medium w-20 shrink-0 pt-0.5">{label}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {slots.map((slot, i) => (
                          <span key={i} className="text-xs text-gold-400 bg-gold-500/10 border border-gold-500/20 rounded-lg px-2 py-0.5">
                            {slot}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pricing */}
          {(gym.pricePerClass != null || gym.monthlyFee != null) && (
            <div>
              <h3 className="text-white font-semibold text-xs uppercase tracking-widest mb-2.5 flex items-center gap-2">
                <Euro size={12} className="text-gold-400" /> Precios
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {gym.pricePerClass != null && (
                  <div className="bg-dark-700 border border-white/8 rounded-xl p-3 text-center">
                    <p className="text-gold-400 font-bold text-lg">{gym.pricePerClass} €</p>
                    <p className="text-gray-500 text-xs mt-0.5">Por clase</p>
                  </div>
                )}
                {gym.monthlyFee != null && (
                  <div className="bg-dark-700 border border-white/8 rounded-xl p-3 text-center">
                    <p className="text-gold-400 font-bold text-lg">{gym.monthlyFee} €</p>
                    <p className="text-gray-500 text-xs mt-0.5">Cuota mensual</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-xs uppercase tracking-widest mb-2.5">Contacto</h3>
            <div className="space-y-2">
              {gym.phone && (
                <a
                  href={`tel:${gym.phone.replace(/\s/g, '')}`}
                  className="flex items-center gap-3 p-3 bg-dark-700 border border-white/8 rounded-xl hover:border-gold-500/30 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-dark-600 flex items-center justify-center shrink-0">
                    <Phone size={14} className="text-gold-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider">Teléfono</p>
                    <p className="text-white text-sm font-medium">{gym.phone}</p>
                  </div>
                  <ExternalLink size={13} className="text-gray-600 group-hover:text-gold-400 transition-colors shrink-0" />
                </a>
              )}
              {gym.email && (
                <a
                  href={`mailto:${gym.email}`}
                  className="flex items-center gap-3 p-3 bg-dark-700 border border-white/8 rounded-xl hover:border-gold-500/30 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-dark-600 flex items-center justify-center shrink-0">
                    <Mail size={14} className="text-gold-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider">Email</p>
                    <p className="text-white text-sm font-medium truncate">{gym.email}</p>
                  </div>
                  <ExternalLink size={13} className="text-gray-600 group-hover:text-gold-400 transition-colors shrink-0" />
                </a>
              )}
              {gym.website && (
                <a
                  href={gym.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-dark-700 border border-white/8 rounded-xl hover:border-gold-500/30 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-dark-600 flex items-center justify-center shrink-0">
                    <Globe size={14} className="text-gold-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider">Web</p>
                    <p className="text-white text-sm font-medium truncate">{gym.website.replace(/^https?:\/\//, '')}</p>
                  </div>
                  <ExternalLink size={13} className="text-gray-600 group-hover:text-gold-400 transition-colors shrink-0" />
                </a>
              )}
              {!gym.phone && !gym.email && !gym.website && (
                <p className="text-gray-600 text-sm">Sin información de contacto disponible.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        {gym.phone && (
          <div className="px-5 py-4 border-t border-white/8 shrink-0">
            <a
              href={`tel:${gym.phone.replace(/\s/g, '')}`}
              className="flex items-center justify-center gap-2 w-full py-3 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-xl text-sm transition-all"
            >
              <Phone size={15} />
              Llamar al gimnasio
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
