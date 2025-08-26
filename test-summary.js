// Test script for the summary API endpoint
const testSummaryAPI = async () => {
  try {
    console.log('Testing summary API endpoint...');
    
    // Test the summary endpoint
    const response = await fetch('http://localhost:8080/api/summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // This will fail auth but let's see the response
      },
      body: JSON.stringify({
        dreamId: 'test-dream-id'
      })
    });
    
    console.log('Response status:', response.status);
    const data = await response.text();
    console.log('Response body:', data);
    
  } catch (error) {
    console.error('Error testing summary API:', error);
  }
};

// Run the test
testSummaryAPI(); 