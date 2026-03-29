#!/usr/bin/env node
/**
 * vendor_bootstrap.js — Track S1
 *
 * Downloads Bootstrap 5.3.3 SCSS source from the official npm registry and
 * extracts it to addons/web/static/lib/bootstrap/scss/.
 *
 * Usage:
 *   npm run vendor:bootstrap
 *
 * The stub files already placed in lib/bootstrap/scss/ are replaced by the
 * real Bootstrap SCSS so that `npm run build:css` produces a full stylesheet.
 */

const https = require("https");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const BOOTSTRAP_VERSION = "5.3.3";
const TARGET_DIR = path.join(__dirname, "../addons/web/static/lib/bootstrap/scss");

function log(msg) { process.stdout.write("[vendor:bootstrap] " + msg + "\n"); }

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** Quote path for POSIX shell (spaces, parens in workspace path). */
function shQuote(p) {
  return "'" + String(p).replace(/'/g, "'\"'\"'") + "'";
}

async function main() {
  log(`Vendoring Bootstrap ${BOOTSTRAP_VERSION} SCSS…`);

  // Strategy 1: use npm pack + tar if available
  try {
    const tmpDir = path.join(require("os").tmpdir(), "erp-bootstrap-vendor");
    ensureDir(tmpDir);

    log("Fetching from npm registry via npm pack…");
    execSync(`npm pack bootstrap@${BOOTSTRAP_VERSION} --pack-destination ${shQuote(tmpDir)}`, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    const tarFile = fs.readdirSync(tmpDir).find((f) => f.startsWith("bootstrap-"));
    if (!tarFile) throw new Error("npm pack did not produce a tarball");

    execSync(`tar -xzf ${shQuote(path.join(tmpDir, tarFile))} -C ${shQuote(tmpDir)}`, { stdio: "ignore" });
    const scssSource = path.join(tmpDir, "package", "scss");
    if (!fs.existsSync(scssSource)) throw new Error("SCSS source not found after extraction");

    ensureDir(TARGET_DIR);
    execSync(`cp -R ${shQuote(path.join(scssSource, "."))} ${shQuote(TARGET_DIR)}`, { stdio: "ignore" });
    log(`✓ Bootstrap ${BOOTSTRAP_VERSION} SCSS vendored to ${TARGET_DIR}`);
    return;
  } catch (e) {
    log(`npm pack strategy failed: ${e.message}`);
    log("Falling back to stub files (build will use minimal Bootstrap scaffold).");
  }

  // Strategy 2: Leave stub files in place
  log("Stub files remain at lib/bootstrap/scss/ — build will use minimal Bootstrap.");
  log("To retry: npm run vendor:bootstrap (requires network access)");
}

main().catch((e) => {
  process.stderr.write("[vendor:bootstrap] Error: " + e.message + "\n");
  process.exit(1);
});
