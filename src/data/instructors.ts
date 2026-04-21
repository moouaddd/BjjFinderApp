export type BeltColor = 'azul' | 'morado' | 'marrón' | 'negro';
export type ClassModality = 'gi' | 'nogi' | 'ambos';

export interface PrivateInstructor {
  id: string;
  name: string;
  belt: BeltColor;
  stripes: number;
  team: string;
  city: string;
  gym?: string;
  bio: string;
  specialties: string[];
  modalities: ClassModality[];
  pricePerHour: number;
  pricePerSession?: number;
  online: boolean;
  inPerson: boolean;
  instagram?: string;
  contact: string;
  experience: string;
  languages: string[];
  availability: string;
  createdAt: string;
}

export const beltDisplay: Record<BeltColor, { bg: string; border: string; label: string }> = {
  azul: {
    bg: 'bg-blue-600',
    border: 'border-blue-500',
    label: 'Cinturón Azul',
  },
  morado: {
    bg: 'bg-purple-600',
    border: 'border-purple-500',
    label: 'Cinturón Morado',
  },
  marrón: {
    bg: 'bg-amber-800',
    border: 'border-amber-700',
    label: 'Cinturón Marrón',
  },
  negro: {
    bg: 'bg-gray-900',
    border: 'border-white/30',
    label: 'Cinturón Negro',
  },
};

export const INSTRUCTOR_CITIES = [
  'Todas', 'Madrid', 'Barcelona', 'Valencia', 'Sevilla',
  'Bilbao', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas',
];

export const seedInstructors: PrivateInstructor[] = [
  {
    id: 'ins-001',
    name: 'Carlos Martín',
    belt: 'negro',
    stripes: 2,
    team: 'Alliance',
    city: 'Madrid',
    gym: 'Alliance BJJ Madrid',
    bio: 'Cinturón negro con más de 12 años en BJJ. Campeón nacional en múltiples ocasiones. Especializado en guard work y preparación de competidores.',
    specialties: ['Guard', 'Competición', 'Back Takes', 'Wrestling'],
    modalities: ['gi', 'nogi'],
    pricePerHour: 45,
    pricePerSession: 65,
    online: true,
    inPerson: true,
    instagram: '@carlosmartin_bjj',
    contact: 'carlosmartin.bjj@gmail.com',
    experience: '12 años, CN 2 rayas',
    languages: ['Español', 'Inglés'],
    availability: 'Tardes entre semana, sábados por la mañana',
    createdAt: '2026-03-15T10:00:00Z',
  },
  {
    id: 'ins-002',
    name: 'Ana García',
    belt: 'negro',
    stripes: 1,
    team: 'Gracie Barra',
    city: 'Barcelona',
    gym: 'Gracie Barra Barcelona',
    bio: 'Primera cinturón negro femenina de Cataluña. Especializada en BJJ femenino, defensa personal y fundamentos. 8 años de experiencia docente.',
    specialties: ['Fundamentos', 'Defensa Personal', 'Guard', 'Self-Defense'],
    modalities: ['gi', 'nogi'],
    pricePerHour: 40,
    pricePerSession: 55,
    online: true,
    inPerson: true,
    instagram: '@anagarcia_bjj',
    contact: 'ana.garcia.bjj@gmail.com',
    experience: '10 años, CN 1 raya',
    languages: ['Español', 'Catalán', 'Inglés'],
    availability: 'Mañanas (9:00–13:00), fines de semana',
    createdAt: '2026-03-20T11:00:00Z',
  },
  {
    id: 'ins-003',
    name: 'Miguel Santos',
    belt: 'marrón',
    stripes: 3,
    team: 'Checkmat',
    city: 'Valencia',
    gym: 'Checkmat BJJ Valencia',
    bio: 'Cinturón marrón con experiencia en competición europea. Especializado en preparación de competidores y juego No-Gi moderno.',
    specialties: ['Leg Locks', 'Wrestling', 'No-Gi', 'Preparación Competición'],
    modalities: ['nogi', 'gi'],
    pricePerHour: 35,
    pricePerSession: 50,
    online: false,
    inPerson: true,
    instagram: '@miguelsantos_bjj',
    contact: 'miguel.santos.grappling@gmail.com',
    experience: '7 años, Marrón 3 rayas',
    languages: ['Español', 'Portugués'],
    availability: 'Tardes entre semana, domingos por la mañana',
    createdAt: '2026-03-25T09:00:00Z',
  },
  {
    id: 'ins-004',
    name: 'Fatima Okonkwo',
    belt: 'morado',
    stripes: 4,
    team: 'New Breed',
    city: 'Sevilla',
    bio: 'Especializada en fundamentos y BJJ para principiantes. Enfoque técnico y pedagógico. Disponible para clases online y presenciales en Sevilla.',
    specialties: ['Fundamentos', 'Principiantes', 'Guard', 'Submissions'],
    modalities: ['gi'],
    pricePerHour: 30,
    online: true,
    inPerson: true,
    instagram: '@fatima_bjj_sevilla',
    contact: 'fatima.okonkwo.bjj@gmail.com',
    experience: '5 años, Morado 4 rayas',
    languages: ['Español', 'Inglés', 'Francés'],
    availability: 'Flexible, principalmente fines de semana y tardes',
    createdAt: '2026-04-01T14:00:00Z',
  },
  {
    id: 'ins-005',
    name: 'Roberto Fernández',
    belt: 'negro',
    stripes: 0,
    team: 'Independent',
    city: 'Bilbao',
    gym: 'Bilbao BJJ Club',
    bio: 'Ex competidor de lucha olímpica reconvertido al BJJ. Especializado en takedowns, wrestling y el juego de pie. Gran base en deportes de combate.',
    specialties: ['Wrestling', 'Takedowns', 'Judo', 'Juego de Pie'],
    modalities: ['gi', 'nogi'],
    pricePerHour: 40,
    pricePerSession: 55,
    online: true,
    inPerson: true,
    instagram: '@roberto_wrestling_bjj',
    contact: 'rfernandez.bjj@gmail.com',
    experience: '6 años BJJ + 15 años lucha olímpica, CN',
    languages: ['Español', 'Euskera'],
    availability: 'Mañanas entre semana, fines de semana',
    createdAt: '2026-04-05T10:00:00Z',
  },
  {
    id: 'ins-006',
    name: 'Diego Ramírez',
    belt: 'azul',
    stripes: 4,
    team: 'Gracie Humaitá',
    city: 'Zaragoza',
    bio: 'Azul 4 rayas con fuerte base competitiva. Ganador de múltiples torneos regionales. Clases para principiantes y nivel intermedio. Muy recomendado para quienes empiezan.',
    specialties: ['Fundamentos', 'Escapes', 'Posiciones Básicas', 'Competición Regional'],
    modalities: ['gi'],
    pricePerHour: 25,
    online: false,
    inPerson: true,
    instagram: '@diegoramirez_bjj',
    contact: 'diego.ramirez.bjj@gmail.com',
    experience: '4 años, Azul 4 rayas, 8 podios regionales',
    languages: ['Español'],
    availability: 'Tardes y fines de semana',
    createdAt: '2026-04-10T10:00:00Z',
  },
];
