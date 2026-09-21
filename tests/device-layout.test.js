const assert = require("assert");
const { classifyDevice } = require("../device-layout.js");

assert.strictEqual(classifyDevice({
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148",
  viewportWidth: 947,
  screenWidth: 390,
  screenHeight: 844,
  maxTouchPoints: 5,
  coarsePointer: true,
}), "mobile", "iPhone containers must stay mobile even with a wide reported viewport");

assert.strictEqual(classifyDevice({
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Version/18 Safari/605.1.15",
  viewportWidth: 1024,
  screenWidth: 1024,
  screenHeight: 1366,
  maxTouchPoints: 5,
  coarsePointer: true,
}), "tablet", "iPad desktop user agents must use the tablet rail");

assert.strictEqual(classifyDevice({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  viewportWidth: 1440,
  screenWidth: 1920,
  screenHeight: 1080,
  maxTouchPoints: 0,
  coarsePointer: false,
}), "desktop", "desktop browsers must use the sidebar-only workspace layout");

assert.strictEqual(classifyDevice({ viewportWidth: 640 }), "mobile");
assert.strictEqual(classifyDevice({ viewportWidth: 900 }), "tablet");

assert.strictEqual(classifyDevice({
  userAgent: "Mozilla/5.0",
  viewportWidth: 947,
  viewportHeight: 1800,
  maxTouchPoints: 0,
  coarsePointer: false,
}), "mobile", "privacy-restricted tall phone containers must not render desktop navigation");

console.log("device-layout tests passed");
