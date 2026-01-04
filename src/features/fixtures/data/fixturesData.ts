/**
 * Fixtures data types and sample data
 */

export interface MatchFixture {
  id: string;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  league: string;
  homeScore?: number;
  awayScore?: number;
  status?: "upcoming" | "live" | "finished";
  url?: string;
}

export const upcomingFixtures: MatchFixture[] = [
  {
    id: "1",
    date: "2026-01-15",
    time: "14:00",
    homeTeam: "Thunder Hawks",
    awayTeam: "Fire Dragons",
    venue: "Main Court",
    league: "Ballers League",
    status: "upcoming",
  },
  {
    id: "2",
    date: "2026-01-15",
    time: "16:00",
    homeTeam: "Storm Riders",
    awayTeam: "Lightning Bolts",
    venue: "Court 2",
    league: "Ballers League",
    status: "upcoming",
  },
  {
    id: "3",
    date: "2026-01-16",
    time: "10:00",
    homeTeam: "Eagle Warriors",
    awayTeam: "Phoenix Rising",
    venue: "Main Court",
    league: "Junior Ballers",
    status: "upcoming",
  },
  {
    id: "4",
    date: "2026-01-16",
    time: "12:00",
    homeTeam: "Tiger Claws",
    awayTeam: "Wolf Pack",
    venue: "Court 2",
    league: "Senior Ballers",
    status: "upcoming",
  },
  {
    id: "5",
    date: "2026-01-16",
    time: "14:00",
    homeTeam: "Lion Pride",
    awayTeam: "Bear Force",
    venue: "Main Court",
    league: "Ballers League",
    status: "upcoming",
  },
  {
    id: "6",
    date: "2026-01-17",
    time: "11:00",
    homeTeam: "Shark Attack",
    awayTeam: "Panther Strike",
    venue: "Court 2",
    league: "Junior Ballers",
    status: "upcoming",
  },
  {
    id: "7",
    date: "2026-01-18",
    time: "15:00",
    homeTeam: "Fire Dragons",
    awayTeam: "Storm Riders",
    venue: "Main Court",
    league: "Ballers League",
    status: "upcoming",
  },
  {
    id: "8",
    date: "2026-01-18",
    time: "17:00",
    homeTeam: "Lightning Bolts",
    awayTeam: "Eagle Warriors",
    venue: "Court 2",
    league: "Senior Ballers",
    status: "upcoming",
  },
  {
    id: "9",
    date: "2026-01-19",
    time: "13:00",
    homeTeam: "Phoenix Rising",
    awayTeam: "Tiger Claws",
    venue: "Main Court",
    league: "Ballers League",
    status: "upcoming",
  },
  {
    id: "10",
    date: "2026-01-19",
    time: "15:00",
    homeTeam: "Wolf Pack",
    awayTeam: "Lion Pride",
    venue: "Court 2",
    league: "Women's League",
    status: "upcoming",
  },
  {
    id: "11",
    date: "2026-01-20",
    time: "10:00",
    homeTeam: "Bear Force",
    awayTeam: "Shark Attack",
    venue: "Main Court",
    league: "Junior Ballers",
    status: "upcoming",
  },
  {
    id: "12",
    date: "2026-01-20",
    time: "14:00",
    homeTeam: "Panther Strike",
    awayTeam: "Thunder Hawks",
    venue: "Court 2",
    league: "Ballers League",
    status: "upcoming",
  },
  {
    id: "13",
    date: "2026-01-22",
    time: "16:00",
    homeTeam: "Fire Dragons",
    awayTeam: "Lightning Bolts",
    venue: "Main Court",
    league: "Ballers League",
    status: "upcoming",
  },
  {
    id: "14",
    date: "2026-01-22",
    time: "18:00",
    homeTeam: "Storm Riders",
    awayTeam: "Eagle Warriors",
    venue: "Court 2",
    league: "Senior Ballers",
    status: "upcoming",
  },
  {
    id: "15",
    date: "2026-01-23",
    time: "12:00",
    homeTeam: "Phoenix Rising",
    awayTeam: "Wolf Pack",
    venue: "Main Court",
    league: "Ballers League",
    status: "upcoming",
  },
];

