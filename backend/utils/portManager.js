// Utility to kill processes on a specific port (Windows compatible)
const { exec } = require("child_process");
const os = require("os");

function killProcessOnPort(port) {
  return new Promise((resolve, reject) => {
    if (os.platform() === "win32") {
      // Windows command to find and kill process on port
      exec(
        `netstat -ano | findstr :${port}`,
        (error, stdout, stderr) => {
          if (error) {
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

          let processed = 0;
          pids.forEach((pid) => {
            exec(`taskkill /PID ${pid} /F`, (err) => {
              if (err) {
                console.warn(`Failed to kill process ${pid}: ${err.message}`);
              } else {
                console.log(`Killed process ${pid} on port ${port}`);
              }

              processed += 1;
              if (processed === pids.size) {
                resolve();
              }
            });
          });
        }
      );
    } else {
      // Unix/Mac command
      exec(
        `lsof -ti:${port} | xargs kill -9`,
        (error) => {
          if (error) {
            console.log(`No process found on port ${port}`);
            resolve();
          } else {
            console.log(`Killed process on port ${port}`);
            resolve();
          }
        }
      );
    }
  });
}

module.exports = { killProcessOnPort };
