// Global test setup — runs before any test file is loaded.
// Sets env vars that modules read at module initialization time.

process.env.JWT_SECRET = 'test-secret-key-that-is-long-enough-for-testing-purposes';
process.env.DEPLOY_TARGET = 'test'; // prevent prisma.ts from emitting the warning
