import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const teams = await prisma.team.findMany({
        select: { id: true, name: true, slug: true, approved: true },
        take: 20
    });
    console.log(JSON.stringify(teams, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
