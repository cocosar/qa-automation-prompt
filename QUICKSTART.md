# Quick Start Guide

Get up and running with the QA Automation Challenge in under 2 minutes.

## ⚡ TL;DR Commands

```bash
# 1. Install dependencies
npm install

# 2. Run quick test (2 minutes)
TIMEOUT_MONITOR_IN_MINUTES=2 npm run monitor

# 3. See results
npm run report

# 4. Reproduce bugs
npm run probe
```

## 🎯 What Each Command Does

| Command | Purpose | Duration |
|---------|---------|----------|
| `npm run monitor` | Continuously test API and log results | 10 min (default) |
| `npm run report` | Calculate uptime from logged data | < 1 sec |
| `npm run probe` | Test specific bug cases | < 5 sec |
| `npm run clear` | Reset database | < 1 sec |

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
