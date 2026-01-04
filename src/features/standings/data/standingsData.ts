/**
 * Standings data types and sample data
 */

export interface TeamStanding {
  rank: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  url?: string;
}

export const standings: TeamStanding[] = [
  {
    rank: 1,
    team: "Thunder Hawks",
    played: 12,
    won: 10,
    drawn: 1,
    lost: 1,
    goalsFor: 245,
    goalsAgainst: 180,
    goalDifference: 65,
    points: 31,
  },
  {
    rank: 2,
    team: "Fire Dragons",
    played: 12,
    won: 9,
    drawn: 2,
    lost: 1,
    goalsFor: 230,
    goalsAgainst: 175,
    goalDifference: 55,
    points: 29,
  },
  {
    rank: 3,
    team: "Storm Riders",
    played: 12,
    won: 9,
    drawn: 0,
    lost: 3,
    goalsFor: 220,
    goalsAgainst: 190,
    goalDifference: 30,
    points: 27,
  },
  {
    rank: 4,
    team: "Lightning Bolts",
    played: 12,
    won: 8,
    drawn: 2,
    lost: 2,
    goalsFor: 215,
    goalsAgainst: 185,
    goalDifference: 30,
    points: 26,
  },
  {
    rank: 5,
    team: "Eagle Warriors",
    played: 12,
    won: 7,
    drawn: 3,
    lost: 2,
    goalsFor: 210,
    goalsAgainst: 195,
    goalDifference: 15,
    points: 24,
  },
  {
    rank: 6,
    team: "Phoenix Rising",
    played: 12,
    won: 6,
    drawn: 4,
    lost: 2,
    goalsFor: 205,
    goalsAgainst: 200,
    goalDifference: 5,
    points: 22,
  },
  {
    rank: 7,
    team: "Tiger Claws",
    played: 12,
    won: 5,
    drawn: 3,
    lost: 4,
    goalsFor: 195,
    goalsAgainst: 205,
    goalDifference: -10,
    points: 18,
  },
  {
    rank: 8,
    team: "Wolf Pack",
    played: 12,
    won: 4,
    drawn: 4,
    lost: 4,
    goalsFor: 185,
    goalsAgainst: 210,
    goalDifference: -25,
    points: 16,
  },
  {
    rank: 9,
    team: "Lion Pride",
    played: 12,
    won: 3,
    drawn: 5,
    lost: 4,
    goalsFor: 175,
    goalsAgainst: 220,
    goalDifference: -45,
    points: 14,
  },
  {
    rank: 10,
    team: "Bear Force",
    played: 12,
    won: 2,
    drawn: 4,
    lost: 6,
    goalsFor: 165,
    goalsAgainst: 230,
    goalDifference: -65,
    points: 10,
  },
  {
    rank: 11,
    team: "Shark Attack",
    played: 12,
    won: 1,
    drawn: 3,
    lost: 8,
    goalsFor: 155,
    goalsAgainst: 240,
    goalDifference: -85,
    points: 6,
  },
  {
    rank: 12,
    team: "Panther Strike",
    played: 12,
    won: 0,
    drawn: 2,
    lost: 10,
    goalsFor: 140,
    goalsAgainst: 250,
    goalDifference: -110,
    points: 2,
  },
];

