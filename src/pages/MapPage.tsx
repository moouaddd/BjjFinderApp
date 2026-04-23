import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Marker } from 'react-leaflet';
import { MapPin, Phone, Globe, Star, X, Loader2, LocateFixed, PlusCircle } from 'lucide-react';
import { api, type GymRecord } from '../services/api';
import AddGymModal from '../components/AddGymModal';
import L from 'leaflet';

function MapFlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 14, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 3px rgba(59,130,246,0.4)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function GymPopup({ gym, onClose }: { gym: GymRecord; onClose: () => void }) {
  return (
    <div
      className="fixed right-4 top-20 z-[1000] w-80 bg-dark-700 border border-gold-500/30 rounded-2xl shadow-2xl overflow-hidden"
      style={{ maxHeight: 'calc(100vh - 100px)' }}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-dark-800 border-b border-white/5">
        <div>
          <p className="text-white font-bold text-sm leading-tight">{gym.name}</p>
          <p className="text-gold-400 text-xs">{gym.city}</p>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(100vh - 180px)' }}>
        {gym.address && (
          <div className="flex items-start gap-2 text-xs text-gray-400">
            <MapPin size={13} className="text-gold-500/70 mt-0.5 shrink-0" />
            <span>{gym.address}</span>
          </div>
        )}
        {gym.phone && (
          <a
            href={`tel:${gym.phone.replace(/\s/g, '')}`}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-gold-400 transition-colors"
          >
            <Phone size={13} className="text-gold-500/70 shrink-0" />
            {gym.phone}
          </a>
        )}
        {gym.rating && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Star size={13} className="text-yellow-400 shrink-0" fill="currentColor" />
            <span>{gym.rating} {gym.ratingCount ? `(${gym.ratingCount} reseñas)` : ''}</span>
          </div>
        )}
        {gym.website && (
          <a
            href={gym.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-gold-400 transition-colors"
          >
            <Globe size={13} className="text-gold-500/70 shrink-0" />
            Visitar sitio web
          </a>
        )}
        {!gym.phone && !gym.email && !gym.website && !gym.address && (
          <p className="text-gray-600 text-xs italic">Sin datos de contacto disponibles</p>
        )}
      </div>
    </div>
  );
}

export default function MapPage() {
  const [gyms, setGyms] = useState<GymRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGym, setSelectedGym] = useState<GymRecord | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [showAddGym, setShowAddGym] = useState(false);

  const fetchGyms = useCallback(async () => {
    try {
      const res = await api.gyms.list({ limit: 600 });
      setGyms(res.data);
    } catch {
      // map still renders, just empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGyms(); }, [fetchGyms]);

  const handleMarkerClick = (gym: GymRecord) => {
    setSelectedGym(gym);
    setFlyTarget({ lat: gym.lat, lng: gym.lng });
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocError('Tu navegador no soporta geolocalización');
      return;
    }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude };
        setUserPos(pos);
        setFlyTarget(pos);
        setLocating(false);
      },
      () => {
        setLocError('No se pudo obtener tu ubicación');
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="bg-dark-800 border-b border-white/5 px-4 sm:px-8 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-white font-bold text-xl">Mapa de Academias BJJ</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {loading ? 'Cargando...' : `${gyms.length} academias en España`} · Haz clic en un punto para ver info
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLocate}
            disabled={locating}
            className="flex items-center gap-2 text-xs bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-lg px-3 py-2 transition-all disabled:opacity-50"
          >
            {locating ? <Loader2 size={13} className="animate-spin" /> : <LocateFixed size={13} />}
            {userPos ? 'Mi ubicación' : 'Activar ubicación'}
          </button>
          <button
            onClick={() => setShowAddGym(true)}
            className="flex items-center gap-2 text-xs bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/30 text-gold-400 rounded-lg px-3 py-2 transition-all"
          >
            <PlusCircle size={13} />
            Añadir gimnasio
          </button>
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-dark-700 border border-white/8 rounded-lg px-3 py-2">
            <span className="w-3 h-3 rounded-full bg-gold-500 pulse-gold inline-block" />
            Academia BJJ
          </div>
        </div>
      </div>

      {locError && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-red-400 text-xs text-center shrink-0">
          {locError}
        </div>
      )}

      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        {loading && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-dark-900/80">
            <Loader2 size={32} className="animate-spin text-gold-500" />
          </div>
        )}

        <MapContainer
          center={[40.0, -3.5]}
          zoom={6}
          style={{ height: '100%', width: '100%', position: 'absolute', inset: 0 }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {flyTarget && <MapFlyTo lat={flyTarget.lat} lng={flyTarget.lng} />}

          {userPos && (
            <Marker position={[userPos.lat, userPos.lng]} icon={userIcon} />
          )}

          {gyms.map((gym) => (
            <CircleMarker
              key={gym.id}
              center={[gym.lat, gym.lng]}
              radius={selectedGym?.id === gym.id ? 12 : 7}
              pathOptions={{
                color: selectedGym?.id === gym.id ? '#f5c842' : '#e6b800',
                fillColor: selectedGym?.id === gym.id ? '#f5c842' : '#e6b800',
                fillOpacity: selectedGym?.id === gym.id ? 1 : 0.75,
                weight: selectedGym?.id === gym.id ? 3 : 1,
              }}
              eventHandlers={{ click: () => handleMarkerClick(gym) }}
            >
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong style={{ color: '#fff', fontSize: 13 }}>{gym.name}</strong>
                  <br />
                  <span style={{ color: '#e6b800', fontSize: 11 }}>{gym.city}</span>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {selectedGym && (
          <GymPopup gym={selectedGym} onClose={() => { setSelectedGym(null); setFlyTarget(null); }} />
        )}

        {showAddGym && <AddGymModal onClose={() => setShowAddGym(false)} />}

        {!selectedGym && !loading && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-dark-800/90 border border-white/10 backdrop-blur-sm rounded-full px-5 py-2.5 text-xs text-gray-400 pointer-events-none z-[500]">
            Haz clic en cualquier punto dorado para ver la info del gimnasio
          </div>
        )}
      </div>
    </div>
  );
}
