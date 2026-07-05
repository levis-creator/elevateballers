/**
 * v2 Staff-page entities. The page is static content for now (see the static
 * datasource); this shape is what a future CMS/DB datasource must return so the
 * presentation layer never changes.
 */

/** A featured leadership card (large, with bio). */
export interface StaffLeader {
	name: string;
	role: string;
	/** Small pill above the name, e.g. "Leadership". */
	badge: string;
	bio: string;
	initials: string;
}

/** A person tile inside a department grid. Rendered by the reusable
 *  `StaffMemberCard` (also used by the team page's staff section). */
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
	leaders: StaffLeader[];
	departments: StaffDepartment[];
}
