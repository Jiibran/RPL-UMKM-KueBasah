/**
 * Script to generate placeholder images for development purposes
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

// Base directory for images
const imagesDir = path.join(__dirname, 'public', 'images');

// Function to download a placeholder image
function downloadPlaceholderImage(filename, width, height, category, text) {
  return new Promise((resolve, reject) => {
    const url = `https://via.placeholder.com/${width}x${height}/${category}?text=${encodeURIComponent(text)}`;
    const filePath = path.join(imagesDir, filename);
    
    console.log(`Downloading placeholder: ${filename}`);
    
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath);
      reject(err.message);
    });
  });
}

// Create necessary directories if they don't exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function generateImages() {
  try {
    // Create directories if they don't exist
    [
      path.join(imagesDir, 'products'),
      path.join(imagesDir, 'testimonials'),
      path.join(imagesDir, 'team'),
      path.join(imagesDir, 'about')
    ].forEach(ensureDirectoryExists);

    // Generate logo
    await downloadPlaceholderImage('logo.png', 200, 60, 'FF6B6B/FFFFFF', 'UMKM Kue Basah');
    
    // Generate favicon
    await downloadPlaceholderImage('favicon.png', 32, 32, 'FF6B6B/FFFFFF', 'KB');
    
    // Generate hero background
    await downloadPlaceholderImage('hero-bg.jpg', 1200, 600, '946B4A/FFFFFF', 'Traditional Cakes');
    
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
    
    for (const product of products) {
      await downloadPlaceholderImage(
        path.join('products', product.name),
        400, 300, 
        '946B4A/FFFFFF', 
        product.title
      );
    }
    
    // Generate testimonial images
    for (let i = 1; i <= 3; i++) {
      await downloadPlaceholderImage(
        path.join('testimonials', `user${i}.jpg`),
        100, 100,
        'CCCCCC/666666',
        `User ${i}`
      );
    }
    
    // Generate team members images
    const teamMembers = [
      { name: 'founder.jpg', title: 'Founder' },
      { name: 'chef.jpg', title: 'Chef' },
      { name: 'manager.jpg', title: 'Manager' }
    ];
    
    for (const member of teamMembers) {
      await downloadPlaceholderImage(
        path.join('team', member.name),
        300, 300,
        'CCCCCC/666666',
        member.title
      );
    }
    
    // Generate about page images
    const aboutImages = [
      { name: 'store-front.jpg', title: 'Our Store' },
      { name: 'kitchen.jpg', title: 'Our Kitchen' },
      { name: 'ingredients.jpg', title: 'Premium Ingredients' }
    ];
    
    for (const image of aboutImages) {
      await downloadPlaceholderImage(
        path.join('about', image.name),
        600, 400,
        'EEEEEE/666666',
        image.title
      );
    }
    
    // Generate default placeholders
    await downloadPlaceholderImage('placeholder.jpg', 400, 300, 'EEEEEE/666666', 'Image');
    await downloadPlaceholderImage('user-placeholder.jpg', 100, 100, 'CCCCCC/666666', 'User');
    await downloadPlaceholderImage('qr-code.png', 200, 200, 'FFFFFF/000000', 'QR Code');
    
    console.log('Placeholder images generated successfully!');
  } catch (error) {
    console.error('Error generating placeholder images:', error);
  }
}

// Run the image generation
generateImages();
