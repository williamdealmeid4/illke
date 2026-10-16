import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const php = existsSync(resolve(root, ".runtime/php"))
  ? resolve(root, ".runtime/php")
  : "php";
const commands = [
  [php, ["artisan", "serve", "--host=127.0.0.1", "--port=8000"], "apps/api"],
  [php, ["artisan", "queue:work", "--timeout=600", "--tries=1"], "apps/api"],
  [
    "node",
    ["--env-file-if-exists=.env", "src/server.js"],
    "services/battle-engine",
  ],
  ["npm", ["run", "dev", "--", "--host", "127.0.0.1"], "apps/web"],
];
const children = commands.map(([command, args, cwd]) =>
  spawn(command, args, { cwd: resolve(root, cwd), stdio: "inherit" }),
);
function stop() {
  for (const child of children) child.kill("SIGTERM");
}
for (const child of children) {
  child.on("error", (error) => {
    console.error(error.message);
    stop();
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    if (code) {
      stop();
      process.exitCode = code;
    }
  });
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
