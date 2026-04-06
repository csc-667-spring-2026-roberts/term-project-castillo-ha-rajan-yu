import "express-session";

// Extend express-session typings so `req.session.user` is type-safe everywhere.
declare module "express-session" {
  interface SessionData {
    // Minimal identity payload stored in the server-side session.
    user?: {
      id: number;
      email: string;
      display_name: string;
    };
  }
}
