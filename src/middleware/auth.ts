import type { NextFunction, Request, Response } from "express";
import { wantsJson } from "../utils/http.js";

// M6: middleware protects authenticated-only routes.
export function requireAuth(request: Request, response: Response, next: NextFunction): void {
  if (request.session.user) {
    next();
    return;
  }

  if (wantsJson(request)) {
    response.status(401).json({ error: "Not authenticated." });
    return;
  }

  // M7: browser requests are redirected to login page.
  response.redirect("/auth/login");
}

export function requireGuest(request: Request, response: Response, next: NextFunction): void {
  if (request.session.user) {
    response.redirect("/lobby");
    return;
  }

  next();
}
