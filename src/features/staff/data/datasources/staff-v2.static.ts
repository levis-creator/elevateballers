/**
 * Static League-Staff fallback. Used only when the `league_staff` table is empty
 * or unavailable, so the /staff page never renders blank. Once `league_staff` is
 * seeded, the live datasource takes over. Org-wide people only (NO team coaches).
 * The "Leadership" people become the spotlight cards; the rest are departments.
 */
import type { StaffPageData, StaffLeader, StaffMember } from "@/features/staff/domain/entities/staff-v2";

const initialsOf = (name: string): string => {
	const w = name.trim().split(/\s+/).filter(Boolean);
	return ((w[0]?.[0] || "") + (w[1]?.[0] || "")).toUpperCase() || "?";
};

const leader = (name: string, role: string, bio: string): StaffLeader => ({
	name,
	role,
	badge: "Leadership",
	bio,
	initials: initialsOf(name),
	image: null,
});

const member = (name: string, role: string, email: string | null = null): StaffMember => ({
	name,
	role,
	initials: initialsOf(name),
	email,
});

export const STAFF_INTRO =
	"The organisers, officials, and volunteers who keep Elevate Ballers running — from tip-off to final buzzer, every match day of the season.";

export const STAFF_PAGE_DATA: StaffPageData = {
	intro: STAFF_INTRO,
	leaders: [
		leader(
			"Anthony Njenga",
			"League Founder & Director",
			"Founded Elevate Ballers to build a professional, community-driven home for basketball in Kenya.",
		),
		leader(
			"Naomi Achieng",
			"League Operations Lead",
			"Oversees fixtures, results, registration and the day-to-day running of the EBL and EWBL.",
		),
	],
	departments: [
		{
			name: "League Management",
			members: [
				member("Grace Wanjiru", "Registrations & Transfers", "elevateballers@gmail.com"),
				member("Daniel Kimani", "Fixtures & Scheduling", "ballers@elevateballers.com"),
				member("Susan Achieng", "Finance & Accounts", "ballers@elevateballers.com"),
				member("Paul Otieno", "Disciplinary Panel Chair", "ballers@elevateballers.com"),
			],
		},
		{
			name: "Officiating",
			members: [
				member("James Mwangi", "Head of Referees"),
				member("Kevin Odhiambo", "Crew Chief — EBL"),
				member("Mercy Njeri", "Crew Chief — EWBL"),
				member("Brian Kamau", "Lead Table Official"),
				member("Alex Mutua", "Shot-Clock Lead"),
			],
		},
		{
			name: "Operations & Media",
			members: [
				member("Faith Nyambura", "Venue Coordinator"),
				member("Collins Barasa", "Stats & Analytics Lead"),
				member("Aisha Hassan", "Media & Content", "ballers@elevateballers.com"),
				member("Victor Ochieng", "Broadcast & AV"),
			],
		},
	],
};
