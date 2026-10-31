// cPanel / Passenger entry point.
//
// The @astrojs/node standalone build starts its own HTTP server (serving both
// SSR routes and dist/client assets) as soon as entry.mjs is imported.
// Passenger intercepts that server's listen() call and routes traffic to it,
// so all this file needs to do is load .env first and then import the build.
import 'dotenv/config';
import './dist/server/entry.mjs';
