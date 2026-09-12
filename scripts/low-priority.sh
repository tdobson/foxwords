#!/usr/bin/env bash
set -euo pipefail
exec nice -n 19 ionice -c 2 -n 7 "$@"
