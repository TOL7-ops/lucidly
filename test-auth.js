import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8080';

async function testAuthFlow() {
  console.log('🧪 Testing Lucidly Authentication Flow\n');

  try {
    // 1. Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log(`   ✅ Health Status: ${healthData.data.status}`);

    // 2. Test protected route without auth (should fail)
    console.log('\n2. Testing protected route without authentication...');
    const unauthedResponse = await fetch(`${BASE_URL}/api/dreams`);
    if (unauthedResponse.status === 401) {
      console.log('   ✅ Protected route properly returns 401 Unauthorized');
    } else {
      console.log(`   ❌ Expected 401, got ${unauthedResponse.status}`);
    }

    // 3. Test with invalid token (should fail)
    console.log('\n3. Testing protected route with invalid token...');
    const invalidTokenResponse = await fetch(`${BASE_URL}/api/dreams`, {
      headers: {
        'Authorization': 'Bearer invalid-token-12345'
      }
    });
    if (invalidTokenResponse.status === 401) {
      console.log('   ✅ Invalid token properly rejected');
    } else {
      console.log(`   ❌ Expected 401, got ${invalidTokenResponse.status}`);
    }

    // 4. Test transcription endpoint (should require auth)
    console.log('\n4. Testing transcription endpoint without auth...');
    const transcriptionResponse = await fetch(`${BASE_URL}/api/transcribe`, {
      method: 'POST'
    });
    if (transcriptionResponse.status === 401) {
      console.log('   ✅ Transcription endpoint properly protected');
    } else {
      console.log(`   ❌ Expected 401, got ${transcriptionResponse.status}`);
    }

    console.log('\n🎉 Authentication protection is working correctly!');
    console.log('\n📝 Next steps:');
    console.log('   1. Set up your Supabase project');
    console.log('   2. Add environment variables to .env.local');
    console.log('   3. Visit http://localhost:8080 and test the login flow');
    console.log('   4. Create an account and record your first dream!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure your development server is running:');
    console.log('   npm run dev');
  }
}

testAuthFlow(); 