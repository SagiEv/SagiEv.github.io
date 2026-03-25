const fs = require('fs');

const file = fs.readFileSync('js/color-shooter.js', 'utf8');

// The state variables to prefix
const stateVars = [
  'levelIdx', 'score', 'hearts', 'mismatches', 'levelStartTime',
  'levelTime', 'rects', 'bullets', 'particles', 'spawnTimer',
  'lastTime', 'stats', 'charX', 'aimAngle', 'mouseX', 'mouseY',
  'currentColorIdx', 'guidePoints'
];

let res = file;

// Replace state variable accesses
for (const v of stateVars) {
  const regex = new RegExp('\\b' + v + '\\b', 'g');
  res = res.replace(regex, 'state.' + v);
}
// Special case for 'state' -> 'state.status'
// we need to be careful not to replace 'state.' with 'state.status.'
res = res.replace(/\bstate\b(?!\.)/g, 'state.status');

// Now let's split into modules manually inside this script or write it out to inspect?
fs.writeFileSync('js/color-shooter-transformed.js', res);
console.log('Transformed to color-shooter-transformed.js');
