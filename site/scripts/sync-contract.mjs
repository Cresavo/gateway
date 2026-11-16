// Keeps the published OpenAPI file identical to the gateway's own contract.
// The gateway repository root is the single source of truth; the committed copy
// in public/ is only a fallback for builds that cannot see files outside site/.
import { copyFile, readFile } from "node:fs/promises";

const source = new URL("../../openapi.yaml", import.meta.url);
const target = new URL("../public/openapi.yaml", import.meta.url);

try {
  const [a, b] = await Promise.all([readFile(source, "utf8"), readFile(target, "utf8").catch(() => "")]);
  if (a !== b) {
    await copyFile(source, target);
    console.log("sync-contract: public/openapi.yaml updated from gateway openapi.yaml");
  } else {
    console.log("sync-contract: public/openapi.yaml already matches gateway openapi.yaml");
  }
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
  console.warn("sync-contract: gateway openapi.yaml not reachable; using committed copy");
}
