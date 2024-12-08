const fs = require('fs');
const path = require('path');

const inputFilePath = path.join(__dirname, 'constants.js');
const outputFilePath = path.join(__dirname, 'public', 'constants.js');

fs.readFile(inputFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading the input file:', err);
        return;
    }

    const transpiledData = data.replace('export default Constants', 'module.exports = Constants');

    fs.writeFile(outputFilePath, transpiledData, 'utf8', (err) => {
        if (err) {
            console.error('Error writing the output file:', err);
            return;
        }

        console.log('File has been transpiled and saved to', outputFilePath);
    });
});