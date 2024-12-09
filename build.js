import { readFile, writeFile } from 'fs';
import { join } from 'path';

const inputFilePath = join(__dirname, 'constants.js');
const outputFilePath = join(__dirname, 'public', 'constants.js');

readFile(inputFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading the input file:', err);
        return;
    }

    const transpiledData = data.replace('export default Constants', 'module.exports = Constants');

    writeFile(outputFilePath, transpiledData, 'utf8', (err) => {
        if (err) {
            console.error('Error writing the output file:', err);
            return;
        }

        console.log('File has been transpiled and saved to', outputFilePath);
    });
});