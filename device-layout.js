(function initializeDeviceLayout(root) {
  "use strict";

  function classifyDevice(environment) {
    const details = environment || {};
    const userAgent = String(details.userAgent || "");
    const mobileHint = details.mobileHint === true;
    const touchPoints = Number(details.maxTouchPoints || 0);
    const viewportWidth = Number(details.viewportWidth || 0);
    const viewportHeight = Number(details.viewportHeight || 0);
    const screenWidth = Number(details.screenWidth || 0);
    const screenHeight = Number(details.screenHeight || 0);
    const shortestScreenSide = Math.min(
      screenWidth || Number.POSITIVE_INFINITY,
      screenHeight || Number.POSITIVE_INFINITY
    );

    const isPhoneAgent = /iPhone|iPod|Windows Phone|Android.*Mobile|\bMobile\b/i.test(userAgent);
    const isIPadAgent = /iPad/i.test(userAgent)
      || (/Macintosh/i.test(userAgent) && touchPoints > 1);
    const isTabletAgent = isIPadAgent
      || /Tablet|Android(?!.*Mobile)|Silk|Kindle/i.test(userAgent);

    if (mobileHint || isPhoneAgent) return "mobile";
    if (isTabletAgent) return "tablet";

    // Some in-app iOS browsers expose a desktop user agent, no touch metadata,
    // and a scaled width near 950px. Their tall viewport is still unambiguous.
    const viewportRatio = viewportHeight > 0 ? viewportWidth / viewportHeight : 0;
    if (viewportWidth > 0 && viewportWidth <= 1100 && viewportRatio > 0 && viewportRatio <= 0.625) {
      return "mobile";
    }

    if (details.coarsePointer && touchPoints > 0 && shortestScreenSide <= 600) {
      return "mobile";
    }
    if (details.coarsePointer && touchPoints > 0 && shortestScreenSide <= 1100) {
      return "tablet";
    }

    if (viewportWidth > 0 && viewportWidth <= 767) return "mobile";
    if (viewportWidth > 0 && viewportWidth <= 1199) return "tablet";
    return "desktop";
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { classifyDevice };
  }

  if (!root || !root.document) return;

  const navigatorDetails = root.navigator || {};
  const screenDetails = root.screen || {};
  const device = classifyDevice({
    userAgent: navigatorDetails.userAgent,
    mobileHint: navigatorDetails.userAgentData && navigatorDetails.userAgentData.mobile,
    maxTouchPoints: navigatorDetails.maxTouchPoints,
    viewportWidth: root.innerWidth,
    viewportHeight: root.innerHeight,
    screenWidth: screenDetails.width,
    screenHeight: screenDetails.height,
    coarsePointer: typeof root.matchMedia === "function"
      && root.matchMedia("(pointer: coarse)").matches,
  });

  root.document.documentElement.dataset.device = device;
  root.DafatiiDeviceLayout = Object.freeze({ classifyDevice, current: device });
}(typeof window === "undefined" ? null : window));
