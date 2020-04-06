const fs = require('fs')
const csv = require('csv-parser')
function readCSV(filename) {
    return new Promise((resolve, reject) => {
        try {
            let rows = [];
            fs.createReadStream(filename)
                .pipe(csv())
                .on('data', (row) => {                  
                        rows.push(row)
                })
                .on('end', () => {
                    resolve(rows);
                });
        }
        catch (err) {
            console.error(err);
            reject(err);
        }
    });
}
exports.readCSV = readCSV;
