# Parameters:
# $1 - Path to the source code folder that should be scanned
# $2 - Path to the assets folder
# $3 - Path to the output folder where scan results should be stored

set -e

trap cleanup TERM INT

cleanup()
{
  PID=$(cat $3/depscan.cid)
  docker stop $PID
  rm $3/depscan.cid
  exit 1
}

docker run --cidfile $3/depscan.cid --rm -v $1:/app -v $2:/input -v $3:/output ghcr.io/eurekadevsecops/radar-depscan 2>&1
