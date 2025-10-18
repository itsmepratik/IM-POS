// Quick test script to check the refund API
// Run with: node test-refund-api.js

const testRefundAPI = async () => {
  const baseUrl = "http://localhost:3000";
  const testReferenceNumber = "TXN33125321433";

  console.log("🧪 Testing Refund API Endpoint");
  console.log("=====================================");
  console.log(`Testing with reference number: ${testReferenceNumber}\n`);

  try {
    const url = `${baseUrl}/api/transactions/fetch?referenceNumber=${encodeURIComponent(
      testReferenceNumber
    )}`;
    console.log(`📡 Fetching: ${url}`);

    const response = await fetch(url);
    console.log(
      `📊 Response Status: ${response.status} ${response.statusText}`
    );

    const data = await response.json();
    console.log("\n📦 Response Data:");
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log("\n✅ API call successful!");
      if (data.transactions && data.transactions.length > 0) {
        console.log(`✅ Found ${data.transactions.length} transaction(s)`);
      } else {
        console.log("⚠️  No transactions found with that reference number");
      }
    } else {
      console.log("\n❌ API call failed!");
      console.log(`Error: ${data.error || "Unknown error"}`);
      if (data.details) {
        console.log(`Details: ${data.details}`);
      }
    }
  } catch (error) {
    console.error("\n💥 Error during test:", error.message);
  }
};

testRefundAPI();
