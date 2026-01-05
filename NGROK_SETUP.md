# Ngrok Setup Guide

This guide will help you expose your local ElevateBallers development server to the internet using ngrok.

## Quick Start

### Option 1: Using npm scripts (Recommended)

1. **Install dependencies** (if you haven't already):
   ```bash
   npm install
   ```

2. **Start your Astro dev server** in one terminal:
   ```bash
   npm run dev
   ```

3. **Start ngrok tunnel** in another terminal:
   ```bash
   npm run dev:ngrok
   ```

   You'll see output like:
   ```
   ✅ ngrok tunnel is active!
   🌐 Public URL: https://abc123.ngrok-free.app
   📱 Local URL: http://localhost:4321
   ```

### Option 2: Using ngrok CLI directly

If you have ngrok CLI installed globally:

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. In another terminal, run:
   ```bash
   ngrok http 4321
   ```

## Optional: Persistent URLs

For persistent URLs (same URL every time), you can:

1. Sign up for a free ngrok account at https://dashboard.ngrok.com/
2. Get your authtoken from the dashboard
3. Set it as an environment variable:
   ```bash
   # Windows (CMD)
   set NGROK_AUTH_TOKEN=your_token_here
   
   # Windows (PowerShell)
   $env:NGROK_AUTH_TOKEN="your_token_here"
   
   # Create a .env file (recommended)
   NGROK_AUTH_TOKEN=your_token_here
   ```

4. Then run `npm run dev:ngrok` as usual

## Port Configuration

By default, the script uses port **4321** (Astro's default). If your dev server runs on a different port, you can:

- Set the `PORT` environment variable:
  ```bash
  set PORT=3000
  npm run dev:ngrok
  ```

- Or modify `scripts/ngrok-tunnel.js` to change the default port

## Troubleshooting

### "Error starting ngrok tunnel"
- Make sure your Astro dev server is running first
- Check that port 4321 is not blocked by firewall
- Ensure you have an internet connection

### "Connection refused"
- Verify your dev server is actually running on the expected port
- Check the port number matches in both commands

### Want a custom subdomain?
- Requires a paid ngrok plan
- Add `subdomain: 'your-subdomain'` to the ngrok.connect options in `scripts/ngrok-tunnel.js`

## Stopping the Tunnel

Press `Ctrl+C` in the terminal running ngrok to stop the tunnel gracefully.

