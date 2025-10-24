<div align="center" style="text-align:center;">

<p align="center">
  <img src="assets/radar.png" alt="Eureka Radar Logo" width="320"/>
</p>

# Radar CLI
### One command. Complete AppSec coverage.

<!-- ![Build](https://github.com/eurekadevsecops/radarctl/actions/workflows/test.yml/badge.svg) -->
![Node](https://img.shields.io/badge/Node.js-22.x-blue?logo=node.js)
![npm version](https://img.shields.io/npm/v/@eurekadevsecops/radar?color=2b82f6&label=NPM)
![License](https://img.shields.io/github/license/eurekadevsecops/radarctl?color=green)

</div>

---

## Overview

**Radar CLI** is a command-line tool that orchestrates multiple application security scanners — for code, dependencies, containers, and secrets — in one unified package. We've put a lot of effort into making Radar CLI easy to use for developers and easy to integrate into CI/CD pipelines. Check out our accompanying [GitHub Action for Radar CLI](https://github.com/EurekaDevSecOps/scan-action).

With Radar CLI, you can:
- Run **SAST**, **SCA**, **container**, and **secret scanning** locally or in CI/CD pipelines.
- Generate **unified SARIF reports** compatible with industry-standard security and vulnerability analysis tools.
- Optionally upload results to **Eureka ASPM** for centralized tracking, deduplication, and prioritization.

---

Telemetry is **off by default** — nothing is uploaded unless you explicitly enable it.

---

## Requirements

- **Node.js** 22.17.0 or higher  
- **Docker** (for containerized scanners)

---

## Installation

Install globally using **npm**:

```bash
npm i -g @eurekadevsecops/radar
````

Verify the installation:

```bash
radar --version
```

---

## Getting Started

Run the CLI to view available commands:

```bash
radar
```

Example output:

```
COMMANDS
  help      display help
  scan      scan for vulnerabilities
  scanners  display available scanners
```

You can view help for any command:

```bash
radar help scan
```

---

## Running a Scan

To scan the current working directory:

```bash
radar scan
```

You can also specify scanners to use:

```bash
radar scan -s opengrep,gitleaks,grype
```

Output a SARIF report:

```bash
radar scan -s opengrep,gitleaks,grype -o report.sarif
```

---

## Supported Scanners

All scanners in Radar are fully containerized for consistency and isolation. When you run a scan, Radar CLI automatically launches the corresponding scanner inside a Docker container. This ensures clean, reproducible results without needing to install each scanner locally. A working Docker Engine is required to run Radar scanners, and the container images for all supported scanners are publicly available on the GitHub Container Registry.

| By Scanner                                                                        | Categories             | Description |
| --------------------------------------------------------------------------------- | ---------------------- | ----------- |
| [Dep-Scan](https://github.com/owasp-dep-scan/dep-scan)                            | **SCA**                | OWASP dep-scan is a next-generation security and risk audit tool based on known vulnerabilities, advisories, and license limitations for project dependencies. Scan most application code - local repos, Linux container images, Kubernetes manifests, and OS - to identify known CVEs with prioritization. |
| [Gitleaks](https://github.com/gitleaks/gitleaks)                                  | **Secrets**            | Gitleaks is a tool for detecting secrets like passwords, API keys, and tokens. |
| [Grype](https://github.com/anchore/grype)                                         | **SCA**, **Container** | Scans the contents of a container image or filesystem to find known vulnerabilities. Find vulnerabilities for language-specific packages and major operating system packages. Supports Docker, OCI and Singularity image formats. |
| [Opengrep](https://github.com/opengrep/opengrep)                                  | **SAST**               | Opengrep is an ultra-fast static code analysis engine to find security issues in code. Opengrep supports 30+ languages. |
| [Veracode SCA](https://www.veracode.com/products/software-composition-analysis/)  | **SCA**                | Effectively identify open-source risks with unmatched precision, ensuring secure and compliant code. Leverages a proprietary database to accurately and promptly detect new vulnerabilities. |

Scanners grouped by category:

| By Category       | Description                                      | Scanners                                                                                          |
| ----------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| **SAST**          | Detects insecure code patterns                   | [Opengrep](https://github.com/opengrep/opengrep)                                                  |
| **Secrets**       | Finds hardcoded credentials                      | [Gitleaks](https://github.com/gitleaks/gitleaks)                                                  |
| **SCA**           | Detects vulnerable package dependencies          | [Veracode SCA](https://www.veracode.com/products/software-composition-analysis/), [Grype](https://github.com/anchore/grype), [Dep-Scan](https://github.com/owasp-dep-scan/dep-scan) |
| **Container**     | Scans Docker, OCI, and Singularity image formats | [Grype](https://github.com/anchore/grype)                                                         |

Veracode SCA (formerly SourceClear) scanner requires the SRCCLR_API_TOKEN environment variable. If not present or valid, scanning with Veracode SCA will not work. Read more about it in [Veracode SCA online documentation](https://docs.veracode.com/r/Veracode_SCA_Agent_Environment_Variables#srcclr_api_token).

---

### More on the `radar scan` command

```bash
USAGE
  radar scan [OPTIONS] [TARGET]
```

Scans your source code and dependencies for vulnerabilities.
If no target is specified, the current working directory is scanned.

**OPTIONS**

| Option             | Description                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| `-c, --categories` | List of scanner categories (e.g. `sast`, `sca`, `secrets`).                                         |
| `-s, --scanners`   | Comma-separated list of scanners to run. Use `radar scanners` to list available ones.               |
| `-o, --output`     | Output findings into a SARIF file.                                                                  |
| `-d, --debug`      | Log detailed debug info to stdout.                                                                  |
| `-q, --quiet`      | Suppress stdout logging (except errors).                                                            |
| `-f, --format`     | Output format for severity display: `security` (high/moderate/low) or `sarif` (error/warning/note). |
| `-e, --escalate`   | Treat specified lower severities as high (e.g. `--escalate=moderate,low`).                          |
| `-l, --local`      | Run a local scan (don't upload scan findings to Eureka).                                            |

**PARAMETERS**

| Parameter | Description                                             |
| --------- | ------------------------------------------------------- |
| `TARGET`  | (Optional) Path to scan. Defaults to current directory. |

#### Category and Scanner Selection

* `--categories` lets you run all scanners in one or more categories.
  Example: `--categories=sca,sast`
* `--scanners` lets you choose specific scanners by name.
  Example: `--scanners=opengrep,depscan`
* Both can be combined — Radar CLI will run scanners that match *both* filters.

#### Severity Formats

| Format     | Example Severities     |
| ---------- | ---------------------- |
| `security` | high / moderate / low  |
| `sarif`    | error / warning / note |

You can also **escalate severities**:

```bash
# Treat moderates and lows as highs
radar scan -e moderate,low
```

Or:

```bash
# Treat warnings and notes as errors
radar scan -f sarif -e warning,note
```

#### Exit Codes

An exit code of `0` means the scan passed with no issues. Any other code means the scan failed — either due to new vulnerabilities found or an error during the scanning process.

| Code    | Meaning                                 |
| ------- | --------------------------------------- |
| `0`     | Clean and successful scan.              |
| `1`     | Invalid command, arguments, or options. |
| `8–15`  | New vulnerabilities found.              |
| `>=16`  | Aborted due to unexpected error.        |

#### Examples

Scan current directory:
```bash
radar scan
```

Scan a specific path:
```bash
radar scan /my/repo/dir
```

Save findings into a SARIF file:
```bash
radar scan -o report.sarif
```

Run only dependency and code scanners:
```bash
radar scan -c sca,sast
```

Run specific scanners:
```bash
radar scan -s depscan,opengrep
```

Enable debug logs:
```bash
radar scan --debug
```

Quiet mode (errors only):
```bash
radar scan --quiet
```

Display findings in SARIF-style severities:
```bash
radar scan -f sarif
```

Treat moderates and lows as highs:
```bash
radar scan -e moderate,low
```

---

## Example Workflows

### Local Scan (no uploads)

Runs entirely on your machine — by default, Radar CLI doesn’t upload any findings. Your vulnerabilities stay local and private.

```bash
radar scan -s opengrep,gitleaks,grype -o report.sarif
```

### Upload Findings to Eureka ASPM

See all findings in one place with deduplication, trend tracking, and risk prioritization. To upload results to **Eureka ASPM**, provide your API credentials via two environment variables: `EUREKA_AGENT_TOKEN` (your API token) and `EUREKA_PROFILE` (your profile ID). When these are set, Radar CLI automatically uploads results after each scan — letting you view your full scan history and all findings in the **Eureka ASPM Dashboard**.

```bash
export EUREKA_AGENT_TOKEN=<your token>
export EUREKA_PROFILE=<your profile ID>

radar scan -s opengrep,gitleaks,grype
```

NOTE: To prevent Radar CLI from uploading scan findings even when you have `EUREKA_AGENT_TOKEN` and `EUREKA_PROFILE` set, you can pass the `-l/--local` option on the command line.

---

## Why Upload Findings to Eureka ASPM?

**Eureka ASPM** extends Radar CLI with powerful visibility and collaboration features:

* **Single Source of Truth:** Aggregate findings from all scanners and repos in one place.
* **Less Noise, More Signal:** Automatically de-duplicate findings and prioritize risks contextually.
* **Faster Fixes:** See ownership, severity, and remediation guidance for each issue.
* **Track Progress:** View how your project’s security posture improves over time.
* **Free for Open Source:** Open source projects get full access at no cost.

**Sign up for a free account at [eurekadevsecops.com](https://eurekadevsecops.com)**

---

## Telemetry & Privacy

Telemetry is **off by default**.
Radar does **not** send any data externally unless you explicitly provide:

* `EUREKA_AGENT_TOKEN`
* `EUREKA_PROFILE`

When provided:

* Findings are securely uploaded to **Eureka ASPM**
* You gain **dashboards, trend analysis, and contextual prioritization**

When omitted:

* Scans remain **fully local**

---

## 🧰 Troubleshooting

| Issue                                         | Cause                               | Solution                                                  |
| --------------------------------------------- | ----------------------------------- | --------------------------------------------------------- |
| ❌ `report.sarif` not found                   | Scan failed or invalid scanner list | Check scanner names and ensure Docker is running          |
| ⚠️ No findings uploaded                       | Missing or invalid token/profile    | Set `EUREKA_AGENT_TOKEN` and `EUREKA_PROFILE`             |
| 🧱 `radar: command not found`                 | CLI not installed globally          | Run `npm i -g @eurekadevsecops/radar` again               |

---

## Contributing

Contributions are welcome!
See our [CONTRIBUTING.md](./CONTRIBUTING.md) for setup and development guidelines.

---

## License

Radar CLI is licensed under the terms of the **GPL v3 License** — © Eureka DevSecOps Inc.

---

## Support

* Issues & feature requests: [GitHub Issues](https://github.com/eurekadevsecops/radarctl/issues)
* Security: [security@eurekadevsecops.com](mailto:security@eurekadevsecops.com)
