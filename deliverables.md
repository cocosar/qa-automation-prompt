## Project Structure

```
qa-automation-prompt/
├── src/
│   ├── monitor.ts        # Main monitoring script (continuously tests API)
│   ├── report.ts         # Uptime calculation and reporting
│   ├── bugs_founded.ts   # Bug reproduction and demonstration
│   ├── http.ts          # HTTP client with error handling
│   ├── db.ts            # SQLite database operations
│   └── clear-db.ts      # Database cleanup utility
├── data/
│   ├── test-cases.json         # Normal test cases for monitoring
│   └── test-cases-special.json # Bug-specific test cases
├── request_logs.db      # SQLite database (created after first run)
├── package.json         # Project configuration and scripts
└── deliverables.md      # This documentation
```

## How to run the project

### Prerequisites
- Node.js ≥ 18.17
- npm or yarn package manager

### Step-by-step execution

#### 1) Install dependencies
```bash
npm install
```

#### 2) Configure environment variables (optional)
The project works with default values, but you can customize behavior:

**Available environment variables:**
- `TIMEOUT_MONITOR_IN_MINUTES` - Duration of monitoring session (default: 10 minutes)
- `TIMEOUT_BETWEEN_REQUESTS` - Delay between API requests (default: 1000ms)
- `TIMEOUT_PER_REQUEST` - Individual request timeout (default: 10000ms)
- `BASE_URL` - API base URL (default: "https://qa-challenge-nine.vercel.app")
- `API_URL` - API endpoint path (default: "/api/name-checker")

**Example: Run a quick 2-minute monitoring session with 500ms intervals:**
```bash
TIMEOUT_MONITOR_IN_MINUTES=2 TIMEOUT_BETWEEN_REQUESTS=500 npm run monitor
```

#### 3) Clean the database (optional - to start from scratch)
```bash
npm run clear
```
**Expected output:**
```
Database cleared successfully. All request logs have been removed.
```

#### 4) Start monitoring
```bash
npm run monitor
```
**What this does:**
- Continuously sends requests to the API using test cases from `data/test-cases.json`
- Shows real-time countdown of remaining monitoring time
- Logs all requests and responses to SQLite database
- Processes 18 different test cases per cycle

**Expected output:**
```
Monitor started for 10 minute(s)
Time remaining: 599 seconds
Time remaining: 598 seconds
...
Time remaining: 1 seconds
Monitor finished. 324 requests were made in 10 minutes
```

#### 5) Get the uptime report
```bash
npm run report
```
**Expected output:**
```
=== Uptime Report (by total requests) ===

Total requests: 324
Uptime (HTTP 200): 94.44% (306/324)

Status breakdown:
┌─────────┬───────┬────────────┐
│ Status  │ Count │ Percentage │
├─────────┼───────┼────────────┤
│ 200     │ 306   │ 94.44%     │
│ 500     │ 18    │ 5.56%      │
└─────────┴───────┴────────────┘

=== Uptime Report (by observed time) ===

Window: 2025-01-13T10:30:00.000Z → 2025-01-13T10:40:00.000Z
Total monitoring time: 10.00 minutes
Uptime (HTTP 200): 89.23%
```

#### Alternative: Full flow (clear → monitor → report)
```bash
npm run clear:run
```
What this does:
- Clears the database
- Runs monitoring with current environment variables
- Prints the uptime report

#### 6) Reproduce and analyze bugs
```bash
npm run probe
```
**What this does:**
- Tests specific bug cases from `data/test-cases-special.json`
- Shows API responses and provides curl commands for manual reproduction
- Demonstrates the exact bug patterns discovered

**Expected output:**
```
Testing bug cases...

Case: "<script></script>"
Response: Status 500 - Internal Server Error
Reproduce with:
curl -X POST -H "Content-Type: application/json" -d '{"name":"<script></script>"}' https://qa-challenge-nine.vercel.app/api/name-checker

Case: null
Response: Status 0 - Body is unusable: Body has already been read
Reproduce with:
curl -X POST -H "Content-Type: application/json" -d '{"name":null}' https://qa-challenge-nine.vercel.app/api/name-checker

...
```

## Uptime

The `report` script prints:
- Uptime as the percentage of requests returning 200.
- Uptime expressed in observed time between events.

Run `npm run report` after monitoring. Make sure to commit `request_logs.db` with session data.

## Bug Reproduction Guide

### Automated Bug Detection
Run the probe script to automatically test and reproduce all identified bugs:
```bash
npm run probe
```

### Manual Bug Reproduction

#### **Bug 1: Script Tag Injection (500 Error)**
**Description:** Sending HTML script tags causes unhandled server error

**Test case:** `<script></script>`

**Steps to reproduce:**
1. **Using curl:**
   ```bash
   curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"name":"<script></script>"}' \
     https://qa-challenge-nine.vercel.app/api/name-checker
   ```

2. **Expected response:**
   ```json
   {
     "error": "Internal Server Error"
   }
   ```
   **HTTP Status:** 500

3. **Using Node.js fetch:**
   ```javascript
   const response = await fetch('https://qa-challenge-nine.vercel.app/api/name-checker', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ name: '<script></script>' })
   });
   ```

#### **Bug 2: Null Value Handling (Body Read Error)**
**Description:** Sending null values causes request body parsing error

**Test case:** `null`

**Steps to reproduce:**
1. **Using curl:**
   ```bash
   curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"name":null}' \
     https://qa-challenge-nine.vercel.app/api/name-checker
   ```

2. **Expected response:**
   ```
   Body is unusable: Body has already been read
   ```
   **HTTP Status:** 0 (connection error)

#### **Bug 3: Script Word Filtering (Overly Aggressive)**
**Description:** Any string containing the word "script" twice or more triggers 500 error

**Test cases:** `"script script"`, `"script script script"`

**Steps to reproduce:**
1. **Using curl:**
   ```bash
   curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"name":"script script"}' \
     https://qa-challenge-nine.vercel.app/api/name-checker
   ```

2. **Expected response:**
   ```json
   {
     "error": "Internal Server Error"
   }
   ```
   **HTTP Status:** 500

### Verification Steps
1. **Run the monitoring script** to capture these errors in the database:
   ```bash
   TIMEOUT_MONITOR_IN_MINUTES=1 npm run monitor
   ```

2. **Check the database** for logged errors:
   ```bash
   npm run report
   ```

3. **Look for status 500 and 0 entries** in the status breakdown

### Additional Test Cases
The `data/test-cases.json` file contains 18 different test cases including:
- **Normal names:** "Juan", "María", "José Luis"
- **Special characters:** "O'Connor", "D'Angelo", "María's"
- **Accented characters:** "Lisandro Pérez", "Micaela Sánchez"
- **Non-string types:** `[]`, `{}`, `-0`, `5`, `[0]`

These are used continuously by the monitoring script to assess overall service stability.


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

- **Total requests**: 990
- **Uptime (HTTP 200)**: 93.94% (930/990)

#### Status breakdown

| Status | Count | Percentage |
|-------:|------:|-----------:|
| 200    | 930   | 93.94%     |
| 500    | 60    | 6.06%      |

### Uptime report (by observed time)

- **Window**: 2025-08-25T03:55:17.000Z -> 2025-08-25T04:00:19.000Z
- **Total monitoring time**: 5.03 minutes
- **Uptime (HTTP 200)**: 90.07%


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

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Unknown file extension .ts" error
**Problem:** Node.js doesn't recognize TypeScript files
**Solution:** Use npm scripts instead of direct ts-node/tsx execution:
```bash
# ✅ Correct
npm run monitor

# ❌ Incorrect
npx ts-node src/monitor.ts
```

#### Issue: Database locked or permission errors
**Problem:** SQLite database is locked by another process
**Solutions:**
1. Make sure no other monitoring session is running
2. Clear and recreate the database:
   ```bash
   npm run clear
   ```
3. Check file permissions in the project directory

#### Issue: Network timeouts during monitoring
**Problem:** API requests timeout frequently
**Solutions:**
1. Increase timeout values:
   ```bash
   TIMEOUT_PER_REQUEST=30000 npm run monitor
   ```
2. Reduce request frequency:
   ```bash
   TIMEOUT_BETWEEN_REQUESTS=2000 npm run monitor
   ```

#### Issue: No data in uptime report
**Problem:** Database is empty or monitoring hasn't run
**Solution:** 
1. Run monitoring first:
   ```bash
   npm run monitor
   ```
2. Then check the report:
   ```bash
   npm run report
   ```

#### Issue: Monitoring stops unexpectedly
**Problem:** Unhandled errors or process interruption
**Solutions:**
1. Check the last few lines of output for error messages
2. Restart with shorter monitoring periods to isolate issues:
   ```bash
   TIMEOUT_MONITOR_IN_MINUTES=1 npm run monitor
   ```

### Environment Variables Reference

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `TIMEOUT_MONITOR_IN_MINUTES` | How long to monitor (minutes) | 10 | `2` |
| `TIMEOUT_BETWEEN_REQUESTS` | Delay between requests (ms) | 1000 | `500` |
| `TIMEOUT_PER_REQUEST` | Individual request timeout (ms) | 10000 | `15000` |
| `BASE_URL` | API base URL | https://qa-challenge-nine.vercel.app | Custom URL |
| `API_URL` | API endpoint path | /api/name-checker | `/custom/path` |
| `DB_PATH` | SQLite database file path | request_logs.db | `./custom.db` |

### Quick Test Procedure
To quickly verify everything works:

1. **Quick 30-second test:**
   ```bash
   TIMEOUT_MONITOR_IN_MINUTES=0.5 npm run monitor
   ```

2. **Verify data was collected:**
   ```bash
   npm run report
   ```

3. **Test bug reproduction:**
   ```bash
   npm run probe
   ```

If all three commands run without errors, your setup is working correctly.
