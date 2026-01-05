import { F as getStaff } from '../../chunks/queries_vvMOn9ut.mjs';
import { E as createStaff } from '../../chunks/mutations_CnOGsUyk.mjs';
import { r as requireAdmin } from '../../chunks/auth_DQR-8pbN.mjs';
import '../../chunks/prisma_sB1uhqJV.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const GET = async ({ request }) => {
  try {
    const staff = await getStaff();
    return new Response(JSON.stringify(staff), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch staff" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const POST = async ({ request }) => {
  try {
    await requireAdmin(request);
    const data = await request.json();
    if (!data.firstName || !data.lastName || !data.role) {
      return new Response(JSON.stringify({ error: "First name, last name, and role are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const staff = await createStaff({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      role: data.role,
      bio: data.bio,
      image: data.image
    });
    return new Response(JSON.stringify(staff), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating staff:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create staff" }),
      {
        status: error.message === "Unauthorized" || error.message.includes("Forbidden") ? 401 : 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
