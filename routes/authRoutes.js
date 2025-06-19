const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.get("/google", authController.googleAuth);

router.get(
  "/google/callback",
  authController.googleAuthCallback,
  (req, res) => {
    res.redirect("/dashboard");
  }
);

router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});



module.exports = router;
