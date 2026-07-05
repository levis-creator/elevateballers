import type { CSSProperties } from "react";

export type TeamNameVariant = "full" | "table" | "compact";

export interface TeamNameValue {
	name: string;
	nickname?: string | null;
	logo?: string | null;
	initials?: string | null;
}

interface TeamNameProps {
	team: TeamNameValue | string;
	variant?: TeamNameVariant;
	withCrest?: boolean;
	className?: string;
	textClassName?: string;
	crestClassName?: string;
	style?: CSSProperties;
	textStyle?: CSSProperties;
	align?: "left" | "right" | "center";
	crestPosition?: "start" | "end";
}

const STOP_WORDS = new Set(["the", "a", "an", "and", "of", "for", "to", "at", "in"]);
const STRIPE = "repeating-linear-gradient(45deg,#e7e2da,#e7e2da 4px,#f0ece5 4px,#f0ece5 8px)";

function normalizeTeam(team: TeamNameValue | string): TeamNameValue {
	return typeof team === "string" ? { name: team } : team;
}

function capLabel(label: string, limit = 18): string {
	const clean = label.replace(/\s+/g, " ").trim();
	if (clean.length <= limit) return clean;

	const words = clean.split(" ");
	let out = "";
	for (const word of words) {
		const next = out ? `${out} ${word}` : word;
		if (next.length > limit) break;
		out = next;
	}

	const base = out || clean.slice(0, limit - 3).trim();
	return `${base.replace(/[^\w)]$/u, "")}...`;
}

export function getShortTeamName(team: TeamNameValue | string): string {
	const value = normalizeTeam(team);
	const explicit = value.nickname?.trim();
	if (explicit) return explicit;

	const name = value.name.trim();
	const paren = name.match(/\(([^)]+)\)/);
	const beforeParen = name.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
	const insideParen = paren?.[1]?.trim();
	const fallback = insideParen && insideParen.length <= 18 ? insideParen : beforeParen || insideParen || name;

	return capLabel(fallback);
}

export function getTeamInitials(team: TeamNameValue | string): string {
	const value = normalizeTeam(team);
	if (value.initials?.trim()) return value.initials.trim().slice(0, 3).toUpperCase();

	const clean = value.name
		.replace(/\([^)]*\)/g, " ")
		.replace(/[^a-zA-Z0-9\s]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
	const words = clean
		.split(" ")
		.filter(Boolean)
		.filter((word) => !STOP_WORDS.has(word.toLowerCase()));

	if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
	if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
	return "?";
}

export function getFullTeamName(team: TeamNameValue | string): string {
	return normalizeTeam(team).name;
}

function Crest({ team, className }: { team: TeamNameValue; className?: string }) {
	const base = `flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-black/10 bg-white font-mono text-[10px] font-bold uppercase text-muted2 ${className ?? ""}`;

	if (team.logo) {
		return <img src={team.logo} alt={`${team.name} logo`} loading="lazy" className={`${base} object-contain`} />;
	}

	return (
		<span className={base} style={{ background: STRIPE }} aria-hidden="true">
			{getTeamInitials(team)}
		</span>
	);
}

export default function TeamName({
	team,
	variant = "full",
	withCrest = false,
	className = "",
	textClassName = "",
	crestClassName,
	style,
	textStyle,
	align = "left",
	crestPosition = "start",
}: TeamNameProps) {
	const value = normalizeTeam(team);
	const fullName = getFullTeamName(value);
	const displayName = variant === "compact" ? getShortTeamName(value) : fullName;
	const justify = align === "right" ? "justify-end" : align === "center" ? "justify-center" : "";
	const textAlign = align === "right" ? "text-right" : align === "center" ? "text-center" : "";
	const wrapperClass =
		variant === "full"
			? `flex min-w-0 items-center gap-3 ${justify} ${className}`
			: `flex min-w-0 items-center gap-2.5 overflow-hidden ${justify} ${className}`;
	const textClass =
		variant === "full"
			? `min-w-0 break-words ${textAlign} ${textClassName}`
			: `min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${textAlign} ${textClassName}`;

	return (
		<span className={wrapperClass} title={variant === "full" ? undefined : fullName} style={style}>
			{withCrest && crestPosition === "start" && <Crest team={value} className={crestClassName} />}
			<span className={textClass} style={textStyle}>
				{displayName}
			</span>
			{withCrest && crestPosition === "end" && <Crest team={value} className={crestClassName} />}
		</span>
	);
}
