const assert = require("assert");

async function runTests() {
  const API_URL = "http://localhost:5001/api";
  console.log("Running functional backend tests...");
  let token = "";

  // 1. Validation Fail Test
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ name: "", email: "not_an_email", password: "123" })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 400, "Should reject bad input");
    assert.strictEqual(data.success, false, "Should be false");
    console.log("✅ Validation Test Passed");
  } catch (err) {
    console.error("❌ Validation Test Failed", err.message);
  }

  // 2. Register
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ name: "QA Tester", email: "qa@tester.com", password: "password123" })
    });
    const data = await res.json();
    // 400 means already exists, which is fine if we re-run
    if (res.status !== 201 && res.status !== 400) throw new Error("Unexpected register status: " + res.status);
    console.log("✅ Registration Test Passed");
  } catch (err) {
    console.error("❌ Registration Test Failed", err.message);
  }

  // 3. Login
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ email: "qa@tester.com", password: "password123" })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200, "Should login ok");
    assert(data.token, "Should have token");
    token = data.token;
    console.log("✅ Login Test Passed");
  } catch (err) {
    console.error("❌ Login Test Failed", err.message);
  }

  // 4. Update Profile
  try {
    const res = await fetch(`${API_URL}/auth/update-profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name: "QA Tester Updated" })
    });
    assert.strictEqual(res.status, 200, "Should update profile ok");
    const data = await res.json();
    assert.strictEqual(data.user.name, "QA Tester Updated", "Name should be updated");
    console.log("✅ Update Profile Test Passed");
  } catch(err) {
    console.error("❌ Update Profile Test Failed", err.message);
  }
}
runTests();
