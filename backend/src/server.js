// Server entry point - initializes and starts the Express application
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { validateSecurityConfig } = require("../config/securityConfig");
const { connectDB } = require("../config/database");
const { killProcessOnPort } = require("../utils/portManager");
const app = require("./app");

const PORT = 5000; // Fixed port

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createServerInstance(retry = true) {
  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
      resolve(server);
    });

    server.on("error", async (err) => {
      if (err.code === "EADDRINUSE" && retry) {
        console.warn(`Port ${PORT} is already in use. Attempting to release it and retry...`);
        await killProcessOnPort(PORT);
        await wait(1000);
        try {
          const retryServer = await createServerInstance(false);
          resolve(retryServer);
        } catch (retryErr) {
          reject(retryErr);
        }
        return;
      }

      reject(err);
    });
  });
}

async function start() {
  try {
    console.log(`Attempting to use port ${PORT}...`);

    // Kill any existing process on the port before starting
    await killProcessOnPort(PORT);
    await wait(1000);

    // Validate security configuration before starting
    validateSecurityConfig();
    await connectDB();

    const server = await createServerInstance();

    // Graceful shutdown handlers
    function shutdown(signal, callback) {
      console.log(`${signal} received. Shutting down gracefully.`);
      server.close(() => {
        console.log("HTTP server closed.");
        if (callback) {
          callback();
        } else {
          process.exit(0);
        }
      });
    }

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGUSR2", () => shutdown("SIGUSR2", () => process.kill(process.pid, "SIGUSR2")));

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason) => {
      console.error("Unhandled rejection:", reason);
      server.close(() => process.exit(1));
    });
  } catch (err) {
    console.error("Startup failed:", err.message);
    process.exit(1);
  }
}

start();