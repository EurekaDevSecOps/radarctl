#!/bin/bash

# Parameters:
# $1 - Path to the source code folder that should be scanned
# $2 - Path to the assets folder
# $3 - Path to the output folder where scan results should be stored

# Requirements:
#
# Environment variables VERACODE_API_KEY_ID and VERACODE_API_KEY_SECRET must be set:
# [Veracode Platform](https://docs.veracode.com/r/c_api_credentials3#generate-api-credentials).
#
# EXAMPLE:
# export VERACODE_API_KEY_ID=123456789
# export VERACODE_API_KEY_SECRET=REDACTED
# radar scan /path/to/repo
# (Prefer setting these via your CI/secret manager; avoid typing real secrets into shell history.)
#
# Optional:
#
# (A) The repo has already been packaged for Veracode as per https://docs.veracode.com/r/compilation_packaging
#     and stored into a ZIP file somewhere within the repo. Set the environment variable VERACODE_ZIPFILE to the
#     path/to/repo/veracode-package.zip file, relative to the root folder of the repo.
#
# -or-
#
# (B) Set the environment variable VERACODE_PACKAGE_CMD to the command that can create the Veracode package ZIP.
#     We will run the command from the root of the repo. It should create veracode-package.zip and save it into
#     the root folder of the repo. We will submit this ZIP to Veracode Pipeline SAST scanner for a scan.
#
#     Examples:
#     export VERACODE_PACKAGE_CMD="zip -qr veracode-package.zip lib"
#     export VERACODE_PACKAGE_CMD="npm run build && zip -qr veracode-package.zip dist"
#     export VERACODE_PACKAGE_CMD="make && zip -qr veracode-package.zip out"
#
# -or-
#
# (C) Your project does not need a build step. Omit both VERACODE_ZIPFILE and VERACODE_PACKAGE_CMD. We will
#     automatically ZIP up the repo, excluding any files referenced in .gitignore, and submit to Veracode Pipeline
#     SAST scanner for a scan. This is the default action if you don't set VERACODE_ZIPFILE and VERACODE_PACKAGE_CMD.
#     This is appropriate for interpreted languages (Javascript, Python, etc) that don't need to be compiled.

set -e

if [ "$#" -ne 3 ]; then
  echo "Usage: $0 <source_dir> <assets_dir> <output_dir>" >&2
  exit 1
fi

# Expand relative paths
if ! APP_DIR="$(cd -- "$1" && pwd)"; then
  echo "Error: source directory not found: $1" >&2
  exit 1
fi

if ! CFG_DIR="$(cd -- "$2" && pwd)"; then
  echo "Error: assets directory not found: $2" >&2
  exit 1
fi

if ! OUT_DIR="$(cd -- "$3" && pwd)"; then
  echo "Error: output directory not found: $3" >&2
  exit 1
fi

delete_packaged_zips() {
    # Check for old veracode zips and remove them
    if [ -e ./veracode-auto-pack-*.zip ]
    then
        rm "${APP_DIR}"/veracode-auto-pack-*.zip
    fi
}

new_zip=0
if [[ -z "${VERACODE_ZIPFILE}" ]]; then

  new_zip=1
  install_dir=$(mktemp -d)
  needed_install=0

  # Check if Veracode-CLI is already installed
  if ! command -v veracode >/dev/null 2>&1
  then
      echo "Installing Veracode CLI for auto-packaging"
      needed_install=1
      curl -fsS https://tools.veracode.com/veracode-cli/install -o "$install_dir"/veracode-installer.sh
      (
          cd "$install_dir" &&
          sh "./veracode-installer.sh"
      )

      # Check if installation succeeded
      if [ ! -e "$install_dir"/veracode ]
      then
          echo "Failed to install Veracode CLI" >&2
          exit 1
      fi
  fi

  delete_packaged_zips

  # Packaging repo using Veracode-CLI's autopackager feature
  "$install_dir"/veracode package --trust --type directory --source "${APP_DIR}" --output "${APP_DIR}"
  export VERACODE_ZIPFILE="$(ls "${APP_DIR}"/veracode-auto-pack-*.zip | xargs basename | tr -d '\n')"

fi

# The ghcr.io/eurekadevsecops/radar-veracode-sast image is currently published for linux/amd64 only.
# On non-amd64 hosts (e.g., Apple Silicon), Docker will use emulation which may be slower.
docker run --platform linux/amd64 --rm \
    -v "${APP_DIR}":/opt/eureka/radar/temp/repo \
    -v "${CFG_DIR}":/opt/eureka/radar/temp/input \
    -v "${OUT_DIR}":/opt/eureka/radar/temp/output \
    -e VERACODE_API_KEY_ID="${VERACODE_API_KEY_ID}" \
    -e VERACODE_API_KEY_SECRET="${VERACODE_API_KEY_SECRET}" \
    -e VERACODE_ZIPFILE="${VERACODE_ZIPFILE}" \
    -e VERACODE_PACKAGE_CMD="${VERACODE_PACKAGE_CMD}" \
    ghcr.io/eurekadevsecops/radar-veracode-sast 2>&1

if [ "$new_zip" = "1" ]; then
  # Clean up
  if [ "$needed_install" = "1" ]
  then
      rm -rf "$install_dir"
      rm -rf /tmp/veracode-cli.*
  fi
  delete_packaged_zips
fi
