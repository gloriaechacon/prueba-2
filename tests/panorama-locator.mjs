// Run directly: node tests/panorama-locator.mjs (no package scripts/build).
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../public/proyecto/lot-panorama-map.js', import.meta.url), 'utf8');
const { PANORAMA_POSES, viewHeading, horizontalFov, conePath } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const catalog = JSON.parse(await readFile(new URL('../public/assets/lot-photos/catalog.json', import.meta.url), 'utf8'));
const lots = JSON.parse(await readFile(new URL('../public/assets/geography/collection-lots.json', import.meta.url), 'utf8')).lots;
assert.equal(viewHeading(350, 20), 10);
assert.equal(viewHeading(-20, 10), 350);
assert.equal(viewHeading(1080, 0), 0);
assert(Math.abs(horizontalFov(90, 1) - 90) < 1e-10);
assert(horizontalFov(72, 2) > horizontalFov(72, .5));
assert(horizontalFov(40, 2) < horizontalFov(72, 2));
for (const fov of [28, 40, 72, 95]) for (const aspect of [.3, 1, 2.5]) {
  assert(!/NaN|Infinity/.test(conePath(horizontalFov(fov, aspect))));
}
let count = 0;
for (const [id, items] of Object.entries(catalog)) for (const item of items.filter(i => i.type === '360' && !i.hidden)) {
  const pose = PANORAMA_POSES[item.file]; assert(pose, `${id}: missing pose`);
  assert(pose.headingOffset >= 0 && pose.headingOffset < 360);
  const lot = lots.find(l => l.id === id), lat = lot.center.lat, lon = lot.center.lon;
  const east = (pose.lon - lon) * 111320 * Math.cos(lat * Math.PI / 180), north = (pose.lat - lat) * 111320;
  assert(Math.hypot(east, north) < 150, `${id}: camera unexpectedly distant`);
  const front = lot.front.frontBearingDegrees * Math.PI / 180;
  assert(east * Math.sin(front) + north * Math.cos(front) > 0, `${id}: camera must be street-side`);
  const yaw = item.initialView?.yaw || 0;
  assert.equal(Math.round((viewHeading(yaw + 8, pose.headingOffset) - viewHeading(yaw, pose.headingOffset) + 360) % 360), 8);
  count++;
}
assert.equal(count, 6);
console.log('PASS: six current panoramas, north wrap, rotation direction, aperture and pose bounds.');
