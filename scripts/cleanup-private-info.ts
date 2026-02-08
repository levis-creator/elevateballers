import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables
config();

async function cleanup() {
    console.log('🔍 Starting cleanup of exposed contact info using mysql2...');

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('❌ DATABASE_URL is not set in environment');
        process.exit(1);
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbUrl);
        console.log('✅ Connected to database');

        // 1. Cleanup Players
        // Note: Prisma @@map("players") means the table is named 'players'
        const [players] = await connection.execute('SELECT id, first_name, last_name, bio, email, phone FROM players');
        console.log(`👥 Checking ${players.length} players...`);

        let playerUpdates = 0;
        for (const player of players) {
            let bio = player.bio || '';
            if (!bio) continue;

            let extractedEmail = null;
            let extractedPhone = null;
            let hasChanges = false;

            // Look for Email in bio
            const emailMatch = bio.match(/Email:\s*([^\n\r]+)/);
            if (emailMatch) {
                extractedEmail = emailMatch[1].trim();
                bio = bio.replace(/Email:\s*[^\n\r]+(\r?\n)?/g, '');
                hasChanges = true;
            }

            // Look for Phone in bio
            const phoneMatch = bio.match(/Phone:\s*([^\n\r]+)/);
            if (phoneMatch) {
                extractedPhone = phoneMatch[1].trim();
                bio = bio.replace(/Phone:\s*[^\n\r]+(\r?\n)?/g, '');
                hasChanges = true;
            }

            if (hasChanges) {
                const finalBio = bio.trim() || null;
                const finalEmail = (extractedEmail && !player.email) ? extractedEmail : player.email;
                const finalPhone = (extractedPhone && !player.phone) ? extractedPhone : player.phone;

                await connection.execute(
                    'UPDATE players SET bio = ?, email = ?, phone = ? WHERE id = ?',
                    [finalBio, finalEmail, finalPhone, player.id]
                );
                console.log(`   ✅ Cleaned bio for player: ${player.first_name} ${player.last_name}`);
                playerUpdates++;
            }
        }

        // 2. Cleanup Teams
        // Note: Prisma @@map("teams") means the table is named 'teams'
        const [teams] = await connection.execute('SELECT id, name, description FROM teams');
        console.log(`\n🏠 Checking ${teams.length} teams...`);

        let teamUpdates = 0;
        for (const team of teams) {
            let description = team.description || '';
            if (!description) continue;

            let hasChanges = false;

            // Look for Contact Email in description
            if (description.includes('Contact Email:')) {
                description = description.replace(/Contact Email:\s*[^\n\r]+(\r?\n)?/g, '');
                hasChanges = true;
            }

            // Look for Contact Phone in description
            if (description.includes('Contact Phone:')) {
                description = description.replace(/Contact Phone:\s*[^\n\r]+(\r?\n)?/g, '');
                hasChanges = true;
            }

            if (hasChanges) {
                const finalDescription = description.trim() || null;
                await connection.execute(
                    'UPDATE teams SET description = ? WHERE id = ?',
                    [finalDescription, team.id]
                );
                console.log(`   ✅ Cleaned description for team: ${team.name}`);
                teamUpdates++;
            }
        }

        console.log('\n✨ Cleanup complete!');
        console.log(`📊 Summary: ${playerUpdates} players updated, ${teamUpdates} teams updated.`);

    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

cleanup();
