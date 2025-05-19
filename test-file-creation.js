const fs = require('fs');
const path = require('path');

// Create test directories and files
const imagesDir = path.join(__dirname, 'public', 'images');
const testDirs = [
  path.join(imagesDir, 'products'),
  path.join(imagesDir, 'testimonials'),
  path.join(imagesDir, 'team'),
  path.join(imagesDir, 'about')
];

console.log('Creating test directories...');

// Ensure the directories exist
testDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  } else {
    console.log(`Directory already exists: ${dir}`);
  }
});

// Create test files
const testFiles = testDirs.map(dir => path.join(dir, 'test.txt'));

console.log('Creating test files...');
testFiles.forEach(file => {
  try {
    fs.writeFileSync(file, 'This is a test file.');
    console.log(`Created test file: ${file}`);
  } catch (err) {
    console.error(`Error creating file ${file}: ${err.message}`);
  }
});

console.log('Test completed!');
