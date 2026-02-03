#!/bin/sh
# Run the app from the directory that contains server.js and node_modules.
# Use this on cPanel so Node resolves modules from the correct app root.
cd "$(dirname "$0")"
exec node server.js
