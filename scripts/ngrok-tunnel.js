import { connect } from '@ngrok/ngrok';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const PORT = parseInt(process.env.PORT || '4321', 10); // Astro default port
const NGROK_AUTH_TOKEN = process.env.NGROK_AUTH_TOKEN; // Optional: for persistent URLs

async function startTunnel() {
  let listener = null;
  
  try {
    console.log(`Starting ngrok tunnel to localhost:${PORT}...`);
    
    // Build configuration for @ngrok/ngrok
    const ngrokConfig = {
      addr: PORT,
      authtoken: NGROK_AUTH_TOKEN, // Will be undefined if not set, which is fine
    };

    // Connect to ngrok using the official SDK
    listener = await connect(ngrokConfig);
    
    const url = listener.url();

    console.log('\n✅ ngrok tunnel is active!');
    console.log(`🌐 Public URL: ${url}`);
    console.log(`📱 Local URL: http://localhost:${PORT}`);
    console.log('\n💡 Tip: Press Ctrl+C to stop the tunnel\n');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\nShutting down ngrok tunnel...');
      try {
        if (listener) {
          await listener.close();
        }
      } catch (e) {
        // Ignore errors on shutdown
      }
      process.exit(0);
    });

    // Keep the process alive - wait for SIGINT
    await new Promise((resolve) => {
      process.on('SIGINT', () => resolve());
    });

  } catch (error) {
    console.error('❌ Error starting ngrok tunnel:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. Your Astro dev server is running on port', PORT);
    console.error('   2. You have an internet connection');
    if (!NGROK_AUTH_TOKEN) {
      console.error('   3. (Optional) Set NGROK_AUTH_TOKEN in .env file for persistent URLs');
    }
    console.error('\n📝 Full error details:', error);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

startTunnel();

