import type { NextFunction, Request, Response } from "express";

// Blocks access to protected routes unless a session user exists.
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.user) {
    res.redirect("/auth/login");
    return;
  }

  next();
}

// Keeps authenticated users out of guest-only pages like login/register.
export function requireGuest(req: Request, res: Response, next: NextFunction): void {
  if (req.session.user) {
    res.redirect("/lobby");
    return;
  }

  next();
}
