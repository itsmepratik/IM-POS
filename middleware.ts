import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/api/")
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If user is authenticated, check role-based access
  if (user) {
    // Get user role from database
    let userRole = "shop"; // default fallback

    try {
      const { data: roleData, error } = await supabase.rpc(
        "get_user_role_for_middleware",
        { user_id: user.id }
      );

      if (!error && roleData) {
        userRole = roleData;
      } else {
        // Fallback based on email
        userRole = user.email === "admin@hnsautomotive.com" ? "admin" : "shop";
      }
    } catch (error) {
      console.error("Error getting user role in middleware:", error);
      // Fallback based on email
      userRole = user.email === "admin@hnsautomotive.com" ? "admin" : "shop";
    }

    const pathname = request.nextUrl.pathname;

    // Define admin-only routes
    const adminOnlyRoutes = [
      "/home",
      "/reports",
      "/settings",
      "/restock-orders",
      "/transfer",
      "/transfer-2",
      "/orders",
    ];

    // Define shop-accessible routes
    const shopRoutes = [
      "/pos",
      "/inventory",
      "/customers",
      "/transactions",
      "/notifications",
    ];

    // If shop user tries to access admin route, redirect to POS
    if (
      userRole === "shop" &&
      adminOnlyRoutes.some((route) => pathname.startsWith(route))
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/pos";
      return NextResponse.redirect(url);
    }

    // If user is on root path or dashboard, redirect based on role
    if (pathname === "/" || pathname === "/dashboard") {
      const url = request.nextUrl.clone();
      url.pathname = userRole === "admin" ? "/home" : "/pos";
      return NextResponse.redirect(url);
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    // Exclude static/public assets and special routes from middleware to avoid loops
    // - _next/static, _next/image: Next.js internals
    // - favicon and common assets (svg/png/jpg/jpeg/gif/webp/ico/ttf/woff/woff2)
    // - sw.js, service-worker.js, manifest.json, robots.txt, sitemap.xml
    // - vercel analytics endpoints

    "/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|sw.js|service-worker.js|_vercel|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|ttf|woff|woff2)$).*)",
  ],
};
