#!/bin/sh

# Parameters:
# $1 - Path to the source code folder that should be scanned
# $2 - Path to the SBOM tool assets folder
# $3 - Path to the output folder where the SBOM should be stored

set -e

OUTPUT="$3"

trap cleanup TERM INT

cleanup()
{
  if [ -f "$OUTPUT/cdxgen.cid" ]; then
    PID=$(cat "$OUTPUT/cdxgen.cid")
    docker stop "$PID"
    rm "$OUTPUT/cdxgen.cid"
  fi
  exit 1
}

IMAGE=ghcr.io/cyclonedx/cdxgen:v12.2.0

if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
  docker pull --quiet "$IMAGE" >/dev/null
fi

docker run \
  --cidfile "$3/cdxgen.cid" \
  --rm \
  -v "$1:/src:ro" \
  -v "$3:/output:rw" \
  --entrypoint sh \
  "$IMAGE" \
  -lc 'set -eu; cd /src; cdxgen -r . -o /output/sbom.cdx.json --no-install-deps --exclude-type github --exclude-type cloudbuild --exclude-type jenkins' \
  2>&1
