#!/usr/bin/env bash
# sonar-check.sh — Run SonarQube analysis, wait for results, and fetch issues.
# Usage: ./scripts/sonar-check.sh [--fix-only]
#   --fix-only  Skip tests and scan; only fetch existing issues (useful after a fix cycle).

set -euo pipefail

###############################################################################
# Load .env if present (secrets and local overrides)
###############################################################################
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ -f "$PROJECT_ROOT/.env" ]]; then
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
fi

###############################################################################
# Configuration (override via environment variables or .env)
###############################################################################
SONAR_HOST_URL="${SONAR_HOST_URL:-http://localhost:9000}"
SONAR_PROJECT_KEY="${SONAR_PROJECT_KEY:-my-project}"
SONAR_TOKEN="${SONAR_TOKEN:-}"
SONAR_POLL_INTERVAL="${SONAR_POLL_INTERVAL:-3}"   # seconds between status checks
SONAR_POLL_TIMEOUT="${SONAR_POLL_TIMEOUT:-120}"   # max seconds to wait for analysis

###############################################################################
# Helpers
###############################################################################
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info()  { echo -e "${GREEN}[sonar]${NC} $*"; }
warn()  { echo -e "${YELLOW}[sonar]${NC} $*"; }
error() { echo -e "${RED}[sonar]${NC} $*" >&2; }

curl_auth_args=()
if [[ -n "$SONAR_TOKEN" ]]; then
  curl_auth_args=(-u "${SONAR_TOKEN}:")
fi

check_sonar_running() {
  if ! curl -sf "${SONAR_HOST_URL}/api/system/status" > /dev/null 2>&1; then
    error "SonarQube is not reachable at ${SONAR_HOST_URL}"
    error "Make sure the SonarQube container is running:"
    error "  docker run -d --name sonarqube -p 9000:9000 sonarqube:lts-community"
    exit 1
  fi
}

###############################################################################
# Step 1: Run tests with coverage
###############################################################################
run_tests() {
  info "Running backend tests with coverage..."
  (cd "$PROJECT_ROOT/backend" && npx vitest run --coverage 2>&1) || {
    warn "Some backend tests failed. Continuing with SonarQube analysis..."
  }

  info "Running frontend tests with coverage..."
  (cd "$PROJECT_ROOT/frontend" && npx vitest run --coverage 2>&1) || {
    warn "Some frontend tests failed. Continuing with SonarQube analysis..."
  }
}

###############################################################################
# Step 2: Run SonarQube scanner
###############################################################################
run_scan() {
  info "Starting SonarQube scan..."
  npx sonar-scanner \
    -Dsonar.host.url="${SONAR_HOST_URL}" \
    -Dsonar.projectKey="${SONAR_PROJECT_KEY}" \
    ${SONAR_TOKEN:+-Dsonar.token="${SONAR_TOKEN}"} \
    2>&1

  # shellcheck disable=SC2181
  if [[ $? -ne 0 ]]; then
    error "SonarQube scan failed."
    exit 1
  fi
}

###############################################################################
# Step 3: Wait for analysis to complete
###############################################################################
wait_for_analysis() {
  info "Waiting for SonarQube to process results..."
  local elapsed=0

  while (( elapsed < SONAR_POLL_TIMEOUT )); do
    local pending
    pending=$(curl -sf "${curl_auth_args[@]}" \
      "${SONAR_HOST_URL}/api/ce/activity?status=PENDING,IN_PROGRESS" \
      | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('tasks',[])))" 2>/dev/null || echo "error")

    if [[ "$pending" == "0" ]]; then
      info "Analysis complete."
      return 0
    elif [[ "$pending" == "error" ]]; then
      warn "Could not check analysis status. Retrying..."
    fi

    sleep "$SONAR_POLL_INTERVAL"
    elapsed=$(( elapsed + SONAR_POLL_INTERVAL ))
  done

  error "Timed out waiting for analysis (${SONAR_POLL_TIMEOUT}s)."
  exit 1
}

###############################################################################
# Step 4: Fetch and display issues
###############################################################################
fetch_issues() {
  info "Fetching issues for project '${SONAR_PROJECT_KEY}'..."

  local response
  response=$(curl -sf "${curl_auth_args[@]}" \
    "${SONAR_HOST_URL}/api/issues/search?projectKeys=${SONAR_PROJECT_KEY}&statuses=OPEN&ps=100&severities=BLOCKER,CRITICAL,MAJOR,MINOR,INFO")

  if [[ -z "$response" ]]; then
    error "Failed to fetch issues from SonarQube API."
    exit 1
  fi

  local total
  total=$(echo "$response" | python3 -c "import sys,json; print(json.loads(sys.stdin.read(), strict=False).get('total',0))")

  if [[ "$total" == "0" ]]; then
    info "No open issues found. Code is clean!"
    exit 0
  fi

  warn "Found ${total} open issue(s):"
  echo ""

  echo "$response" | python3 -c "
import sys, json

data = json.loads(sys.stdin.read(), strict=False)
issues = data.get('issues', [])

severity_order = {'BLOCKER': 0, 'CRITICAL': 1, 'MAJOR': 2, 'MINOR': 3, 'INFO': 4}
issues.sort(key=lambda i: severity_order.get(i.get('severity', 'INFO'), 5))

severity_counts = {}
for issue in issues:
    sev = issue.get('severity', 'UNKNOWN')
    severity_counts[sev] = severity_counts.get(sev, 0) + 1

print('Summary:')
for sev in ['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'INFO']:
    count = severity_counts.get(sev, 0)
    if count > 0:
        print(f'  {sev}: {count}')
print()

for issue in issues:
    severity = issue.get('severity', 'UNKNOWN')
    message  = issue.get('message', 'No message')
    rule     = issue.get('rule', 'unknown')
    comp     = issue.get('component', '').split(':')[-1]
    line     = issue.get('textRange', {}).get('startLine', '?')

    print(f'[{severity}] {comp}:{line}')
    print(f'  Rule:    {rule}')
    print(f'  Message: {message}')
    print()
"

  # Return non-zero if there are BLOCKER or CRITICAL issues
  local blockers
  blockers=$(echo "$response" | python3 -c "
import sys, json
data = json.loads(sys.stdin.read(), strict=False)
count = sum(1 for i in data.get('issues',[]) if i.get('severity') in ('BLOCKER','CRITICAL','MAJOR'))
print(count)
")

  if [[ "$blockers" -gt 0 ]]; then
    error "${blockers} BLOCKER/CRITICAL/MAJOR issue(s) found. These must be fixed."
    exit 1
  else
    warn "No BLOCKER/CRITICAL issues, but review MINOR issues above."
    exit 0
  fi
}

###############################################################################
# Main
###############################################################################
main() {
  check_sonar_running

  if [[ "${1:-}" == "--fix-only" ]]; then
    info "Fix-only mode: skipping tests and scan."
    fetch_issues
    return
  fi

  run_tests
  run_scan
  wait_for_analysis
  fetch_issues
}

main "$@"