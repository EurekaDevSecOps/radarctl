<div align="center" style="text-align:center;">

<p align="center">
  <img src="assets/radar.png" alt="Eureka Radar Logo" width="320"/>
</p>

# Radar CLI by Eureka ASPM
### The Unified AppSec Orchestration Tool

![npm version](https://img.shields.io/npm/v/@eurekadevsecops/radar?color=2b82f6&label=NPM)
![License](https://img.shields.io/github/license/eurekadevsecops/radarctl?color=green)
![Node](https://img.shields.io/badge/Node.js-22.x-blue?logo=node.js)
![Build](https://github.com/eurekadevsecops/radarctl/actions/workflows/test.yml/badge.svg)

</div>

---

## Overview

**Radar CLI** is a developer-friendly command-line tool that orchestrates multiple application security scanners — for code, dependencies, and secrets — in one unified workflow.  

With Radar CLI, you can:
- Run **SAST**, **SCA**, and **secret scanning** locally or in CI/CD pipelines.
- Generate **unified SARIF reports** compatible with GitHub Advanced Security.
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

You can also specify scanners:

```bash
radar scan -s "opengrep,gitleaks,grype"
```

To output a SARIF report:

```bash
radar scan -s "opengrep,gitleaks,grype" -o report.sarif
```

---

## Supported Scanners

| Category          | Scanners       | Description                                     |
| ----------------- | -------------- | ----------------------------------------------- |
| **SAST**          | Opengrep       | Detects insecure code patterns                  |
| **Secrets**       | Gitleaks       | Finds hardcoded credentials                     |
| **SCA**           | Grype, DepScan | Detects vulnerable dependencies                 |
| **Container/IaC** | (coming soon)  | Scans Dockerfiles, Terraform, and K8s manifests |

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

* Scans remain **fully local**, ideal for open source and air-gapped environments

---

## Example Workflows

### Local Scan (no uploads)

Perfect for open source and private projects — 100% local execution.

```bash
radar scan -s "opengrep,gitleaks,grype"
```

### Upload Findings to Eureka ASPM

See all findings in one place with deduplication, trend tracking, and risk prioritization.

```bash
export EUREKA_AGENT_TOKEN=<your token>
export EUREKA_PROFILE=my-service

radar scan -s "opengrep,gitleaks,grype" -o report.sarif --upload
```

### Upload to GitHub Advanced Security

If your repo uses **GHAS**, Radar’s SARIF output can be uploaded directly:

```bash
radar scan -s "opengrep,gitleaks,grype" -o report.sarif
gh code-scanning upload --sarif report.sarif
```

---

## 🧰 Troubleshooting

| Issue                                         | Cause                               | Solution                                                  |
| --------------------------------------------- | ----------------------------------- | --------------------------------------------------------- |
| ❌ `report.sarif` not found                    | Scan failed or invalid scanner list | Check scanner names and ensure Docker is running          |
| ⚠️ No findings uploaded                       | Missing or invalid token/profile    | Set `EUREKA_AGENT_TOKEN` and `EUREKA_PROFILE`             |
| 🚫 “Permission denied” when uploading to GHAS | GHAS not enabled                    | Enable *Code scanning alerts* under **Security** settings |
| 🧱 `radar: command not found`                 | CLI not installed globally          | Run `npm i -g @eurekadevsecops/radar` again               |

---

## Contributing

Contributions are welcome!
See our [CONTRIBUTING.md](./CONTRIBUTING.md) for setup and development guidelines.

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

## License

Licensed under the **MIT License** — © Eureka DevSecOps Inc.

---

## Support

* 📫 Email: [security@eurekadevsecops.com](mailto:security@eurekadevsecops.com)
* 🧩 Issues & feature requests: [GitHub Issues](https://github.com/eurekadevsecops/radarctl/issues)

---

<p align="center">
  <i>Radar CLI — One command. Complete AppSec coverage.</i>
</p>











<pre>
               _            
 _ __ __ _  __| | __ _ _ __ 
| '__/ _` |/ _` |/ _` | '__|
| | | (_| | (_| | (_| | |   
|_|  \__,_|\__,_|\__,_|_|
</pre>

# Introduction

radarctl is a command-line interface for Radar, an open-source orchestrator of security scanners. Radar is part of the Eureka DevSecOps platform.

## Requirements

- Node.js version 22.17.0 or higher
- Docker

## Installation

Install the Radar CLI on the command-line using [NPM](https://npmjs.com):

```bash
npm i -g @eurekadevsecops/radar
```

## Getting Started

Run the Radar CLI:

```bash
radar
```

You will get a list of available commands:
```bash
COMMANDS 
  help      display help              
  scan      scan for vulnerabilities  
  scanners  display available scanners 
```

View help page for each command by using `help` on the command-line:

```bash
radar help
```

## Running a Scan

Run a scan on the source code in the current working directory:

```bash
radar scan
```

Refer to help for the `scan` command for more information.

```bash
radar help scan
```

## Contributing guide

See [CONTRIBUTING.md](./CONTRIBUTING.md)
