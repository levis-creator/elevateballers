/**
 * CommonJS entry point for cPanel / Node when server.js is treated as ESM
 * but the deployed file is an old CommonJS version (require is not defined).
 * Use this file as Startup File in cPanel Node.js app: server.cjs
 */
const http = require('http');

const isLiteSpeed = typeof process.env.LSWS_FCGI_CHILDREN !== 'undefined' ||
  process.argv.some(arg => arg.includes('lsnode'));

const LISTEN_LOCK_KEY = '__elevateballers_listen_lock';

async function start() {
  const { handler: ssrHandler } = await import('./dist/server/entry.mjs');

  const getOrCreateServer = () => {
    if (globalThis.__elevateballers_server) {
      return globalThis.__elevateballers_server;
    }

    const server = http.createServer(async (req, res) => {
      try {
        const response = await ssrHandler(req);

        if (response.headers) {
          if (response.headers.forEach) {
            response.headers.forEach((value, key) => {
              res.setHeader(key, value);
            });
          } else if (response.headers.entries) {
            for (const [key, value] of response.headers.entries()) {
              res.setHeader(key, value);
            }
          } else {
            for (const [key, value] of Object.entries(response.headers)) {
              res.setHeader(key, value);
            }
          }
        }

        res.statusCode = response.status || 200;

        if (response.body) {
          if (response.body instanceof ReadableStream) {
            const reader = response.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(value);
            }
            res.end();
          } else if (typeof response.body === 'string') {
            res.end(response.body);
          } else if (response.body instanceof Uint8Array || Buffer.isBuffer(response.body)) {
            res.end(response.body);
          } else {
            res.end(String(response.body));
          }
        } else {
          res.end();
        }
      } catch (error) {
        console.error('Server error:', error);
        console.error('Error stack:', error?.stack);
        console.error('Request URL:', req.url);
        console.error('Request method:', req.method);

        const errorMessage = error instanceof Error ? error.message : String(error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(`<!DOCTYPE html>
<html>
<head><title>Server Error</title></head>
<body>
  <h1>Internal Server Error</h1>
  <p>${errorMessage}</p>
  ${process.env.NODE_ENV !== 'production' ? `<pre>${error?.stack}</pre>` : ''}
</body>
</html>`);
      }
    });

    globalThis.__elevateballers_server = server;
    return server;
  };

  const server = getOrCreateServer();

  const hasListenBeenCalled = () => {
    return !!(globalThis[LISTEN_LOCK_KEY] ||
      process[LISTEN_LOCK_KEY] ||
      (server && server.listening));
  };

  const attemptListen = () => {
    if (hasListenBeenCalled() || server.listening) return;

    try {
      const address = server.address();
      if (address) {
        console.log('Server already bound to address:', address);
        return;
      }
    } catch (e) {}

    globalThis[LISTEN_LOCK_KEY] = true;
    process[LISTEN_LOCK_KEY] = true;

    const PORT = process.env.PORT || 3000;

    try {
      server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        if (isLiteSpeed) console.log('Running under LiteSpeed Node.js wrapper');
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('listen() was called more than once')) {
        return;
      }
      console.error('Error calling server.listen():', error?.message || error);
    }
  };

  if (!hasListenBeenCalled() && !server.listening) {
    attemptListen();
  }

  if (!globalThis.__elevateballers_shutdown_handlers_registered) {
    globalThis.__elevateballers_shutdown_handlers_registered = true;
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      const srv = globalThis.__elevateballers_server;
      if (srv && srv.listening) srv.close(() => process.exit(0));
      else process.exit(0);
    });
    process.on('SIGINT', () => {
      console.log('SIGINT signal received: closing HTTP server');
      const srv = globalThis.__elevateballers_server;
      if (srv && srv.listening) srv.close(() => process.exit(0));
      else process.exit(0);
    });
  }
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
