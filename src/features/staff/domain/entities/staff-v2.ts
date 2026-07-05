/**
 * v2 Staff-page entities. The global /staff page ("League Staff") renders
 * org-wide people grouped by department. This shape is what the LeagueStaff
 * datasource returns (and what the static fallback mirrors) so the page never
 * changes when the data source is swapped.
 */

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
	departments: StaffDepartment[];
}
