const os = require("node:os");
const path = require("node:path");

const getBitbucketCloneDir = () => process.env.BITBUCKET_CLONE_DIR;

const getCiProvider = () => {
  // BitBucket pipelines provides BITBUCKET_CLONE_DIR environment variable, so we can use it to detect if we are running in BitBucket Pipelines
  if (getBitbucketCloneDir()) return "bitbucket";
  return "default";
};

// resolve clone directory based on CI/CD provider or return null if not applicable
const getCloneDir = (provider = getCiProvider()) => {
  switch (provider) {
    case "bitbucket":
      return getBitbucketCloneDir();
    case "default":
    default:
      return null;
  }
};

// resolve scan target based on CI/CD provider or default to current working directory
const resolveScanTarget = (target) => {
  const provider = getCiProvider();
  const cloneDir = getCloneDir(provider);

  switch (provider) {
    case "bitbucket": {
      let resolved = target ?? cloneDir;
      if (!path.isAbsolute(resolved)) {
        resolved = path.join(cloneDir, resolved);
      }
      resolved = path.resolve(path.normalize(resolved));

      const relative = path.relative(cloneDir, resolved);
      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        throw new Error(
          `TARGET must be within BITBUCKET_CLONE_DIR: ${cloneDir}`,
        );
      }

      return resolved;
    }
    case "default":
    default:
      return path.resolve(path.normalize(target ?? process.cwd()));
  }
};

// resolve scans directory based on CI/CD provider or default to ~/.radar/scans
const resolveScansDir = () => {
  const provider = getCiProvider();
  const cloneDir = getCloneDir(provider);

  switch (provider) {
    case "bitbucket":
      return path.join(cloneDir, ".radar", "scans");
    case "default":
    default:
      return path.join(os.homedir(), ".radar", "scans");
  }
};

module.exports = {
  getCiProvider,
  getCloneDir,
  resolveScanTarget,
  resolveScansDir,
};
