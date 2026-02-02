import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const liveMatches = await prisma.match.findMany({
        where: { status: 'LIVE' },
        select: { id: true }
    });

    if (liveMatches.length === 0) {
        console.log('No live matches found');
        return;
    }

    for (const match of liveMatches) {
        console.log(`Match: ${match.id}`);
        const players = await prisma.matchPlayer.findMany({
            where: { matchId: match.id },
            include: { player: true }
        });
        players.forEach(p => {
            console.log(`  Player: ${p.player.firstName} ${p.player.lastName}, Started: ${p.started}, IsActive: ${p.isActive}`);
        });
    }
}

check().catch(console.error).finally(() => prisma.$disconnect());
