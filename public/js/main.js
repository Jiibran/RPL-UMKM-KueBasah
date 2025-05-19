// Main JavaScript file for UMKM Kue Basah

// Update cart count on page load
document.addEventListener('DOMContentLoaded', function() {
  updateCartCount();
});

// Function to update cart count
function updateCartCount() {
  fetch('/api/cart/count')
    .then(response => response.json())
    .then(data => {
      document.getElementById('cart-count').innerText = data.count;
    })
    .catch(error => {
      console.error('Error fetching cart count:', error);
    });
}

// Product quantity selector
function decrementQuantity(inputId) {
  const input = document.getElementById(inputId);
  const currentValue = parseInt(input.value);
  if (currentValue > 1) {
    input.value = currentValue - 1;
  }
}

function incrementQuantity(inputId) {
  const input = document.getElementById(inputId);
  const currentValue = parseInt(input.value);
  const max = parseInt(input.getAttribute('max'));
  if (!max || currentValue < max) {
    input.value = currentValue + 1;
  }
}

// Add to cart with animation
function addToCart(productId, quantity = 1) {
  const data = {
    product_id: productId,
    quantity: quantity
  };
  
  fetch('/orders/cart/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(err => { throw err; });
    }
    return response.json();
  })
  .then(data => {
    // Update cart count
    updateCartCount();
    
    // Show success message
    const toast = new bootstrap.Toast(document.getElementById('cartToast'));
    toast.show();
  })
  .catch(error => {
    console.error('Error adding to cart:', error);
    // Show error message
    document.getElementById('errorToastBody').innerText = error.error || 'Failed to add item to cart';
    const toast = new bootstrap.Toast(document.getElementById('errorToast'));
    toast.show();
  });
}

// Image preview for admin forms
function previewImage(event, previewId) {
  const reader = new FileReader();
  reader.onload = function() {
    const preview = document.getElementById(previewId);
    preview.src = reader.result;
    preview.style.display = 'block';
  }
  reader.readAsDataURL(event.target.files[0]);
}
