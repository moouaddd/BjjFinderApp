export type EventType = 'seminario' | 'campamento';

export interface Seminar {
  id: string;
  title: string;
  instructor: string;
  instructorBelt: string;
  instructorTeam: string;
  gym: string;
  city: string;
  date: string;
  endDate?: string;
  time: string;
  duration: string;
  type: EventType;
  price: number;
  description: string;
  spotsTotal: number;
  spotsLeft: number;
  image?: string;
  tags: string[];
}

export const seminars: Seminar[] = [];
