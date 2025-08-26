// Simple API test script
// Run with: node test-api.js

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8080/api';

async function testHealthEndpoint() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    console.log('✅ Health endpoint:', data);
    return true;
  } catch (error) {
    console.error('❌ Health endpoint failed:', error.message);
    return false;
  }
}

async function testAuthEndpoint() {
  try {
    // This should fail with 401 since we don't have a token
    const response = await fetch(`${BASE_URL}/dreams`);
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Auth protection working - got expected 401');
      return true;
    } else {
      console.log('❌ Auth protection not working - expected 401 but got:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Auth test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing Lucidly API endpoints...\n');
  
  const healthOk = await testHealthEndpoint();
  const authOk = await testAuthEndpoint();
  
  console.log('\n📊 Test Results:');
  console.log(`Health endpoint: ${healthOk ? '✅' : '❌'}`);
  console.log(`Auth protection: ${authOk ? '✅' : '❌'}`);
  
  if (healthOk && authOk) {
    console.log('\n🎉 Basic API tests passed! The backend is ready.');
    console.log('\n📝 Next steps:');
    console.log('1. Set up your environment variables (.env file)');
    console.log('2. Configure Supabase authentication in your frontend');
    console.log('3. Test authenticated endpoints with proper tokens');
  } else {
    console.log('\n⚠️  Some tests failed. Check the server is running on port 8080.');
  }
}

// Run the tests
runTests(); 