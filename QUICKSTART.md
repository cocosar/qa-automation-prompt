# Quick Start Guide

Get up and running with the QA Automation Challenge in under 2 minutes.

## ⚡ TL;DR Commands

```bash
# 0. Copy and complete with the variables the .env.example to an .env file
Example:
BASE_URL=https://qa-challenge-nine.vercel.app
API_URL=/api/name-checker
TIMEOUT_PER_REQUEST=10000
TIMEOUT_MONITOR_IN_MINUTES=5
TIMEOUT_BETWEEN_REQUESTS=100
DB_PATH=request_logs.db

# 1. Install dependencies
npm install

# 2. Run quick test (2 minutes)
TIMEOUT_MONITOR_IN_MINUTES=2 npm run monitor

# 3. See results
npm run report

# 4. Reproduce bugs
npm run probe

# Alt: Full flow (clear -> monitor -> report)
npm run clear:run
```

## 🎯 What Each Command Does

| Command | Purpose | Duration |
|---------|---------|----------|
| `npm run monitor` | Continuously test API and log results | 10 min (default) |
| `npm run report` | Calculate uptime from logged data | < 1 sec |
| `npm run probe` | Test specific bug cases | < 5 sec |
| `npm run clear` | Reset database | < 1 sec |
| `npm run clear:run` | Reset DB, run monitor, then show report | ~10 min |

## 🔧 Quick Customization

**Short test (30 seconds):**
```bash
TIMEOUT_MONITOR_IN_MINUTES=0.5 npm run monitor
```

**Faster requests (every 250ms):**
```bash
TIMEOUT_BETWEEN_REQUESTS=250 npm run monitor
```

**Both together:**
```bash
TIMEOUT_MONITOR_IN_MINUTES=1 TIMEOUT_BETWEEN_REQUESTS=500 npm run monitor
```

## 🧪 Example Outputs

### `npm run clear`
```
Database cleared successfully. All request logs have been removed.
```

### `npm run monitor` (excerpt)
```
Monitor started for 10 minute(s)
Time remaining: 599 seconds
Time remaining: 598 seconds
...
Time remaining: 1 seconds
Monitor finished. 324 requests were made in 10 minutes
```

### `npm run report` (excerpt)
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
```

### `npm run probe` (excerpt)
```
Testing bug cases...

Case: "<script></script>"
Response: Status 500 - Internal Server Error
Reproduce with:
curl -X POST -H "Content-Type: application/json" -d '{"name":"<script></script>"}' https://qa-challenge-nine.vercel.app/api/name-checker
```

## 🐛 Expected Bug Findings

After running `npm run probe`, you should see these bugs:

1. **Script tags cause 500 errors** → `<script></script>`
2. **Null values break request parsing** → `null`
3. **Word "script" triggers errors** → `script script`

## 📊 Expected Uptime

Typical results after 10 minutes of monitoring:
- **Uptime**: ~90-95% (varies by time)
- **Main issue**: Intermittent 500 "System is down" responses
- **Bug-related errors**: ~3-6% of requests

## 🚨 Troubleshooting

**If monitoring fails:**
```bash
# Use npm scripts, not direct execution
npm run monitor  # ✅
# NOT: npx ts-node src/monitor.ts  # ❌
```

**If no data in report:**
```bash
npm run clear    # Reset database
npm run monitor  # Run monitoring first
npm run report   # Then check results
```

---

For detailed documentation, see [deliverables.md](./deliverables.md)
