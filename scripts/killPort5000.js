#!/usr/bin/env node
// Kill any process on port 5000 before starting backend
const { exec } = require("child_process");
const os = require("os");

function killProcessOnPort(port) {
  return new Promise((resolve) => {
    if (os.platform() === "win32") {
      // Windows command to find and kill process on port
      exec(
        `netstat -ano | findstr :${port}`,
        (error, stdout) => {
          if (error || !stdout) {
            console.log(`No process found on port ${port}`);
            resolve();
            return;
          }

          const lines = stdout.split("\n");
          const pids = new Set();

          lines.forEach((line) => {
            const match = line.match(/LISTENING\s+(\d+)/);
            if (match) {
              pids.add(match[1]);
            }
          });

          if (pids.size === 0) {
            console.log(`No listening process found on port ${port}`);
            resolve();
            return;
          }

          let killed = 0;
          pids.forEach((pid) => {
            exec(`taskkill /PID ${pid} /F`, (err) => {
              killed++;
              if (!err) {
                console.log(`Killed process ${pid} on port ${port}`);
              } else {
                console.warn(`Failed to kill process ${pid}: ${err.message}`);
              }

              if (killed === pids.size) {
                resolve();
              }
            });
          });
        }
      );
    } else {
      // Unix/Mac command
      exec(
        `lsof -ti:${port} | xargs kill -9 2>/dev/null || true`,
        () => {
          console.log(`Cleared port ${port}`);
          resolve();
        }
      );
    }
  });
}

// Kill process on port 5000 and then exit so npm start can begin
killProcessOnPort(5000).then(() => {
  process.exit(0);
});
