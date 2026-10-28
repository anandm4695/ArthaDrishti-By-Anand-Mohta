#!/usr/bin/env bash
set -euo pipefail

# Deploy to production from local main branch and prune superseded Vercel deployments.
# Usage:
#   ./promote-to-live.sh

BRANCH="main"
LIVE_REMOTE="origin"
VERCEL_PROJECT="arthadrishti-by-anand-mohta"

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  echo "✖ Error: promote-to-live.sh must be run from '$BRANCH' (current: '$CURRENT_BRANCH')."
  exit 1
fi

echo "→ Pushing to $LIVE_REMOTE/$BRANCH ..."
git push "$LIVE_REMOTE" "$BRANCH"

if command -v vercel >/dev/null 2>&1; then
  echo "→ Pruning superseded Vercel deployments to keep Deployment Storage clean ..."
  vercel remove --safe --yes "$VERCEL_PROJECT" >/dev/null 2>&1 || true
fi

echo "✓ Production deployed — https://arthadrishti-app.vercel.app"
