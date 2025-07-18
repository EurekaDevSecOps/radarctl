# TELEMETRY

## How to use this module to send telemetry

### Step 1: Import the module:
```js
const telemetry = require('./telemetry')
```

### Step 2: Call telemetry.send to send telemetry. Choose one of several telemetry events available.

All available telemetry events:
```js
telemetry.send(`scans/:scanID/started`, { scanID }, { scanners })
telemetry.send(`scans/:scanID/completed`, { scanID }, { status, findings, log })
telemetry.sendSensitive(`scans/:scanID/log`, { scanID }, log)
telemetry.sendSensitive(`scans/:scanID/findings`, { scanID }, sarif)
```

To send a telemetry event indicating that a scan has started:
```js
telemetry.send(`scans/:scanID/started`, { scanID }, { scanners })
```

To send a telemetry event indicating that a scan has completed:
```js
telemetry.send(`scans/:scanID/completed`, { scanID }, { status, findings, log })
```

To send a telemetry event with the scan console log:
```js
telemetry.sendSensitive(`scans/:scanID/log`, { scanID }, log)
```

To send a telemetry event with the scan vulnerability findings:
```js
telemetry.sendSensitive(`scans/:scanID/findings`, { scanID }, sarif)
```

### Step 3: (optional) You can await on telemetry.send to read the fetch response.

```js
const response = await telemetry.send(`scans/:scanID/started`, { scanID }, { scanners })
console.log(response.statusCode)
console.log(await response.json())
```

## Sensitive data in telemtry events

NOTE: Telemetry events that contain vulnerability data are sent to the Vulnerability
Data Backend (VDBE) which can be hosted by customers directly on their own infrastructure.
These telemetry events must be sent using the `sendSensitive` function.
