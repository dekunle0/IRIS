import { IRISClient } from './src/index';

async function runTest() {
  console.log("--- 🚀 Testing LIS-to-IRIS Integration ---");

  // Initialize the SDK with the local API address and security token
  const iris = new IRISClient({
    baseUrl: "http://127.0.0.1:8787",
    localToken: "local-dev-token-xyz", 
  });

  try {
    console.log("1. Pushing new patient context from LIS...");
    const syncResponse = await iris.patients.sync({
      externalPatientId: `LIS-${Date.now()}`,
      name: "Ngozi Okafor (LIS Sync)",
      dob: "1988-11-20",
      gender: "Female",
      testRequests: [{ testType: "Malaria Parasite" }],
    });

    console.log("✅ Success! Patient added to IRIS Worklist.");
    console.log(`Mapped IRIS Patient ID: ${syncResponse.irisPatientId}`);

  } catch (error: any) {
    console.error("❌ Test Failed:", error.message);
  }
}

runTest();