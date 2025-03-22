import fetch from 'node-fetch';

async function testLogin(username, password) {
  try {
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    if (response.ok) {
      console.log(`✅ Successful login for ${username} with role: ${data.role}, organization: ${data.organizationType}`);
    } else {
      console.log(`❌ Failed login for ${username}: ${data.message}`);
    }
  } catch (error) {
    console.error(`Error testing login for ${username}:`, error.message);
  }
}

async function runTests() {
  console.log('Testing authentication for all sample users...\n');
  
  // Admin user
  await testLogin('admin', 'Admin@123');
  
  // ATO instructor
  await testLogin('ato_airline', 'ATO@airline123');
  
  // Airline student
  await testLogin('student', 'Student@123');
  
  // Second airline student
  await testLogin('student2', 'Student@123');
  
  // ATO instructor (second)
  await testLogin('airline2', 'ATO@airline123');
  
  // ATO examiner
  await testLogin('examiner', 'Examiner@123');
  
  // Airline instructor
  await testLogin('airline', 'Airline@123');
  
  // ATO student
  await testLogin('atostudent', 'Student@123');
  
  console.log('\nTesting completed!');
}

runTests();