// js/no-subway.js — Waterloo has no subway. Stands in for subway.js and subway-ride.js with the same interface that
// main.js uses, doing nothing, so the rest of the engine runs unchanged (the ION light rail is a surface line).
(function () {
  window.CITY = window.CITY || {};
  window.CITY.createSubway = () => ({ colliders: [], entrances: { pylons: [] }, update() {} });
  window.CITY.createSubwayRide = () => ({
    active: false,
    inside: false,
    canChase: false,
    hasEntranceCandidate: false,
    surfaceMode: null,
    station: null,
    warmGraphics() {},
    update() {},
    action: () => false,
    featured: () => false,
  });
})();
