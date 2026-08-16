import { prisma } from '../../../../../lib/prisma';
import { COACH_ROLE_NAME, type UserAccountRow } from '../../../domain/entities/user-directory';

export const userSelect = {
	id: true,
	name: true,
	email: true,
	phone: true,
	active: true,
	activatedAt: true,
	createdAt: true,
	updatedAt: true,
	userRoles: {
		select: {
			role: { select: { id: true, name: true, description: true, isSystem: true } },
		},
	},
	teamOwnerships: {
		where: { role: COACH_ROLE_NAME, revokedAt: null },
		select: { team: { select: { id: true, name: true } } },
	},
	notificationSettings: { select: { emailEnabled: true } },
	sessions: {
		where: { revokedAt: null },
		orderBy: { lastSeenAt: 'desc' as const },
		take: 1,
		select: { lastSeenAt: true, createdAt: true },
	},
} as const;

type SelectedUser = {
	id: string;
	name: string;
	email: string;
	phone: string | null;
	active: boolean;
	activatedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
	userRoles: Array<{ role: { id: string; name: string; description: string | null; isSystem: boolean } }>;
	teamOwnerships: Array<{ team: { id: string; name: string } }>;
	notificationSettings: { emailEnabled: boolean } | null;
	sessions: Array<{ lastSeenAt: Date | null; createdAt: Date }>;
};

export async function toUserRow(user: SelectedUser): Promise<UserAccountRow> {
	const signIns = await prisma.loginEvent.count({ where: { userId: user.id, success: true } });
	const lastSession = user.sessions[0];
	return {
		id: user.id,
		name: user.name,
		email: user.email,
		phone: user.phone,
		active: user.active,
		activatedAt: user.activatedAt ? user.activatedAt.toISOString() : null,
		createdAt: user.createdAt.toISOString(),
		updatedAt: user.updatedAt.toISOString(),
		roles: user.userRoles.map((ur) => ur.role),
		coachTeams: user.teamOwnerships.map((to) => ({ teamId: to.team.id, teamName: to.team.name })),
		notifyEmail: user.notificationSettings?.emailEnabled ?? true,
		lastActive: lastSession ? (lastSession.lastSeenAt ?? lastSession.createdAt).toISOString() : null,
		signIns,
	};
}
