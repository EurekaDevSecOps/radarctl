#/bin/bash

set -e

# Parameters:
# $1 - Path to the source code folder that should be scanned
# $2 - Path to the assets folder
# $3 - Path to the output folder where scan results should be stored
###


# Expand relative paths
APP_DIR=$(cd $1; pwd)
CFG_DIR=$(cd $2; pwd)
OUT_DIR=$(cd $3; pwd)

if [[ -z "$SNYK_TOKEN" ]]; then
    echo "Missing environment variable SNYK_TOKEN containing Snyk API key"
    exit 1
fi

DETECT_LANGS_SCRIPT=/tmp/detect-langs.js
docker run --rm ghcr.io/eurekadevsecops/snyk-helper export-detectlangs > ${DETECT_LANGS_SCRIPT}
export SNYK_LANGS=$(node ${DETECT_LANGS_SCRIPT} "${APP_DIR}")

# Snyk deprecates, but never removes, outdated images. Here we fetch the list of supported images.
SNYK_IMAGES_ALPINE_URL="https://raw.githubusercontent.com/snyk/snyk-images/refs/heads/master/alpine"
SNYK_IMAGES_LINUX_URL="https://raw.githubusercontent.com/snyk/snyk-images/refs/heads/master/linux"
SNYK_IMAGE_LIST_ALL_FILE="snyk-images-all.txt"
SNYK_IMAGE_LIST_DEPRECATED_FILE="snyk-images-dep.txt"
touch $SNYK_IMAGE_LIST_DEPRECATED_FILE # Prevents grep (in the for-loop) from failing if wget fails
wget -qO $SNYK_IMAGE_LIST_ALL_FILE $SNYK_IMAGES_ALPINE_URL $SNYK_IMAGES_LINUX_URL \
&& grep DEPRECATED $SNYK_IMAGE_LIST_ALL_FILE | cut -d ' ' -f2 > $SNYK_IMAGE_LIST_DEPRECATED_FILE \
|| true # Don't fail if the list is unavailable

if [ -z "$EACH_FILE" ]; then
    SNYK_LANGS=$(echo "$SNYK_LANGS" | tr ' ' '\n' | cut -d ':' -f1 | uniq | tr '\n' ' ')
fi

SNYK_LANGS_COUNT=$(echo "$SNYK_LANGS" | wc -w | tr -d ' ' | tr -d '\n')

echo "[Snyk] Discovered ${SNYK_LANGS_COUNT} package files for the following:"

echo $SNYK_LANGS | awk '{for (i=1; i<=NF; i++) print "\t"i") "$i}'

for SLF in $SNYK_LANGS; do
    SL=$(printf '%s' "$SLF" | cut -d ':' -f1)

    echo "[Snyk] Scanning ${SL} packages."
    FILE_SELECTOR="--all-projects"

    if [ -n "$EACH_FILE" ]; then
        SF=$(printf '%s' "$SLF" | cut -d ':' -f2)
        echo "[Snyk] Using package file \"${SF}\""
        FILE_SELECTOR="--file=${SF}"

        if [ "$SL" = "python" ]; then
            FILE_SELECTOR="${FILE_SELECTOR} --package-manager=pip"
        fi
    fi

    if grep -qe "^${SL}$" $SNYK_IMAGE_LIST_DEPRECATED_FILE; then
        echo "[Snyk] Language or Framework not currently supported by Snyk. Falling back to legacy Snyk image."
    fi
    
    docker run --rm \
        -v "${APP_DIR}":/app \
        -v "${CFG_DIR}":/tmp/radar-input \
        -v "${OUT_DIR}":/tmp/radar-output \
        -e SNYK_TOKEN=${SNYK_TOKEN} \
        snyk/snyk:${SL} snyk test \
        --sarif-file-output="/tmp/radar-output/snyk-${SL}-$(date +%s).sarif" \
        $FILE_SELECTOR || true # Continue loop if Snyk exits non-zero, which happens when there are findings
        
done

if [[ $SNYK_LANGS_COUNT -gt 1 ]]; then
    echo "[Snyk] Joining results into single file for ingestion."
    
    docker run --rm -v "${OUT_DIR}":/tmp/sarifs ghcr.io/eurekadevsecops/snyk-helper joinsarifs /tmp/sarifs
fi