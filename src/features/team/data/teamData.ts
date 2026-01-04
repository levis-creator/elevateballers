/**
 * Team feature data types and sample data
 * 
 * This file contains the data structure for team players and their statistics.
 * Replace the sample data with actual player data from your database or API.
 */

/**
 * Team Player interface
 * Represents a player with their statistics and information
 */
export interface TeamPlayer {
  /** Unique identifier for the player */
  id: string;
  /** Player's full name */
  name: string;
  /** Player's position (e.g., PG, SG, SF, PF, C) */
  position: string;
  /** Player's height (e.g., "6'0\"", "6'5\"") */
  height: string;
  /** Player's weight in pounds (e.g., "180", "220") */
  weight: string;
  /** Field goal percentage (0-100) */
  fgPercent: number;
  /** Free throw percentage (0-100) */
  ftPercent: number;
  /** Three-point percentage (0-100) */
  threePointPercent: number;
  /** Rebounds per game */
  rpg: number;
  /** Assists per game */
  apg: number;
  /** Steals per game */
  spg: number;
  /** Blocks per game */
  bpg: number;
  /** Points per game */
  ppg: number;
  /** Efficiency rating */
  eff: number;
  /** Optional player image URL */
  image?: string;
  /** Optional link to player's profile page */
  url?: string;
}

/**
 * Player category/league grouping
 */
export interface PlayerCategory {
  /** Category/League name (e.g., "BALLERS LEAGUE", "JUNIOR BALLERS") */
  name: string;
  /** Players in this category */
  players: TeamPlayer[];
}

/**
 * Sample team players data organized by categories/leagues
 * 
 * TODO: Replace this with actual player data from your database or API.
 * You can populate these arrays with real player statistics.
 * 
 * Example usage:
 * - Import from API: const playerCategories = await fetchPlayersByCategory();
 * - Import from database: const playerCategories = await getPlayersByCategory();
 * - Static data: Keep these arrays and populate manually
 */
export const playerCategories: PlayerCategory[] = [
  {
    name: "BALLERS LEAGUE",
    players: [
      {
        id: "1",
        name: "James Mitchell",
        position: "PG",
        height: "6'2\"",
        weight: "185",
        fgPercent: 48.5,
        ftPercent: 85.2,
        threePointPercent: 38.7,
        rpg: 4.2,
        apg: 8.5,
        spg: 1.8,
        bpg: 0.3,
        ppg: 22.3,
        eff: 25.6,
      },
      {
        id: "2",
        name: "Michael Johnson",
        position: "SG",
        height: "6'4\"",
        weight: "195",
        fgPercent: 45.8,
        ftPercent: 82.1,
        threePointPercent: 40.2,
        rpg: 5.1,
        apg: 3.2,
        spg: 1.5,
        bpg: 0.5,
        ppg: 19.8,
        eff: 22.4,
      },
      {
        id: "3",
        name: "David Williams",
        position: "SF",
        height: "6'6\"",
        weight: "210",
        fgPercent: 47.2,
        ftPercent: 78.5,
        threePointPercent: 35.8,
        rpg: 7.3,
        apg: 4.1,
        spg: 1.2,
        bpg: 0.8,
        ppg: 18.5,
        eff: 23.1,
      },
      {
        id: "4",
        name: "Robert Brown",
        position: "PF",
        height: "6'8\"",
        weight: "225",
        fgPercent: 52.3,
        ftPercent: 75.4,
        threePointPercent: 28.5,
        rpg: 9.2,
        apg: 2.8,
        spg: 0.9,
        bpg: 1.5,
        ppg: 16.7,
        eff: 24.3,
      },
      {
        id: "5",
        name: "Christopher Davis",
        position: "C",
        height: "6'10\"",
        weight: "245",
        fgPercent: 55.8,
        ftPercent: 72.3,
        threePointPercent: 0.0,
        rpg: 11.5,
        apg: 1.5,
        spg: 0.6,
        bpg: 2.8,
        ppg: 14.9,
        eff: 26.2,
      },
    ],
  },
  {
    name: "JUNIOR BALLERS",
    players: [
      {
        id: "6",
        name: "Alex Thompson",
        position: "PG",
        height: "5'10\"",
        weight: "165",
        fgPercent: 44.2,
        ftPercent: 80.5,
        threePointPercent: 36.8,
        rpg: 3.5,
        apg: 6.8,
        spg: 1.6,
        bpg: 0.2,
        ppg: 15.2,
        eff: 18.5,
      },
      {
        id: "7",
        name: "Jordan Martinez",
        position: "SG",
        height: "6'0\"",
        weight: "175",
        fgPercent: 42.8,
        ftPercent: 79.2,
        threePointPercent: 38.5,
        rpg: 4.2,
        apg: 2.9,
        spg: 1.3,
        bpg: 0.4,
        ppg: 14.8,
        eff: 17.9,
      },
      {
        id: "8",
        name: "Ryan Anderson",
        position: "SF",
        height: "6'2\"",
        weight: "185",
        fgPercent: 45.5,
        ftPercent: 77.8,
        threePointPercent: 33.2,
        rpg: 6.1,
        apg: 3.5,
        spg: 1.1,
        bpg: 0.6,
        ppg: 13.5,
        eff: 19.2,
      },
      {
        id: "9",
        name: "Tyler Wilson",
        position: "PF",
        height: "6'4\"",
        weight: "195",
        fgPercent: 49.8,
        ftPercent: 73.5,
        threePointPercent: 25.8,
        rpg: 7.8,
        apg: 2.2,
        spg: 0.8,
        bpg: 1.2,
        ppg: 12.3,
        eff: 20.1,
      },
      {
        id: "10",
        name: "Noah Garcia",
        position: "C",
        height: "6'6\"",
        weight: "210",
        fgPercent: 52.5,
        ftPercent: 70.2,
        threePointPercent: 0.0,
        rpg: 9.5,
        apg: 1.2,
        spg: 0.5,
        bpg: 2.1,
        ppg: 11.8,
        eff: 21.4,
      },
    ],
  },
  {
    name: "SENIOR BALLERS",
    players: [
      {
        id: "11",
        name: "Marcus Taylor",
        position: "PG",
        height: "6'1\"",
        weight: "190",
        fgPercent: 46.8,
        ftPercent: 83.5,
        threePointPercent: 37.2,
        rpg: 4.8,
        apg: 7.9,
        spg: 1.7,
        bpg: 0.4,
        ppg: 20.5,
        eff: 24.8,
      },
      {
        id: "12",
        name: "Kevin White",
        position: "SG",
        height: "6'3\"",
        weight: "200",
        fgPercent: 44.5,
        ftPercent: 81.8,
        threePointPercent: 39.5,
        rpg: 5.5,
        apg: 3.5,
        spg: 1.4,
        bpg: 0.6,
        ppg: 18.2,
        eff: 21.6,
      },
      {
        id: "13",
        name: "Daniel Lee",
        position: "SF",
        height: "6'5\"",
        weight: "215",
        fgPercent: 48.2,
        ftPercent: 79.2,
        threePointPercent: 34.8,
        rpg: 7.8,
        apg: 4.3,
        spg: 1.3,
        bpg: 0.9,
        ppg: 17.8,
        eff: 22.9,
      },
      {
        id: "14",
        name: "Brandon Harris",
        position: "PF",
        height: "6'7\"",
        weight: "230",
        fgPercent: 51.5,
        ftPercent: 76.5,
        threePointPercent: 29.2,
        rpg: 9.8,
        apg: 3.1,
        spg: 1.0,
        bpg: 1.8,
        ppg: 15.9,
        eff: 25.2,
      },
      {
        id: "15",
        name: "Anthony Clark",
        position: "C",
        height: "6'9\"",
        weight: "250",
        fgPercent: 54.2,
        ftPercent: 74.8,
        threePointPercent: 0.0,
        rpg: 12.1,
        apg: 1.8,
        spg: 0.7,
        bpg: 3.2,
        ppg: 13.5,
        eff: 27.8,
      },
    ],
  },
  {
    name: "WOMEN'S LEAGUE",
    players: [
      {
        id: "16",
        name: "Sarah Johnson",
        position: "PG",
        height: "5'8\"",
        weight: "145",
        fgPercent: 45.2,
        ftPercent: 86.5,
        threePointPercent: 39.8,
        rpg: 4.5,
        apg: 7.2,
        spg: 2.1,
        bpg: 0.3,
        ppg: 18.5,
        eff: 23.4,
      },
      {
        id: "17",
        name: "Emily Davis",
        position: "SG",
        height: "5'10\"",
        weight: "155",
        fgPercent: 43.8,
        ftPercent: 84.2,
        threePointPercent: 41.5,
        rpg: 5.2,
        apg: 3.8,
        spg: 1.8,
        bpg: 0.5,
        ppg: 17.2,
        eff: 21.8,
      },
      {
        id: "18",
        name: "Jessica Martinez",
        position: "SF",
        height: "6'0\"",
        weight: "165",
        fgPercent: 46.5,
        ftPercent: 80.5,
        threePointPercent: 36.2,
        rpg: 7.1,
        apg: 4.2,
        spg: 1.5,
        bpg: 0.8,
        ppg: 16.8,
        eff: 22.6,
      },
      {
        id: "19",
        name: "Amanda Wilson",
        position: "PF",
        height: "6'2\"",
        weight: "175",
        fgPercent: 50.2,
        ftPercent: 78.5,
        threePointPercent: 30.5,
        rpg: 8.9,
        apg: 2.8,
        spg: 1.2,
        bpg: 1.5,
        ppg: 15.3,
        eff: 24.1,
      },
      {
        id: "20",
        name: "Nicole Brown",
        position: "C",
        height: "6'4\"",
        weight: "185",
        fgPercent: 53.8,
        ftPercent: 75.2,
        threePointPercent: 0.0,
        rpg: 10.8,
        apg: 1.5,
        spg: 0.9,
        bpg: 2.5,
        ppg: 14.2,
        eff: 25.9,
      },
    ],
  },
  {
    name: "VETERANS",
    players: [
      {
        id: "21",
        name: "Richard Moore",
        position: "PG",
        height: "6'0\"",
        weight: "180",
        fgPercent: 42.5,
        ftPercent: 82.5,
        threePointPercent: 35.8,
        rpg: 3.8,
        apg: 6.2,
        spg: 1.4,
        bpg: 0.2,
        ppg: 12.5,
        eff: 16.8,
      },
      {
        id: "22",
        name: "Thomas Jackson",
        position: "SG",
        height: "6'2\"",
        weight: "190",
        fgPercent: 41.2,
        ftPercent: 80.8,
        threePointPercent: 37.5,
        rpg: 4.5,
        apg: 2.8,
        spg: 1.2,
        bpg: 0.4,
        ppg: 11.8,
        eff: 15.9,
      },
    ],
  },
  {
    name: "COACHES",
    players: [
      {
        id: "23",
        name: "Coach Mark Thompson",
        position: "Head Coach",
        height: "6'3\"",
        weight: "200",
        fgPercent: 0.0,
        ftPercent: 0.0,
        threePointPercent: 0.0,
        rpg: 0.0,
        apg: 0.0,
        spg: 0.0,
        bpg: 0.0,
        ppg: 0.0,
        eff: 0.0,
      },
      {
        id: "24",
        name: "Coach Lisa Rodriguez",
        position: "Assistant Coach",
        height: "5'9\"",
        weight: "150",
        fgPercent: 0.0,
        ftPercent: 0.0,
        threePointPercent: 0.0,
        rpg: 0.0,
        apg: 0.0,
        spg: 0.0,
        bpg: 0.0,
        ppg: 0.0,
        eff: 0.0,
      },
    ],
  },
  {
    name: "STAFF",
    players: [
      {
        id: "25",
        name: "John Smith",
        position: "Manager",
        height: "5'11\"",
        weight: "175",
        fgPercent: 0.0,
        ftPercent: 0.0,
        threePointPercent: 0.0,
        rpg: 0.0,
        apg: 0.0,
        spg: 0.0,
        bpg: 0.0,
        ppg: 0.0,
        eff: 0.0,
      },
      {
        id: "26",
        name: "Mary Johnson",
        position: "Trainer",
        height: "5'7\"",
        weight: "140",
        fgPercent: 0.0,
        ftPercent: 0.0,
        threePointPercent: 0.0,
        rpg: 0.0,
        apg: 0.0,
        spg: 0.0,
        bpg: 0.0,
        ppg: 0.0,
        eff: 0.0,
      },
    ],
  },
  {
    name: "REFEREES",
    players: [
      {
        id: "27",
        name: "Referee Paul Adams",
        position: "Head Referee",
        height: "6'1\"",
        weight: "185",
        fgPercent: 0.0,
        ftPercent: 0.0,
        threePointPercent: 0.0,
        rpg: 0.0,
        apg: 0.0,
        spg: 0.0,
        bpg: 0.0,
        ppg: 0.0,
        eff: 0.0,
      },
      {
        id: "28",
        name: "Referee Susan Lee",
        position: "Referee",
        height: "5'8\"",
        weight: "145",
        fgPercent: 0.0,
        ftPercent: 0.0,
        threePointPercent: 0.0,
        rpg: 0.0,
        apg: 0.0,
        spg: 0.0,
        bpg: 0.0,
        ppg: 0.0,
        eff: 0.0,
      },
    ],
  },
];

/**
 * Legacy export for backward compatibility
 * @deprecated Use playerCategories instead
 */
export const teamPlayers: TeamPlayer[] = [];

