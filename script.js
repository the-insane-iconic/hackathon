// Initialize Firebase (compat version)
const firebaseConfig = {
  apiKey: "AIzaSyA_NU0Cz5XqDyBQehpYiuTlUjCXFWx4bsM",
  authDomain: "insane-gaming-setup.firebaseapp.com",
  projectId: "insane-gaming-setup",
  storageBucket: "insane-gaming-setup.appspot.com",
  messagingSenderId: "472778417206",
  appId: "1:472778417206:web:b1cca04cf9d19f897c6497",
  measurementId: "G-3KC6TVL9DV"
};

// Initialize Firebase services
let app, auth, database, db;
try {
  app = firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  database = firebase.database();
  db = firebase.firestore();
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Global cart variable with localStorage persistence
let cart = JSON.parse(localStorage.getItem('cart')) || {};
let cartCount = Object.keys(cart).length;

// Global variable to track real-time review listener
let currentReviewListener = null;

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function formatDate(timestamp) {
  if (!timestamp) return "Just now";
  const date = new Date(timestamp);
  return date.toLocaleString();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, icon = "⚡", duration = 3000) {
  const container = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.className = "toast show";

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hide");
    toast.addEventListener("transitionend", () => toast.remove());
  }, duration);
}


function updateCartStorage() {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  cartCount = Object.keys(cart).length;
  const cartCounter = document.getElementById('cart-count');
  if (cartCounter) cartCounter.textContent = cartCount;
}

function highlightProduct(card) {
  if (!card) return;
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.style.outline = '3px solid #007bff';
  setTimeout(() => card.style.outline = '', 1500);
}

// Main DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded - Script starting...');
  // ----- MOBILE MENU -----
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileMenuToggle && navLinks) {
    mobileMenuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  // ----- THEME TOGGLE -----
  const toggleButton = document.getElementById('theme-toggle');
  if (toggleButton) {
    toggleButton.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      // Inside your existing toggle function, after dark mode is applied:
if (document.body.classList.contains("dark-mode")) {
  darkModeSound.currentTime = 0.1;
  darkModeSound.volume = 0.5;
  darkModeSound.muted = false;

  darkModeSound.play().catch(e => {
    console.log("Autoplay blocked: ", e);
  });
}

      localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });
    
    // Load saved theme
    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark-mode');
    }
  }

  // ----- SEARCH FUNCTIONALITY -----
  const searchInput = document.getElementById('search-bar');
  const suggestionsBox = document.getElementById('suggestions');
  
  if (searchInput && suggestionsBox) {
    searchInput.addEventListener('input', debounce(function() {
      const query = this.value.trim().toLowerCase();
      suggestionsBox.innerHTML = '';
      
      if (query.length < 1) {
        suggestionsBox.style.display = 'none';
        return;
      }

      const products = Array.from(document.querySelectorAll('.add-to-cart'))
        .map(btn => ({
          name: btn.dataset.name,
          price: btn.dataset.price,
          element: btn.closest('.card')
        }));

      const matches = products.filter(product => 
        product.name.toLowerCase().includes(query)
      );

      if (matches.length) {
        matches.forEach(product => {
          const li = document.createElement('li');
          li.textContent = `${product.name} (₹${product.price})`;
          li.addEventListener('click', () => {
            searchInput.value = product.name;
            suggestionsBox.style.display = 'none';
            highlightProduct(product.element);
          });
          suggestionsBox.appendChild(li);
        });
        suggestionsBox.style.display = 'block';
      } else {
        suggestionsBox.style.display = 'none';
      }
    }, 300));


  // Old sort functionality removed - using modern controls instead


    // Close suggestions when clicking elsewhere
    document.addEventListener('click', (e) => {
      if (e.target !== searchInput) {
        suggestionsBox.style.display = 'none';
      }
    });
  }

  // ----- CART LOGIC -----
  updateCartCount();
  const cartCounter = document.getElementById('cart-count');
  const cartItemsEl = document.getElementById("cart-items");
  const cartTotalEl = document.getElementById("cart-total");
  const cartBox = document.getElementById("cart-box");
  const cartIcon = document.getElementById("cart-icon");
  const cartCloseBtn = document.getElementById("cart-close-btn");

  // Adding items to cart
  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', () => {
      const productName = button.dataset.name;
      const price = parseInt(button.dataset.price);
      const card = button.closest('.card');
      const image = card.querySelector('img').src;

      // Update cart object
      if (cart[productName]) {
        cart[productName].qty += 1;
      } else {
        cart[productName] = { name: productName, price, qty: 1, image };
      }

      updateCartStorage();
      updateCartDisplay();
      showToast(`${productName} added to cart`, "🛒");
    });
  });

  function updateCartDisplay() {
    if (!cartItemsEl || !cartTotalEl) return;
    
    cartItemsEl.innerHTML = '';
    let total = 0;

    for (let name in cart) {
      const item = cart[name];
      const li = document.createElement("li");
      li.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div>
          <h4>${item.name}</h4>
          <p>₹${item.price} x ${item.qty} = ₹${item.price * item.qty}</p>
          <button class="remove-item" data-name="${name}">Remove</button>
        </div>
      `;
      cartItemsEl.appendChild(li);
      total += item.price * item.qty;
    }

    cartTotalEl.textContent = `Total: ₹${total}`;

    // Add remove item functionality
    document.querySelectorAll('.remove-item').forEach(button => {
      button.addEventListener('click', (e) => {
        const name = e.target.dataset.name;
        delete cart[name];
        updateCartStorage();
        updateCartDisplay();
        showToast(`${name} removed from cart`, "❌");
      });
    });

    // Show AI recommendations if cart has items
    if (Object.keys(cart).length > 0) {
      showAIRecommendations();
    } else {
      hideAIRecommendations();
    }
  }

  // ----- CART MODAL -----
  if (cartIcon && cartBox && cartCloseBtn) {
    cartIcon.addEventListener('click', () => {
      updateCartDisplay();
      cartBox.style.display = 'block';
    });

    cartCloseBtn.addEventListener('click', () => {
      cartBox.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
      if (e.target === cartBox) {
        cartBox.style.display = 'none';
      }
    });
  }

  // ----- PRODUCT MODAL -----
  const productModal = document.getElementById('product-modal');
  if (productModal) {
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart')) return;
        
        const imgSrc = card.querySelector('img').src;
        const productName = card.querySelector('.add-to-cart').dataset.name;
        const price = card.querySelector('.add-to-cart').dataset.price;
        const description = card.querySelector('.add-to-cart').dataset.description;
        document.getElementById('modal-desc').textContent = description;
        document.getElementById('modal-img').src = imgSrc;
        document.getElementById('modal-title').textContent = productName;
        document.getElementById('modal-price').textContent = `₹${price}`;
        
        productModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Show reviews section
        const reviewsSection = document.querySelector('.reviews-section');
        if (reviewsSection) {
          reviewsSection.style.display = 'block';
        }
        
        // Load reviews for this product
        setTimeout(() => {
          loadProductReviews();
        }, 100);
      });
    });

    document.querySelector('#product-modal .close').addEventListener('click', () => {
      productModal.style.display = 'none';
      document.body.style.overflow = 'auto';
      
      // Hide reviews section
      const reviewsSection = document.querySelector('.reviews-section');
      if (reviewsSection) {
        reviewsSection.style.display = 'none';
      }
      
      // Unsubscribe from real-time listener
      if (currentReviewListener) {
        currentReviewListener();
        currentReviewListener = null;
      }
    });

    window.addEventListener('click', (e) => {
      if (e.target === productModal) {
        productModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Hide reviews section
        const reviewsSection = document.querySelector('.reviews-section');
        if (reviewsSection) {
          reviewsSection.style.display = 'none';
        }
        
        // Unsubscribe from real-time listener
        if (currentReviewListener) {
          currentReviewListener();
          currentReviewListener = null;
        }
      }
    });
  }
  
  // ----- MODERN CONTROLS -----
  console.log('Setting up modern controls...');
  setupModernControls();

  // ----- ORDER TRACKING SYSTEM -----
  setupOrderTracking();

  // ----- COMMENTS SYSTEM -----
  setupCommentsSystem();

  // ----- LOAD MORE COMMENTS -----
  const loadMoreBtn = document.querySelector('.load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function() {
      const commentsContainer = document.querySelector('.comments-container');
      if (commentsContainer) {
        commentsContainer.classList.toggle('expanded');
        this.textContent = commentsContainer.classList.contains('expanded') 
          ? 'Show Less' 
          : 'Load More';
      }
    });
  }

  // ----- LOGOUT FUNCTIONALITY -----
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await auth.signOut();
        // Use the transition function for smooth navigation
        if (typeof navigateWithTransition === 'function') {
          navigateWithTransition("login.html");
        } else {
          window.location.href = "login.html";
        }
      } catch (err) {
        console.error("Error logging out:", err);
      }
    });
  }

  // ----- HEADER SCROLL EFFECT -----
  window.addEventListener('scroll', function() {
    const header = document.querySelector('.site-header');
    if (header) {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  });

  // ----- CHECKOUT FUNCTIONALITY -----
  setupCheckout();

  // ----- AI RECOMMENDATIONS -----
  const hideRecBtn = document.getElementById('hide-recommendations-btn');
  if (hideRecBtn) {
    hideRecBtn.addEventListener('click', function() {
      const recSection = document.getElementById('ai-recommendations');
      if (recSection) recSection.style.display = 'none';
    });
  }

  // ----- AI CHATBOT -----
  setupChatbot();

  // ----- REVIEW SYSTEM -----
  setupReviewSystem();

  // ----- PARTICLES INITIALIZATION -----
  if (document.getElementById('particles-js') && typeof particlesJS !== 'undefined') {
    try {
      particlesJS('particles-js', {
      "particles": {
        "number": {
          "value": 80,
          "density": {
            "enable": true,
            "value_area": 800
          }
        },
        "color": {
          "value": "#6a11cb"
        },
        "shape": {
          "type": "circle",
          "stroke": {
            "width": 0,
            "color": "#000000"
          },
          "polygon": {
            "nb_sides": 5
          },
          "image": {
            "src": "img/github.svg",
            "width": 100,
            "height": 100
          }
        },
        "opacity": {
          "value": 0.5,
          "random": false,
          "anim": {
            "enable": false,
            "speed": 1,
            "opacity_min": 0.1,
            "sync": false
          }
        },
        "size": {
          "value": 3,
          "random": true,
          "anim": {
            "enable": false,
            "speed": 40,
            "size_min": 0.1,
            "sync": false
          }
        },
        "line_linked": {
          "enable": true,
          "distance": 150,
          "color": "#6a11cb",
          "opacity": 0.4,
          "width": 1
        },
        "move": {
          "enable": true,
          "speed": 6,
          "direction": "none",
          "random": false,
          "straight": false,
          "out_mode": "out",
          "bounce": false,
          "attract": {
            "enable": false,
            "rotateX": 600,
            "rotateY": 1200
          }
        }
      },
      "interactivity": {
        "detect_on": "canvas",
        "events": {
          "onhover": {
            "enable": true,
            "mode": "repulse"
          },
          "onclick": {
            "enable": true,
            "mode": "push"
          },
          "resize": true
        },
        "modes": {
          "grab": {
            "distance": 400,
            "line_linked": {
              "opacity": 1
            }
          },
          "bubble": {
            "distance": 400,
            "size": 40,
            "duration": 2,
            "opacity": 8,
            "speed": 3
          },
          "repulse": {
            "distance": 200,
            "duration": 0.4
          },
          "push": {
            "particles_nb": 4
          },
          "remove": {
            "particles_nb": 2
          }
        }
      },
      "retina_detect": true
    });
    console.log('Particles initialized successfully');
    } catch (error) {
      console.error('Particles initialization error:', error);
    }
  } else {
    console.log('Particles element not found or particlesJS not loaded');
  }
});

// AI Recommendation Functions
function showAIRecommendations() {
  const recommendationsContainer = document.getElementById('ai-recommendations');
  if (!recommendationsContainer) return;
  
  recommendationsContainer.style.display = 'block';
  generateAIRecommendations();
}

function hideAIRecommendations() {
  const recommendationsContainer = document.getElementById('ai-recommendations');
  if (recommendationsContainer) {
    recommendationsContainer.style.display = 'none';
  }
}

function generateAIRecommendations() {
  const recommendationsGrid = document.getElementById('recommendations-grid');
  if (!recommendationsGrid) return;

  // Get current cart items
  const cartItems = Object.keys(cart);
  if (cartItems.length === 0) return;

  // AI Recommendation Algorithm
  const recommendations = getSmartRecommendations(cartItems);
  
  // Clear previous recommendations
  recommendationsGrid.innerHTML = '';
  
  // Display recommendations
  recommendations.forEach(product => {
    const recItem = document.createElement('div');
    recItem.className = 'recommendation-item';
    recItem.innerHTML = `
      <img src="${product.image}" alt="${product.name}" loading="lazy">
      <h5>${product.name}</h5>
      <div class="rec-price">₹${product.price}</div>
      <button class="add-rec-btn" data-name="${product.name}" data-price="${product.price}" data-image="${product.image}">
        Add to Cart
      </button>
    `;
    recommendationsGrid.appendChild(recItem);
  });

  // Add event listeners to recommendation buttons
  document.querySelectorAll('.add-rec-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const productName = e.target.dataset.name;
      const price = parseInt(e.target.dataset.price);
      const image = e.target.dataset.image;

      // Add to cart
      if (cart[productName]) {
        cart[productName].qty += 1;
      } else {
        cart[productName] = { name: productName, price, qty: 1, image };
      }

      updateCartStorage();
      updateCartDisplay();
      showToast(`${productName} added to cart!`, "🤖");
      
      // Animate the button
      e.target.style.transform = 'scale(0.95)';
      setTimeout(() => {
        e.target.style.transform = 'scale(1)';
      }, 150);
    });
  });
}

function getSmartRecommendations(cartItems) {
  // Product database with categories and relationships
  const allProducts = [
    { name: "RGB LED Strip", category: "lighting", price: 1299, image: "https://foyr.com/learn/wp-content/uploads/2019/01/lighting-for-gaming-room-scaled.jpg", tags: ["lighting", "rgb", "smart"] },
    { name: "Gaming Decor Bundle", category: "furniture", price: 2499, image: "https://cdn.shopify.com/s/files/1/0644/5013/4180/files/kushsama_set_up_a_personal_gaming_computer_in_a_girl_room_cute__25ae19a9-7a30-475b-ac34-596114f87b80_480x480.webp?v=1713785010", tags: ["furniture", "bundle", "accessories"] },
    { name: "Acoustic Wall Panels", category: "furniture", price: 999, image: "https://m.media-amazon.com/images/I/815NKi8l4kL._UF1000,1000_QL80_.jpg", tags: ["furniture", "acoustic", "sound"] },
    { name: "Gaming Chair", category: "furniture", price: 7999, image: "https://foyr.com/learn/wp-content/uploads/2019/01/seating-for-gaming-room.jpg", tags: ["furniture", "chair", "ergonomic"] },
    { name: "Smart LED Kit", category: "lighting", price: 3499, image: "https://www.almila.com.tr/sites/default/files/styles/content_header_mobile/public/2024-06/37888785-fa43-4243-ae48-2a9ca2f35ff0_atmosphaerisches-gamer-zimmer.jpg.webp?itok=6YA57pOv", tags: ["lighting", "smart", "music-sync"] },
    { name: "Gaming Posters", category: "posters", price: 399, image: "https://i.pinimg.com/736x/da/95/0a/da950ab5bd3f8812988bf75113af8d27.jpg", tags: ["posters", "decoration", "art"] },
    { name: "Gaming Desk", category: "furniture", price: 4999, image: "https://cdn.shopify.com/s/files/1/1881/2599/files/0d554ee22af77852eabae82936cee6ee_480x480.jpg?v=1717754907", tags: ["furniture", "desk", "workspace"] },
    { name: "Anime LED Kit", category: "lighting", price: 1799, image: "https://static.wixstatic.com/media/973641_dd18afbf52c44615b55545334043c0ee~mv2.jpg/v1/fill/w_480,h_600,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/973641_dd18afbf52c44615b55545334043c0ee~mv2.jpg", tags: ["lighting", "anime", "decorative"] },
    { name: "Game Wall Stickers", category: "posters", price: 699, image: "https://www.huetion.com/media/catalog/product/cache/fc968504d73242eeb5af558e5cfedb2f/g/a/gaming_wall_stickers_for_gaming_room_decor.jpg", tags: ["posters", "stickers", "wall-art"] },
    { name: "LED Shelves", category: "furniture", price: 2199, image: "https://images-cdn.ubuy.co.in/66f1469f4206364186049347-gaming-floating-shelves-with-lights-led.jpg", tags: ["furniture", "shelves", "storage"] },
    { name: "Gaming Rug", category: "furniture", price: 2999, image: "https://images-cdn.ubuy.co.in/64494581a47132191378bd25-large-video-gaming-area-rug-for.jpg", tags: ["furniture", "rug", "flooring"] },
    { name: "Metal Game Art", category: "posters", price: 1499, image: "https://portrilux.com/cdn/shop/articles/Portrilux_Metal_Prints_1200x1200_6e066b39-0dd6-4064-a62a-ed3631d519c0.webp?v=1681851705", tags: ["posters", "metal", "premium"] }
  ];

  // Get cart product details
  const cartProducts = allProducts.filter(product => cartItems.includes(product.name));
  
  // AI Recommendation Logic
  let recommendations = [];
  
  // 1. Category-based recommendations (same category items)
  const cartCategories = [...new Set(cartProducts.map(p => p.category))];
  const categoryRecommendations = allProducts.filter(product => 
    cartCategories.includes(product.category) && !cartItems.includes(product.name)
  );
  
  // 2. Tag-based recommendations (similar tags)
  const cartTags = [...new Set(cartProducts.flatMap(p => p.tags))];
  const tagRecommendations = allProducts.filter(product => 
    product.tags.some(tag => cartTags.includes(tag)) && !cartItems.includes(product.name)
  );
  
  // 3. Price-based recommendations (similar price range)
  const avgCartPrice = cartProducts.reduce((sum, p) => sum + p.price, 0) / cartProducts.length;
  const priceRecommendations = allProducts.filter(product => 
    Math.abs(product.price - avgCartPrice) < avgCartPrice * 0.5 && !cartItems.includes(product.name)
  );
  
  // 4. Popular items (best sellers)
  const popularItems = allProducts.filter(product => 
    product.price < 2000 && !cartItems.includes(product.name)
  );
  
  // Combine and score recommendations
  const allRecs = [...categoryRecommendations, ...tagRecommendations, ...priceRecommendations, ...popularItems];
  const scoredRecs = {};
  
  allRecs.forEach(product => {
    if (!scoredRecs[product.name]) {
      scoredRecs[product.name] = { ...product, score: 0 };
    }
    
    // Scoring algorithm
    if (cartCategories.includes(product.category)) scoredRecs[product.name].score += 3;
    if (product.tags.some(tag => cartTags.includes(tag))) scoredRecs[product.name].score += 2;
    if (Math.abs(product.price - avgCartPrice) < avgCartPrice * 0.3) scoredRecs[product.name].score += 1;
    if (product.price < 2000) scoredRecs[product.name].score += 1;
  });
  
  // Sort by score and return top 4
  recommendations = Object.values(scoredRecs)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  
  // If we don't have enough recommendations, add random popular items
  if (recommendations.length < 4) {
    const remaining = allProducts.filter(product => 
      !cartItems.includes(product.name) && 
      !recommendations.some(rec => rec.name === product.name)
    );
    recommendations = [...recommendations, ...remaining.slice(0, 4 - recommendations.length)];
  }
  
  return recommendations;
}

// AI Chatbot System
function setupChatbot() {
  const chatbotToggle = document.getElementById('chatbot-toggle');
  const chatbotWindow = document.getElementById('chatbot-window');
  const chatbotMinimize = document.getElementById('chatbot-minimize');
  const chatbotInput = document.getElementById('chatbot-input');
  const chatbotSend = document.getElementById('chatbot-send');
  const chatbotMessages = document.getElementById('chatbot-messages');
  const chatbotIcon = document.querySelector('.chatbot-icon');
  const chatbotClose = document.querySelector('.chatbot-close');
  const quickActionBtns = document.querySelectorAll('.quick-action-btn');

  let isOpen = false;
  let isTyping = false;

  // Toggle chatbot
  if (chatbotToggle && chatbotWindow) {
    chatbotToggle.addEventListener('click', () => {
      isOpen = !isOpen;
      if (isOpen) {
        chatbotWindow.style.display = 'flex';
        chatbotIcon.style.display = 'none';
        chatbotClose.style.display = 'block';
        chatbotInput.focus();
      } else {
        chatbotWindow.style.display = 'none';
        chatbotIcon.style.display = 'block';
        chatbotClose.style.display = 'none';
      }
    });
  }

  // Minimize chatbot
  if (chatbotMinimize) {
    chatbotMinimize.addEventListener('click', () => {
      isOpen = false;
      chatbotWindow.style.display = 'none';
      chatbotIcon.style.display = 'block';
      chatbotClose.style.display = 'none';
    });
  }

  // Send message
  function sendMessage() {
    const message = chatbotInput.value.trim();
    if (!message || isTyping) return;

    addMessage(message, 'user');
    chatbotInput.value = '';
    
    // Simulate typing
    setTimeout(() => {
      const response = processMessage(message);
      addMessage(response, 'bot');
    }, 1000 + Math.random() * 1000);
  }

  // Send button click
  if (chatbotSend) {
    chatbotSend.addEventListener('click', sendMessage);
  }

  // Enter key press
  if (chatbotInput) {
    chatbotInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }

  // Quick action buttons
  quickActionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      let message = '';
      
      switch(action) {
        case 'find-products':
          message = 'I want to find products';
          break;
        case 'track-order':
          message = 'I want to track my order';
          break;
        case 'recommendations':
          message = 'I want product recommendations';
          break;
      }
      
      if (message) {
        chatbotInput.value = message;
        sendMessage();
      }
    });
  });

  // Add message to chat
  function addMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    messageDiv.innerHTML = `
      <div class="message-content">${content}</div>
      <div class="message-time">${time}</div>
    `;
    
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  // Process user message and generate response
  function processMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    // Product search
    if (lowerMessage.includes('find') || lowerMessage.includes('search') || lowerMessage.includes('looking for')) {
      return handleProductSearch(message);
    }
    
    // Order tracking
    if (lowerMessage.includes('track') || lowerMessage.includes('order') || lowerMessage.includes('delivery')) {
      return handleOrderTracking(message);
    }
    
    // Recommendations
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('what should')) {
      return handleRecommendations(message);
    }
    
    // Greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "👋 Hello! I'm your AI shopping assistant. How can I help you today?";
    }
    
    // Help
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `🤖 I can help you with:
      
🔍 **Find Products**: Describe what you're looking for
📦 **Track Orders**: Provide your order ID
💡 **Get Recommendations**: Based on your preferences
❓ **Store Information**: Ask about shipping, returns, etc.

Just tell me what you need!`;
    }
    
    // Price questions
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('expensive')) {
      return "💰 Our products range from ₹399 to ₹7,999. You can browse our catalog or tell me what you're looking for and I'll show you the best options!";
    }
    
    // Shipping questions
    if (lowerMessage.includes('shipping') || lowerMessage.includes('delivery') || lowerMessage.includes('how long')) {
      return "🚚 We offer free shipping on orders above ₹2,000! Standard delivery takes 3-5 business days. Express delivery (₹50) takes 1-2 days.";
    }
    
    // Return questions
    if (lowerMessage.includes('return') || lowerMessage.includes('refund') || lowerMessage.includes('exchange')) {
      return "↩️ We offer 7-day easy returns! Items must be in original condition. Contact our support team for return instructions.";
    }
    
    // Default response
    return "I understand you're asking about: \"" + message + "\". Could you be more specific? I can help you find products, track orders, or answer questions about our store!";
  }

  // Handle product search
  function handleProductSearch(message) {
    const products = [
      { name: "RGB LED Strip", category: "lighting", price: 1299, tags: ["led", "rgb", "lighting", "strip", "colorful"] },
      { name: "Gaming Chair", category: "furniture", price: 7999, tags: ["chair", "gaming", "ergonomic", "comfortable"] },
      { name: "Gaming Desk", category: "furniture", price: 4999, tags: ["desk", "gaming", "workspace", "table"] },
      { name: "Smart LED Kit", category: "lighting", price: 3499, tags: ["smart", "led", "music", "sync", "kit"] },
      { name: "Gaming Posters", category: "posters", price: 399, tags: ["posters", "gaming", "wall", "art", "decoration"] },
      { name: "Anime LED Kit", category: "lighting", price: 1799, tags: ["anime", "led", "projector", "silhouette"] },
      { name: "Acoustic Wall Panels", category: "furniture", price: 999, tags: ["acoustic", "sound", "panels", "wall"] },
      { name: "LED Shelves", category: "furniture", price: 2199, tags: ["shelves", "led", "floating", "display"] },
      { name: "Gaming Rug", category: "furniture", price: 2999, tags: ["rug", "gaming", "floor", "carpet"] },
      { name: "Game Wall Stickers", category: "posters", price: 699, tags: ["stickers", "wall", "vinyl", "decoration"] },
      { name: "Metal Game Art", category: "posters", price: 1499, tags: ["metal", "art", "prints", "premium"] },
      { name: "Gaming Decor Bundle", category: "furniture", price: 2499, tags: ["bundle", "decor", "gaming", "accessories"] }
    ];

    const lowerMessage = message.toLowerCase();
    const matchingProducts = products.filter(product => 
      product.tags.some(tag => lowerMessage.includes(tag)) ||
      lowerMessage.includes(product.name.toLowerCase()) ||
      lowerMessage.includes(product.category)
    );

    if (matchingProducts.length > 0) {
      let response = "🔍 I found these products for you:\n\n";
      matchingProducts.slice(0, 3).forEach(product => {
        response += `**${product.name}** - ₹${product.price}\n`;
        response += `Category: ${product.category}\n\n`;
      });
      response += "Would you like to see more details about any of these?";
      return response;
    } else {
      return "🔍 I couldn't find specific products matching your search. Could you try describing what you're looking for? For example:\n\n• 'LED lights for gaming room'\n• 'Gaming chair'\n• 'Wall decorations'\n• 'Desk accessories'";
    }
  }

  // Handle order tracking
  function handleOrderTracking(message) {
    // Check if message contains order ID pattern
    const orderIdMatch = message.match(/#?(\d{6,})/);
    
    if (orderIdMatch) {
      const orderId = orderIdMatch[1];
      return `📦 **Order #${orderId} Status**\n\n✅ **Confirmed** - Your order has been processed\n📦 **Packed** - Items are being prepared for shipment\n🚚 **Shipped** - On the way to your address\n📅 **Expected Delivery**: 2-3 business days\n\nYou can also track your order in the "Track Order" section on our website!`;
    } else {
      return "📦 To track your order, please provide your **Order ID** (6+ digits). You can find it in:\n\n• Your order confirmation email\n• Your account order history\n• SMS notifications\n\nJust paste your order ID here and I'll check the status for you!";
    }
  }

  // Handle recommendations
  function handleRecommendations(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('budget') || lowerMessage.includes('cheap') || lowerMessage.includes('affordable')) {
      return "💰 **Budget-Friendly Options** (Under ₹1,000):\n\n• Gaming Posters - ₹399\n• Game Wall Stickers - ₹699\n• Acoustic Wall Panels - ₹999\n\nThese are perfect for starting your gaming room setup!";
    }
    
    if (lowerMessage.includes('premium') || lowerMessage.includes('high-end') || lowerMessage.includes('expensive')) {
      return "💎 **Premium Gaming Setup** (₹3,000+):\n\n• Gaming Chair - ₹7,999\n• Smart LED Kit - ₹3,499\n• Gaming Desk - ₹4,999\n• Gaming Rug - ₹2,999\n\nThese create a professional gaming environment!";
    }
    
    if (lowerMessage.includes('lighting') || lowerMessage.includes('led') || lowerMessage.includes('lights')) {
      return "💡 **Lighting Solutions**:\n\n• RGB LED Strip - ₹1,299 (Basic)\n• Smart LED Kit - ₹3,499 (Music sync)\n• Anime LED Kit - ₹1,799 (Themed)\n\nAll create amazing gaming atmosphere!";
    }
    
    return "💡 **Popular Recommendations**:\n\n🏆 **Best Sellers**:\n• Gaming Desk - ₹4,999\n• RGB LED Strip - ₹1,299\n• Gaming Posters - ₹399\n\n🆕 **New Arrivals**:\n• Smart LED Kit - ₹3,499\n\nWhat type of gaming setup are you looking for?";
  }
}

// Modern Controls System
function setupModernControls() {
  console.log('setupModernControls function called');
  // Category buttons
  const categoryBtns = document.querySelectorAll('.category-btn');
  console.log('Found category buttons:', categoryBtns.length);
  
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      // Remove active class from all buttons
      categoryBtns.forEach(b => b.classList.remove('active'));
      // Add active class to clicked button
      this.classList.add('active');
      
      // Filter products
      const selectedCategory = this.dataset.category;
      const cards = document.querySelectorAll('.card');
      
      cards.forEach(card => {
        const category = card.dataset.category;
        const shouldShow = selectedCategory === 'all' || category === selectedCategory;
        card.style.display = shouldShow ? 'block' : 'none';
      });
    });
  });

  // Search toggle
  const searchToggle = document.getElementById('search-toggle');
  const searchDropdown = document.getElementById('search-dropdown');
  const searchBar = document.getElementById('search-bar');
  const suggestions = document.getElementById('suggestions');

  if (searchToggle && searchDropdown) {
    searchToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      searchDropdown.style.display = searchDropdown.style.display === 'none' ? 'block' : 'none';
      if (searchDropdown.style.display === 'block') {
        searchBar.focus();
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!searchToggle.contains(e.target) && !searchDropdown.contains(e.target)) {
        searchDropdown.style.display = 'none';
      }
    });
  }

  // Sort toggle
  const sortToggle = document.getElementById('sort-toggle');
  const sortDropdown = document.getElementById('sort-dropdown');
  const sortOptions = document.querySelectorAll('.sort-option');

  if (sortToggle && sortDropdown) {
    sortToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      sortDropdown.style.display = sortDropdown.style.display === 'none' ? 'block' : 'none';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!sortToggle.contains(e.target) && !sortDropdown.contains(e.target)) {
        sortDropdown.style.display = 'none';
      }
    });
  }

  // Sort options
  sortOptions.forEach(option => {
    option.addEventListener('click', function() {
      const sortType = this.dataset.sort;
      sortProducts(sortType);
      sortDropdown.style.display = 'none';
    });
  });

  // Search functionality
  if (searchBar) {
    searchBar.addEventListener('input', function() {
      const query = this.value.toLowerCase().trim();
      
      if (query.length === 0) {
        suggestions.innerHTML = '';
        suggestions.style.display = 'none';
        return;
      }

      // Get all products
      const products = Array.from(document.querySelectorAll('.card')).map(card => ({
        name: card.querySelector('h3').textContent,
        element: card
      }));

      // Filter products
      const matches = products.filter(product => 
        product.name.toLowerCase().includes(query)
      );

      // Show suggestions
      if (matches.length > 0) {
        suggestions.innerHTML = matches.map(product => 
          `<li>${product.name}</li>`
        ).join('');
        suggestions.style.display = 'block';
      } else {
        suggestions.innerHTML = '<li>No products found</li>';
        suggestions.style.display = 'block';
      }
    });

    // Handle suggestion clicks
    if (suggestions) {
      suggestions.addEventListener('click', function(e) {
        if (e.target.tagName === 'LI') {
          const productName = e.target.textContent;
          if (productName !== 'No products found') {
            // Find and show the product
            const products = Array.from(document.querySelectorAll('.card'));
            const targetProduct = products.find(card => 
              card.querySelector('h3').textContent === productName
            );
            
            if (targetProduct) {
              // Hide all products first
              products.forEach(card => card.style.display = 'none');
              // Show only the selected product
              targetProduct.style.display = 'block';
              // Scroll to the product
              targetProduct.scrollIntoView({ behavior: 'smooth' });
            }
          }
          searchBar.value = '';
          suggestions.style.display = 'none';
        }
      });
    }
  }

  // Sort products function
  function sortProducts(sortType) {
    const grid = document.querySelector('.grid');
    const products = Array.from(grid.querySelectorAll('.card'));
    
    products.sort((a, b) => {
      const priceA = parseInt(a.querySelector('.add-to-cart').dataset.price);
      const priceB = parseInt(b.querySelector('.add-to-cart').dataset.price);
      
      switch(sortType) {
        case 'low-high':
          return priceA - priceB;
        case 'high-low':
          return priceB - priceA;
        default:
          return 0;
      }
    });
    
    // Re-append sorted products
    products.forEach(product => grid.appendChild(product));
  }
}

// Order Tracking System
function setupOrderTracking() {
  const trackOrderBtn = document.getElementById("trackOrderBtn");
  const setupzoneClose = document.getElementsByClassName("setupzone-close")[0];
  const trackingModal = document.getElementById("setupzoneTrackingModal");
  const setupzoneSearchBtn = document.getElementById("setupzoneSearchOrderBtn");
  const setupzoneOrderIdInput = document.getElementById("setupzoneOrderIdInput");

  if (trackOrderBtn && trackingModal) {
    trackOrderBtn.addEventListener("click", function() {
      trackingModal.style.display = "block";
    });
  }

  if (setupzoneClose && trackingModal) {
    setupzoneClose.addEventListener("click", function() {
      trackingModal.style.display = "none";
      resetTrackingModal();
    });
  }

  if (trackingModal) {
    window.addEventListener("click", function(event) {
      if (event.target === trackingModal) {
        trackingModal.style.display = "none";
        resetTrackingModal();
      }
    });
  }

  if (setupzoneSearchBtn) {
    setupzoneSearchBtn.addEventListener("click", searchSetupzoneOrder);
  }

  if (setupzoneOrderIdInput) {
    setupzoneOrderIdInput.addEventListener("keypress", function(e) {
      if (e.key === "Enter") {
        searchSetupzoneOrder();
      }
    });
  }

  function resetTrackingModal() {
    const setupzoneOrderDetails = document.getElementById("setupzoneOrderDetails");
    const setupzoneOrderNotFound = document.getElementById("setupzoneOrderNotFound");
    const setupzoneOrderIdInput = document.getElementById("setupzoneOrderIdInput");
    
    if (setupzoneOrderDetails) setupzoneOrderDetails.classList.add("hidden");
    if (setupzoneOrderNotFound) setupzoneOrderNotFound.classList.add("hidden");
    if (setupzoneOrderIdInput) setupzoneOrderIdInput.value = "";
  }

  function searchSetupzoneOrder() {
    const setupzoneOrderIdInput = document.getElementById("setupzoneOrderIdInput");
    const setupzoneSearchBtn = document.getElementById("setupzoneSearchOrderBtn");
    const setupzoneOrderDetails = document.getElementById("setupzoneOrderDetails");
    const setupzoneOrderNotFound = document.getElementById("setupzoneOrderNotFound");
    
    if (!setupzoneOrderIdInput || !setupzoneSearchBtn) return;
    
  let orderId = setupzoneOrderIdInput.value.trim().toUpperCase();

  const darkModeSound = document.getElementById("darkModeSound");


// Ensure it starts with "ORD-"
if (!orderId.startsWith("ORD-")) {
  orderId = "ORD-" + orderId;
}

    if (!orderId) {
      showToast("Please enter an order ID", "⚠️");
      return;
    }
    
    // Show loading state
    setupzoneSearchBtn.disabled = true;
    setupzoneSearchBtn.textContent = "Searching...";
    
    // Query Firestore for the order
    db.collection("orders").doc(orderId).get()
      .then((doc) => {
        if (doc.exists) {
          const orderData = doc.data();
          displaySetupzoneOrderDetails(orderId, orderData);
          if (setupzoneOrderDetails) setupzoneOrderDetails.classList.remove("hidden");
          if (setupzoneOrderNotFound) setupzoneOrderNotFound.classList.add("hidden");
        } else {
          if (setupzoneOrderDetails) setupzoneOrderDetails.classList.add("hidden");
          if (setupzoneOrderNotFound) setupzoneOrderNotFound.classList.remove("hidden");
        }
      })
      .catch((error) => {
        console.error("Error getting order:", error);
    
  showToast("Please log in to track your order");

      })
      .finally(() => {
        if (setupzoneSearchBtn) {
          setupzoneSearchBtn.disabled = false;
          setupzoneSearchBtn.textContent = "Search";
        }
      });
  }

  function displaySetupzoneOrderDetails(orderId, orderData) {
    // Set basic order info
    const orderNumberEl = document.getElementById("setupzoneOrderNumber");
    const carrierEl = document.getElementById("setupzoneCarrier");
    const trackingNumberEl = document.getElementById("setupzoneTrackingNumber");
    const estimatedDeliveryEl = document.getElementById("setupzoneEstimatedDelivery");
    
    if (orderNumberEl) orderNumberEl.textContent = orderId;
    if (carrierEl) carrierEl.textContent = orderData.shipping?.carrier || "Standard Shipping";
    if (trackingNumberEl) trackingNumberEl.textContent = orderData.shipping?.trackingNumber || "Not available";
    
    // Format and display estimated delivery
    if (estimatedDeliveryEl) {
      if (orderData.shipping?.estimatedDelivery) {
        const deliveryDate = new Date(orderData.shipping.estimatedDelivery);

        estimatedDeliveryEl.textContent = deliveryDate.toLocaleDateString();
      } else {
        estimatedDeliveryEl.textContent = "Calculating...";
      }
    }
    
    // Update status timeline
    const statusSteps = {
      "ordered": orderData.orderDate,
      "processed": orderData.processDate,
      "shipped": orderData.shipDate,
      "delivered": orderData.deliveryDate
    };
    
    let currentStatus = "ordered";
    
    // Determine current status
    if (orderData.status === "processing") {
      currentStatus = "processed";
    } else if (orderData.status === "shipped") {
      currentStatus = "shipped";
    } else if (orderData.status === "delivered") {
      currentStatus = "delivered";
    }
    
    // Update each step
    for (const [step, date] of Object.entries(statusSteps)) {
      const stepElement = document.getElementById(`setupzone-step-${step}`);
      if (!stepElement) continue;
      
      const dateElement = stepElement.querySelector(".setupzone-status-date");
      
      if (date) {
    const formattedDate = new Date(date).toLocaleDateString();

        if (dateElement) dateElement.textContent = formattedDate;
      }
      
      // Mark previous steps as completed
      if (step === currentStatus) {
        stepElement.classList.add("active");
      } else if (isSetupzoneStepBefore(step, currentStatus)) {
        stepElement.classList.add("completed");
      }
    }
  }

  function isSetupzoneStepBefore(step, currentStep) {
    const stepsOrder = ["ordered", "processed", "shipped", "delivered"];
    return stepsOrder.indexOf(step) < stepsOrder.indexOf(currentStep);
  }

}



// Comments System
function setupCommentsSystem() {
  const commentInput = document.getElementById('comment-input');
  const submitComment = document.getElementById('submit-comment');
  const commentsContainer = document.querySelector('.comments-container');
  const loginPrompt = document.querySelector('.login-prompt');
  const charCounter = document.querySelector('.char-counter');

  if (commentInput && submitComment && commentsContainer) {
    const commentsRef = database.ref('comments');

auth.onAuthStateChanged(user => {
  if (user) {
    if (loginPrompt) loginPrompt.style.display = 'none';
    commentInput.disabled = false;
  } else {
    if (loginPrompt) loginPrompt.style.display = 'block';
    commentInput.disabled = true;
  }
});

// Always load comments, even if user is not logged in
loadComments();


    // Submit comment
    submitComment.addEventListener('click', () => {
      const user = auth.currentUser;
      const text = commentInput.value.trim();
      
      if (!user) {
        showToast("Please sign in to comment", "🔒");
        return;
      }
      
      if (text.length === 0) {
        showToast("Comment cannot be empty", "⚠️");
        return;
      }
      
      if (text.length > 250) {
        showToast("Comment too long (max 250 chars)", "⚠️");
        return;
      }
      
      // Push new comment to database
      commentsRef.push({
        text: text,
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userEmail: user.email,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      }).then(() => {
        commentInput.value = "";
        if (charCounter) charCounter.textContent = '0/250';
      }).catch(error => {
        console.error("Error posting comment:", error);
        showToast("Failed to post comment", "❌");
      });
    });

    // Character counter
    commentInput.addEventListener('input', function() {
      if (charCounter) charCounter.textContent = `${this.value.length}/250`;
    });

    // Load comments function
    function loadComments() {
      commentsRef.orderByChild('timestamp').on('value', (snapshot) => {
        commentsContainer.innerHTML = '';
        const comments = [];
        
        snapshot.forEach(childSnapshot => {
          const comment = childSnapshot.val();
          comments.push({
            id: childSnapshot.key,
            ...comment
          });
        });
        
        // Display comments in reverse chronological order
        comments.reverse().forEach(comment => {
          const commentEl = document.createElement('div');
          commentEl.className = 'comment';
          commentEl.innerHTML = `
            <div class="comment-header">
              <span class="comment-author">${escapeHtml(comment.userName)}</span>
              <span class="comment-date">${formatDate(comment.timestamp)}</span>
            </div>
            <div class="comment-text">${escapeHtml(comment.text)}</div>
          `;
          commentsContainer.appendChild(commentEl);
        });
      });
    }
  }
}
// Add this near the top of setupCheckout():
auth.onAuthStateChanged(user => {
  const checkoutAuthStatus = document.getElementById('checkout-auth-status');
  if (checkoutAuthStatus) {
    if (user) {
      checkoutAuthStatus.innerHTML = `
        <span class="auth-status logged-in">
          ✔️ Logged in as ${user.email || 'user'}
        </span>
      `;
    } else {
      checkoutAuthStatus.innerHTML = `
        <span class="auth-status logged-out">
          🔒 Please sign in to checkout
        </span>
        <a href="login.html" class="login-link" id="checkout-login-link">Login</a>
      `;
      
      // Add transition to the dynamically created login link
      const checkoutLoginLink = document.getElementById('checkout-login-link');
      if (checkoutLoginLink && typeof navigateWithTransition === 'function') {
        checkoutLoginLink.addEventListener('click', function(e) {
          e.preventDefault();
          navigateWithTransition('login.html');
        });
      }
    }
  }
});

function placeOrder(paymentMethod, paymentId = null) {
  // Check authentication again before placing order
  const user = auth.currentUser;
  if (!user) {
    showToast("Please sign in to place an order", "🔒");
    return;
  }

  const shippingInfo = getShippingInfo();
  const cartItems = getCartItems();
  const total = calculateTotal();
  
  // Rest of your existing placeOrder code...
}
// Checkout System
function setupCheckout() {
  // DOM Elements
  const checkoutBtn = document.getElementById('checkout');
  const checkoutModal = document.getElementById('checkout-modal');
  const closeCheckoutBtn = document.querySelector('#checkout-modal .close');
  const step1 = document.getElementById('step-1');
  const step2 = document.getElementById('step-2');
  const step3 = document.getElementById('step-3');
  const nextToPaymentBtn = document.getElementById('next-to-payment');
  const backToShippingBtn = document.getElementById('back-to-shipping');
  const placeCodOrderBtn = document.getElementById('place-cod-order');
  const rzpButton = document.getElementById('rzp-button');
  const enableCodCheckbox = document.getElementById('enable-cod');
  const continueShoppingBtn = document.getElementById('continue-shopping');
  const trackOrderBtn = document.getElementById('track-order');
  const progressSteps = document.querySelectorAll('.progress-step');
  const toastContainer = document.getElementById('toast-container');
  
  // Open checkout modal when "PROCEED TO CHECKOUT" is clicked
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function() {
      const cartBox = document.getElementById('cart-box');
      if (cartBox) cartBox.style.display = 'none';
      
      if (checkoutModal) {
        checkoutModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Reset to first step
        document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
        document.getElementById('step-1').classList.add('active');
        
        document.querySelectorAll('.progress-step').forEach(step => {
          step.classList.remove('active', 'completed');
        });
        document.querySelector('.progress-step[data-step="1"]').classList.add('active');
        
        updateOrderSummary();
      } else {
        console.error("Checkout modal not found!");
      }
    });
  }

  
  // Close checkout modal
  if (closeCheckoutBtn && checkoutModal) {
    closeCheckoutBtn.addEventListener('click', function() {
      checkoutModal.style.display = 'none';
      document.body.style.overflow = 'auto';
    });
  }
  
  // Progress to Payment step
  if (nextToPaymentBtn) {
    nextToPaymentBtn.addEventListener('click', function() {
      if (validateShippingForm()) {
        // Update progress indicators
        step1.classList.remove('active');
        step2.classList.add('active');
        
        // Update progress steps if they exist
        if (progressSteps.length > 0) {
          progressSteps[0].classList.add('completed');
          progressSteps[1].classList.add('active');
        }
        
        // Update order summary with shipping info
        updateOrderSummary();
      }
    });
  }
  
  // Back to Shipping step
  if (backToShippingBtn) {
    backToShippingBtn.addEventListener('click', function() {
      step2.classList.remove('active');
      step1.classList.add('active');
      
      // Update progress steps if they exist
      if (progressSteps.length > 0) {
        progressSteps[1].classList.remove('active');
        progressSteps[0].classList.remove('completed');
        progressSteps[0].classList.add('active');
      }
    });
  }
  
  // COD checkbox toggle
  if (enableCodCheckbox) {
    enableCodCheckbox.addEventListener('change', function() {
      if (this.checked) {
        rzpButton.style.opacity = '0.5';
        placeCodOrderBtn.style.display = 'block';
      } else {
        rzpButton.style.opacity = '1';
        placeCodOrderBtn.style.display = 'none';
      }
      updateOrderSummary();
    });
  }
  
  // Razorpay payment button
  if (rzpButton) {
    rzpButton.addEventListener('click', function(e) {
      e.preventDefault();
      
      if (!validateShippingForm()) {
        return;
      }
      
      const shippingInfo = getShippingInfo();
      const total = calculateTotal();
      
      // Initialize Razorpay payment
      const options = {
        key: "YOUR_RAZORPAY_KEY", // Replace with your actual Razorpay key
        amount: total * 100, // Razorpay uses paise
        currency: "INR",
        name: "SetupZone",
        description: "Gaming Room Decor Purchase",
        image: "https://example.com/logo.png", // Replace with your actual logo URL
        handler: function(response) {
          // Process order after successful payment
          placeOrder('razorpay', response.razorpay_payment_id);
        },
        prefill: {
          name: shippingInfo.fullName,
          email: shippingInfo.email,
          contact: shippingInfo.phone
        },
        notes: {
          address: shippingInfo.address
        },
        theme: {
          color: "#3399cc"
        }
      };
      
      const rzp = new Razorpay(options);
      rzp.open();
    });
  }
  
  // Place COD Order button
if (placeCodOrderBtn) {
  placeCodOrderBtn.addEventListener("click", function () {
    if (!validateShippingForm()) {
      return;
    }

    // Place order via your function (this saves it to Firestore, etc.)
    placeOrder("cod");

    // Get user email
    const email = document.querySelector("input[type=email]").value;

    // Create order ID
    const orderId = "ORD" + Math.floor(Math.random() * 1000000);
    const deliveryDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toDateString(); // 5 days later

    // Prepare orders array from cart
    const orders = Object.values(cart).map(item => ({
      name: item.name,
      price: item.price,
      units: item.qty,
      image_url: item.image
    }));

    // Calculate totals
    const total = orders.reduce((sum, i) => sum + (i.price * i.units), 0);

    const templateParams = {
      order_id: orderId,
      delivery_date: deliveryDate,
      email: email,
      orders: orders,
      cost: {
        shipping: "Free",
        tax: 0,
        total: total
      }
    };

    emailjs.send("service_cryo_byte", "template_cryo_byte", templateParams)
      .then(function (response) {
        console.log("✅ Email sent!", response.status, response.text);
      }, function (error) {
        console.error("❌ Email failed:", error);
      });



  // Proceed to confirmation screen
  document.getElementById("order-id-display").innerText = orderId;
  document.getElementById("order-email-display").innerText = email;
  document.getElementById("order-delivery-display").innerText = deliveryDate;
  document.querySelector("#step-2").classList.remove("active");
  document.querySelector("#step-3").classList.add("active");
});

}
  
  // Continue Shopping button
  if (continueShoppingBtn) {
    continueShoppingBtn.addEventListener('click', function() {
      checkoutModal.style.display = 'none';
      document.body.style.overflow = 'auto';
      clearCart();
    });
  }
  
  // Track Order button
if (trackOrderBtn) {
  trackOrderBtn.addEventListener('click', function () {
    const modal = document.getElementById('setupzoneTrackingModal');
    if (modal) {
      modal.style.display = 'block';
      document.getElementById('setupzoneOrderIdInput').value = document.getElementById('order-id-display').textContent;
    }
  });
}

  // Form validation function
  function validateShippingForm() {
    const form = document.querySelector('#step-1 .checkout-form');
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
      if (!input.value.trim()) {
        input.style.borderColor = '#ef4444';
        isValid = false;
      } else {
        input.style.borderColor = '#cbd5e1';
      }
    });
    
    if (!isValid) {
      showToast('Please fill all required fields', 'error');
    }
    
    return isValid;
  }
  
  // Get shipping info from form
  function getShippingInfo() {
    const form = document.querySelector('#step-1 .checkout-form');
    const inputs = form.querySelectorAll('input, textarea');
    
    return {
      fullName: inputs[0].value.trim(),
      email: inputs[1].value.trim(),
      address: inputs[2].value.trim(),
      city: inputs[3].value.trim(),
      zip: inputs[4].value.trim(),
      phone: inputs[5].value.trim()
    };
  }
  
  // Get cart items
  function getCartItems() {
    const items = [];
    for (const productName in cart) {
      const item = cart[productName];
      items.push({
        name: productName,
        price: parseInt(item.price) || 0,
        quantity: parseInt(item.qty) || 1,
        image: item.image || 'feww'
      });
    }
    return items;
  }
  
  // Calculate order total
  function calculateTotal() {
    const cartItems = getCartItems();
    let subtotal = 0;
    
    cartItems.forEach(item => {
      subtotal += item.price * item.quantity;
    });
    
    // Add COD fee if applicable
    if (document.getElementById('enable-cod')?.checked) {
      return subtotal + 50;
    }
    
    return subtotal;
  }
  
  // Update order summary in checkout
  function updateOrderSummary() {
    const cartItems = getCartItems();
    const container = document.getElementById('checkout-items');
    if (!container) {
      console.error('Checkout items container not found');
      return;
    }
    
    container.innerHTML = '';
    let subtotal = 0;
    
    if (cartItems.length === 0) {
      container.innerHTML = '<div class="empty-cart-message">Your cart is empty</div>';
      updateTotals(0, 0);
      return;
    }
    
    cartItems.forEach(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      
      const itemElement = document.createElement('div');
      itemElement.className = 'checkout-item';
      itemElement.innerHTML = `
        <div class="checkout-item-image-container">
          <img src="${item.image}" alt="${item.name}" class="checkout-item-image" onerror="this.src='https://via.placeholder.com/80?text=No+Image'">
        </div>
        <div class="checkout-item-details">
          <h4 class="checkout-item-name">${item.name}</h4>
          <div class="checkout-item-meta">
            <span class="checkout-item-price">₹${item.price.toFixed(2)}</span>
            <span class="checkout-item-quantity">× ${item.quantity}</span>
          </div>
        </div>
        <div class="checkout-item-total">₹${itemTotal.toFixed(2)}</div>
      `;
      container.appendChild(itemElement);
    });
    
    const isCOD = document.getElementById('enable-cod')?.checked;
    const shippingFee = isCOD ? 50 : 0;
    updateTotals(subtotal, shippingFee);
  }
  
  function updateTotals(subtotal, shippingFee) {
    const total = subtotal + shippingFee;
    
    document.getElementById('checkout-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('checkout-shipping').textContent = shippingFee ? '₹50.00' : 'Free';
    document.getElementById('checkout-total-amount').textContent = `₹${total.toFixed(2)}`;
    
    // Also update the payment button amounts
    const rzpButton = document.getElementById('rzp-button');
    if (rzpButton) {
      rzpButton.textContent = `Pay ₹${total.toFixed(2)} with Razorpay 🔐`;
    }
    
    const placeCodOrderBtn = document.getElementById('place-cod-order');
    if (placeCodOrderBtn) {
      placeCodOrderBtn.textContent = `Place COD Order (₹${total.toFixed(2)})`;
    }
  }
  
  // Place order in Firebase
  function placeOrder(paymentMethod, paymentId = null) {
    const shippingInfo = getShippingInfo();
    const cartItems = getCartItems();
    const total = calculateTotal();
    
    // Generate order ID
    const orderId = 'ORD-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    const orderDate = new Date().toISOString();
    
    // Create order object
    const order = {
      orderId,
      orderDate,
      customer: {
        name: shippingInfo.fullName,
        email: shippingInfo.email,
        phone: shippingInfo.phone,
        address: {
          street: shippingInfo.address,
          city: shippingInfo.city,
          zip: shippingInfo.zip
        }
      },
      items: cartItems,
      subtotal: total - (paymentMethod === 'cod' ? 50 : 0),
      shippingFee: paymentMethod === 'cod' ? 50 : 0,
      total,
      paymentMethod,
      paymentId,
      status: paymentMethod === 'cod' ? 'processing' : 'paid',
      shippingStatus: 'processing',
      statusTimeline: {
        ordered: new Date().toISOString(),
        processed: null,
        shipped: null,
        delivered: null
      },
      carrier: 'FastTrack Logistics',
      trackingNumber: 'TRK' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      estimatedDelivery: getEstimatedDeliveryDate()
    };
    
    // Save to Firebase
    if (window.firebase && firebase.firestore) {
      const db = firebase.firestore();
      
      db.collection('orders').doc(orderId).set(order)
        .then(() => {
          // Show confirmation
          moveToConfirmation(order);
          
          // Show success message
          showToast('Order placed successfully!', '✅ Email sent!');
          
          // Also save locally for order tracking
          saveOrderLocally(order);
        })
        .catch(error => {
          console.error('Error saving order: ', error);
          showToast('Error placing order. Please try again.', 'error');
        });
    } 
  }



  // Move to confirmation step
  function moveToConfirmation(order) {
    // Update steps
    step2.classList.remove('active');
    step3.classList.add('active');
    
    // Update progress steps if they exist
    if (progressSteps.length > 0) {
      progressSteps[1].classList.add('completed');
      progressSteps[2].classList.add('active');
    }
    
    // Update confirmation details
    document.getElementById('order-id-display').textContent = order.orderId;
    document.getElementById('order-email-display').textContent = order.customer.email;
    document.getElementById('order-delivery-display').textContent = 'Estimated 3-5 business days';
  }
  
  // Save order to localStorage for tracking
  function saveOrderLocally(order) {
    let orders = JSON.parse(localStorage.getItem('setupzoneOrders')) || [];
    orders.push(order);
    localStorage.setItem('setupzoneOrders', JSON.stringify(orders));
  }
  
  // Get estimated delivery date
  function getEstimatedDeliveryDate() {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * 3) + 3); // 3-5 days from now
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  // Clear cart after successful purchase
  function clearCart() {
    cart = {};
    localStorage.removeItem('cart');
    updateCartCount();
    
    // Clear cart items in UI
    const cartItemsElement = document.getElementById('cart-items');
    if (cartItemsElement) {
      cartItemsElement.innerHTML = '';
    }
    
    // Update cart total in UI
    const cartTotalElement = document.getElementById('cart-total');
    if (cartTotalElement) {
      cartTotalElement.textContent = 'Total: ₹0';
    }
  }
}

// Review System Functions
function setupReviewSystem() {
  console.log('Setting up review system...');
  
  // Star rating input functionality
  const starInputs = document.querySelectorAll('.star-input');
  starInputs.forEach((star, index) => {
    star.addEventListener('click', function() {
      const rating = parseInt(this.dataset.rating);
      updateStarRating(rating);
    });
    
    star.addEventListener('mouseenter', function() {
      const rating = parseInt(this.dataset.rating);
      highlightStars(rating);
    });
  });
  
  // Reset stars on mouse leave
  const starRating = document.getElementById('star-rating');
  if (starRating) {
    starRating.addEventListener('mouseleave', function() {
      const currentRating = getCurrentRating();
      highlightStars(currentRating);
    });
  }
  
  // Submit review functionality
  const submitReviewBtn = document.getElementById('submit-review');
  if (submitReviewBtn) {
    submitReviewBtn.addEventListener('click', function() {
      submitReview();
    });
  }
}

function updateStarRating(rating) {
  const stars = document.querySelectorAll('.star-input');
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
}

function highlightStars(rating) {
  const stars = document.querySelectorAll('.star-input');
  stars.forEach((star, index) => {
    if (index < rating) {
      star.style.color = '#ffd700';
    } else {
      star.style.color = '#ddd';
    }
  });
}

function getCurrentRating() {
  const activeStars = document.querySelectorAll('.star-input.active');
  return activeStars.length;
}

function submitReview() {
  const rating = getCurrentRating();
  const reviewText = document.getElementById('review-text').value.trim();
  const reviewerName = document.getElementById('reviewer-name').value.trim() || 'Anonymous';
  
  if (rating === 0) {
    showToast('Please select a rating', '⚠️');
    return;
  }
  
  if (reviewText.length < 10) {
    showToast('Please write at least 10 characters for your review', '⚠️');
    return;
  }
  
  // Get current product name for Firebase storage
  const currentProduct = document.getElementById('modal-title').textContent;
  if (!currentProduct || currentProduct === 'Product Name') {
    showToast('Error: Product not found', '❌');
    return;
  }
  
  // Create new review object
  const newReview = {
    rating: rating,
    text: reviewText,
    reviewer: reviewerName,
    date: new Date().toISOString(),
    timestamp: Date.now(),
    productName: currentProduct
  };
  
  // Save to Firebase
  saveReviewToFirebase(newReview);
  
  // Clear form
  clearReviewForm();
  
  // Show loading message
  showToast('Saving your review...', '💾');
}

function addReviewToList(review) {
  const reviewsList = document.getElementById('reviews-list');
  if (!reviewsList) return;
  
  const reviewElement = createReviewElement(review);
  reviewsList.insertBefore(reviewElement, reviewsList.firstChild);
}

function createReviewElement(review) {
  const reviewDiv = document.createElement('div');
  reviewDiv.className = 'review-item';
  reviewDiv.innerHTML = `
    <div class="review-header">
      <div class="reviewer-info">
        <span class="reviewer-name">${escapeHtml(review.reviewer)}</span>
        <div class="review-rating">
          ${generateStarRating(review.rating)}
        </div>
      </div>
      <span class="review-date">${formatReviewDate(review.date)}</span>
    </div>
    <p class="review-text">${escapeHtml(review.text)}</p>
  `;
  
  return reviewDiv;
}

function generateStarRating(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars += '<span class="star filled">★</span>';
    } else {
      stars += '<span class="star">★</span>';
    }
  }
  return stars;
}

function formatReviewDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return '1 day ago';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  } else {
    return date.toLocaleDateString();
  }
}

function updateOverallRating() {
  const reviews = document.querySelectorAll('.review-item');
  if (reviews.length === 0) {
    // No reviews yet - show default state
    const ratingText = document.getElementById('rating-text');
    const ratingCountElement = document.getElementById('rating-count');
    
    if (ratingText) {
      ratingText.textContent = 'No ratings yet';
    }
    
    if (ratingCountElement) {
      ratingCountElement.textContent = '(0 reviews)';
    }
    
    // Reset overall rating stars
    const overallStars = document.querySelectorAll('#overall-rating .star');
    overallStars.forEach(star => {
      star.style.color = '#ddd';
    });
    
    // Reset rating breakdown
    const ratingBars = document.querySelectorAll('.rating-bar');
    ratingBars.forEach(bar => {
      const fill = bar.querySelector('.rating-fill');
      const percentageText = bar.querySelector('.rating-percentage');
      
      if (fill) {
        fill.style.width = '0%';
      }
      
      if (percentageText) {
        percentageText.textContent = '0%';
      }
    });
    
    return;
  }
  
  let totalRating = 0;
  let ratingCount = 0;
  
  reviews.forEach(review => {
    const stars = review.querySelectorAll('.review-rating .star.filled');
    if (stars.length > 0) {
      totalRating += stars.length;
      ratingCount++;
    }
  });
  
  if (ratingCount > 0) {
    const averageRating = (totalRating / ratingCount).toFixed(1);
    const ratingText = document.getElementById('rating-text');
    const ratingCountElement = document.getElementById('rating-count');
    
    if (ratingText) {
      ratingText.textContent = `${averageRating} out of 5`;
    }
    
    if (ratingCountElement) {
      ratingCountElement.textContent = `(${ratingCount} review${ratingCount !== 1 ? 's' : ''})`;
    }
    
    // Update overall rating stars
    updateOverallRatingStars(averageRating);
    
    // Update rating breakdown
    updateRatingBreakdown(reviews);
  }
}

function updateOverallRatingStars(rating) {
  const overallStars = document.querySelectorAll('#overall-rating .star');
  const ratingValue = parseFloat(rating);
  
  overallStars.forEach((star, index) => {
    if (index < Math.floor(ratingValue)) {
      star.style.color = '#ffd700';
    } else if (index === Math.floor(ratingValue) && ratingValue % 1 >= 0.5) {
      star.style.color = '#ffd700';
    } else {
      star.style.color = '#ddd';
    }
  });
}

function updateRatingBreakdown(reviews) {
  const ratingCounts = [0, 0, 0, 0, 0]; // 1-5 star counts
  let totalReviews = 0;
  
  reviews.forEach(review => {
    const stars = review.querySelectorAll('.review-rating .star.filled');
    if (stars.length > 0) {
      ratingCounts[stars.length - 1]++;
      totalReviews++;
    }
  });
  
  if (totalReviews > 0) {
    const ratingBars = document.querySelectorAll('.rating-bar');
    ratingBars.forEach((bar, index) => {
      const percentage = ((ratingCounts[4 - index] / totalReviews) * 100).toFixed(0);
      const fill = bar.querySelector('.rating-fill');
      const percentageText = bar.querySelector('.rating-percentage');
      
      if (fill) {
        fill.style.width = `${percentage}%`;
      }
      
      if (percentageText) {
        percentageText.textContent = `${percentage}%`;
      }
    });
  }
}

function clearReviewForm() {
  document.getElementById('review-text').value = '';
  document.getElementById('reviewer-name').value = '';
  updateStarRating(0);
}

function loadProductReviews() {
  console.log('Loading product reviews from Firebase...');
  
  // Get current product name
  const currentProduct = document.getElementById('modal-title').textContent;
  if (!currentProduct || currentProduct === 'Product Name') {
    console.log('No product selected, skipping review load');
    return;
  }
  
  // Set up real-time listener for reviews
  setupRealTimeReviews(currentProduct);
}

function saveReviewToFirebase(review) {
  try {
    // Check if Firebase is initialized
    if (!db) {
      console.error('Firebase not initialized');
      showToast('Database not available. Please try again.', '❌');
      return;
    }
    
    // Add review to Firestore
    db.collection('reviews').add(review)
      .then((docRef) => {
        console.log('Review saved with ID: ', docRef.id);
        
        // Add the review to the UI
        addReviewToList(review);
        
        // Update overall rating
        updateOverallRating();
        
        // Show success message
        showToast('Thank you for your review!', '⭐');
      })
      .catch((error) => {
        console.error('Error saving review: ', error);
        showToast('Error saving review. Please try again.', '❌');
      });
  } catch (error) {
    console.error('Firebase error: ', error);
    showToast('Database connection error. Please try again.', '❌');
  }
}

function loadReviewsFromFirebase(productName) {
  try {
    // Query reviews for the current product
    db.collection('reviews')
      .where('productName', '==', productName)
      .orderBy('timestamp', 'desc')
      .get()
      .then((querySnapshot) => {
        const reviewsList = document.getElementById('reviews-list');
        if (!reviewsList) return;
        
        // Clear existing reviews
        reviewsList.innerHTML = '';
        
        if (querySnapshot.empty) {
          console.log('No reviews found for product:', productName);
          updateOverallRating(); // Update to show "No ratings yet"
          return;
        }
        
        // Add each review to the UI
        querySnapshot.forEach((doc) => {
          const reviewData = doc.data();
          reviewData.id = doc.id; // Add document ID
          addReviewToList(reviewData);
        });
        
        // Update overall rating
        updateOverallRating();
        
        console.log(`Loaded ${querySnapshot.size} reviews for ${productName}`);
      })
      .catch((error) => {
        console.error('Error loading reviews: ', error);
        // Still update rating to show empty state
        updateOverallRating();
      });
  } catch (error) {
    console.error('Firebase error: ', error);
    // Still update rating to show empty state
    updateOverallRating();
  }
}

function setupRealTimeReviews(productName) {
  try {
    // Check if Firebase is initialized
    if (!db) {
      console.error('Firebase not initialized');
      return null;
    }
    
    // Unsubscribe from previous listener if exists
    if (currentReviewListener) {
      currentReviewListener();
      currentReviewListener = null;
    }
    
    // Set up real-time listener for reviews
    // Note: You may need to create a Firestore index for this query:
    // Collection: reviews, Fields: productName (Ascending), timestamp (Descending)
    currentReviewListener = db.collection('reviews')
      .where('productName', '==', productName)
      .orderBy('timestamp', 'desc')
      .onSnapshot((querySnapshot) => {
        const reviewsList = document.getElementById('reviews-list');
        if (!reviewsList) return;
        
        // Clear existing reviews
        reviewsList.innerHTML = '';
        
        if (querySnapshot.empty) {
          updateOverallRating();
          return;
        }
        
        // Add each review to the UI
        querySnapshot.forEach((doc) => {
          const reviewData = doc.data();
          reviewData.id = doc.id;
          addReviewToList(reviewData);
        });
        
        // Update overall rating
        updateOverallRating();
      }, (error) => {
        console.error('Real-time listener error: ', error);
        
        // If index doesn't exist, try without orderBy
        if (error.code === 'failed-precondition') {
          console.log('Index not found, trying without orderBy...');
          currentReviewListener = db.collection('reviews')
            .where('productName', '==', productName)
            .onSnapshot((querySnapshot) => {
              const reviewsList = document.getElementById('reviews-list');
              if (!reviewsList) return;
              
              // Clear existing reviews
              reviewsList.innerHTML = '';
              
              if (querySnapshot.empty) {
                updateOverallRating();
                return;
              }
              
              // Sort reviews by timestamp in JavaScript
              const reviews = [];
              querySnapshot.forEach((doc) => {
                const reviewData = doc.data();
                reviewData.id = doc.id;
                reviews.push(reviewData);
              });
              
              // Sort by timestamp descending
              reviews.sort((a, b) => b.timestamp - a.timestamp);
              
              // Add each review to the UI
              reviews.forEach(review => {
                addReviewToList(review);
              });
              
              // Update overall rating
              updateOverallRating();
            }, (fallbackError) => {
              console.error('Fallback query error: ', fallbackError);
            });
        }
      });
      
    return currentReviewListener;
  } catch (error) {
    console.error('Firebase real-time setup error: ', error);
    return null;
  }
}



