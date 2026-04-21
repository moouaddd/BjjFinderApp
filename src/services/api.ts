import type { CommunityEvent } from '../data/events';
import type { PrivateInstructor } from '../data/instructors';

export interface OrganizerRequest {
  id: string;
  userId: string;
  message: string | null;
  status: string; // 'pending' | 'approved' | 'rejected'
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
  // Pricing (null = consultar)
  pricePerClass: number | null;
  monthlyFee: number | null;
  // Schedule (JSON string or null)
  scheduleJson: string | null;
  // Open mat
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

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('bjj_token');
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

export const api = {
  gyms: {
    list: (params?: { city?: string; search?: string; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.city) qs.set('city', params.city);
      if (params?.search) qs.set('search', params.search);
      qs.set('limit', String(params?.limit ?? 600));
      return request<GymsResponse>(`/gyms?${qs.toString()}`);
    },
    get: (id: string) => request<GymRecord>(`/gyms/${id}`),
    cities: () => request<{ cities: string[] }>('/gyms/cities'),
    claim: (gymId: string, message?: string) =>
      request<{ message: string }>(`/gyms/${gymId}/claim`, { method: 'POST', body: JSON.stringify({ message }) }),
    updateOpenMat: (gymId: string, data: {
      openMatFriday?: boolean; openMatFridayTime?: string; openMatFridayDuration?: string;
      openMatSaturday?: boolean; openMatSaturdayTime?: string; openMatSaturdayDuration?: string;
      openMatNotes?: string;
    }) => request<GymRecord>(`/gyms/${gymId}/openmat`, { method: 'PATCH', body: JSON.stringify(data) }),
    updateProfile: (gymId: string, data: {
      phoneOverride?: string; emailOverride?: string; websiteOverride?: string;
      pricePerClass?: number | ''; monthlyFee?: number | '';
      scheduleJson?: string; description?: string;
    }) => request<GymRecord>(`/gyms/${gymId}/profile`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (gymId: string) => request<void>(`/gyms/${gymId}`, { method: 'DELETE' }),
  },
  events: {
    list: () => request<CommunityEvent[]>('/events'),
    create: (data: Omit<CommunityEvent, 'id' | 'createdAt'>) =>
      request<CommunityEvent>('/events', { method: 'POST', body: JSON.stringify(data) }),
    decreaseSpot: (id: string) =>
      request<CommunityEvent>(`/events/${id}/spots`, { method: 'PATCH' }),
    delete: (id: string) => request<void>(`/events/${id}`, { method: 'DELETE' }),
  },
  instructors: {
    list: () => request<PrivateInstructor[]>('/instructors'),
    create: (data: Omit<PrivateInstructor, 'id' | 'createdAt'>) =>
      request<PrivateInstructor>('/instructors', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/instructors/${id}`, { method: 'DELETE' }),
  },
  organizers: {
    myRequest: () => request<OrganizerRequest | null>('/organizers/my-request'),
    submitRequest: (message?: string) =>
      request<OrganizerRequest>('/organizers/request', { method: 'POST', body: JSON.stringify({ message }) }),
  },
  seo: {
    city: (slug: string) =>
      request<{ city: string; slug: string; count: number; intro: string; training: string; faqs: Array<{ q: string; a: string }>; bestRated: { name: string; rating: number | null; address: string | null } | null }>(`/seo/city/${slug}`),
  },
  admin: {
    getClaims: () => request<unknown[]>('/admin/claims'),
    approveClaim: (id: string) =>
      request<{ ok: boolean }>(`/admin/claims/${id}`, { method: 'PATCH', body: JSON.stringify({ action: 'approve' }) }),
    rejectClaim: (id: string) =>
      request<{ ok: boolean }>(`/admin/claims/${id}`, { method: 'PATCH', body: JSON.stringify({ action: 'reject' }) }),
    getStats: () => request<{ users: number; pendingClaims: number; approvedClaims: number; claimedGyms: number; pendingOrganizers: number }>('/admin/stats'),
    getOrganizerRequests: () => request<OrganizerRequest[]>('/admin/organizer-requests'),
    approveOrganizerRequest: (id: string) =>
      request<{ ok: boolean }>(`/admin/organizer-requests/${id}`, { method: 'PATCH', body: JSON.stringify({ action: 'approve' }) }),
    rejectOrganizerRequest: (id: string) =>
      request<{ ok: boolean }>(`/admin/organizer-requests/${id}`, { method: 'PATCH', body: JSON.stringify({ action: 'reject' }) }),
  },
};
