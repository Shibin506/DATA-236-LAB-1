# JMeter Performance Testing Guide for HostIQ Application

## Overview
This directory contains Apache JMeter test plans for performance testing the HostIQ application's critical APIs including user authentication, property data fetching, and booking processing.

## Prerequisites

1. **Install Apache JMeter**
   ```bash
   brew install jmeter
   ```

2. **Ensure Backend is Running**
   ```bash
   cd ../Backend
   docker compose up -d
   ```

3. **Create Results Directory**
   ```bash
   mkdir -p results
   ```

## Test Plan Structure

The `Airbnb_Performance_Test.jmx` file contains:

### Thread Groups (Concurrent Users)
- **100 Concurrent Users** (enabled by default)
- **200 Concurrent Users** (disabled)
- **300 Concurrent Users** (disabled)
- **400 Concurrent Users** (disabled)
- **500 Concurrent Users** (disabled)

### API Endpoints Tested
1. **User Login** - `/api/auth/login`
   - POST request with email/password
   - Extracts user_id for subsequent requests
   
2. **Search Properties** - `/api/properties`
   - GET request with pagination and city filter
   - Tests property listing functionality
   
3. **Get Property Details** - `/api/properties/{id}`
   - GET request for specific property
   - Random property ID between 1-20
   
4. **Create Booking** - `/api/bookings`
   - POST request to create a booking
   - Random property ID and guest count
   - Tests booking processing

### Listeners (Result Collectors)
- **View Results Tree** - Detailed request/response view
- **Summary Report** - Aggregate statistics
- **View Results in Table** - Tabular data
- **Graph Results** - Visual representation
- **Response Time Graph** - Response time trends

## Running Tests

### Method 1: GUI Mode (For test development and debugging)

```bash
jmeter -t Airbnb_Performance_Test.jmx
```

This opens the JMeter GUI where you can:
1. Enable/disable thread groups
2. View results in real-time
3. Modify test parameters
4. Save results

### Method 2: CLI Mode (For actual performance testing)

Run for different concurrent user loads:

#### 100 Users
```bash
jmeter -n -t Airbnb_Performance_Test.jmx \
  -l results/100_users_results.jtl \
  -e -o results/100_users_report
```

#### 200 Users
First, edit the .jmx file to enable 200 users thread group, or use:
```bash
jmeter -n -t Airbnb_Performance_Test.jmx \
  -Jusers=200 \
  -l results/200_users_results.jtl \
  -e -o results/200_users_report
```

#### 300 Users
```bash
jmeter -n -t Airbnb_Performance_Test.jmx \
  -Jusers=300 \
  -l results/300_users_results.jtl \
  -e -o results/300_users_report
```

#### 400 Users
```bash
jmeter -n -t Airbnb_Performance_Test.jmx \
  -Jusers=400 \
  -l results/400_users_results.jtl \
  -e -o results/400_users_report
```

#### 500 Users
```bash
jmeter -n -t Airbnb_Performance_Test.jmx \
  -Jusers=500 \
  -l results/500_users_results.jtl \
  -e -o results/500_users_report
```

### Method 3: Run All Tests Sequentially

```bash
./run_all_tests.sh
```

## Understanding Results

### Key Metrics to Analyze

1. **Average Response Time** - Mean time to process requests
2. **90th Percentile** - 90% of requests completed within this time
3. **95th Percentile** - 95% of requests completed within this time
4. **Throughput** - Requests per second
5. **Error Rate** - Percentage of failed requests
6. **Min/Max Response Time** - Fastest and slowest requests

### Expected Benchmarks

| Metric | Good | Acceptable | Poor |
|--------|------|------------|------|
| Avg Response Time | < 200ms | 200-500ms | > 500ms |
| 95th Percentile | < 500ms | 500ms-1s | > 1s |
| Error Rate | < 1% | 1-5% | > 5% |
| Throughput | High | Medium | Low |

## Viewing Reports

After running tests in CLI mode, open the HTML report:

```bash
open results/100_users_report/index.html
open results/200_users_report/index.html
# ... etc
```

The report includes:
- Test statistics dashboard
- Response time over time graphs
- Response time percentiles
- Transactions per second
- Error analysis

## Creating Performance Graphs

### Export Data for Analysis

```bash
# Extract average response times
grep -E "User Login|Search Properties|Get Property Details|Create Booking" \
  results/100_users_results.jtl | \
  awk -F',' '{print $3, $2}' > results/100_users_avg_times.txt
```

### Graph Data in Excel/Numbers/Google Sheets

1. Import the result CSV files from `results/` directory
2. Create graphs comparing:
   - Average response time vs concurrent users
   - Throughput vs concurrent users
   - Error rate vs concurrent users

### Sample Analysis Template

| Concurrent Users | Avg Response Time (ms) | 95th Percentile (ms) | Throughput (req/sec) | Error Rate (%) |
|-----------------|------------------------|----------------------|----------------------|----------------|
| 100 | | | | |
| 200 | | | | |
| 300 | | | | |
| 400 | | | | |
| 500 | | | | |

## Performance Bottleneck Analysis

### Common Bottlenecks

1. **Database Connection Pool**
   - Symptom: Response time increases linearly with users
   - Solution: Increase MongoDB connection pool size

2. **Memory Constraints**
   - Symptom: Errors increase at higher loads
   - Solution: Increase Node.js heap size

3. **CPU Saturation**
   - Symptom: Throughput plateaus
   - Solution: Scale horizontally or optimize code

4. **Network Latency**
   - Symptom: High minimum response times
   - Solution: Use connection pooling, CDN

### Monitoring During Tests

Monitor backend performance:
```bash
# Watch container stats
docker stats hostiq_backend

# Watch logs
docker compose logs -f backend

# MongoDB performance
docker compose exec backend node -e "
const mongoose = require('mongoose');
require('./src/config/database');
setTimeout(() => {
  console.log(mongoose.connection.db.serverStatus());
  process.exit(0);
}, 2000);"
```

## Test Scenarios

### Scenario 1: User Authentication Load
Tests login endpoint under various loads

### Scenario 2: Property Search Performance
Tests property listing and filtering

### Scenario 3: Booking Creation
Tests booking workflow including:
- Property availability check
- Date validation
- Price calculation
- Database transaction

### Scenario 4: Mixed Load (Travelers + Owners)
Simulates real-world usage with:
- 70% travelers (searching, booking)
- 30% owners (viewing bookings, responding)

## Customization

### Modify User Load
Edit `.jmx` file and change:
```xml
<stringProp name="ThreadGroup.num_threads">100</stringProp>
<stringProp name="ThreadGroup.ramp_time">10</stringProp>
```

### Add New Endpoints
1. Open JMeter GUI
2. Right-click Thread Group → Add → Sampler → HTTP Request
3. Configure endpoint details
4. Save test plan

### Change Test Data
Modify the JSON payloads in HTTP Request samplers

## Troubleshooting

### JMeter Not Found
```bash
brew install jmeter
# Or download from https://jmeter.apache.org/download_jmeter.cgi
```

### Backend Not Running
```bash
cd ../Backend
docker compose up -d
docker compose ps  # Verify backend is healthy
```

### Connection Refused Errors
- Check if backend is on port 3002
- Verify MONGODB_URI is correct
- Ensure no firewall blocking

### Out of Memory Errors
Increase JMeter heap size:
```bash
export JVM_ARGS="-Xms512m -Xmx4096m"
jmeter -n -t Airbnb_Performance_Test.jmx ...
```

## Deliverables Checklist

- [ ] JMeter test plan (.jmx file) ✅
- [ ] Test execution for 100 users
- [ ] Test execution for 200 users
- [ ] Test execution for 300 users
- [ ] Test execution for 400 users
- [ ] Test execution for 500 users
- [ ] Response time graphs
- [ ] Summary of test results
- [ ] Performance bottleneck analysis
- [ ] Screenshots of JMeter results
- [ ] Report with findings and recommendations

## Sample Report Structure

```
# JMeter Performance Test Report

## Executive Summary
- Overview of test objectives
- Key findings
- Recommendations

## Test Configuration
- Server configuration
- Test scenarios
- Load patterns

## Results
### 100 Concurrent Users
- Response times
- Throughput
- Error rates

[... repeat for 200, 300, 400, 500 users]

## Graphs
- Response Time vs Concurrent Users
- Throughput vs Concurrent Users
- Error Rate Analysis

## Performance Bottlenecks
1. Database connection pooling
2. Memory management
3. [Other findings]

## Recommendations
1. Optimize database queries
2. Implement caching
3. [Other improvements]

## Appendix
- Raw test data
- JMeter screenshots
- Configuration files
```

## Additional Resources

- [JMeter User Manual](https://jmeter.apache.org/usermanual/index.html)
- [JMeter Best Practices](https://jmeter.apache.org/usermanual/best-practices.html)
- [Performance Testing Guide](https://www.blazemeter.com/blog/jmeter-tutorial)

## Notes

- Always run performance tests in a controlled environment
- Warm up the system before collecting metrics
- Run each test multiple times for consistency
- Monitor system resources during tests
- Document any anomalies or unexpected behavior
