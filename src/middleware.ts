import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/auth/reset-password', '/auth/callback']
  const isPublicRoute = publicRoutes.some(path => request.nextUrl.pathname.startsWith(path))
  
  // Note: We previously had special handling for reset-password/update route,
  // but it's now handled by the public routes check above
  
  // Define login/signup pages that should redirect to home if user is already signed in
  const authOnlyRoutes = ['/login', '/signup']
  const isAuthOnlyRoute = authOnlyRoutes.some(path => request.nextUrl.pathname.startsWith(path))

  // Redirect root path to /costco
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/costco', request.url))
  }

  // If the user is not signed in and the route is not public, redirect to login
  // Commented out to support anonymous/unauthenticated voting
  // If needed again in the future, uncomment the following block:
  /*
  if (!user && !isPublicRoute) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }
  */

  // If the user is signed in and trying to access login/signup pages, redirect to home
  // But allow access to password reset update page even when authenticated
  if (user && isAuthOnlyRoute) {
    return NextResponse.redirect(new URL('/', request.url))
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

  return supabaseResponse
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}