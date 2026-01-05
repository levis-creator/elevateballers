import { g as getFeatureFlags } from '../../chunks/feature-flags_DTlWIEXZ.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async () => {
  try {
    const flags = getFeatureFlags();
    return new Response(JSON.stringify(flags), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60"
        // Cache for 1 minute
      }
    });
  } catch (error) {
    console.error("Error fetching feature flags:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch feature flags" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
