import test from "node:test";
import assert from "node:assert/strict";

process.env.OPENAI_API_KEY = "";

const { createApp } = await import("../src/app.js");

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

async function request(server, path, options = {}) {
  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json();
  return { response, payload };
}

test("status endpoint reports fallback mode without OpenAI key", async () => {
  const server = await listen(createApp());

  try {
    const { response, payload } = await request(server, "/api/status");

    assert.equal(response.status, 200);
    assert.equal(payload.status, "ok");
    assert.equal(payload.storageAvailable, false);
    assert.equal(payload.aiMode, "fallback");
  } finally {
    server.close();
  }
});

test("emergency symptom check returns deterministic high-risk guidance", async () => {
  const server = await listen(createApp());

  try {
    const { response, payload } = await request(server, "/api/health-checks", {
      method: "POST",
      body: JSON.stringify({
        userId: "test-user",
        symptoms: "I have chest pain and cannot breathe",
        age: 45,
        sex: "male",
        location: "Dhaka"
      })
    });

    assert.equal(response.status, 201);
    assert.equal(payload.guidance.riskLevel, "High");
    assert.equal(payload.guidance.emergencyRequired, true);
    assert.equal(payload.emergency.isEmergency, true);
    assert.equal(payload.source, "rules");
    assert.equal(payload.storage.available, false);
  } finally {
    server.close();
  }
});

test("history endpoint returns empty list when database is unavailable", async () => {
  const server = await listen(createApp());

  try {
    const { response, payload } = await request(server, "/api/health-checks?userId=test-user");

    assert.equal(response.status, 200);
    assert.deepEqual(payload.healthChecks, []);
    assert.equal(payload.storageAvailable, false);
  } finally {
    server.close();
  }
});
