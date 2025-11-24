# Quick Start: JMeter Performance Testing

## 1. Install JMeter (if not already installed)

```bash
brew install jmeter
```

Verify installation:
```bash
jmeter --version
```

## 2. Ensure Backend is Running

```bash
cd /Users/spartan/Documents/DATA-236-LAB-1/Backend
docker compose up -d
docker compose ps  # Verify airbnb_backend is healthy
```

## 3. Run Your First Test

### Option A: GUI Mode (Recommended for first time)

```bash
cd /Users/spartan/Documents/DATA-236-LAB-1/JMeter
jmeter -t Airbnb_Performance_Test.jmx
```

This will open the JMeter GUI. Then:
1. Click the green "Start" button (play icon) in the toolbar
2. Watch results in real-time in the listeners (bottom panels)
3. View "View Results Tree" to see individual requests
4. View "Summary Report" for aggregate statistics

### Option B: CLI Mode (For actual test runs)

```bash
cd /Users/spartan/Documents/DATA-236-LAB-1/JMeter
mkdir -p results

# Run test for 100 users
jmeter -n -t Airbnb_Performance_Test.jmx \
  -l results/100_users_results.jtl \
  -e -o results/100_users_report

# View results
open results/100_users_report/index.html
```

### Option C: Run All Tests Automatically

```bash
cd /Users/spartan/Documents/DATA-236-LAB-1/JMeter
./run_all_tests.sh
```

This will:
- Run tests for 100, 200, 300, 400, and 500 users
- Generate HTML reports for each
- Create a summary file
- Take about 15-20 minutes total

## 4. View Results

After running CLI mode tests:

```bash
# Open HTML reports
open results/100_users_report/index.html
open results/200_users_report/index.html
open results/300_users_report/index.html
open results/400_users_report/index.html
open results/500_users_report/index.html

# View summary
cat results/SUMMARY.txt
```

## 5. Collect Data for Your Report

### Extract Key Metrics

For each test (100, 200, 300, 400, 500 users):

1. **Open the HTML report**
2. **Go to "APDEX (Application Performance Index)" section**
   - Note the overall score
3. **Go to "Requests Summary" section**
   - Note: Total samples, Error %, Average time, Min, Max, 90th/95th/99th percentiles
4. **Go to "Statistics" table**
   - Copy the table for your report
5. **Go to "Response Times Over Time" graph**
   - Take a screenshot
6. **Go to "Response Times Percentiles" graph**
   - Take a screenshot

### Create Comparison Graph

Create a table in Excel/Google Sheets:

| Users | Avg Response Time (ms) | 95th Percentile (ms) | Throughput (req/s) | Error Rate (%) |
|-------|------------------------|---------------------|-------------------|----------------|
| 100   | [from report]          | [from report]       | [from report]     | [from report]  |
| 200   | [from report]          | [from report]       | [from report]     | [from report]  |
| 300   | [from report]          | [from report]       | [from report]     | [from report]  |
| 400   | [from report]          | [from report]       | [from report]     | [from report]  |
| 500   | [from report]          | [from report]       | [from report]     | [from report]  |

Then create graphs:
1. Line graph: Users (X-axis) vs Avg Response Time (Y-axis)
2. Line graph: Users (X-axis) vs Throughput (Y-axis)
3. Bar graph: Users (X-axis) vs Error Rate (Y-axis)

## 6. Monitor System During Tests

In a separate terminal, monitor the backend:

```bash
# Watch Docker container stats
docker stats airbnb_backend

# Watch backend logs
cd /Users/spartan/Documents/DATA-236-LAB-1/Backend
docker compose logs -f backend
```

Take screenshots of:
- CPU usage during peak load
- Memory usage during peak load
- Any error messages in logs

## 7. Analyze Bottlenecks

Look for:
1. **Response time increase** - Does it increase linearly? Exponentially?
2. **Error rates** - At what point do errors start appearing?
3. **Throughput plateau** - Does throughput stop increasing at some point?
4. **Resource usage** - Is CPU/memory maxed out?

## 8. Write Your Report

Use the template:
```bash
cp PERFORMANCE_TEST_REPORT_TEMPLATE.md MY_PERFORMANCE_REPORT.md
```

Fill in:
- All the tables with your test data
- Add your screenshots
- Write the "Why/Why Not/How" analysis sections
- Identify bottlenecks
- Make recommendations

## Troubleshooting

### Backend not responding
```bash
cd /Users/spartan/Documents/DATA-236-LAB-1/Backend
docker compose restart backend
docker compose logs backend --tail=50
```

### JMeter "Out of Memory" error
```bash
export JVM_ARGS="-Xms512m -Xmx4096m"
jmeter -n -t Airbnb_Performance_Test.jmx ...
```

### Results directory permission error
```bash
cd /Users/spartan/Documents/DATA-236-LAB-1/JMeter
mkdir -p results
chmod 755 results
```

### Can't find .jmx file
```bash
cd /Users/spartan/Documents/DATA-236-LAB-1/JMeter
ls -la  # Should see Airbnb_Performance_Test.jmx
```

## Tips for Success

1. **Run each test multiple times** - Results should be consistent
2. **Clear results between runs** - Don't mix data from different runs
3. **Monitor system resources** - Watch for CPU/memory/disk bottlenecks
4. **Document everything** - Take screenshots as you go
5. **Compare with baseline** - Run a baseline test first
6. **Analyze trends** - Look at how metrics change, not just absolute values

## Next Steps

After completing all tests:
1. ✅ Analyze results
2. ✅ Create performance graphs
3. ✅ Write bottleneck analysis
4. ✅ Make recommendations
5. ✅ Prepare final report with screenshots
6. ✅ Submit .jmx file + report + screenshots

Good luck with your performance testing! 🚀
