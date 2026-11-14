// Builds a fully static version of the site into /out (for Netlify / any static host).
// API route handlers can't be exported statically, so app/api is set aside during the build
// and always restored. Without them the site behaves exactly as in preview mode:
// checkout and early-access sign-up report that they open at launch.
import { execSync } from "node:child_process";
import { existsSync, renameSync } from "node:fs";

const api = "app/api";
const parked = ".api-parked";
const moved = existsSync(api);
if (moved) renameSync(api, parked);
try {
  execSync("next build", { stdio: "inherit", env: { ...process.env, STATIC_EXPORT: "1" } });
} finally {
  if (moved) renameSync(parked, api);
}
