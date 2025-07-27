import express from "express";
import "dotenv/config";
import authRoutes from "./routes/auth.routes.js";
import problemRoutes from "./routes/problem.routes.js";
import executeRoutes from "./routes/executeProblem.routes.js";
import submissionRoutes from "./routes/submission.routes.js";
import problemSheetRoutes from "./routes/problemSheet.routes.js";
import cookieParser from "cookie-parser";
import { logger } from "./utils/logger.js";
import session from "express-session";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import crypto from "crypto";
import cors from "cors";
import { db } from "./db/db.js";
const app = express();
const PORT = process.env.PORT;
app.use(express.json());
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://brainexe.jaydipsatani.com"],
    credentials: true,
  })
);
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        let user = await db.User.findUnique({
          where: { email },
        });

        if (!user) {
          // Generate unique name
          const baseName = profile.displayName
            .toLowerCase()
            .replace(/\s+/g, "");
          let finalName = baseName;
          let count = 1;

          while (await db.User.findUnique({ where: { name: finalName } })) {
            finalName = `${baseName}${count++}`;
          }
          const randomPassword = crypto.randomBytes(32).toString("hex");

          user = await db.User.create({
            data: {
              name: finalName,
              email,
              image: profile.photos?.[0]?.value,
              userVerified: true,
              password: randomPassword,
            },
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => done(null, user));
app.use(cookieParser());
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);
app.get(
  "/auth/google/callback",
  (req, res, next) => {
    if (req.query.error === "access_denied") {
      return res.redirect("http://localhost:5173/login?error=access_denied");
    }
    next(); // Continue to passport.authenticate if no error
  },
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/login?error=auth_failed",
  }),
  (req, res) => {
    const { id, name, email } = req.user;

    const token = jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_TOKEN_EXPIRY,
    });

    const cookieOption = {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };

    res.cookie("authToken", token, cookieOption);

    res.redirect(
      `http://localhost:5173/auth/success/${encodeURIComponent(name)}/${encodeURIComponent(email)}`
    );
  }
);

app.use(
  "/api/v1/auth",
  express.raw({ type: "application/octet-stream" }),
  authRoutes
);
app.use(
  "/api/v1/problem",
  express.raw({ type: "application/octet-stream" }),
  problemRoutes
);
app.use(
  "/api/v1/execute-problem",
  express.raw({ type: "application/octet-stream" }),
  executeRoutes
);
app.use("/api/v1/submission", submissionRoutes);
app.use("/api/v1/problem-sheet", problemSheetRoutes);
app.listen(PORT, () => logger.info(`Server started successfully on ${PORT}`));
