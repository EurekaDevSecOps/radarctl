# Scanners

Scanner manifest file is located in `scanners/scanners.toml`. Every scanner has a section that looks a lot like this:

```toml
[[scanners]]
name = "opengrep"
title = "Opengrep"
description = "Ultra-fast static analysis tool."
categories = [ "SAST" ]
cmd = "${assets}/run.sh ${target} ${assets} ${output}"

```

The `name` field contains the scanner identifier that radarctl uses internally. Any command-line arguments or options for radarctl that take in a scanner always expect this scanner identifier. The `categories` field is an array of categories that the scanner can be part of. Usually takes on one or more values of SCA, SAST, and DAST. The `cmd` field is the command to run to launch the scanner.

Each scanner has its own subfolder with the `scanners` directory with the shell script that launches the scanner and any other files needed for scanner operation. An example shell script looks like this:

```bash
# Parameters:
# $1 - Path to the source code folder that should be scanned
# $2 - Path to the assets folder
# $3 - Path to the output folder where scan results should be stored

set -e
docker run --rm -t -v $1:/app -v $2:/input -v $3:/home/output radar/opengrep:latest /app 2>&1
```

The assets folder is the scanner's subfolder within the `scanners` directory. The output folder is a system temporary folder that is deleted when the scan terminates, successfully or not.


# Development flow

## Linting

With the trifecta of the development process nearly complete, let's talk about linting. The linter we run is [golangci-lint](https://golangci-lint.run/). It helps with finding potential bugs in programs, as well as helping you follow standard go conventions. To run it locally, just run `golangci-lint --path-prefix=. run`. If you'd like to run all of our [pre-commit lints](https://pre-commit.com/), then run `pre-commit run --all-files`

# Cutting a release

If you have write access to this repo, you can ship ...

a patch release with:

`npm version patch && npm publish`

a minor release with:

`npm version minor && npm publish`

or a major release with:

`npm version major && npm publish`


# Committing to radarctl

When committing to `radarctl`, there are a few important things to keep in mind:

-   Keep commits small and focused, it helps greatly when reviewing larger PRs
-   Make sure to use descriptive messages in your commit messages, it also helps future people understand why a change was made.
-   PRs are squash merged, so please make sure to use descriptive titles
