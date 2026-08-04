import { rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

try {
  rmSync(path.join(projectRoot, ".next"), { recursive: true, force: true });
} catch {
  // best-effort
}

const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const forwardedArgs = process.argv.slice(2);
const devArgs =
  forwardedArgs.length > 0
    ? ["dev", ...forwardedArgs]
    : [
        "dev",
        "--hostname",
        "127.0.0.1",
        "--port",
        process.env.PORT ?? "3000",
      ];

const child = spawn(
  process.execPath,
  [nextBin, ...devArgs],
  {
    cwd: projectRoot,
    stdio: "inherit",
    env: process.env,
  },
);

child.on("exit", (code) => process.exit(code ?? 1));
