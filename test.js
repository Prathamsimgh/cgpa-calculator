'use strict';
/* Edge-case tests for the pure calculation module in app.js. Run: node test.js */
const { PRESETS, customPreset, convertToPercent, convertToCgpa, calcCGPA, getPreset } = require('./app.js');

let pass = 0;
let fail = 0;

function eq(actual, expected, name) {
  if (actual === expected) {
    pass += 1;
  } else {
    fail += 1;
    console.error(`FAIL ${name}: expected ${expected}, got ${actual}`);
  }
}

const P = id => getPreset(id);

/* --- VTU 2018: (CGPA - 0.75) x 10 --- */
eq(convertToPercent(8.5, P('vtu-2018')).value, '77.5', 'vtu 8.5 -> 77.5');
eq(convertToPercent(10, P('vtu-2018')).value, '92.5', 'vtu 10 -> 92.5');
eq(convertToPercent(0, P('vtu-2018')).value, '0', 'vtu 0 clamps to 0');
eq(convertToPercent(0, P('vtu-2018')).clamped, true, 'vtu 0 flagged clamped');
eq(convertToPercent(0.5, P('vtu-2018')).value, '0', 'vtu 0.5 clamps to 0');
eq(convertToCgpa(77.5, P('vtu-2018')).value, '8.5', 'vtu reverse 77.5 -> 8.5');

/* --- VTU 2021: x10 --- */
eq(convertToPercent(8.5, P('vtu-2021')).value, '85', 'vtu2021 8.5 -> 85');

/* --- Anna x10 / (CGPA-0.5)x10 --- */
eq(convertToPercent(9.2, P('anna-10')).value, '92', 'anna 9.2 -> 92');
eq(convertToPercent(10, P('anna-10')).value, '100', 'anna 10 -> 100 (clamped at 100)');
eq(convertToPercent(8.5, P('anna-05')).value, '80', 'anna-05 8.5 -> 80');
eq(convertToCgpa(80, P('anna-05')).value, '8.5', 'anna-05 reverse 80 -> 8.5');

/* --- AKTU --- */
eq(convertToPercent(8.5, P('aktu')).value, '77.5', 'aktu 8.5 -> 77.5');

/* --- GTU: (CGPA-0.5)x10 --- */
eq(convertToPercent(8, P('gtu')).value, '75', 'gtu 8 -> 75');
eq(convertToCgpa(75, P('gtu')).value, '8', 'gtu reverse 75 -> 8');

/* --- Mumbai: 7.1xCGPA+11 --- */
eq(convertToPercent(8, P('mumbai')).value, '67.8', 'mumbai 8 -> 67.8');
eq(convertToPercent(10, P('mumbai')).value, '82', 'mumbai 10 -> 82');
eq(convertToCgpa(67.8, P('mumbai')).value, '8', 'mumbai reverse 67.8 -> 8');

/* --- CBSE x9.5 --- */
eq(convertToPercent(10, P('cbse')).value, '95', 'cbse 10 -> 95');
eq(convertToCgpa(95, P('cbse')).value, '10', 'cbse reverse 95 -> 10');
eq(convertToPercent(8, P('cbse')).value, '76', 'cbse 8 -> 76');

/* --- Generic --- */
eq(convertToPercent(7.33, P('generic')).value, '73.3', 'generic rounding 7.33 -> 73.3');

/* --- Custom formula --- */
const custom = customPreset(9.5, 0);
eq(convertToPercent(8, custom).value, '76', 'custom 9.5/0: 8 -> 76');
const custom2 = customPreset(10, 0.75);
eq(convertToPercent(8.5, custom2).value, '77.5', 'custom 10/0.75: 8.5 -> 77.5');
eq(convertToCgpa(77.5, custom2).value, '8.5', 'custom reverse 77.5 -> 8.5');

/* --- SGPA -> CGPA --- */
eq(calcCGPA([{ sgpa: 8, credits: 20 }, { sgpa: 9, credits: 22 }]), '8.52', 'weighted cgpa 8.52');
eq(calcCGPA([{ sgpa: 10, credits: 24 }]), '10', 'single semester');
eq(calcCGPA([]), null, 'no rows -> null');
eq(calcCGPA([{ sgpa: 8, credits: 0 }]), null, 'zero credits -> null');

/* --- Rounding --- */
eq(convertToPercent(8.555, P('generic')).value, '85.55', 'rounds to 2dp');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
