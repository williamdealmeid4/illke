import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile, chmod, access } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
process.chdir(root);
const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};
async function download(url, path) {
  const response = await fetch(url, { signal: AbortSignal.timeout(180000) });
  if (!response.ok) throw Error("Falha no download: " + response.status);
  await writeFile(path, Buffer.from(await response.arrayBuffer()));
}
let php =
  spawnSync("php", ["-v"], { stdio: "ignore" }).status === 0
    ? "php"
    : resolve(root, ".runtime/php");
await mkdir(".runtime", { recursive: true });
if (php !== "php" && !(await exists(php))) {
  if (process.platform !== "linux")
    throw Error(
      "Instale PHP 8.5 e Composer: https://laravel.com/docs/13.x/installation",
    );
  const arch =
    process.arch === "x64" ? "x64" : process.arch === "arm64" ? "arm64" : null;
  if (!arch) throw Error("Instale PHP 8.5 para sua arquitetura.");
  console.log("Preparando PHP 8.5 portátil (fonte php.new / Laravel).");
  await download(
    `https://download.herdphp.com/herd-lite/linux/${arch}/8.5/php`,
    php,
  );
  await chmod(php, 0o755);
}
const composerSystem =
  spawnSync("composer", ["--version"], { stdio: "ignore" }).status === 0;
if (!composerSystem && !(await exists(".runtime/composer.phar")))
  await download(
    "https://getcomposer.org/download/latest-stable/composer.phar",
    ".runtime/composer.phar",
  );
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: {
      ...process.env,
      PATH: resolve(root, ".runtime") + ":" + process.env.PATH,
    },
  });
  if (result.status !== 0)
    throw Error("O comando falhou: " + command + " " + args.join(" "));
}
const api = resolve(root, "apps/api");
run(
  composerSystem ? "composer" : php,
  composerSystem
    ? ["install", "--no-interaction"]
    : [resolve(root, ".runtime/composer.phar"), "install", "--no-interaction"],
  api,
);
if (!(await exists("apps/api/.env")))
  await writeFile("apps/api/.env", await readFile("apps/api/.env.example"));
let env = await readFile("apps/api/.env", "utf8");
let secret = env.match(/^ENGINE_TOKEN=(.+)$/m)?.[1];
if (!secret) {
  secret = randomBytes(32).toString("hex");
  env = env.replace(/^ENGINE_TOKEN=.*\n?/m, "");
  env += "\nENGINE_TOKEN=" + secret + "\n";
  await writeFile("apps/api/.env", env);
}
if (!(await exists("services/battle-engine/.env")))
  await writeFile(
    "services/battle-engine/.env",
    "ENGINE_PORT=8081\nENGINE_TOKEN=" + secret + "\n",
  );
if (!/^APP_KEY=.+$/m.test(env))
  run(php, ["artisan", "key:generate", "--no-interaction"], api);
if (
  (!/^DB_CONNECTION=/m.test(env) || /^DB_CONNECTION=sqlite$/m.test(env)) &&
  !(await exists("apps/api/database/database.sqlite"))
)
  await writeFile("apps/api/database/database.sqlite", "");
run(php, ["artisan", "migrate", "--no-interaction"], api);
if (!(await exists(".data/catalog.json"))) await import("./sync-data.mjs");
run(php, ["artisan", "catalog:import"], api);
console.log("Pronto. Execute npm run dev e abra http://127.0.0.1:5186.");
