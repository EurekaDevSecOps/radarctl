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
  if [ -f "$OUTPUT/spdx.cid" ]; then
    PID=$(cat "$OUTPUT/spdx.cid")
    docker stop "$PID" >/dev/null 2>&1 || true
    rm -f "$OUTPUT/spdx.cid"
  fi
  exit 1
}

IMAGE=cyclonedx/cyclonedx-cli:0.30.0
FALLBACK_PLATFORM=linux/amd64

convert()
{
  "$1" convert \
    --input-file "$OUTPUT/sbom.cdx.json" \
    --input-format json \
    --output-file "$OUTPUT/sbom.spdx.json" \
    --output-format spdxjson
}

convert_with_docker()
{
  if [ -n "$1" ]; then
    PLATFORM_ARGS="--platform $1"
  else
    PLATFORM_ARGS=""
  fi

  # shellcheck disable=SC2086
  docker run \
    $PLATFORM_ARGS \
    --cidfile "$OUTPUT/spdx.cid" \
    --rm \
    -v "$OUTPUT:/output:rw" \
    "$IMAGE" \
    convert \
    --input-file /output/sbom.cdx.json \
    --input-format json \
    --output-file /output/sbom.spdx.json \
    --output-format spdxjson \
    2>&1
}

if command -v cyclonedx >/dev/null 2>&1; then
  convert cyclonedx
  exit 0
fi

if command -v cyclonedx-cli >/dev/null 2>&1; then
  convert cyclonedx-cli
  exit 0
fi

PLATFORM=

if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
  if ! docker pull --quiet "$IMAGE" >/dev/null; then
    PLATFORM="$FALLBACK_PLATFORM"
    docker pull --platform "$PLATFORM" --quiet "$IMAGE" >/dev/null
  fi
fi

convert_with_docker "$PLATFORM"
