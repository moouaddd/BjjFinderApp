export type CommunityEventType = 'openmat' | 'seminario' | 'campamento';
export type EventCategory = 'mixto' | 'femenino' | 'kids' | 'masters' | 'competidores';
export type EventModality = 'gi' | 'nogi' | 'ambos';

export interface CommunityEvent {
  id: string;
  type: CommunityEventType;
  title: string;
  organizer: string;
  organizerContact: string;
  gym: string;
  address: string;
  city: string;
  date: string;
  time: string;
  duration: string;
  price: number;
  category: EventCategory;
  modality: EventModality;
  description: string;
  spotsTotal: number | null;
  spotsLeft: number | null;
  instructor?: string;
  instructorBelt?: string;
  tags: string[];
  createdAt: string;
}

export const EVENT_CITIES = [
  'Todas', 'Madrid', 'Barcelona', 'Valencia', 'Sevilla',
  'Bilbao', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas',
];

export const categoryLabels: Record<EventCategory, string> = {
  mixto: 'Mixto',
  femenino: 'Femenino',
  kids: 'Kids',
  masters: 'Masters 40+',
  competidores: 'Competidores',
};

export const categoryColors: Record<EventCategory, string> = {
  mixto: 'bg-gray-700/80 text-gray-300',
  femenino: 'bg-rose-900/60 text-rose-300 border border-rose-500/30',
  kids: 'bg-orange-900/60 text-orange-300 border border-orange-500/30',
  masters: 'bg-purple-900/60 text-purple-300 border border-purple-500/30',
  competidores: 'bg-red-900/60 text-red-300 border border-red-500/30',
};

export const modalityLabels: Record<EventModality, string> = {
  gi: 'Gi',
  nogi: 'No-Gi',
  ambos: 'Gi + No-Gi',
};

export const seedEvents: CommunityEvent[] = [  // vacío — solo datos reales
  {
    id: 'evt-001',
    type: 'openmat',
    title: 'Open Mat Femenino — Madrid',
    organizer: 'Laura Sánchez',
    organizerContact: '@bjj_femenino_madrid',
    gym: 'Checkmat BJJ Madrid',
    address: 'Calle Gran Vía 45, Madrid',
    city: 'Madrid',
    date: '2026-04-26',
    time: '11:00',
    duration: '2 horas',
    price: 0,
    category: 'femenino',
    modality: 'gi',
    description:
      'Open mat exclusivo para mujeres de todos los niveles. Ven a practicar, conocer compañeras y disfrutar del jiu-jitsu en un ambiente seguro y divertido. Sin importar tu cinturón, todas son bienvenidas.',
    spotsTotal: 30,
    spotsLeft: 14,
    tags: ['Femenino', 'Todos los Niveles', 'Gi'],
    createdAt: '2026-04-10T10:00:00Z',
  },
  {
    id: 'evt-002',
    type: 'openmat',
    title: 'Open Mat Competidores — Barcelona',
    organizer: 'Club BJJ Barcelona',
    organizerContact: 'competicion@bjjbcn.es',
    gym: 'New Breed Academy Barcelona',
    address: 'Carrer de Mallorca 234, Barcelona',
    city: 'Barcelona',
    date: '2026-04-25',
    time: '10:00',
    duration: '3 horas',
    price: 10,
    category: 'competidores',
    modality: 'ambos',
    description:
      'Sesión de entrenamiento intensiva para competidores. Rounds de 5 y 8 minutos. Gi y No-Gi. Árbitros presentes para práctica con reglamento. Nivel recomendado: azul en adelante.',
    spotsTotal: 40,
    spotsLeft: 22,
    tags: ['Competición', 'Gi', 'No-Gi', 'Avanzado'],
    createdAt: '2026-04-08T12:00:00Z',
  },
  {
    id: 'evt-003',
    type: 'openmat',
    title: 'Open Mat Kids — Valencia',
    organizer: 'Academia Infantil Valencia',
    organizerContact: '@bjj_kids_valencia',
    gym: 'Valencia BJJ Academy',
    address: 'Avinguda del Regne de València 12, Valencia',
    city: 'Valencia',
    date: '2026-04-27',
    time: '12:00',
    duration: '90 min',
    price: 0,
    category: 'kids',
    modality: 'gi',
    description:
      'Open mat para niños y niñas de 5 a 14 años. Ambiente supervisado y divertido. Padres bienvenidos a ver. Traed el quimono.',
    spotsTotal: 20,
    spotsLeft: 8,
    tags: ['Kids', 'Principiantes', 'Gi', 'Familiar'],
    createdAt: '2026-04-09T09:00:00Z',
  },
  {
    id: 'evt-004',
    type: 'seminario',
    title: 'Seminario de Leg Locks — Nivel Básico',
    organizer: 'Pedro Alves',
    organizerContact: 'pedro@bjjsevilla.com',
    instructor: 'Pedro Alves',
    instructorBelt: 'Negro',
    gym: 'Alliance BJJ Sevilla',
    address: 'Calle Sierpes 8, Sevilla',
    city: 'Sevilla',
    date: '2026-05-03',
    time: '10:00',
    duration: '3 horas',
    price: 60,
    category: 'mixto',
    modality: 'nogi',
    description:
      'Introducción completa al juego de leg locks. Heel hooks, kneebars y ankle locks. Énfasis en seguridad y control. No-Gi. Nivel: azul en adelante.',
    spotsTotal: 25,
    spotsLeft: 11,
    tags: ['Leg Locks', 'No-Gi', 'Seguridad'],
    createdAt: '2026-04-11T15:00:00Z',
  },
  {
    id: 'evt-005',
    type: 'openmat',
    title: 'Open Mat Masters (40+) — Bilbao',
    organizer: 'Bilbao BJJ Masters',
    organizerContact: '@bjj_masters_bilbao',
    gym: 'Bilbao BJJ Club',
    address: 'Calle Gran Vía 1, Bilbao',
    city: 'Bilbao',
    date: '2026-05-02',
    time: '10:30',
    duration: '2 horas',
    price: 5,
    category: 'masters',
    modality: 'gi',
    description:
      'Open mat para practicantes de 40 años en adelante. Ritmo controlado, técnica y disfrute. Sin ego, buen ambiente. Nivel mixto.',
    spotsTotal: null,
    spotsLeft: null,
    tags: ['Masters', 'Gi', 'Todos los Niveles', 'Técnica'],
    createdAt: '2026-04-12T08:00:00Z',
  },
  {
    id: 'evt-006',
    type: 'seminario',
    title: 'Clínica de Guard Passing — Sevilla',
    organizer: 'José Morales',
    organizerContact: '@josemorales_bjj',
    instructor: 'José Morales',
    instructorBelt: 'Marrón',
    gym: 'Checkmat BJJ Sevilla',
    address: 'Av. de la Constitución 23, Sevilla',
    city: 'Sevilla',
    date: '2026-05-10',
    time: '11:00',
    duration: '2.5 horas',
    price: 45,
    category: 'mixto',
    modality: 'gi',
    description:
      'Clínica enfocada en pasar la guardia de forma efectiva. Toreando, knee slice, double under y leg weave. Gi únicamente. Todos los niveles bienvenidos.',
    spotsTotal: 20,
    spotsLeft: 7,
    tags: ['Guard Passing', 'Gi', 'Técnica'],
    createdAt: '2026-04-13T11:00:00Z',
  },
];
