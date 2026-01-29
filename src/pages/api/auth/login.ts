import type { APIRoute } from 'astro';
import { findUserByEmail, verifyPassword, createToken } from '../../../features/cms/lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { email, password } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = createToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Detect if we're in production and using HTTPS
    // For cPanel: Only set secure flag if we're CERTAIN it's HTTPS
    // This prevents cookie issues when site is accessed via HTTP
    const isProduction = import.meta.env.PROD || 
                        import.meta.env.MODE === 'production' || 
                        process.env.NODE_ENV === 'production';
    
    // Check if request is over HTTPS (be conservative - only set secure if definitely HTTPS)
    // cPanel may proxy requests, so check multiple headers
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const forwardedSsl = request.headers.get('x-forwarded-ssl');
    const urlProtocol = new URL(request.url).protocol;
    
    // Only set secure flag if we have clear evidence of HTTPS
    const isSecure = forwardedProto === 'https' ||
                     forwardedSsl === 'on' ||
                     urlProtocol === 'https:';

    console.log('Login successful (cPanel):', {
      userId: user.id,
      email: user.email,
      isProduction,
      isSecure,
      url: request.url,
      forwardedProto,
      forwardedSsl,
      urlProtocol,
      headers: {
        'x-forwarded-proto': forwardedProto,
        'x-forwarded-ssl': forwardedSsl,
        'host': request.headers.get('host'),
      },
    });

    cookies.set('auth-token', token, {
      httpOnly: true,
      secure: isSecure, // Only set secure flag if actually using HTTPS
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Login error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return new Response(
      JSON.stringify({ 
        error: 'Login failed',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

