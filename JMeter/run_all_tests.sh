#!/bin/bash

# Airbnb Performance Testing Script
# This script runs JMeter tests for 100, 200, 300, 400, and 500 concurrent users

set -e

echo "=========================================="
echo "Airbnb Performance Testing Suite"
echo "=========================================="
echo ""

# Check if JMeter is installed
if ! command -v jmeter &> /dev/null; then
    echo "❌ JMeter is not installed!"
    echo "Install it with: brew install jmeter"
    exit 1
fi

# Check if backend is running
echo "Checking if backend is running..."
if ! curl -s http://localhost:3002/health > /dev/null; then
    echo "❌ Backend is not running on port 3002!"
    echo "Start it with: cd ../Backend && docker compose up -d"
    exit 1
fi
echo "✅ Backend is running"
echo ""

# Create results directory
mkdir -p results
echo "✅ Results directory created"
echo ""

# Test configuration
USERS=(100 200 300 400 500)
TEST_FILE="Airbnb_Performance_Test.jmx"

# Run tests for each user load
for user_count in "${USERS[@]}"; do
    echo "=========================================="
    echo "Running test with $user_count concurrent users"
    echo "=========================================="
    
    # Create a temporary modified test plan
    TEMP_FILE="temp_${user_count}_users.jmx"
    
    # Enable the appropriate thread group based on user count
    if [ $user_count -eq 100 ]; then
        # 100 users is already enabled by default
        cp $TEST_FILE $TEMP_FILE
    else
        # Create modified version with correct thread group enabled
        sed "s/testname=\"${user_count} Concurrent Users\" enabled=\"false\"/testname=\"${user_count} Concurrent Users\" enabled=\"true\"/g" $TEST_FILE > $TEMP_FILE
        # Disable 100 users thread group
        sed -i '' 's/testname="100 Concurrent Users" enabled="true"/testname="100 Concurrent Users" enabled="false"/g' $TEMP_FILE
    fi
    
    # Run JMeter test
    echo "Starting JMeter test..."
    jmeter -n -t $TEMP_FILE \
        -l "results/${user_count}_users_results.jtl" \
        -e -o "results/${user_count}_users_report" \
        -j "results/${user_count}_users_jmeter.log"
    
    # Clean up temp file
    rm $TEMP_FILE
    
    echo "✅ Test completed for $user_count users"
    echo "   Results: results/${user_count}_users_results.jtl"
    echo "   Report: results/${user_count}_users_report/index.html"
    echo ""
    
    # Wait a bit between tests
    if [ $user_count -ne 500 ]; then
        echo "Waiting 30 seconds before next test..."
        sleep 30
    fi
done

echo "=========================================="
echo "All tests completed successfully!"
echo "=========================================="
echo ""
echo "View reports with:"
for user_count in "${USERS[@]}"; do
    echo "  open results/${user_count}_users_report/index.html"
done
echo ""

# Generate summary
echo "Generating summary..."
echo "Summary of Performance Test Results" > results/SUMMARY.txt
echo "====================================" >> results/SUMMARY.txt
echo "" >> results/SUMMARY.txt

for user_count in "${USERS[@]}"; do
    if [ -f "results/${user_count}_users_results.jtl" ]; then
        echo "$user_count Concurrent Users:" >> results/SUMMARY.txt
        echo "------------------------" >> results/SUMMARY.txt
        
        # Extract key metrics (this is a simple example, adjust based on actual JTL format)
        total_requests=$(wc -l < "results/${user_count}_users_results.jtl")
        echo "  Total Requests: $total_requests" >> results/SUMMARY.txt
        echo "" >> results/SUMMARY.txt
    fi
done

echo "✅ Summary saved to results/SUMMARY.txt"
echo ""
echo "Next steps:"
echo "1. Review the HTML reports"
echo "2. Take screenshots of key graphs"
echo "3. Analyze performance bottlenecks"
echo "4. Create comparison graphs in Excel/Google Sheets"
echo "5. Write your performance analysis report"
