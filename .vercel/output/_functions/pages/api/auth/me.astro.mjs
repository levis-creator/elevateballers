import { g as getCurrentUser } from '../../../chunks/auth_CrN9ezVw.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const GET = async ({ request }) => {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Get current user error:", error);
    return new Response(JSON.stringify({ error: "Failed to get user" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
