/**
 * Icon Generator Script for FleetInspect Pro
 *
 * This script helps generate PNG icons from SVG files.
 *
 * Option 1: Use online converter
 * - Go to https://cloudconvert.com/svg-to-png or https://svgtopng.com/
 * - Upload the SVG files from assets folder
 * - Download and replace the PNG files
 *
 * Option 2: Install sharp and run this script
 * npm install sharp
 * node scripts/generate-icons.js
 *
 * Required sizes:
 * - icon.png: 1024x1024 (App Store icon)
 * - splash-icon.png: 288x288 (Splash screen icon - will be centered on background)
 * - adaptive-icon.png: 1024x1024 (Android adaptive icon foreground)
 * - notification-icon.png: 96x96 (Push notification icon)
 */

const fs = require('fs');
const path = require('path');

async function generateIcons() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.log('Sharp not installed. Install it with: npm install sharp');
    console.log('\nAlternatively, use an online SVG to PNG converter:');
    console.log('1. https://cloudconvert.com/svg-to-png');
    console.log('2. https://svgtopng.com/');
    console.log('\nSVG files are in: ' + path.join(__dirname, '../assets'));
    console.log('\nRequired conversions:');
    console.log('- icon.svg -> icon.png (1024x1024)');
    console.log('- icon.svg -> adaptive-icon.png (1024x1024)');
    console.log('- splash-icon.svg -> splash-icon.png (288x288)');
    console.log('- icon.svg -> notification-icon.png (96x96)');
    return;
  }

  const assetsDir = path.join(__dirname, '../assets');

  const conversions = [
    { input: 'icon.svg', output: 'icon.png', width: 1024, height: 1024 },
    { input: 'icon.svg', output: 'adaptive-icon.png', width: 1024, height: 1024 },
    { input: 'splash-icon.svg', output: 'splash-icon.png', width: 288, height: 288 },
    { input: 'icon.svg', output: 'notification-icon.png', width: 96, height: 96 },
  ];

  for (const { input, output, width, height } of conversions) {
    const inputPath = path.join(assetsDir, input);
    const outputPath = path.join(assetsDir, output);

    if (!fs.existsSync(inputPath)) {
      console.log(`Skipping ${input} - file not found`);
      continue;
    }

    try {
      await sharp(inputPath)
        .resize(width, height)
        .png()
        .toFile(outputPath);
      console.log(`Generated: ${output} (${width}x${height})`);
    } catch (error) {
      console.error(`Error generating ${output}:`, error.message);
    }
  }

  console.log('\nIcon generation complete!');
}

generateIcons();
