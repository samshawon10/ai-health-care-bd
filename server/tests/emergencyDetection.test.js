import test from "node:test";
import assert from "node:assert/strict";
import { detectEmergency } from "../src/services/emergencyService.js";

test("detects English chest pain as emergency", () => {
  const result = detectEmergency("I have severe chest pain and sweating");
  assert.equal(result.isEmergency, true);
  assert.equal(result.riskLevel, "High");
  assert.match(result.flags.join(" "), /cardiac/i);
});

test("detects Bangla breathing emergency", () => {
  const result = detectEmergency("আমার খুব শ্বাসকষ্ট হচ্ছে");
  assert.equal(result.isEmergency, true);
  assert.equal(result.riskLevel, "High");
  assert.match(result.flags.join(" "), /breathing/i);
});

test("does not flag mild headache as automatic emergency", () => {
  const result = detectEmergency("Mild headache since afternoon");
  assert.equal(result.isEmergency, false);
  assert.equal(result.riskLevel, "Low");
});

test("does not flag negated English chest pain", () => {
  const result = detectEmergency("I have fever but no chest pain or breathing issues");
  assert.equal(result.isEmergency, false);
});

test("does not flag negated Bangla chest pain", () => {
  const result = detectEmergency("জ্বর আছে কিন্তু বুক ব্যথা নেই");
  assert.equal(result.isEmergency, false);
});

test("still flags contrasted breathing emergency", () => {
  const result = detectEmergency("No chest pain but I cannot breathe");
  assert.equal(result.isEmergency, true);
  assert.match(result.flags.join(" "), /breathing/i);
});
