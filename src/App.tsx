import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MapPage from './pages/MapPage';
import OpenMats from './pages/OpenMats';
import Seminars from './pages/Seminars';
import Reserve from './pages/Reserve';
import Eventos from './pages/Eventos';
import Instructores from './pages/Instructores';
import Login from './pages/Login';
import OwnerDashboard from './pages/OwnerDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AdminPanel from './pages/AdminPanel';
import CityPage from './pages/CityPage';
import CityIndex from './pages/CityIndex';
import CityOpenMats from './pages/CityOpenMats';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-dark-900">
          <Navbar />
          <main className="pt-16">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/mapa" element={<MapPage />} />
              <Route path="/openmats" element={<OpenMats />} />
              <Route path="/seminarios" element={<Seminars />} />
              <Route path="/reservar" element={<Reserve />} />
              <Route path="/eventos" element={<Eventos />} />
              <Route path="/instructores" element={<Instructores />} />
              <Route path="/login" element={<Login />} />
              <Route path="/mi-academia" element={<OwnerDashboard />} />
              <Route path="/mis-eventos" element={<OrganizerDashboard />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/academias-bjj-espana" element={<CityIndex />} />
              <Route path="/bjj-:ciudad" element={<CityPage />} />
              <Route path="/horarios/:slug" element={<CityOpenMats />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
