<pre>
               _            
 _ __ __ _  __| | __ _ _ __ 
| '__/ _` |/ _` |/ _` | '__|
| | | (_| | (_| | (_| | |   
|_|  \__,_|\__,_|\__,_|_|
</pre>

# Introduction

radarctl is a command-line interface for Radar, an open-source orchestrator of security scanners. Radar is part of the Eureka DevSecOps platform.

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
