// CommonJS shim for cPanel setups whose Startup File is server.cjs.
// The real entry point is the ES module server.js.
import('./server.js').catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
