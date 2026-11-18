/* Camera path for the 3D arrival hero (Casa Utah).
 * World units are metres, in the shared lot frame used by utah/viewer.js:
 * the house sits at z = lotOffset(houses.a) ≈ 7.33, its facade faces +Z,
 * the main door is at x ≈ 0.25, z ≈ 12.33, the street centre at z ≈ 26.6.
 * Each keyframe pins the camera position and look-at target at scroll
 * progress t; CatmullRomCurve3 interpolates between them (uniform spacing,
 * so keyframes must stay at t = 0, .25, .5, .75, 1).
 * Tune with ?debug=camera, which prints progress / position / target. */
export const keyframes = [
  { t: 0.00, label: 'Wide, high view of the lot and the house', position: [15, 21, 41], target: [-0.6, 0, 7.5] },
  { t: 0.25, label: 'At driveway height, facing the facade', position: [-6.2, 1.75, 27.5], target: [-0.8, 1.9, 11.5] },
  { t: 0.50, label: 'In front of the house, centred', position: [0.25, 1.7, 21.5], target: [0.25, 1.8, 11] },
  { t: 0.75, label: 'On the porch, facing the front door', position: [0.55, 1.65, 15.4], target: [0.25, 1.25, 12.2] },
  { t: 1.00, label: 'Close-up of the front door', position: [0.27, 1.5, 13.55], target: [0.25, 1.15, 11.6] }
];

/* Mobile frames the same beats with a taller field of view. */
export const fov = { desktop: 36, mobile: 52 };

/* The front door leaf is a separate mesh in utah-exterior-v2.glb (oak leaf,
 * its glass and hardware). It swings inward on a hinge at local x = 0.68. */
export const door = { start: 0.85, end: 1.0, hinge: [0.68, 0, 4.99], angle: -1.35 };

/* Headline beats: progress windows [in, hold-until, out]. */
export const beats = [
  { in: 0.00, out: [0.16, 0.24] },
  { in: [0.30, 0.37], out: [0.55, 0.62] },
  { in: [0.68, 0.75], out: null }
];
