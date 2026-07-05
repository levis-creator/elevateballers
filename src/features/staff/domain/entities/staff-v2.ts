/**
 * v2 Staff-page entities. The global /staff page ("Our Staff") shows a
 * leadership spotlight (the "Leadership" department, with bios) followed by the
 * remaining departments as person grids. This shape is what the LeagueStaff
 * datasource returns (and what the static fallback mirrors).
 */

/** A featured leadership card (large, with bio). */
export interface StaffLeader {
	name: string;
	role: string;
	/** Small pill above the name, e.g. "Leadership". */
	badge: string;
	bio: string;
	initials: string;
	/** Resolved photo URL, or null → striped-initials avatar. */
	image?: string | null;
}

/** A person tile inside a department grid. Rendered by the reusable
 *  `StaffMemberCard` (also used by the team page's "Coaching Staff" section). */
export interface StaffMember {
	name: string;
	role: string;
	initials: string;
	/** Contact address, or null → no "Contact" link. */
	email: string | null;
	/** Resolved photo URL, or null/undefined → render the striped-initials avatar. */
	image?: string | null;
}

export interface StaffDepartment {
	name: string;
	members: StaffMember[];
}

export interface StaffPageData {
	/** Hero sub-heading paragraph. */
	intro: string;
	/** Leadership spotlight cards (the "Leadership" department). */
	leaders: StaffLeader[];
	/** All other departments, as person grids. */
	departments: StaffDepartment[];
}
