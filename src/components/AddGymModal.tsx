import { useState } from 'react';
import { X, Loader2, MapPin, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  onClose: () => void;
}

interface FormData {
  name: string;
  city: string;
  address: string;
  phone: string;
  website: string;
  description: string;
}

const empty: FormData = { name: '', city: '', address: '', phone: '', website: '', description: '' };

async function geocode(address: string, city: string): Promise<{ lat: number; lng: number } | null> {
  const q = encodeURIComponent(`${address}, ${city}, España`);
  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=es`, {
    headers: { 'Accept-Language': 'es' },
  });
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

export default function AddGymModal({ onClose }: Props) {
  const [form, setForm] = useState<FormData>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const coords = await geocode(form.address, form.city);
      if (!coords) throw new Error('No se pudo geolocalizar la dirección. Comprueba que sea correcta.');

      const { data: { user } } = await supabase.auth.getUser();

      const { error: dbErr } = await supabase.from('gyms').insert({
        name:       form.name.trim(),
        city:       form.city.trim(),
        address:    form.address.trim() || null,
        phone:      form.phone.trim() || null,
        website:    form.website.trim() || null,
        description: form.description.trim() || null,
        latitude:   coords.lat,
        longitude:  coords.lng,
        is_verified: false,
        owner_id:   user?.id ?? null,
      });

      if (dbErr) throw new Error(dbErr.message);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-dark-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-gold-400" />
            <h2 className="text-white font-bold text-sm">Añadir mi gimnasio</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="p-8 flex flex-col items-center gap-3 text-center">
            <CheckCircle size={40} className="text-emerald-400" />
            <p className="text-white font-semibold">¡Gimnasio enviado!</p>
            <p className="text-gray-400 text-sm">Lo revisaremos y aparecerá en el mapa en breve.</p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-xl text-sm transition-all"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-400 mb-1.5 block">Nombre del gimnasio *</label>
                <input
                  value={form.name}
                  onChange={set('name')}
                  required
                  placeholder="BJJ Academy Madrid"
                  className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-gold-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Ciudad *</label>
                <input
                  value={form.city}
                  onChange={set('city')}
                  required
                  placeholder="Madrid"
                  className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-gold-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Teléfono</label>
                <input
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="+34 600 000 000"
                  className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-gold-500/50 transition-colors"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-400 mb-1.5 block">Dirección *</label>
                <input
                  value={form.address}
                  onChange={set('address')}
                  required
                  placeholder="Calle Gran Vía 10, Madrid"
                  className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-gold-500/50 transition-colors"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-400 mb-1.5 block">Sitio web</label>
                <input
                  value={form.website}
                  onChange={set('website')}
                  placeholder="https://mi-academia.es"
                  className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-gold-500/50 transition-colors"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-400 mb-1.5 block">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={set('description')}
                  rows={3}
                  placeholder="Cuéntanos algo sobre tu academia..."
                  className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-gold-500/50 transition-colors resize-none"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2.5 text-red-400 text-xs">
                {error}
              </div>
            )}

            <p className="text-gray-600 text-xs">* El gimnasio será revisado antes de aparecer en el mapa.</p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Enviando...' : 'Enviar gimnasio'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
