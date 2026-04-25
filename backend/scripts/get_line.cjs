const fs = require('fs');
const lines = fs.readFileSync('c:\\Users\\lenovo\\my work\\institute\\frontend\\src\\Pages\\Vehicles\\VehicleFormPage.tsx', 'utf8').split('\n');
console.log(JSON.stringify(lines[495])); // 0-indexed, so 495 is line 496
