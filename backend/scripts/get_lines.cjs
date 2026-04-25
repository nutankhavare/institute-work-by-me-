const fs = require('fs');
const lines = fs.readFileSync('c:\\Users\\lenovo\\my work\\institute\\frontend\\src\\Pages\\Vehicles\\VehicleFormPage.tsx', 'utf8').split('\n');
for (let i = 473; i <= 491; i++) {
  console.log(`${i+1}: ${JSON.stringify(lines[i])}`);
}
