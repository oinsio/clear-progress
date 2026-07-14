import { runAllChecks } from "./run";

const { errors, duplicateGroups } = runAllChecks();

if (duplicateGroups.size > 0) {
  console.log("\n--- Duplicate values (informational) ---");
  for (const [value, keys] of duplicateGroups) {
    console.log(`  "${value}": ${keys.join(", ")}`);
  }
  console.log("");
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`[${error.kind}] ${error.key} — ${error.detail}`);
  }
  console.error(`\ni18n-check: ${errors.length} errors`);
  process.exit(1);
}

console.log("i18n-check: OK");
