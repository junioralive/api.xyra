export async function onRequest(context) {
    const url = new URL(context.request.url);
  
    // Get the pathname (e.g., "/recent/subroute1")
    const pathname = url.pathname;
  
    // Handle sub-routes
    if (pathname === "/recent/subroute1") {
      return new Response(JSON.stringify({ message: "Hello from Subroute 1" }), {
        headers: { "Content-Type": "application/json" },
      });
    } else if (pathname === "/recent/subroute2") {
      return new Response(JSON.stringify({ message: "Hello from Subroute 2" }), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      // Default response for /recent or other unhandled sub-routes
      return new Response(JSON.stringify({ message: "Hello from Recent" }), {
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  