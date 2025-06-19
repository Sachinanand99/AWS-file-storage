const express = require("express");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const ejsMate = require("ejs-mate");
require("dotenv").config();
require("./config/oauthConfig");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const fileRoutes = require("./routes/fileRoutes");

const app = express();

app.use(cors());
app.use(
  session({ secret: "secretkey", resave: false, saveUninitialized: true })
);
app.use(passport.initialize());
app.use(passport.session());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

app.use("/auth", authRoutes);
app.use("/", fileRoutes);

app.get("/dashboard", (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/");
  res.render("layout", {
    content: "dashboard",
    user: req.user,
  });
});

app.get("/", (req, res) => res.render("login"));

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
