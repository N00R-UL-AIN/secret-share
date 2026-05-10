// Main Express application setup with security middleware and routes
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const compression = require("compression");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const { securityConfig } = require("../config/securityConfig");
const { globalLimiter } = require("./middleware/rateLimiter");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const authRoutes = require("./routes/auth");
const secretRoutes = require("./routes/secret");

const app = express();

// Trust proxy for accurate IP addresses behind load balancers
app.set("trust proxy", 1);

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development origins
      const isLocalDevOrigin =
        typeof origin === "string" &&
        /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

      if (process.env.NODE_ENV !== "production" && isLocalDevOrigin) {
        return callback(null, true);
      }

      // Check against allowed origins in production
      if (!origin || securityConfig.cors.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting
app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(cookieParser());

// Data sanitization
app.use(mongoSanitize());

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      skip: (req, res) => res.statusCode < 400,
    })
  );
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, status: "healthy" });
});

// API documentation page
app.get("/", (req, res) => {
  res.status(200).type("html").send(getApiDocsHTML());
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/secrets", secretRoutes);

// Error handling 
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

// Generate HTML for API documentation
function getApiDocsHTML() {
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Secure Share API</title>
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0;
        font-family: Segoe UI, Arial, sans-serif;
        background: #0b1020;
        color: #e2e8f0;
      }
      .wrap {
        max-width: 760px;
        margin: 0 auto;
        padding: 48px 20px;
      }
      .card {
        background: #111827;
        border: 1px solid #1f2937;
        border-radius: 14px;
        padding: 24px;
      }
      h1 { margin: 0 0 10px; font-size: 1.8rem; }
      p { margin: 0 0 18px; color: #94a3b8; }
      .pill {
        display: inline-block;
        margin-bottom: 16px;
        background: #1d4ed8;
        color: #dbeafe;
        font-weight: 600;
        border-radius: 999px;
        padding: 6px 12px;
        font-size: 12px;
      }
      ul { margin: 0; padding-left: 18px; }
      li { margin: 8px 0; }
      a { color: #93c5fd; text-decoration: none; }
      code {
        background: #0f172a;
        border: 1px solid #1e293b;
        padding: 2px 6px;
        border-radius: 6px;
      }
    </style>
  </head>
  <body>
    <main class="wrap">
      <section class="card">
        <span class="pill">Secure Share Backend</span>
        <h1>Home Route is Active</h1>
        <p>The API server is running. Use the routes below to interact with the application.</p>
        <ul>
          <li><a href="/api/health"><code>GET /api/health</code></a> - service health check</li>
          <li><code>POST /api/auth/register</code> - create account</li>
          <li><code>POST /api/auth/login</code> - sign in</li>
          <li><code>POST /api/secrets</code> - create one-time secret</li>
          <li><code>GET /api/secrets/:secretId</code> - secret metadata</li>
          <li><code>POST /api/secrets/:secretId/view</code> - reveal and destroy secret</li>
        </ul>
      </section>
    </main>
  </body>
</html>
  `;
}