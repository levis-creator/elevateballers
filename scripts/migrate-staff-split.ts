import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Mode = "dry-run" | "apply" | "rollback";

interface LeagueStaffSeed {
	name: string;
	role: string;
	department: string;
	email?: string;
	photo?: string;
	sortOrder?: number;
	active?: boolean;
}

const args = new Set(process.argv.slice(2));
const mode: Mode = args.has("--apply")
	? "apply"
	: args.has("--rollback")
		? "rollback"
		: "dry-run";

function getArgValue(name: string): string | null {
	const prefix = `${name}=`;
	const raw = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
	return raw ? raw.slice(prefix.length) : null;
}

const backupDir = getArgValue("--backup-dir") || "backups/staff-split";
const seedFile = getArgValue("--league-staff-seed");
const includeInactiveSeed = args.has("--include-inactive-seed");
const rollbackSeeded = args.has("--rollback-seeded");

function roleToType(role: string): "coach" | "manager" | "support" {
	if (role === "COACH" || role === "ASSISTANT_COACH") return "coach";
	if (role === "MANAGER" || role === "ASSISTANT_MANAGER") return "manager";
	return "support";
}

function roleToLabel(role: string): string {
	return role
		.split("_")
		.map((word) => word.charAt(0) + word.slice(1).toLowerCase())
		.join(" ");
}

function fullName(staff: { firstName: string; lastName: string }): string {
	return `${staff.firstName} ${staff.lastName}`.trim();
}

async function readSeed(): Promise<LeagueStaffSeed[]> {
	if (!seedFile) return [];
	const absolute = path.resolve(seedFile);
	const body = await readFile(absolute, "utf8");
	const parsed = JSON.parse(body);
	if (!Array.isArray(parsed)) {
		throw new Error(`League staff seed file must be a JSON array: ${absolute}`);
	}

	return parsed.filter((entry) =>
		entry &&
		typeof entry.name === "string" &&
		typeof entry.role === "string" &&
		typeof entry.department === "string" &&
		(includeInactiveSeed || entry.active !== false)
	);
}

async function snapshot(label: string) {
	const [legacyStaff, legacyTeamStaff, newLeagueStaff, newTeamStaff] = await Promise.all([
		prisma.staff.findMany({ orderBy: [{ firstName: "asc" }, { lastName: "asc" }] }),
		prisma.teamStaff.findMany({ include: { staff: true, team: true }, orderBy: { createdAt: "asc" } }),
		prisma.leagueStaff.findMany({ orderBy: [{ department: "asc" }, { sortOrder: "asc" }, { name: "asc" }] }),
		prisma.teamStaffMember.findMany({ include: { team: true, season: true }, orderBy: { createdAt: "asc" } }),
	]);

	await mkdir(backupDir, { recursive: true });
	const file = path.join(
		backupDir,
		`${new Date().toISOString().replace(/[:.]/g, "-")}-${label}.json`
	);
	await writeFile(
		file,
		JSON.stringify(
			{
				createdAt: new Date().toISOString(),
				mode,
				legacyStaff,
				legacyTeamStaff,
				newLeagueStaff,
				newTeamStaff,
			},
			null,
			2
		)
	);
	return file;
}

async function buildPlan() {
	const [legacyAssignments, legacyStaff, seasonTeams, existingNewStaff, seed] = await Promise.all([
		prisma.teamStaff.findMany({
			include: { staff: true, team: true },
			orderBy: [{ teamId: "asc" }, { createdAt: "asc" }],
		}),
		prisma.staff.findMany({ include: { teams: true }, orderBy: [{ firstName: "asc" }, { lastName: "asc" }] }),
		prisma.seasonTeam.findMany({
			include: { season: true },
			orderBy: { createdAt: "desc" },
		}),
		prisma.teamStaffMember.findMany({ select: { legacyTeamStaffId: true } }),
		readSeed(),
	]);

	const latestSeasonByTeam = new Map<string, string>();
	for (const seasonTeam of seasonTeams) {
		if (!latestSeasonByTeam.has(seasonTeam.teamId)) {
			latestSeasonByTeam.set(seasonTeam.teamId, seasonTeam.seasonId);
		}
	}

	const existingLegacyIds = new Set(
		existingNewStaff.map((row) => row.legacyTeamStaffId).filter(Boolean)
	);

	const copies = legacyAssignments.map((assignment) => {
		const seasonId = latestSeasonByTeam.get(assignment.teamId) ?? null;
		return {
			legacyTeamStaffId: assignment.id,
			legacyStaffId: assignment.staffId,
			teamId: assignment.teamId,
			teamName: assignment.team.name,
			seasonId,
			name: fullName(assignment.staff),
			role: roleToLabel(assignment.role),
			type: roleToType(assignment.role),
			email: assignment.staff.email,
			photo: assignment.staff.image,
			alreadyCopied: existingLegacyIds.has(assignment.id),
		};
	});

	const assignedStaffIds = new Set(legacyAssignments.map((assignment) => assignment.staffId));
	const review = legacyStaff
		.filter((staff) => !assignedStaffIds.has(staff.id))
		.map((staff) => ({
			legacyStaffId: staff.id,
			name: fullName(staff),
			role: roleToLabel(staff.role),
			reason: "No legacy team_staff assignment found; needs human team mapping.",
		}));

	const byTeam = new Map<string, { teamId: string; teamName: string; create: number; skip: number; people: string[] }>();
	for (const copy of copies) {
		const item = byTeam.get(copy.teamId) ?? {
			teamId: copy.teamId,
			teamName: copy.teamName,
			create: 0,
			skip: 0,
			people: [],
		};
		if (copy.alreadyCopied) item.skip += 1;
		else item.create += 1;
		item.people.push(`${copy.name} (${copy.role}, ${copy.type})`);
		byTeam.set(copy.teamId, item);
	}

	return {
		copies,
		review,
		seed,
		teamSummaries: [...byTeam.values()].sort((a, b) => a.teamName.localeCompare(b.teamName)),
	};
}

async function printPlan() {
	const plan = await buildPlan();
	const toCreate = plan.copies.filter((copy) => !copy.alreadyCopied);
	const alreadyCopied = plan.copies.filter((copy) => copy.alreadyCopied);

	console.log(`Mode: ${mode}`);
	console.log(`Legacy team assignments found: ${plan.copies.length}`);
	console.log(`New team staff rows to create: ${toCreate.length}`);
	console.log(`Already copied rows to skip: ${alreadyCopied.length}`);
	console.log(`Unmatched legacy staff requiring review: ${plan.review.length}`);
	console.log(`League staff seed entries: ${plan.seed.length}`);
	console.log("");
	console.log("Per-team mapping:");
	for (const team of plan.teamSummaries) {
		console.log(`- ${team.teamName}: create ${team.create}, skip ${team.skip}`);
		for (const person of team.people) console.log(`  - ${person}`);
	}

	if (plan.review.length > 0) {
		console.log("");
		console.log("Manual review list:");
		for (const item of plan.review) {
			console.log(`- ${item.name} (${item.role}) [${item.legacyStaffId}]: ${item.reason}`);
		}
	}

	return plan;
}

async function apply() {
	const plan = await printPlan();
	const backup = await snapshot("before-apply");
	console.log(`Backup snapshot written: ${backup}`);

	let created = 0;
	for (const copy of plan.copies) {
		if (copy.alreadyCopied) continue;
		await prisma.teamStaffMember.create({
			data: {
				teamId: copy.teamId,
				seasonId: copy.seasonId,
				name: copy.name,
				role: copy.role,
				type: copy.type,
				email: copy.email,
				photo: copy.photo,
				legacyStaffId: copy.legacyStaffId,
				legacyTeamStaffId: copy.legacyTeamStaffId,
			},
		});
		created += 1;
	}

	let seeded = 0;
	for (const item of plan.seed) {
		const existing = await prisma.leagueStaff.findFirst({
			where: {
				name: item.name,
				role: item.role,
				department: item.department,
			},
		});
		if (existing) continue;

		await prisma.leagueStaff.create({
			data: {
				name: item.name,
				role: item.role,
				department: item.department,
				email: item.email,
				photo: item.photo,
				sortOrder: item.sortOrder ?? 0,
				active: item.active ?? true,
			},
		});
		seeded += 1;
	}

	console.log("");
	console.log(`Created team staff rows: ${created}`);
	console.log(`Created league staff seed rows: ${seeded}`);
	console.log("Legacy staff and team_staff rows were left untouched.");
}

async function rollback() {
	const plan = await printPlan();
	const backup = await snapshot("before-rollback");
	console.log(`Backup snapshot written: ${backup}`);

	const legacyIds = plan.copies.map((copy) => copy.legacyTeamStaffId);
	const deletedTeamStaff = await prisma.teamStaffMember.deleteMany({
		where: { legacyTeamStaffId: { in: legacyIds } },
	});

	let deletedLeagueStaff = 0;
	if (rollbackSeeded && plan.seed.length > 0) {
		for (const item of plan.seed) {
			const result = await prisma.leagueStaff.deleteMany({
				where: {
					name: item.name,
					role: item.role,
					department: item.department,
				},
			});
			deletedLeagueStaff += result.count;
		}
	}

	console.log("");
	console.log(`Deleted copied team staff rows: ${deletedTeamStaff.count}`);
	console.log(`Deleted seeded league staff rows: ${deletedLeagueStaff}`);
	console.log("Legacy staff and team_staff rows were left untouched.");
}

try {
	if (mode === "apply") await apply();
	else if (mode === "rollback") await rollback();
	else await printPlan();
} finally {
	await prisma.$disconnect();
}
