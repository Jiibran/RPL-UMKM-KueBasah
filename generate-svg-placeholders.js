/**
 * Script to generate dummy product data and simple placeholder images
 * This version creates simple colored boxes as images using pure Node.js
 */
const fs = require('fs');
const path = require('path');

// Base directory for images
const imagesDir = path.join(__dirname, 'public', 'images');

// Create a simple colored box image with text as placeholder
function createSimplePlaceholderImage(filename, width, height, color) {
  return new Promise((resolve, reject) => {
    try {
      // Create an SVG string
      const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${color}"/>
        <text x="50%" y="50%" font-family="Arial" font-size="${Math.floor(width/10)}px" fill="white" text-anchor="middle" dominant-baseline="middle">${filename}</text>
      </svg>
      `;
      
      const filePath = path.join(imagesDir, filename);
      fs.writeFileSync(filePath, svg);
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

async function generatePlaceholders() {
  try {
    console.log("Starting placeholder generation...");
    
    // Create directories if they don't exist
    [
      imagesDir,
      path.join(imagesDir, 'products'),
      path.join(imagesDir, 'testimonials'),
      path.join(imagesDir, 'team'),
      path.join(imagesDir, 'about')
    ].forEach(ensureDirectoryExists);

    // Generate product placeholders
    const products = [
      { name: 'product1.svg', color: '#FF6B6B' },
      { name: 'product2.svg', color: '#4ECDC4' },
      { name: 'product3.svg', color: '#FFD166' },
      { name: 'product4.svg', color: '#FF6B6B' },
      { name: 'product5.svg', color: '#4ECDC4' },
      { name: 'product6.svg', color: '#FFD166' },
      { name: 'product7.svg', color: '#FF6B6B' },
      { name: 'product8.svg', color: '#4ECDC4' }
    ];
    
    console.log("Generating product images...");
    for (const product of products) {
      await createSimplePlaceholderImage(
        path.join('products', product.name),
        400, 300,
        product.color
      );
    }
    
    // Generate testimonial placeholders
    console.log("Generating testimonial images...");
    for (let i = 1; i <= 3; i++) {
      await createSimplePlaceholderImage(
        path.join('testimonials', `user${i}.svg`),
        100, 100,
        '#946B4A'
      );
    }
    
    // Generate team member placeholders
    console.log("Generating team images...");
    const teamMembers = [
      { name: 'founder.svg', color: '#FF6B6B' },
      { name: 'chef.svg', color: '#4ECDC4' },
      { name: 'manager.svg', color: '#FFD166' }
    ];
    
    for (const member of teamMembers) {
      await createSimplePlaceholderImage(
        path.join('team', member.name),
        300, 300,
        member.color
      );
    }
    
    // Generate about images
    console.log("Generating about page images...");
    const aboutImages = [
      { name: 'store-front.svg', color: '#946B4A' },
      { name: 'kitchen.svg', color: '#4ECDC4' },
      { name: 'ingredients.svg', color: '#FFD166' }
    ];
    
    for (const image of aboutImages) {
      await createSimplePlaceholderImage(
        path.join('about', image.name),
        600, 400,
        image.color
      );
    }
    
    // Generate default placeholders
    console.log("Generating default placeholders...");
    await createSimplePlaceholderImage('placeholder.svg', 400, 300, '#946B4A');
    await createSimplePlaceholderImage('logo.svg', 200, 60, '#FF6B6B');
    await createSimplePlaceholderImage('favicon.svg', 32, 32, '#FF6B6B');
    
    console.log('Placeholder images generated successfully!');
    
    // Also create a data file with product information
    generateProductData();
    
  } catch (error) {
    console.error('Error generating placeholders:', error);
  }
}

// Generate sample product data
function generateProductData() {
  const productData = [
    {
      id: 1,
      name: "Kue Lapis",
      description: "Traditional layered cake with rich coconut and pandan flavors, perfect for special occasions.",
      price: 45000,
      image: "product1.svg",
      category_id: 1,
      stock: 20,
      is_featured: true
    },
    {
      id: 2,
      name: "Klepon",
      description: "Sweet rice cake balls filled with palm sugar and coated with grated coconut.",
      price: 25000,
      image: "product2.svg",
      category_id: 1,
      stock: 30,
      is_featured: true
    },
    {
      id: 3,
      name: "Lemper",
      description: "Sticky rice rolls filled with savory chicken or beef, wrapped in banana leaves.",
      price: 30000,
      image: "product3.svg",
      category_id: 1,
      stock: 25,
      is_featured: false
    },
    {
      id: 4,
      name: "Onde-onde",
      description: "Fried rice cake balls with sweet mung bean filling and sesame seed coating.",
      price: 28000,
      image: "product4.svg",
      category_id: 3,
      stock: 15,
      is_featured: true
    },
    {
      id: 5,
      name: "Bika Ambon",
      description: "Honeycombed textured cake with rich taste of egg and coconut milk.",
      price: 50000,
      image: "product5.svg",
      category_id: 1,
      stock: 10,
      is_featured: true
    },
    {
      id: 6,
      name: "Kue Putu",
      description: "Cylindrical green rice flour cake with palm sugar filling, served with grated coconut.",
      price: 20000,
      image: "product6.svg",
      category_id: 3,
      stock: 20,
      is_featured: false
    },
    {
      id: 7,
      name: "Dadar Gulung",
      description: "Green pancake rolls with sweet coconut and palm sugar filling.",
      price: 22000,
      image: "product7.svg",
      category_id: 1,
      stock: 25,
      is_featured: true
    },
    {
      id: 8,
      name: "Nagasari",
      description: "Rice flour pudding with banana filling, wrapped in banana leaves.",
      price: 18000,
      image: "product8.svg",
      category_id: 1,
      stock: 30,
      is_featured: false
    }
  ];

  // Save to products.json file
  const dataPath = path.join(__dirname, 'server', 'data');
  ensureDirectoryExists(dataPath);
  fs.writeFileSync(path.join(dataPath, 'products.json'), JSON.stringify(productData, null, 2));
  console.log('Product data generated successfully!');
}

// Run the placeholder generation
generatePlaceholders();
