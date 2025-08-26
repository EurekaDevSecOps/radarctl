# Parameters:
# $1 - Path to the source code folder that should be scanned
# $2 - Path to the assets folder
# $3 - Path to the output folder where scan results should be stored

set -e
docker run --rm -v $1:/app -v $2:/input -v $3:/output ghcr.io/eurekadevsecops/radar-depscan 2>&1
cp $3/depscan/depscan.sarif $3/depscan.sarif
