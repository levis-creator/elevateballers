export interface PlayerOfTheWeek {
  id: string;
  playerId: string;
  customImage?: string | null;
  description?: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerOfTheWeekWithPlayer extends PlayerOfTheWeek {
  player: {
    id: string;
    firstName: string;
    lastName: string;
    slug: string;
    team?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  };
}

export interface Sponsor {
  id: string;
  name: string;
  image: string;
  link?: string | null;
  order: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePlayerOfTheWeekInput {
  playerId: string;
  customImage?: string;
  description?: string;
  active?: boolean;
}

export interface UpdatePlayerOfTheWeekInput {
  playerId?: string;
  customImage?: string | null;
  description?: string | null;
  active?: boolean;
}

export interface CreateSponsorInput {
  name: string;
  image: string;
  link?: string;
  order?: number;
  active?: boolean;
}

export interface UpdateSponsorInput {
  name?: string;
  image?: string;
  link?: string | null;
  order?: number;
  active?: boolean;
}
