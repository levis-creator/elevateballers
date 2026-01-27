import { createServer } from 'http';
import { handler as ssrHandler } from './dist/server/entry.mjs';

const PORT = process.env.PORT || 3000;

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
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
