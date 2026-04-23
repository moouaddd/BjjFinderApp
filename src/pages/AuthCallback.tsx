import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase v2 PKCE: detecta el ?code= en la URL y canjea la sesión automáticamente.
    // onAuthStateChange dispara SIGNED_IN cuando termina.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/', { replace: true });
      }
      if (event === 'SIGNED_OUT') {
        navigate('/login', { replace: true });
      }
    });

    // Seguridad: si en 8 s no hay sesión, algo falló
    const timeout = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/', { replace: true });
      } else {
        setError('No se pudo completar el inicio de sesión. Inténtalo de nuevo.');
      }
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={() => navigate('/login')}
          className="text-gold-400 hover:text-gold-300 text-sm underline"
        >
          Volver al login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <Loader2 size={32} className="animate-spin text-gold-500" />
      <p className="text-gray-400 text-sm">Iniciando sesión...</p>
    </div>
  );
}
