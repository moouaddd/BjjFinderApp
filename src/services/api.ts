import { supabase } from '../lib/supabase';
import type { CommunityEvent } from '../data/events';
import type { PrivateInstructor } from '../data/instructors';

// ── Types ────────────────────────────────────────────────────────────────────

export interface OrganizerRequest {
  id: string;
  userId: string;
  message: string | null;
  status: string;
  createdAt: string;
  user?: { id: string; email: string; name: string };
}

export interface GymRecord {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  rating: number | null;
  ratingCount: number | null;
  description: string | null;
  pricePerClass: number | null;
  monthlyFee: number | null;
  scheduleJson: string | null;
  openMatFriday: boolean;
  openMatFridayTime: string | null;
  openMatFridayDuration: string | null;
  openMatSaturday: boolean;
  openMatSaturdayTime: string | null;
  openMatSaturdayDuration: string | null;
  openMatNotes: string | null;
  isVerified: boolean;
  claimedByOwner: boolean;
}

interface GymsResponse {
  total: number;
  page: number;
  limit: number;
  pages: number;
  data: GymRecord[];
}

// ── Mappers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToGym(row: any): GymRecord {
  return {
    id:                   row.id,
    name:                 row.name,
    city:                 row.city ?? '',
    country:              'ES',
    lat:                  row.latitude ?? 0,
    lng:                  row.longitude ?? 0,
    phone:                row.phone ?? null,
    email:                row.email ?? null,
    website:              row.website ?? null,
    address:              row.address ?? null,
    rating:               row.rating ?? null,
    ratingCount:          row.rating_count ?? null,
    description:          null,
    pricePerClass:        null,
    monthlyFee:           null,
    scheduleJson:         null,
    openMatFriday:        row.open_mat_friday ?? false,
    openMatFridayTime:    null,
    openMatFridayDuration: null,
    openMatSaturday:      row.open_mat_saturday ?? false,
    openMatSaturdayTime:  null,
    openMatSaturdayDuration: null,
    openMatNotes:         null,
    isVerified:           false,
    claimedByOwner:       false,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToEvent(row: any): CommunityEvent {
  return {
    id:               row.id,
    type:             row.type,
    title:            row.title,
    organizer:        row.organizer,
    organizerContact: row.organizer_contact,
    gym:              row.gym,
    address:          row.address,
    city:             row.city,
    date:             row.date,
    time:             row.time,
    duration:         row.duration,
    price:            row.price ?? 0,
    category:         row.category,
    modality:         row.modality,
    description:      row.description,
    spotsTotal:       row.spots_total ?? null,
    spotsLeft:        row.spots_left ?? null,
    instructor:       row.instructor ?? undefined,
    instructorBelt:   row.instructor_belt ?? undefined,
    tags:             row.tags ?? [],
    createdAt:        row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToInstructor(row: any): PrivateInstructor {
  return {
    id:              row.id,
    name:            row.name,
    belt:            row.belt,
    stripes:         row.stripes ?? 0,
    team:            row.team,
    city:            row.city,
    gym:             row.gym ?? undefined,
    bio:             row.bio,
    specialties:     row.specialties ?? [],
    modalities:      row.modalities ?? [],
    pricePerHour:    row.price_per_hour,
    pricePerSession: row.price_per_session ?? undefined,
    online:          row.online ?? false,
    inPerson:        row.in_person ?? true,
    instagram:       row.instagram ?? undefined,
    contact:         row.contact,
    experience:      row.experience,
    languages:       row.languages ?? [],
    availability:    row.availability,
    createdAt:       row.created_at,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function supabaseError(error: { message: string }): never {
  throw new Error(error.message);
}

// ── API ───────────────────────────────────────────────────────────────────────

export const api = {

  // ── Gyms ──────────────────────────────────────────────────────────────────

  gyms: {
    list: async (params?: { city?: string; search?: string; limit?: number }): Promise<GymsResponse> => {
      const limit = params?.limit ?? 600;
      let query = supabase
        .from('gyms')
        .select('*', { count: 'exact' })
        .eq('is_verified', true)
        .order('city', { ascending: true })
        .order('name', { ascending: true })
        .limit(limit);

      if (params?.city) {
        query = query.ilike('city', `%${params.city.trim()}%`);
      }
      if (params?.search) {
        const q = params.search.trim();
        query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%`);
      }

      const { data, error, count } = await query;
      if (error) supabaseError(error);

      const gyms = (data ?? []).map(rowToGym);
      return { total: count ?? gyms.length, page: 1, limit, pages: 1, data: gyms };
    },

    get: async (id: string): Promise<GymRecord> => {
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .eq('id', id)
        .single();
      if (error) supabaseError(error);
      return rowToGym(data);
    },

    cities: async (): Promise<{ cities: string[] }> => {
      const { data, error } = await supabase
        .from('gyms')
        .select('city')
        .order('city', { ascending: true });
      if (error) supabaseError(error);
      const cities = [...new Set((data ?? []).map((r: { city: string }) => r.city))].sort((a, b) =>
        a.localeCompare(b, 'es'),
      );
      return { cities };
    },

    // Gym owner features — require gym_profiles table (Phase 2)
    claim: async (_gymId: string, _message?: string): Promise<{ message: string }> => {
      throw new Error('La función de reclamar academia estará disponible próximamente.');
    },

    updateOpenMat: async (_gymId: string, _data: object): Promise<GymRecord> => {
      throw new Error('La edición de open mats estará disponible próximamente.');
    },

    updateProfile: async (_gymId: string, _data: object): Promise<GymRecord> => {
      throw new Error('La edición de perfil estará disponible próximamente.');
    },

    delete: async (_gymId: string): Promise<void> => {
      throw new Error('La eliminación de academias estará disponible próximamente.');
    },

    // Admin: pending gym submissions
    getPending: async (): Promise<GymRecord[]> => {
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .eq('is_verified', false)
        .order('created_at', { ascending: false });
      if (error) supabaseError(error);
      return (data ?? []).map(rowToGym);
    },

    approve: async (gymId: string): Promise<void> => {
      const { error } = await supabase
        .from('gyms')
        .update({ is_verified: true })
        .eq('id', gymId);
      if (error) supabaseError(error);
    },

    reject: async (gymId: string): Promise<void> => {
      const { error } = await supabase
        .from('gyms')
        .delete()
        .eq('id', gymId);
      if (error) supabaseError(error);
    },
  },

  // ── Events ────────────────────────────────────────────────────────────────

  events: {
    list: async (): Promise<CommunityEvent[]> => {
      const { data, error } = await supabase
        .from('community_events')
        .select('*')
        .order('date', { ascending: true });
      if (error) supabaseError(error);
      return (data ?? []).map(rowToEvent);
    },

    create: async (eventData: Omit<CommunityEvent, 'id' | 'createdAt'>): Promise<CommunityEvent> => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('community_events')
        .insert({
          type:             eventData.type,
          title:            eventData.title,
          organizer:        eventData.organizer,
          organizer_contact: eventData.organizerContact,
          organizer_id:     user?.id ?? null,
          gym:              eventData.gym,
          address:          eventData.address,
          city:             eventData.city,
          date:             eventData.date,
          time:             eventData.time,
          duration:         eventData.duration,
          price:            eventData.price,
          category:         eventData.category,
          modality:         eventData.modality,
          description:      eventData.description,
          spots_total:      eventData.spotsTotal,
          spots_left:       eventData.spotsLeft,
          instructor:       eventData.instructor ?? null,
          instructor_belt:  eventData.instructorBelt ?? null,
          tags:             eventData.tags,
        })
        .select()
        .single();
      if (error) supabaseError(error);
      return rowToEvent(data);
    },

    decreaseSpot: async (id: string): Promise<CommunityEvent> => {
      // Read current value then decrement (atomic enough for this use case)
      const { data: current, error: readErr } = await supabase
        .from('community_events')
        .select('spots_left')
        .eq('id', id)
        .single();
      if (readErr) supabaseError(readErr);

      const newSpots = current.spots_left != null ? current.spots_left - 1 : null;
      const { data, error } = await supabase
        .from('community_events')
        .update({ spots_left: newSpots })
        .eq('id', id)
        .select()
        .single();
      if (error) supabaseError(error);
      return rowToEvent(data);
    },

    delete: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('community_events')
        .delete()
        .eq('id', id);
      if (error) supabaseError(error);
    },
  },

  // ── Instructors ───────────────────────────────────────────────────────────

  instructors: {
    list: async (): Promise<PrivateInstructor[]> => {
      const { data, error } = await supabase
        .from('instructors')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) supabaseError(error);
      return (data ?? []).map(rowToInstructor);
    },

    create: async (instructorData: Omit<PrivateInstructor, 'id' | 'createdAt'>): Promise<PrivateInstructor> => {
      const { data, error } = await supabase
        .from('instructors')
        .insert({
          name:             instructorData.name,
          belt:             instructorData.belt,
          stripes:          instructorData.stripes,
          team:             instructorData.team,
          city:             instructorData.city,
          gym:              instructorData.gym ?? null,
          bio:              instructorData.bio,
          specialties:      instructorData.specialties,
          modalities:       instructorData.modalities,
          price_per_hour:   instructorData.pricePerHour,
          price_per_session: instructorData.pricePerSession ?? null,
          online:           instructorData.online,
          in_person:        instructorData.inPerson,
          instagram:        instructorData.instagram ?? null,
          contact:          instructorData.contact,
          experience:       instructorData.experience,
          languages:        instructorData.languages,
          availability:     instructorData.availability,
        })
        .select()
        .single();
      if (error) supabaseError(error);
      return rowToInstructor(data);
    },

    delete: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('instructors')
        .delete()
        .eq('id', id);
      if (error) supabaseError(error);
    },
  },

  // ── Organizers ────────────────────────────────────────────────────────────

  organizers: {
    myRequest: async (): Promise<OrganizerRequest | null> => null,
    submitRequest: async (_message?: string): Promise<OrganizerRequest> => {
      throw new Error('Función no disponible todavía.');
    },
  },

  // ── SEO ───────────────────────────────────────────────────────────────────

  seo: {
    city: async (slug: string) => {
      // Derive SEO content from Supabase gym data
      const { data, error } = await supabase
        .from('gyms')
        .select('name,city,rating')
        .order('rating', { ascending: false, nullsFirst: false });
      if (error) supabaseError(error);

      const gyms = (data ?? []) as { name: string; city: string; rating: number | null }[];

      function toSlug(str: string) {
        return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }

      const cityGyms = gyms.filter((g) => toSlug(g.city) === slug);
      if (cityGyms.length === 0) throw new Error('City not found');

      const cityName = cityGyms[0].city;
      const bestRated = cityGyms.find((g) => g.rating != null) ?? null;

      return {
        city: cityName,
        slug,
        count: cityGyms.length,
        intro: `Encuentra academias de Brazilian Jiu-Jitsu en ${cityName}. ${cityGyms.length} ${cityGyms.length === 1 ? 'academia' : 'academias'} disponibles.`,
        training: `Entrena BJJ en ${cityName} con instructores certificados.`,
        faqs: [],
        bestRated: bestRated ? { name: bestRated.name, rating: bestRated.rating, address: null } : null,
      };
    },
  },

  // ── Admin ─────────────────────────────────────────────────────────────────

  admin: {
    getClaims: async (): Promise<unknown[]> => [],
    approveClaim: async (_id: string): Promise<{ ok: boolean }> => ({ ok: false }),
    rejectClaim: async (_id: string): Promise<{ ok: boolean }> => ({ ok: false }),

    getStats: async () => {
      const [eventsRes, instructorsRes, pendingGymsRes] = await Promise.allSettled([
        supabase.from('community_events').select('*', { count: 'exact', head: true }),
        supabase.from('instructors').select('*', { count: 'exact', head: true }),
        supabase.from('gyms').select('*', { count: 'exact', head: true }).eq('is_verified', false),
      ]);
      return {
        users: 0,
        pendingClaims: 0,
        approvedClaims: 0,
        claimedGyms: 0,
        pendingOrganizers: 0,
        pendingGyms: pendingGymsRes.status === 'fulfilled' ? (pendingGymsRes.value.count ?? 0) : 0,
        events: eventsRes.status === 'fulfilled' ? (eventsRes.value.count ?? 0) : 0,
        instructors: instructorsRes.status === 'fulfilled' ? (instructorsRes.value.count ?? 0) : 0,
      };
    },

    getOrganizerRequests: async (): Promise<OrganizerRequest[]> => [],
    approveOrganizerRequest: async (_id: string): Promise<{ ok: boolean }> => ({ ok: false }),
    rejectOrganizerRequest: async (_id: string): Promise<{ ok: boolean }> => ({ ok: false }),
  },
};
