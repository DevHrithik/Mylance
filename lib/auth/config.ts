// Auth configuration constants
export const AUTH_CONFIG = {
  // Routes
  SIGN_IN_URL: "/login",
  SIGN_UP_URL: "/signup",
  CALLBACK_URL: "/auth/callback",
  DASHBOARD_URL: "/dashboard",
  ONBOARDING_URL: "/onboarding",

  // Email settings
  MAGIC_LINK_EXPIRY: 3600, // 1 hour in seconds

  // Redirect URLs
  DEFAULT_REDIRECT_AFTER_LOGIN: "/dashboard",
  DEFAULT_REDIRECT_AFTER_LOGOUT: "/login",

  // Protected route patterns
  PROTECTED_ROUTES: [
    "/dashboard",
    "/onboarding",
    "/posts",
    "/analytics",
    "/billing",
    "/profile",
    "/settings",
  ],

  // Public route patterns
  PUBLIC_ROUTES: [
    "/",
    "/login",
    "/signup",
    "/auth",
    "/help",
    "/faq",
    "/contact",
  ],
} as const;

// Email template configurations for Supabase
export const EMAIL_TEMPLATES = {
  MAGIC_LINK: {
    subject: "Your Mylance login link",
    body: `
      <h2>Welcome to Mylance!</h2>
      <p>Click the link below to sign in to your account:</p>
      <p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">Sign in to Mylance</a></p>
      <p>This link will expire in 1 hour for security reasons.</p>
      <p>If you didn't request this email, you can safely ignore it.</p>
      <hr>
      <p style="font-size: 12px; color: #666;">
        This email was sent from Mylance. If you have any questions, please contact our support team.
      </p>
    `,
  },
  WELCOME: {
    subject: "Welcome to Mylance - Start creating amazing LinkedIn content!",
    body: `
      <h2>Welcome to Mylance! 🎉</h2>
      <p>We're excited to have you on board. Mylance helps you create engaging LinkedIn content powered by AI.</p>
      
      <h3>What's next?</h3>
      <ol>
        <li><strong>Complete your profile:</strong> Tell us about your industry and goals</li>
        <li><strong>Set up your content strategy:</strong> Define your target audience and content pillars</li>
        <li><strong>Generate your first post:</strong> Let our AI create compelling content for you</li>
      </ol>
      
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/onboarding" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">Get Started</a></p>
      
      <p>Need help? Check out our <a href="${process.env.NEXT_PUBLIC_SITE_URL}/help">help center</a> or reply to this email.</p>
      
      <p>Best regards,<br>The Mylance Team</p>
    `,
  },
} as const;

// Validation functions
export function isProtectedRoute(pathname: string): boolean {
  return AUTH_CONFIG.PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
}

export function isPublicRoute(pathname: string): boolean {
  return AUTH_CONFIG.PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route)
  );
}

export function getRedirectUrl(intendedUrl?: string): string {
  // If there's an intended URL and it's a protected route, use it
  if (intendedUrl && isProtectedRoute(intendedUrl)) {
    return intendedUrl;
  }

  // Otherwise, redirect to dashboard
  return AUTH_CONFIG.DEFAULT_REDIRECT_AFTER_LOGIN;
}

// Auth state types
export type AuthStateType = "loading" | "authenticated" | "unauthenticated";

// Auth error codes
export const AUTH_ERRORS = {
  INVALID_EMAIL: "invalid_email",
  EMAIL_NOT_CONFIRMED: "email_not_confirmed",
  TOO_MANY_REQUESTS: "too_many_requests",
  USER_NOT_FOUND: "user_not_found",
  NETWORK_ERROR: "network_error",
  UNKNOWN_ERROR: "unknown_error",
} as const;

export type AuthErrorCode = (typeof AUTH_ERRORS)[keyof typeof AUTH_ERRORS];

// Helper to get user-friendly error messages
export function getAuthErrorMessage(error: string): string {
  switch (error) {
    case AUTH_ERRORS.INVALID_EMAIL:
      return "Please enter a valid email address.";
    case AUTH_ERRORS.EMAIL_NOT_CONFIRMED:
      return "Please check your email and click the confirmation link.";
    case AUTH_ERRORS.TOO_MANY_REQUESTS:
      return "Too many requests. Please wait a moment before trying again.";
    case AUTH_ERRORS.USER_NOT_FOUND:
      return "No account found with this email address.";
    case AUTH_ERRORS.NETWORK_ERROR:
      return "Network error. Please check your connection and try again.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
}
