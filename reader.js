//only read file
// const fs = require('fs');

// if (process.argv.length !== 3) {
//   console.error('Usage: node readfile.js <filename>');
//   process.exit(1);
// }

// const filename = process.argv[2];

// fs.readFile(filename, 'utf8', (err, data) => {
//   if (err) {
//     console.error(err);
//     process.exit(1);
//   }
//   console.log(data);
// });

//this is read input and put it in output (if output file doesn't exist -> create it)
//Usage: node readwrite.js <input_filename> <output_filename>
const decryptedSourceCode = require('./app');
const fs = require('fs');

if (process.argv.length !== 4) {
  console.error('Usage: node readwrite.js <input_filename> <output_filename>');
  process.exit(1);
}

const inputFilename = "examples/" + process.argv[2];
const outputFilename = process.argv[3];

fs.readFile(inputFilename, 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  // TODO: Process the input data and generate some output
  const outputData = decryptedSourceCode;

  fs.writeFile(outputFilename, outputData, 'utf8', (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Output written to ${outputFilename}`);
  });
});