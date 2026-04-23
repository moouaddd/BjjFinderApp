import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogIn, LogOut, ShieldCheck, Building2, ChevronDown, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Horarios' },
  { to: '/mapa', label: 'Mapa' },
  { to: '/openmats', label: 'Open Mats' },
  { to: '/seminarios', label: 'Seminarios' },
  { to: '/eventos', label: 'Eventos' },
  { to: '/instructores', label: 'Instructores' },
  { to: '/reservar', label: 'Reservar' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, isAdmin, isOwner, isOrganizer } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/30">
              <span className="text-black font-black text-sm tracking-tighter">BJJ</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-white font-bold text-sm tracking-wide">DOJO FINDER</span>
              <span className="text-gold-500 font-medium text-[10px] tracking-widest uppercase">España</span>
            </div>
          </NavLink>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Auth area */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-700 border border-white/10 hover:border-white/20 transition-all"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gold-500/20 flex items-center justify-center">
                      <span className="text-gold-400 text-xs font-bold">{user.name[0]?.toUpperCase()}</span>
                    </div>
                  )}
                  <span className="text-white text-xs font-medium max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown size={12} className="text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-dark-700 border border-white/10 rounded-xl shadow-xl overflow-hidden">
                    {isOrganizer && (
                      <button
                        onClick={() => { navigate('/mis-eventos'); setUserMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Star size={14} className="text-purple-400" />
                        Mis Eventos
                      </button>
                    )}
                    {(isOwner || isAdmin) && (
                      <button
                        onClick={() => { navigate('/mi-academia'); setUserMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Building2 size={14} className="text-gold-400" />
                        Mi Academia
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => { navigate('/admin'); setUserMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <ShieldCheck size={14} className="text-emerald-400" />
                        Admin Panel
                      </button>
                    )}
                    <div className="border-t border-white/8" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                    >
                      <LogOut size={14} />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                to="/login"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-400 text-[13px] font-medium hover:bg-gold-500/20 transition-all"
              >
                <LogIn size={14} />
                Acceder
              </NavLink>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Menú"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-dark-800 border-t border-white/5 px-4 py-3 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'bg-gold-500/15 text-gold-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <div className="border-t border-white/5 pt-2 mt-2">
            {user ? (
              <>
                {isOrganizer && (
                  <NavLink to="/mis-eventos" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-white">
                    <Star size={14} />Mis Eventos
                  </NavLink>
                )}
                {(isOwner || isAdmin) && (
                  <NavLink to="/mi-academia" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-white">
                    <Building2 size={14} />Mi Academia
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-white">
                    <ShieldCheck size={14} />Admin Panel
                  </NavLink>
                )}
                <button onClick={() => { handleLogout(); setOpen(false); }} className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-red-400 w-full">
                  <LogOut size={14} />Cerrar sesión
                </button>
              </>
            ) : (
              <NavLink to="/login" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm text-gold-400">
                <LogIn size={14} />Acceder / Registrarse
              </NavLink>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
