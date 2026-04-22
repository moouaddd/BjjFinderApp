/**
 * Seeds community_events and instructors tables in Supabase.
 * Run: node scripts/03-seed-events-instructors.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Seed events ───────────────────────────────────────────────────────────────

const events = [
  { id: 'evt-001', type: 'openmat', title: 'Open Mat Femenino — Madrid', organizer: 'Laura Sánchez', organizer_contact: '@bjj_femenino_madrid', gym: 'Checkmat BJJ Madrid', address: 'Calle Gran Vía 45, Madrid', city: 'Madrid', date: '2026-05-26', time: '11:00', duration: '2 horas', price: 0, category: 'femenino', modality: 'gi', description: 'Open mat exclusivo para mujeres de todos los niveles.', spots_total: 30, spots_left: 14, tags: ['Femenino', 'Todos los Niveles', 'Gi'] },
  { id: 'evt-002', type: 'openmat', title: 'Open Mat Competidores — Barcelona', organizer: 'Club BJJ Barcelona', organizer_contact: 'competicion@bjjbcn.es', gym: 'New Breed Academy Barcelona', address: 'Carrer de Mallorca 234, Barcelona', city: 'Barcelona', date: '2026-05-25', time: '10:00', duration: '3 horas', price: 10, category: 'competidores', modality: 'ambos', description: 'Sesión de entrenamiento intensiva para competidores.', spots_total: 40, spots_left: 22, tags: ['Competición', 'Gi', 'No-Gi', 'Avanzado'] },
  { id: 'evt-003', type: 'openmat', title: 'Open Mat Kids — Valencia', organizer: 'Academia Infantil Valencia', organizer_contact: '@bjj_kids_valencia', gym: 'Valencia BJJ Academy', address: 'Avinguda del Regne de València 12, Valencia', city: 'Valencia', date: '2026-05-27', time: '12:00', duration: '90 min', price: 0, category: 'kids', modality: 'gi', description: 'Open mat para niños y niñas de 5 a 14 años.', spots_total: 20, spots_left: 8, tags: ['Kids', 'Principiantes', 'Gi', 'Familiar'] },
  { id: 'evt-004', type: 'seminario', title: 'Seminario de Leg Locks — Nivel Básico', organizer: 'Pedro Alves', organizer_contact: 'pedro@bjjsevilla.com', instructor: 'Pedro Alves', instructor_belt: 'Negro', gym: 'Alliance BJJ Sevilla', address: 'Calle Sierpes 8, Sevilla', city: 'Sevilla', date: '2026-06-03', time: '10:00', duration: '3 horas', price: 60, category: 'mixto', modality: 'nogi', description: 'Introducción completa al juego de leg locks.', spots_total: 25, spots_left: 11, tags: ['Leg Locks', 'No-Gi', 'Seguridad'] },
  { id: 'evt-005', type: 'openmat', title: 'Open Mat Masters (40+) — Bilbao', organizer: 'Bilbao BJJ Masters', organizer_contact: '@bjj_masters_bilbao', gym: 'Bilbao BJJ Club', address: 'Calle Gran Vía 1, Bilbao', city: 'Bilbao', date: '2026-06-02', time: '10:30', duration: '2 horas', price: 5, category: 'masters', modality: 'gi', description: 'Open mat para practicantes de 40 años en adelante.', spots_total: null, spots_left: null, tags: ['Masters', 'Gi', 'Todos los Niveles', 'Técnica'] },
  { id: 'evt-006', type: 'seminario', title: 'Clínica de Guard Passing — Sevilla', organizer: 'José Morales', organizer_contact: '@josemorales_bjj', instructor: 'José Morales', instructor_belt: 'Marrón', gym: 'Checkmat BJJ Sevilla', address: 'Av. de la Constitución 23, Sevilla', city: 'Sevilla', date: '2026-06-10', time: '11:00', duration: '2.5 horas', price: 45, category: 'mixto', modality: 'gi', description: 'Clínica enfocada en pasar la guardia de forma efectiva.', spots_total: 20, spots_left: 7, tags: ['Guard Passing', 'Gi', 'Técnica'] },
];

// ── Seed instructors ──────────────────────────────────────────────────────────

const instructors = [
  { id: 'ins-001', name: 'Carlos Martín', belt: 'negro', stripes: 2, team: 'Alliance', city: 'Madrid', gym: 'Alliance BJJ Madrid', bio: 'Cinturón negro con más de 12 años en BJJ. Campeón nacional en múltiples ocasiones.', specialties: ['Guard', 'Competición', 'Back Takes', 'Wrestling'], modalities: ['gi', 'nogi'], price_per_hour: 45, price_per_session: 65, online: true, in_person: true, instagram: '@carlosmartin_bjj', contact: 'carlosmartin.bjj@gmail.com', experience: '12 años, CN 2 rayas', languages: ['Español', 'Inglés'], availability: 'Tardes entre semana, sábados por la mañana' },
  { id: 'ins-002', name: 'Ana García', belt: 'negro', stripes: 1, team: 'Gracie Barra', city: 'Barcelona', gym: 'Gracie Barra Barcelona', bio: 'Primera cinturón negro femenina de Cataluña.', specialties: ['Fundamentos', 'Defensa Personal', 'Guard', 'Self-Defense'], modalities: ['gi', 'nogi'], price_per_hour: 40, price_per_session: 55, online: true, in_person: true, instagram: '@anagarcia_bjj', contact: 'ana.garcia.bjj@gmail.com', experience: '10 años, CN 1 raya', languages: ['Español', 'Catalán', 'Inglés'], availability: 'Mañanas (9:00–13:00), fines de semana' },
  { id: 'ins-003', name: 'Miguel Santos', belt: 'marrón', stripes: 3, team: 'Checkmat', city: 'Valencia', gym: 'Checkmat BJJ Valencia', bio: 'Cinturón marrón con experiencia en competición europea.', specialties: ['Leg Locks', 'Wrestling', 'No-Gi', 'Preparación Competición'], modalities: ['nogi', 'gi'], price_per_hour: 35, price_per_session: 50, online: false, in_person: true, instagram: '@miguelsantos_bjj', contact: 'miguel.santos.grappling@gmail.com', experience: '7 años, Marrón 3 rayas', languages: ['Español', 'Portugués'], availability: 'Tardes entre semana, domingos por la mañana' },
  { id: 'ins-004', name: 'Fatima Okonkwo', belt: 'morado', stripes: 4, team: 'New Breed', city: 'Sevilla', bio: 'Especializada en fundamentos y BJJ para principiantes.', specialties: ['Fundamentos', 'Principiantes', 'Guard', 'Submissions'], modalities: ['gi'], price_per_hour: 30, online: true, in_person: true, instagram: '@fatima_bjj_sevilla', contact: 'fatima.okonkwo.bjj@gmail.com', experience: '5 años, Morado 4 rayas', languages: ['Español', 'Inglés', 'Francés'], availability: 'Flexible, principalmente fines de semana y tardes' },
  { id: 'ins-005', name: 'Roberto Fernández', belt: 'negro', stripes: 0, team: 'Independent', city: 'Bilbao', gym: 'Bilbao BJJ Club', bio: 'Ex competidor de lucha olímpica reconvertido al BJJ.', specialties: ['Wrestling', 'Takedowns', 'Judo', 'Juego de Pie'], modalities: ['gi', 'nogi'], price_per_hour: 40, price_per_session: 55, online: true, in_person: true, instagram: '@roberto_wrestling_bjj', contact: 'rfernandez.bjj@gmail.com', experience: '6 años BJJ + 15 años lucha olímpica, CN', languages: ['Español', 'Euskera'], availability: 'Mañanas entre semana, fines de semana' },
  { id: 'ins-006', name: 'Diego Ramírez', belt: 'azul', stripes: 4, team: 'Gracie Humaitá', city: 'Zaragoza', bio: 'Azul 4 rayas con fuerte base competitiva.', specialties: ['Fundamentos', 'Escapes', 'Posiciones Básicas', 'Competición Regional'], modalities: ['gi'], price_per_hour: 25, online: false, in_person: true, instagram: '@diegoramirez_bjj', contact: 'diego.ramirez.bjj@gmail.com', experience: '4 años, Azul 4 rayas, 8 podios regionales', languages: ['Español'], availability: 'Tardes y fines de semana' },
];

// ── Insert ────────────────────────────────────────────────────────────────────

async function seed(table, rows, label) {
  console.log(`\nSeeding ${label}…`);
  const { data, error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
    .select('id');
  if (error) {
    console.error(`  ❌ Error:`, error.message);
  } else {
    console.log(`  ✅ ${data?.length ?? 0} rows inserted`);
  }
}

await seed('community_events', events, 'community_events');
await seed('instructors', instructors, 'instructors');
console.log('\nDone.');
