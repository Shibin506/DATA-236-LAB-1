# Part 5: JMeter Performance Testing - Action Plan

## ✅ What's Been Completed

1. **Apache JMeter 5.6.3** installed and verified
2. **Complete test plan** created (`Airbnb_Performance_Test.jmx`)
3. **Sample test run** completed for 100 users
4. **Documentation** created:
   - README.md (detailed guide)
   - QUICK_START.md (quick instructions)
   - PERFORMANCE_TEST_REPORT_TEMPLATE.md (report template)
   - SETUP_COMPLETE.md (setup summary)
5. **Automation script** (`run_all_tests.sh`) ready to use
6. **Backend** running and healthy on port 3002

## 🎯 Your Action Items

### Step 1: Run All Performance Tests (~20 minutes)

```bash
cd /Users/spartan/Documents/DATA-236-LAB-1/JMeter
./run_all_tests.sh
```

This will test with 100, 200, 300, 400, and 500 concurrent users automatically.

**While tests run:**
- Open another terminal
- Run: `docker stats airbnb_backend`
- Take screenshots of CPU/Memory usage at different loads

### Step 2: Collect Test Results (~30 minutes)

For each test (100, 200, 300, 400, 500 users):

1. Open the HTML report:
   ```bash
   open results/100_users_report/index.html
   open results/200_users_report/index.html
   # ... etc
   ```

2. From each report, copy these metrics to a spreadsheet:

| Metric | Value |
|--------|-------|
| Total Samples | |
| Error % | |
| Average Response Time (ms) | |
| Min Response Time (ms) | |
| Max Response Time (ms) | |
| 90th Percentile (ms) | |
| 95th Percentile (ms) | |
| 99th Percentile (ms) | |
| Throughput (req/sec) | |
| Received KB/sec | |

3. Take screenshots of:
   - "Statistics" table
   - "Response Times Over Time" graph
   - "Response Time Percentiles" graph
   - "Transactions Per Second" graph
   - Any errors shown

### Step 3: Create Comparison Graphs (~20 minutes)

In Excel or Google Sheets, create a table:

| Users | Avg RT (ms) | 95th %ile (ms) | Throughput (req/s) | Error % |
|-------|-------------|----------------|-------------------|---------|
| 100   |             |                |                   |         |
| 200   |             |                |                   |         |
| 300   |             |                |                   |         |
| 400   |             |                |                   |         |
| 500   |             |                |                   |         |

Create 4 graphs:

1. **Line graph:** Users vs Average Response Time
   - Shows how response time degrades with load
   
2. **Line graph:** Users vs Throughput
   - Shows if throughput plateaus
   
3. **Bar/Line graph:** Users vs Error Rate
   - Shows when system becomes unstable
   
4. **Line graph:** Users vs 95th Percentile Response Time
   - Shows tail latency behavior

### Step 4: Analyze Performance (~30 minutes)

Answer these questions in your report:

**WHY does performance degrade?**
- What happens to response time as users increase?
- Which endpoint is slowest?
- When do errors start appearing?

Look at:
- Database connection pool exhaustion
- CPU saturation
- Memory pressure
- Network latency to MongoDB Atlas

**WHY NOT better performance?**
- Why doesn't it scale linearly?
- What limits throughput?
- What causes the plateau?

Consider:
- Single backend instance
- No caching
- Synchronous processing
- Database query inefficiency

**HOW to improve?**
- Short-term fixes (hours to implement)
- Medium-term improvements (days)
- Long-term optimizations (weeks)

Examples:
- Increase connection pool size
- Add database indexes
- Implement response caching
- Horizontal scaling

### Step 5: Write Your Report (~1 hour)

Use the template:
```bash
cp PERFORMANCE_TEST_REPORT_TEMPLATE.md MY_PERFORMANCE_REPORT.md
```

Fill in:
1. **Test Configuration** - Your system specs
2. **Test Results** - All 5 tables with real data
3. **Performance Graphs** - Insert your Excel graphs
4. **Screenshots** - JMeter results, docker stats
5. **Analysis** - Why, Why Not, How sections
6. **Bottlenecks** - Top 3 issues with evidence
7. **Recommendations** - Prioritized list with impact/effort

### Step 6: Package Deliverables

Create a folder with:
```
Part5_JMeter_Performance_Testing/
├── Airbnb_Performance_Test.jmx          # Test plan
├── Performance_Test_Report.pdf           # Your completed report
├── screenshots/                          # All screenshots
│   ├── 100_users_statistics.png
│   ├── 100_users_response_time.png
│   ├── 200_users_statistics.png
│   ├── ... (all screenshots)
│   ├── docker_stats_500_users.png
│   └── comparison_graphs.png
└── results_summary.xlsx                  # Your Excel file with graphs
```

## 📊 What Your Report Should Include

### Required Sections

1. **Executive Summary**
   - Key findings (3-5 bullets)
   - Maximum supported load
   - Critical bottleneck
   - Top recommendation

2. **Test Configuration**
   - System specs
   - Test scenarios
   - Load patterns

3. **Test Results** (for all 5 loads)
   - Complete metrics tables
   - Screenshots of JMeter reports

4. **Performance Graphs**
   - Response Time vs Users
   - Throughput vs Users
   - Error Rate vs Users
   - 95th Percentile trends

5. **Analysis: Why, Why Not, How**
   - Root cause analysis
   - Limiting factors
   - Improvement strategies

6. **Performance Bottlenecks**
   - At least 3 bottlenecks identified
   - Evidence from tests
   - Impact assessment
   - Severity rating

7. **Recommendations**
   - Priority 1: Critical (immediate)
   - Priority 2: Important (this sprint)
   - Priority 3: Enhancement (next quarter)
   - For each: Impact, Effort, Expected improvement

8. **Conclusion**
   - Summary of findings
   - Acceptable load level
   - Next steps

## 🎓 Grading Criteria (Based on Requirements)

The assignment asks for:

✅ **Test critical APIs** (login, property data, booking)
- Your test plan includes all three ✓

✅ **Simulate Travelers and Owners**
- Your test includes realistic user scenarios ✓

✅ **Test for 100, 200, 300, 400, 500 users**
- Your test plan has all 5 thread groups ✓

✅ **Draw graphs with average time**
- You'll create these in Excel from results ✓

✅ **Analysis: why, why not, how**
- Template has sections for all three ✓

✅ **Submit JMeter test plan (.jmx)**
- Airbnb_Performance_Test.jmx is ready ✓

✅ **Summary of test results**
- Template includes summary tables ✓

✅ **Screenshots of JMeter results**
- You'll collect these from HTML reports ✓

✅ **Analysis of performance bottlenecks**
- Template has bottleneck analysis section ✓

## ⏱️ Time Estimate

| Task | Time | Status |
|------|------|--------|
| Setup JMeter & test plan | 15 min | ✅ DONE |
| Run all tests | 20 min | ⏳ TODO |
| Collect results | 30 min | ⏳ TODO |
| Create graphs | 20 min | ⏳ TODO |
| Analyze performance | 30 min | ⏳ TODO |
| Write report | 60 min | ⏳ TODO |
| Package deliverables | 10 min | ⏳ TODO |
| **TOTAL** | **~3 hours** | |

## 🚀 Get Started Now

```bash
# Navigate to JMeter directory
cd /Users/spartan/Documents/DATA-236-LAB-1/JMeter

# Run all tests (this takes 15-20 minutes)
./run_all_tests.sh

# While tests run, open another terminal and monitor
docker stats airbnb_backend
```

Then follow Steps 2-6 above to complete your assignment!

## 📚 Reference Files

- **QUICK_START.md** - Fast reference for commands
- **README.md** - Detailed guide with troubleshooting
- **PERFORMANCE_TEST_REPORT_TEMPLATE.md** - Full report template
- **SETUP_COMPLETE.md** - What's been configured

## 💡 Pro Tips

1. **Run tests during stable system state** - No other heavy processes
2. **Take more screenshots than needed** - Easy to delete extras
3. **Document as you go** - Don't rely on memory
4. **Look for patterns** - Linear? Exponential? Plateau?
5. **Be specific in recommendations** - "Increase pool from 10 to 50" not just "increase pool"
6. **Show your work** - Include calculations, reasoning
7. **Use actual numbers** - Avoid vague statements like "much slower"

Good luck! You're all set to complete Part 5! 🎉
