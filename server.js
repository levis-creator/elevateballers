import { createServer } from 'http';
import { handler as ssrHandler } from './dist/server/entry.mjs';

// Detect if we're running under LiteSpeed's Node.js wrapper
// LiteSpeed wraps http.Server.listen() and throws if called multiple times
const isLiteSpeed = typeof process.env.LSWS_FCGI_CHILDREN !== 'undefined' || 
                    process.argv.some(arg => arg.includes('lsnode'));

// cPanel's LiteSpeed Node.js wrapper may load this module multiple times
// within the same process. We need to ensure we only create one server instance
// and only call listen() once per process.
//
// Use a global variable to store the server instance and track if it's already listening
const getOrCreateServer = () => {
  if (globalThis.__elevateballers_server) {
    return globalThis.__elevateballers_server;
  }

  const server = createServer(async (req, res) => {
    try {
      const response = await ssrHandler(req);
      
      // Set response headers
      if (response.headers) {
        // Handle Headers object (from Web API)
        if (response.headers.forEach) {
          response.headers.forEach((value, key) => {
            res.setHeader(key, value);
          });
        } else if (response.headers.entries) {
          // Handle Map-like headers
          for (const [key, value] of response.headers.entries()) {
            res.setHeader(key, value);
          }
        } else {
          // Handle plain object
          for (const [key, value] of Object.entries(response.headers)) {
            res.setHeader(key, value);
          }
        }
      }
      
      // Set status code
      res.statusCode = response.status || 200;
      
      // Handle response body
      if (response.body) {
        // If body is a ReadableStream
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
          // Try to convert to string
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
      
      // Log more details in production for debugging
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorDetails = process.env.NODE_ENV === 'production' 
        ? `Error: ${errorMessage}` 
        : `Error: ${errorMessage}\n\nStack: ${error?.stack}`;
      
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

// Only call listen() if the server is not already listening
// This prevents the "listen() was called more than once" error
// Use process-level tracking for better reliability across module loads
const LISTEN_LOCK_KEY = '__elevateballers_listen_lock';

// Check if listen() has already been called (using process-level storage)
// This works even if globalThis is reset between module loads
const hasListenBeenCalled = () => {
  // Check multiple storage locations for maximum compatibility
  return !!(globalThis[LISTEN_LOCK_KEY] || 
            process[LISTEN_LOCK_KEY] || 
            (server && server.listening));
};

// Attempt to call listen() with comprehensive error handling
// LiteSpeed's wrapper may call this module multiple times, so we need robust guards
const attemptListen = () => {
  // Multiple checks to prevent calling listen() if already listening
  if (hasListenBeenCalled() || server.listening) {
    return; // Already listening or attempt made
  }
  
  // Check if server is already bound to an address
  try {
    const address = server.address();
    if (address) {
      console.log('Server already bound to address:', address);
      return; // Server is already bound
    }
  } catch (e) {
    // address() might throw if server is closing, ignore
  }
  
  // Set lock immediately before calling listen()
  globalThis[LISTEN_LOCK_KEY] = true;
  process[LISTEN_LOCK_KEY] = true;
  
  const PORT = process.env.PORT || 3000;
  
  // Always wrap listen() in try-catch - LiteSpeed wrapper throws synchronously
  try {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      if (isLiteSpeed) {
        console.log('Running under LiteSpeed Node.js wrapper');
      }
    });
  } catch (error) {
    // LiteSpeed wrapper throws "listen() was called more than once" synchronously
    // This is expected when module loads multiple times - just ignore it
    if (error instanceof Error) {
      if (error.message.includes('listen() was called more than once')) {
        // Expected behavior in LiteSpeed - server is already listening via wrapper
        // Silently continue - this is normal in LiteSpeed environment
        return;
      }
      // Other errors should be logged
      console.error('Error calling server.listen():', error.message);
    } else {
      console.error('Unknown error calling server.listen():', error);
    }
  }
};

// Only attempt to listen if conditions are met
if (!hasListenBeenCalled() && !server.listening) {
  attemptListen();
} else {
  // Already handled - this is fine
  if (server.listening) {
    console.log('Server already listening');
  }
}

// Graceful shutdown handlers
// Only register once per process to avoid duplicate handlers
if (!globalThis.__elevateballers_shutdown_handlers_registered) {
  globalThis.__elevateballers_shutdown_handlers_registered = true;

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    const srv = globalThis.__elevateballers_server;
    if (srv && srv.listening) {
      srv.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    const srv = globalThis.__elevateballers_server;
    if (srv && srv.listening) {
      srv.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
}
