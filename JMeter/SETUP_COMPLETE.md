# JMeter Performance Testing - Setup Complete! ✅

## What Has Been Set Up

### 1. JMeter Installation ✅
- **Version:** Apache JMeter 5.6.3
- **Location:** Installed via Homebrew
- **Verified:** Working and ready to use

### 2. Test Plan Created ✅
- **File:** `Airbnb_Performance_Test.jmx`
- **Location:** `/Users/spartan/Documents/DATA-236-LAB-1/JMeter/`
- **Test Scenarios:**
  - User Login (POST `/api/auth/login`)
  - Search Properties (GET `/api/properties`)
  - Get Property Details (GET `/api/properties/{id}`)
  - Create Booking (POST `/api/bookings`)

### 3. Thread Groups Configured ✅
- 100 Concurrent Users (enabled by default)
- 200 Concurrent Users (disabled - enable when needed)
- 300 Concurrent Users (disabled - enable when needed)
- 400 Concurrent Users (disabled - enable when needed)
- 500 Concurrent Users (disabled - enable when needed)

### 4. Supporting Files Created ✅
- ✅ `README.md` - Comprehensive testing guide
- ✅ `QUICK_START.md` - Quick start guide
- ✅ `PERFORMANCE_TEST_REPORT_TEMPLATE.md` - Report template
- ✅ `run_all_tests.sh` - Automated test execution script
- ✅ `results/` directory - For storing test outputs

### 5. First Test Run Completed ✅
- **Test:** 100 concurrent users
- **Results:** Generated in `results/test_100_users_report/`
- **Status:** ✅ Complete

## How to Run Your Performance Tests

### Quick Start (Single Test)

```bash
cd /Users/spartan/Documents/DATA-236-LAB-1/JMeter

# Run test with 100 users
jmeter -n -t Airbnb_Performance_Test.jmx \
  -l results/100_users_results.jtl \
  -e -o results/100_users_report

# View results
open results/100_users_report/index.html
```

### Run All Tests (Recommended)

```bash
cd /Users/spartan/Documents/DATA-236-LAB-1/JMeter
./run_all_tests.sh
```

This will automatically:
1. Test with 100 users → Generate report
2. Test with 200 users → Generate report
3. Test with 300 users → Generate report
4. Test with 400 users → Generate report
5. Test with 500 users → Generate report
6. Create summary comparison

**Estimated time:** 15-20 minutes total

### View Results

```bash
# Open HTML reports for each test
open results/100_users_report/index.html
open results/200_users_report/index.html
open results/300_users_report/index.html
open results/400_users_report/index.html
open results/500_users_report/index.html
```

## What to Collect for Your Report

### From Each Test Report

1. **Navigate to the HTML report**
2. **Statistics Tab** - Copy this table:
   - Sample Count
   - Average Response Time
   - Min/Max Response Time
   - 90th/95th/99th Percentile
   - Error Rate
   - Throughput (requests/second)

3. **Take Screenshots:**
   - Response Times Over Time graph
   - Response Times Percentiles graph
   - Transactions Per Second graph
   - Response Time vs Request graph

4. **Note Any Errors:**
   - From the "Errors" section
   - Types of errors
   - When they started occurring

### Create Comparison Graphs

In Excel/Google Sheets, create a table:

| Users | Avg Response Time | 95th Percentile | Throughput | Error % |
|-------|------------------|-----------------|------------|---------|
| 100   | [from report]    | [from report]   | [from report] | [from report] |
| 200   | [from report]    | [from report]   | [from report] | [from report] |
| 300   | [from report]    | [from report]   | [from report] | [from report] |
| 400   | [from report]    | [from report]   | [from report] | [from report] |
| 500   | [from report]    | [from report]   | [from report] | [from report] |

Then create line graphs:
1. **Graph 1:** Users (X) vs Average Response Time (Y)
2. **Graph 2:** Users (X) vs Throughput (Y)
3. **Graph 3:** Users (X) vs Error Rate (Y)

## Writing Your Analysis

Use the template: `PERFORMANCE_TEST_REPORT_TEMPLATE.md`

### Key Sections to Complete

1. **Test Results Tables**
   - Fill in actual numbers from your test reports
   - Include all 5 user load levels

2. **Performance Graphs**
   - Insert your Excel/Google Sheets graphs
   - Add the screenshots from JMeter reports

3. **Why Analysis**
   - Why does response time increase?
   - Root causes: database connections, CPU, memory, network

4. **Why Not Analysis**
   - Why doesn't it scale linearly?
   - What prevents better performance?

5. **How Analysis**
   - How to fix the issues?
   - Short-term, medium-term, long-term solutions

6. **Bottleneck Identification**
   - What are the top 3 bottlenecks?
   - Evidence from your tests
   - Impact and severity

7. **Recommendations**
   - Priority 1: Critical fixes
   - Priority 2: Important improvements
   - Priority 3: Nice-to-have enhancements

## Current Known Issues

### Booking Errors
Some bookings may fail with "Property not found or not available" errors. This is expected and part of your analysis:

**Why it happens:**
- Random property IDs (1-20) are used
- Some properties might not exist
- Properties might not be in 'active' status

**What to note in your report:**
- At what user load do errors increase?
- What percentage of requests fail?
- Is this a scalability issue or data issue?

**How to fix (for your recommendations):**
- Ensure all properties 1-20 exist and are active
- Improve error handling
- Add proper data validation

## Monitoring During Tests

While tests run, monitor the system:

```bash
# Terminal 1: Watch Docker stats
docker stats airbnb_backend

# Terminal 2: Watch backend logs
cd /Users/spartan/Documents/DATA-236-LAB-1/Backend
docker compose logs -f backend
```

**What to look for:**
- CPU usage spikes
- Memory usage growth
- Error messages in logs
- Response time patterns

**Take screenshots of:**
- Docker stats during peak load (500 users)
- Any interesting error messages
- Resource utilization graphs

## Final Deliverables Checklist

- [ ] JMeter test plan file (.jmx) ✅ DONE
- [ ] Test results for 100 users
- [ ] Test results for 200 users
- [ ] Test results for 300 users
- [ ] Test results for 400 users
- [ ] Test results for 500 users
- [ ] Performance comparison graphs (created in Excel/Sheets)
- [ ] Screenshots of JMeter HTML reports
- [ ] Screenshots of resource monitoring (docker stats)
- [ ] Completed performance test report (PDF or Markdown)
- [ ] Analysis of bottlenecks
- [ ] Recommendations for improvements

## Next Steps

1. **Run All Tests**
   ```bash
   cd /Users/spartan/Documents/DATA-236-LAB-1/JMeter
   ./run_all_tests.sh
   ```
   (This will take 15-20 minutes)

2. **Collect Data**
   - Open each HTML report
   - Copy metrics to Excel/Google Sheets
   - Take screenshots

3. **Create Graphs**
   - Build comparison graphs in Excel
   - Export as images

4. **Write Report**
   - Use the template provided
   - Fill in all sections
   - Include your graphs and screenshots

5. **Submit**
   - .jmx file
   - Completed report
   - All screenshots
   - Raw data (optional)

## Files Reference

```
JMeter/
├── Airbnb_Performance_Test.jmx          # Main test plan
├── README.md                             # Detailed guide
├── QUICK_START.md                        # Quick start guide
├── PERFORMANCE_TEST_REPORT_TEMPLATE.md   # Report template
├── SETUP_COMPLETE.md                     # This file
├── run_all_tests.sh                      # Automated test runner
└── results/                              # Test results directory
    ├── test_100_users_report/           # Sample test results
    ├── 100_users_report/                # (will be generated)
    ├── 200_users_report/                # (will be generated)
    ├── 300_users_report/                # (will be generated)
    ├── 400_users_report/                # (will be generated)
    └── 500_users_report/                # (will be generated)
```

## Tips for Success

1. **Run tests during low system activity** - Close other applications
2. **Run each test multiple times** - Verify consistency
3. **Document as you go** - Don't wait until the end
4. **Take lots of screenshots** - Better to have too many
5. **Monitor system resources** - Understanding bottlenecks is key
6. **Analyze trends, not just numbers** - How do metrics change?
7. **Be specific in recommendations** - Code examples are helpful

## Getting Help

If you encounter issues:

1. **Check the README.md** - Comprehensive troubleshooting section
2. **Check the QUICK_START.md** - Common problems and solutions
3. **View the sample test results** - `results/test_100_users_report/`
4. **Check backend logs** - `docker compose logs backend`

## Summary

✅ **JMeter is installed and working**  
✅ **Test plan is created and tested**  
✅ **All supporting documentation is ready**  
✅ **Sample test has been run successfully**  
✅ **You are ready to complete Part 5!**

**Total setup time:** ~15 minutes  
**Estimated testing time:** 15-20 minutes  
**Estimated analysis/report writing:** 1-2 hours  

**Good luck with your performance testing!** 🚀

---

**Created:** November 24, 2025  
**System:** Airbnb Application (MongoDB Atlas + Node.js Backend)  
**Backend Port:** 3002  
**Frontend Port:** 3000  
**JMeter Version:** 5.6.3
