import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/features/cms/lib/auth';

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@elevateballers.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const name = process.env.ADMIN_NAME || 'Admin User';

  console.log('Creating admin user...');
  console.log(`Email: ${email}`);
  console.log(`Name: ${name}`);

  const hashedPassword = await hashPassword(password);

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash: hashedPassword,
        name,
        role: 'ADMIN',
      },
      create: {
        email,
        passwordHash: hashedPassword,
        name,
        role: 'ADMIN',
      },
    });

    console.log('✅ Admin user created/updated successfully!');
    console.log(`User ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log('\nYou can now login at: http://localhost:4321/admin/login');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

