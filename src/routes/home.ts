import { Router } from "express";

const router = Router();

// Landing route routes users to the correct auth state entry point.
router.get("/", (req, res) => {
  // Logged-in users should go straight to the protected lobby.
  if (req.session.user) {
    res.redirect("/lobby");
    return;
  }

  // Guests are directed to the login page.
  res.redirect("/auth/login");
});

export default router;
