/**
 * Demo fallback for the v2 Players directory — shown only when the live query
 * fails, so the page never renders empty. Mirrors the design's sample roster.
 */
import type { PlayersDirectoryData, PlayerCard, PosCode } from "@/features/player/domain/entities/players-directory-v2";

const initialsOf = (name: string): string => {
	const w = name.replace(/\(.*?\)/g, "").trim().split(/\s+/).filter(Boolean);
	return ((w[0]?.[0] || "") + (w[1]?.[0] || "")).toUpperCase() || "?";
};
const POS_LABEL: Record<PosCode, string> = { G: "Guard", F: "Forward", C: "Center", "?": "—" };

// [name, team, posCode, number, ppg, rpg, apg]
type Demo = [string, string, PosCode, number, number, number, number];
const DEMO: Demo[] = [
	["Travious Kitondo", "CBA Jets", "G", 7, 24.8, 4.1, 6.2],
	["Brian Otieno", "City Hawks", "F", 11, 22.1, 9.6, 2.4],
	["Kevin Barasa", "Nairobi Thunder", "C", 33, 21.4, 12.7, 1.8],
	["Faith Mwangi", "Alliance Queens", "G", 5, 20.6, 3.9, 8.9],
	["Dennis Mutua", "Karen Oilers", "G", 3, 19.9, 3.2, 7.7],
	["Aisha Noor", "Coast Waves", "G", 9, 18.9, 4.5, 6.8],
	["Samuel Kiptoo", "Rift Valley Rangers", "F", 21, 18.2, 10.8, 1.5],
	["John Kamau", "Don Bosco Nets", "F", 14, 17.7, 6.3, 5.9],
	["Mercy Achieng", "Alliance Queens", "C", 44, 15.4, 11.4, 2.1],
	["Grace Wanjiru", "Coast Waves", "F", 8, 14.9, 9.1, 3.3],
	["Peter Njoroge", "Vikings", "C", 55, 13.6, 8.8, 1.2],
	["Yusuf Abdi", "Simba Elite", "G", 2, 16.1, 3.0, 4.7],
	["Lydia Chebet", "Eldoret Blaze", "F", 23, 15.2, 7.4, 2.9],
	["Collins Owuor", "Legends", "G", 6, 14.4, 3.8, 5.1],
	["Nadia Hassan", "Malaikas", "C", 32, 12.8, 10.2, 1.6],
	["Ian Wekesa", "MAVS Basketball", "F", 17, 13.9, 6.9, 2.2],
];

function toCard(d: Demo): PlayerCard {
	const [name, team, posCode, number, ppg, rpg, apg] = d;
	return {
		id: name,
		name,
		team,
		posCode,
		posLabel: POS_LABEL[posCode],
		number: String(number),
		initials: initialsOf(name),
		href: "#",
		image: null,
		ppg,
		rpg,
		apg,
	};
}

const players = DEMO.map(toCard);

export const FALLBACK_PLAYERS_DIRECTORY: PlayersDirectoryData = {
	players,
	teams: ["All Teams", ...[...new Set(players.map((p) => p.team))].sort()],
	total: players.length,
};
