/**
 * Script to generate placeholder images for development purposes
 * This version creates colored rectangles with text as placeholders
 */
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Base directory for images
const imagesDir = path.join(__dirname, 'public', 'images');

// Function to create a placeholder image
function createPlaceholderImage(filename, width, height, bgColor, textColor, text) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Creating placeholder image: ${filename}`);
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      
      // Fill background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);
      
      // Add text
      ctx.fillStyle = textColor;
      ctx.font = `bold ${Math.floor(width / 20)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Handle multi-line text
      const words = text.split(' ');
      let lines = [];
      let currentLine = '';
      
      words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > width * 0.8 && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      if (currentLine) lines.push(currentLine);
      
      // Draw each line
      const lineHeight = Math.floor(width / 15);
      const startY = height / 2 - (lines.length - 1) * lineHeight / 2;
      
      lines.forEach((line, i) => {
        ctx.fillText(line, width / 2, startY + i * lineHeight);
      });
      
      // Save to file
      const filePath = path.join(imagesDir, filename);
      const buffer = canvas.toBuffer('image/jpeg');
      fs.writeFileSync(filePath, buffer);
      
      console.log(`Created: ${filename}`);
      resolve();
    } catch (err) {
      console.error(`Error creating ${filename}: ${err.message}`);
      reject(err);
    }
  });
}

// Create necessary directories if they don't exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function generateImages() {
  try {
    console.log("Starting placeholder image generation...");
    
    // Create directories if they don't exist
    [
      imagesDir,
      path.join(imagesDir, 'products'),
      path.join(imagesDir, 'testimonials'),
      path.join(imagesDir, 'team'),
      path.join(imagesDir, 'about')
    ].forEach(ensureDirectoryExists);

    console.log("Directories created/verified. Generating images...");

    // Generate logo
    await createPlaceholderImage('logo.png', 200, 60, '#FF6B6B', '#FFFFFF', 'UMKM Kue Basah');
    
    // Generate favicon
    await createPlaceholderImage('favicon.png', 32, 32, '#FF6B6B', '#FFFFFF', 'KB');
    
    // Generate hero background
    await createPlaceholderImage('hero-bg.jpg', 1200, 600, '#946B4A', '#FFFFFF', 'Traditional Cakes');
    
    // Generate product placeholders
    const products = [
      { name: 'product1.jpg', title: 'Kue Lapis' },
      { name: 'product2.jpg', title: 'Klepon' },
      { name: 'product3.jpg', title: 'Lemper' },
      { name: 'product4.jpg', title: 'Onde-onde' },
      { name: 'product5.jpg', title: 'Bika Ambon' },
      { name: 'product6.jpg', title: 'Kue Putu' },
      { name: 'product7.jpg', title: 'Dadar Gulung' },
      { name: 'product8.jpg', title: 'Nagasari' }
    ];
    
    console.log("Generating product images...");
    for (const product of products) {
      await createPlaceholderImage(
        path.join('products', product.name),
        400, 300, 
        '#946B4A', 
        '#FFFFFF', 
        product.title
      );
    }
    
    // Generate testimonial images
    console.log("Generating testimonial images...");
    for (let i = 1; i <= 3; i++) {
      await createPlaceholderImage(
        path.join('testimonials', `user${i}.jpg`),
        100, 100,
        '#CCCCCC',
        '#666666',
        `User ${i}`
      );
    }
    
    // Generate team members images
    console.log("Generating team member images...");
    const teamMembers = [
      { name: 'founder.jpg', title: 'Founder' },
      { name: 'chef.jpg', title: 'Chef' },
      { name: 'manager.jpg', title: 'Manager' }
    ];
    
    for (const member of teamMembers) {
      await createPlaceholderImage(
        path.join('team', member.name),
        300, 300,
        '#CCCCCC',
        '#666666',
        member.title
      );
    }
    
    // Generate about page images
    console.log("Generating about page images...");
    const aboutImages = [
      { name: 'store-front.jpg', title: 'Our Store' },
      { name: 'kitchen.jpg', title: 'Our Kitchen' },
      { name: 'ingredients.jpg', title: 'Premium Ingredients' }
    ];
    
    for (const image of aboutImages) {
      await createPlaceholderImage(
        path.join('about', image.name),
        600, 400,
        '#EEEEEE',
        '#666666',
        image.title
      );
    }
    
    // Generate default placeholders
    console.log("Generating default placeholder images...");
    await createPlaceholderImage('placeholder.jpg', 400, 300, '#EEEEEE', '#666666', 'Image');
    await createPlaceholderImage('user-placeholder.jpg', 100, 100, '#CCCCCC', '#666666', 'User');
    await createPlaceholderImage('qr-code.png', 200, 200, '#FFFFFF', '#000000', 'QR Code');
    
    console.log('Placeholder images generated successfully!');
  } catch (error) {
    console.error('Error generating placeholder images:', error);
  }
}

// Run the image generation
generateImages();
