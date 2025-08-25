## How to run the project

1) Install dependencies
```
npm install
```

2) Configure environment variables
- Copy `.env.example` to `.env` and adjust values if needed.

3) Clean the database (optional to start from scratch)
```
npm run clear
```

4) Start monitoring (duration controlled by `TIMEOUT_MONITOR_IN_MINUTES`)
```
npm run monitor
```

5) Get the uptime report (by requests and by observed time)
```
npm run report
```

6) Reproduce the bugs and see example `curl` commands
```
npm run probe
```

## Uptime

The `report` script prints:
- Uptime as the percentage of requests returning 200.
- Uptime expressed in observed time between events.

Run `npm run report` after monitoring. Make sure to commit `request_logs.db` with session data.

## Found bugs and reproduction

The `probe` script (`src/bugs_founded.ts`) iterates over `data/test-cases-special.json` and for each case prints:
- The endpoint response (status, body or error).
- The `curl` command to reproduce.

Cases to reproduce bugs:
```
Case: "<script></script>"
Reproduce with:
curl -X POST -H "Content-Type: application/json" -d '{"name":"<script></script>"}' https://qa-challenge-nine.vercel.app/api/name-checker
```
```
Case: null
Reproduce with:
curl -X POST -H "Content-Type: application/json" -d '{"name":null}' https://qa-challenge-nine.vercel.app/api/name-checker
```
```
Case: "script script"
Reproduce with:
curl -X POST -H "Content-Type: application/json" -d '{"name":"script script"}' https://qa-challenge-nine.vercel.app/api/name-checker
```
```
Case: "script script script"
Reproduce with:
curl -X POST -H "Content-Type: application/json" -d '{"name":"script script script"}' https://qa-challenge-nine.vercel.app/api/name-checker
```

`data/test-cases.json` includes additional entries (strings with accents, compound names, special characters, and non-string types) that the monitor uses continuously to assess service stability/uptime.


## Important findings

- At times, the service responds with 500 "System is down".
- Sending a request with body {"name": null} causes a "Body is unusable: Body has already been read" error with status 0.
- Sending a request with name "<script></script>" returns an unhandled error with status 500.
- Sending requests with words containing "script" (like "script script", "script script script") also returns status 500, indicating overly aggressive content filtering.
- The endpoint accepts special characters, BOM, booleans, numbers, arrays, and empty objects.
- The service appears to restart after 23:59. (This was not considered in the uptime calculation as it is assumed to be due to temporary unavailability of Vercel infrastructure.)
- The GET, DELETE, PUT, PATCH, and OPTIONS methods respond identically regardless of method.


## Report

### Uptime report (by total requests)

- **Total requests**: 975
- **Uptime (HTTP 200)**: 93.64% (913/975)

#### Status breakdown

| Status | Count | Percentage |
|-------:|------:|-----------:|
| 200    | 913   | 93.64%     |
| 500    | 62    | 6.36%      |

### Uptime report (by observed time)

- **Window**: 2025-08-25T03:24:51.000Z → 2025-08-25T03:29:55.000Z
- **Total monitoring time**: 5.07 minutes
- **Uptime (HTTP 200)**: 89.80%


## The Bugs

### Identified Bug Patterns

Analyzing the bugs found, the following patterns can be identified:

#### 1. **Input Validation Vulnerabilities**
- **Script injection potential**: The `<script></script>` case causes an unhandled 500 error, suggesting lack of input sanitization for HTML/JavaScript content.
- **Script word filtering**: Strings containing the word "script" (`script script`, `script script script`) also cause 500 errors, indicating a flawed security filter that blocks legitimate content.
- **Null pointer handling**: The `null` value causes a "Body is unusable: Body has already been read" error with status 0, suggesting issues in request body parsing.

#### 2. **HTTP Method Handling Inconsistencies**
- **Method confusion**: GET, DELETE, PUT, PATCH, and OPTIONS methods respond identically, violating REST principles and HTTP conventions.
- **Endpoint versatility**: The endpoint accepts varied data types (booleans, numbers, arrays, empty objects) without discrimination, which may indicate lack of type validation.

#### 3. **Service Stability Issues**
- **Intermittent failures**: Occasional "System is down" responses with status 500, suggesting infrastructure problems or overload.
- **Infrastructure dependency**: The apparent restart after 23:59 indicates dependency on infrastructure cycles (possibly Vercel).

#### 4. **Poor Error Handling**
- **Unhandled exceptions**: Errors are not being caught and handled appropriately, resulting in generic 500 responses.
- **Inconsistent error responses**: Different types of invalid input produce different error codes (405 vs 500).

#### 5. **Excessive Tolerance to Non-standard Inputs**
- **Over-permissive input**: The system accepts special characters, BOM, and various data types, which can be both a feature and a security risk.
