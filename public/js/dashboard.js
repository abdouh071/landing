/**
 * Admin Dashboard JavaScript
 * Handles authentication, product CRUD, variants, orders, and settings
 */

// ============ Configuration ============
const API_BASE = '/api';

// Mock token for development (replace with Firebase Auth in production)
let authToken = null;

// ============ State ============
let products = [];
let variants = [];
let orders = [];

// ============ DOM Elements ============
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const elements = {
  // Login
  loginScreen: $('#loginScreen'),
  loginForm: $('#loginForm'),
  loginEmail: $('#loginEmail'),
  loginPassword: $('#loginPassword'),
  loginBtn: $('#loginBtn'),
  
  // Dashboard
  dashboardContainer: $('#dashboardContainer'),
  userEmail: $('#userEmail'),
  logoutBtn: $('#logoutBtn'),
  pageTitle: $('#pageTitle'),
  menuToggle: $('#menuToggle'),
  sidebar: $('.sidebar'),
  
  // Navigation
  navItems: $$('.nav-item'),
  sections: $$('.content-section'),
  
  // Products
  productsGrid: $('#productsGrid'),
  addProductBtn: $('#addProductBtn'),
  productModal: $('#productModal'),
  productForm: $('#productForm'),
  productModalTitle: $('#productModalTitle'),
  closeProductModal: $('#closeProductModal'),
  cancelProductBtn: $('#cancelProductBtn'),
  productEditId: $('#productEditId'),
  productName: $('#productName'),
  productNameFr: $('#productNameFr'),
  productPrice: $('#productPrice'),
  productInStock: $('#productInStock'),
  productImageFile: $('#productImageFile'),
  productImageUpload: $('#productImageUpload'),
  productUploadPlaceholder: $('#productUploadPlaceholder'),
  productImagePreview: $('#productImagePreview'),
  productImageUrl: $('#productImageUrl'),
  
  // Variants
  variantsList: $('#variantsList'),
  addVariantBtn: $('#addVariantBtn'),
  variantModal: $('#variantModal'),
  variantForm: $('#variantForm'),
  variantModalTitle: $('#variantModalTitle'),
  closeVariantModal: $('#closeVariantModal'),
  cancelVariantBtn: $('#cancelVariantBtn'),
  variantEditId: $('#variantEditId'),
  variantProductId: $('#variantProductId'),
  variantName: $('#variantName'),
  variantNameFr: $('#variantNameFr'),
  variantImageFile: $('#variantImageFile'),
  variantImageUpload: $('#variantImageUpload'),
  variantUploadPlaceholder: $('#variantUploadPlaceholder'),
  variantImagePreview: $('#variantImagePreview'),
  variantImageUrl: $('#variantImageUrl'),
  
  // Orders
  ordersTableBody: $('#ordersTableBody'),
  ordersEmpty: $('#ordersEmpty'),
  refreshOrdersBtn: $('#refreshOrdersBtn'),
  
  // Settings
  settingsForm: $('#settingsForm'),
  settingsStoreName: $('#settingsStoreName'),
  settingsStoreNameFr: $('#settingsStoreNameFr'),
  settingsOutOfStock: $('#settingsOutOfStock'),
  settingsOutOfStockFr: $('#settingsOutOfStockFr'),
  
  // Toast
  toastContainer: $('#toastContainer'),

  // Confirm Modal
  confirmModal: $('#confirmModal'),
  confirmModalTitle: $('#confirmModalTitle'),
  confirmModalMessage: $('#confirmModalMessage'),
  confirmOkBtn: $('#confirmOkBtn'),
  confirmCancelBtn: $('#confirmCancelBtn'),
  closeConfirmModal: $('#closeConfirmModal')
};

// ============ Initialization ============
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupEventListeners();
});

// ============ Authentication ============
function checkAuth() {
  const token = localStorage.getItem('authToken');
  if (token) {
    authToken = token;
    showDashboard();
  }
}

async function handleLogin(e) {
  e.preventDefault();
  
  const email = elements.loginEmail.value;
  const password = elements.loginPassword.value;
  
  elements.loginBtn.disabled = true;
  elements.loginBtn.textContent = 'Signing in...';
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('userEmail', data.user.email);
      showDashboard();
      showToast('Welcome! Logged in successfully', 'success');
    } else {
      throw new Error(data.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    showToast(error.message, 'error');
    elements.loginBtn.disabled = false;
    elements.loginBtn.textContent = 'Sign In';
  }
}

function handleLogout() {
  authToken = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('userEmail');
  elements.dashboardContainer.style.display = 'none';
  elements.loginScreen.style.display = 'flex';
  elements.loginBtn.disabled = false;
  elements.loginBtn.textContent = 'Sign In';
  elements.loginForm.reset();
}

function showDashboard() {
  elements.loginScreen.style.display = 'none';
  elements.dashboardContainer.style.display = 'flex';
  elements.userEmail.textContent = localStorage.getItem('userEmail') || 'admin@ecom-shop.com';
  
  // Load initial data
  loadProducts();
  loadOrders();
  loadSettings();
}

// ============ API Helpers ============
async function fetchAPI(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    ...options
  };
  
  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  
  return data;
}

async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('name', file.name);
  
  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: formData
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Upload failed');
  }
  
  return data.url;
}

// ============ Event Listeners ============
function setupEventListeners() {
  // Login
  elements.loginForm.addEventListener('submit', handleLogin);
  elements.logoutBtn.addEventListener('click', handleLogout);
  
  // Mobile menu
  elements.menuToggle.addEventListener('click', () => {
    elements.sidebar.classList.toggle('show');
  });
  
  // Navigation
  elements.navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      navigateToSection(section);
    });
  });
  
  // Products
  elements.addProductBtn.addEventListener('click', () => openProductModal());
  elements.closeProductModal.addEventListener('click', closeProductModal);
  elements.cancelProductBtn.addEventListener('click', closeProductModal);
  elements.productForm.addEventListener('submit', handleProductSubmit);
  elements.productImageUpload.addEventListener('click', () => elements.productImageFile.click());
  elements.productImageFile.addEventListener('change', handleProductImageChange);
  
  // Variants
  elements.addVariantBtn.addEventListener('click', () => openVariantModal());
  elements.closeVariantModal.addEventListener('click', closeVariantModal);
  elements.cancelVariantBtn.addEventListener('click', closeVariantModal);
  elements.variantForm.addEventListener('submit', handleVariantSubmit);
  elements.variantImageUpload.addEventListener('click', () => elements.variantImageFile.click());
  elements.variantImageFile.addEventListener('change', handleVariantImageChange);
  
  // Orders
  elements.refreshOrdersBtn.addEventListener('click', loadOrders);
  
  // Settings
  elements.settingsForm.addEventListener('submit', handleSettingsSubmit);
  
  // Close modals on outside click
  elements.productModal.addEventListener('click', (e) => {
    if (e.target === elements.productModal) closeProductModal();
  });
  elements.variantModal.addEventListener('click', (e) => {
    if (e.target === elements.variantModal) closeVariantModal();
  });
  
  // Confirm Modal Listeners
  elements.confirmModal.addEventListener('click', (e) => {
    if (e.target === elements.confirmModal) closeConfirmModal();
  });
  elements.closeConfirmModal.addEventListener('click', closeConfirmModal);
  elements.confirmCancelBtn.addEventListener('click', closeConfirmModal);
}

// ============ Navigation ============
function navigateToSection(sectionId) {
  // Update nav items
  elements.navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.section === sectionId);
  });
  
  // Update sections
  elements.sections.forEach(section => {
    section.classList.toggle('active', section.id === `${sectionId}Section`);
  });
  
  // Update page title
  const titles = {
    products: 'Products',
    variants: 'Variants',
    orders: 'Orders',
    settings: 'Settings'
  };
  elements.pageTitle.textContent = titles[sectionId] || 'Dashboard';
  
  // Hide mobile menu
  elements.sidebar.classList.remove('show');
  
  // Refresh data if needed
  if (sectionId === 'variants') {
    loadAllVariants();
  } else if (sectionId === 'orders') {
    loadOrders();
  }
}

// ============ Products ============
async function loadProducts() {
  try {
    products = await fetchAPI('/products');
    renderProducts();
    updateVariantProductSelect();
  } catch (error) {
    console.error('Error loading products:', error);
    showToast('Failed to load products', 'error');
  }
}

function renderProducts() {
  if (products.length === 0) {
    elements.productsGrid.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📦</span>
        <p>No products yet. Add your first product!</p>
      </div>
    `;
    return;
  }
  
  elements.productsGrid.innerHTML = products.map(product => `
    <div class="product-card" data-id="${product.id}">
      <img 
        src="${product.mainImage || 'https://via.placeholder.com/300x200/334155/94a3b8?text=No+Image'}" 
        alt="${product.name}"
        class="product-card-image"
      >
      <div class="product-card-content">
        <h3 class="product-card-name">${product.name}</h3>
        <p class="product-card-name-fr">${product.nameFr || ''}</p>
        <div class="product-card-meta">
          <span class="stock-status ${product.inStock ? 'in-stock' : 'out-of-stock'}">
            ${product.inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
        <div class="product-card-actions">
          <button class="btn btn-ghost btn-sm btn-edit-product" data-product-id="${product.id}">
            ✏️ Edit
          </button>
          <button class="btn btn-danger btn-sm btn-delete-product" data-product-id="${product.id}">
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  `).join('');
  
  // Add event listeners using event delegation
  elements.productsGrid.querySelectorAll('.btn-edit-product').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const productId = btn.dataset.productId;
      editProduct(productId);
    });
  });
  
  elements.productsGrid.querySelectorAll('.btn-delete-product').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const productId = btn.dataset.productId;
      deleteProduct(productId);
    });
  });
}

function openProductModal(product = null) {
  elements.productForm.reset();
  elements.productEditId.value = '';
  elements.productImageUrl.value = '';
  elements.productImagePreview.style.display = 'none';
  elements.productUploadPlaceholder.style.display = 'flex';
  
  if (product) {
    elements.productModalTitle.textContent = 'Edit Product';
    elements.productEditId.value = product.id;
    elements.productName.value = product.name;
    elements.productNameFr.value = product.nameFr || '';
    elements.productPrice.value = product.price || '';
    elements.productInStock.checked = product.inStock;
    
    if (product.mainImage) {
      elements.productImageUrl.value = product.mainImage;
      elements.productImagePreview.src = product.mainImage;
      elements.productImagePreview.style.display = 'block';
      elements.productUploadPlaceholder.style.display = 'none';
    }
  } else {
    elements.productModalTitle.textContent = 'Add Product';
  }
  
  elements.productModal.classList.add('show');
}

function closeProductModal() {
  elements.productModal.classList.remove('show');
}

async function handleProductImageChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // Show preview
  const reader = new FileReader();
  reader.onload = (e) => {
    elements.productImagePreview.src = e.target.result;
    elements.productImagePreview.style.display = 'block';
    elements.productUploadPlaceholder.style.display = 'none';
  };
  reader.readAsDataURL(file);
  
  // Upload to ImgBB
  try {
    showToast('Uploading image...', 'success');
    const url = await uploadImage(file);
    elements.productImageUrl.value = url;
    showToast('Image uploaded!', 'success');
  } catch (error) {
    console.error('Upload error:', error);
    showToast('Image upload failed', 'error');
  }
}

async function handleProductSubmit(e) {
  e.preventDefault();
  
  const productData = {
    name: elements.productName.value.trim(),
    nameFr: elements.productNameFr.value.trim(),
    price: elements.productPrice.value,
    mainImage: elements.productImageUrl.value,
    inStock: elements.productInStock.checked
  };
  
  const editId = elements.productEditId.value;
  
  try {
    if (editId) {
      await fetchAPI(`/products/${editId}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      });
      showToast('Product updated!', 'success');
    } else {
      await fetchAPI('/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });
      showToast('Product created!', 'success');
    }
    
    closeProductModal();
    loadProducts();
  } catch (error) {
    console.error('Error saving product:', error);
    showToast('Failed to save product', 'error');
  }
}

async function editProduct(id) {
  const product = products.find(p => p.id === id);
  if (product) {
    openProductModal(product);
  }
}

async function deleteProduct(id) {
  const confirmed = await showConfirmModal('Delete Product', 'Are you sure you want to delete this product? This action cannot be undone.');
  if (!confirmed) return;
  
  try {
    await fetchAPI(`/products/${id}`, { method: 'DELETE' });
    showToast('Product deleted!', 'success');
    loadProducts();
  } catch (error) {
    console.error('Error deleting product:', error);
    showToast('Failed to delete product', 'error');
  }
}

// ============ Variants ============
function updateVariantProductSelect() {
  elements.variantProductId.innerHTML = '<option value="">Select Product</option>';
  products.forEach(product => {
    elements.variantProductId.innerHTML += `
      <option value="${product.id}">${product.name}</option>
    `;
  });
}

async function loadAllVariants() {
  variants = [];
  
  for (const product of products) {
    try {
      const productVariants = await fetchAPI(`/variants/${product.id}`);
      productVariants.forEach(v => {
        v.productName = product.name;
      });
      variants.push(...productVariants);
    } catch (error) {
      console.error('Error loading variants for product:', product.id);
    }
  }
  
  renderVariants();
}

function renderVariants() {
  if (variants.length === 0) {
    elements.variantsList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🎨</span>
        <p>No variants yet. Add variants for your products!</p>
      </div>
    `;
    return;
  }
  
  elements.variantsList.innerHTML = variants.map(variant => `
    <div class="variant-card" data-id="${variant.id}">
      <img 
        src="${variant.imageUrl || 'https://via.placeholder.com/60x60/334155/94a3b8?text=?'}" 
        alt="${variant.name}"
        class="variant-card-image"
      >
      <div class="variant-card-info">
        <h4 class="variant-card-name">${variant.name}</h4>
        <p class="variant-card-name-fr">${variant.nameFr || ''}</p>
        <small style="color: var(--text-muted);">${variant.productName || ''}</small>
      </div>
      <div class="variant-card-actions">
        <button class="btn btn-danger btn-sm btn-delete-variant" data-variant-id="${variant.id}">
          🗑️
        </button>
      </div>
    </div>
  `).join('');
  
  // Add event listeners for variant delete buttons
  elements.variantsList.querySelectorAll('.btn-delete-variant').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteVariant(btn.dataset.variantId);
    });
  });
}

function openVariantModal() {
  elements.variantForm.reset();
  elements.variantEditId.value = '';
  elements.variantImageUrl.value = '';
  elements.variantImagePreview.style.display = 'none';
  elements.variantUploadPlaceholder.style.display = 'flex';
  elements.variantModalTitle.textContent = 'Add Variant';
  elements.variantModal.classList.add('show');
}

function closeVariantModal() {
  elements.variantModal.classList.remove('show');
}

async function handleVariantImageChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    elements.variantImagePreview.src = e.target.result;
    elements.variantImagePreview.style.display = 'block';
    elements.variantUploadPlaceholder.style.display = 'none';
  };
  reader.readAsDataURL(file);
  
  try {
    showToast('Uploading image...', 'success');
    const url = await uploadImage(file);
    elements.variantImageUrl.value = url;
    showToast('Image uploaded!', 'success');
  } catch (error) {
    console.error('Upload error:', error);
    showToast('Image upload failed', 'error');
  }
}

async function handleVariantSubmit(e) {
  e.preventDefault();
  
  const variantData = {
    productId: elements.variantProductId.value,
    name: elements.variantName.value.trim(),
    nameFr: elements.variantNameFr.value.trim(),
    imageUrl: elements.variantImageUrl.value
  };
  
  if (!variantData.imageUrl) {
    showToast('Please upload an image for the variant', 'error');
    return;
  }
  
  try {
    await fetchAPI('/variants', {
      method: 'POST',
      body: JSON.stringify(variantData)
    });
    showToast('Variant created!', 'success');
    closeVariantModal();
    loadAllVariants();
  } catch (error) {
    console.error('Error saving variant:', error);
    showToast('Failed to save variant', 'error');
  }
}

async function deleteVariant(id) {
  const confirmed = await showConfirmModal('Delete Variant', 'Are you sure you want to delete this variant?');
  if (!confirmed) return;
  
  try {
    await fetchAPI(`/variants/${id}`, { method: 'DELETE' });
    showToast('Variant deleted!', 'success');
    loadAllVariants();
  } catch (error) {
    console.error('Error deleting variant:', error);
    showToast('Failed to delete variant', 'error');
  }
}

// ============ Orders ============
async function loadOrders() {
  try {
    orders = await fetchAPI('/orders');
    renderOrders();
  } catch (error) {
    console.error('Error loading orders:', error);
    showToast('Failed to load orders', 'error');
  }
}

function renderOrders() {
  if (orders.length === 0) {
    elements.ordersTableBody.innerHTML = '';
    elements.ordersEmpty.style.display = 'block';
    return;
  }
  
  elements.ordersEmpty.style.display = 'none';
  elements.ordersTableBody.innerHTML = orders.map(order => `
    <tr>
      <td><code>${order.id.slice(0, 8)}...</code></td>
      <td>
        <div style="display: flex; align-items: center; gap: 10px;">
          ${order.variantImage 
            ? `<img src="${order.variantImage}" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover; border: 1px solid var(--border-color);" alt="Variant">`
            : '<span style="font-size: 20px;">📦</span>'
          }
          ${order.variantName 
            ? `<span style="font-size: 0.85rem; font-weight: 500;">${order.variantName}</span>` 
            : ''
          }
        </div>
      </td>
      <td>${order.firstName} ${order.lastName}</td>
      <td>${order.phone}</td>
      <td>${order.state}, ${order.municipality}</td>
      <td>
        <span class="order-status ${order.status}">
          ${order.status}
        </span>
      </td>
      <td>${formatDate(order.createdAt)}</td>
      <td>
        <button class="btn btn-success btn-sm btn-process-order" data-order-id="${order.id}">
          ✓
        </button>
        <button class="btn btn-danger btn-sm btn-delete-order" data-order-id="${order.id}">
          🗑️
        </button>
      </td>
    </tr>
  `).join('');
  
  // Add event listeners for order buttons
  elements.ordersTableBody.querySelectorAll('.btn-process-order').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      updateOrderStatus(btn.dataset.orderId, 'processed');
    });
  });
  
  elements.ordersTableBody.querySelectorAll('.btn-delete-order').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteOrder(btn.dataset.orderId);
    });
  });
}

function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date._seconds ? date._seconds * 1000 : date);
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function updateOrderStatus(id, status) {
  try {
    await fetchAPI(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    showToast('Order status updated!', 'success');
    loadOrders();
  } catch (error) {
    console.error('Error updating order:', error);
    showToast('Failed to update order', 'error');
  }
}

async function deleteOrder(id) {
  const confirmed = await showConfirmModal('Delete Order', 'Are you sure you want to delete this order?');
  if (!confirmed) return;
  
  try {
    await fetchAPI(`/orders/${id}`, { method: 'DELETE' });
    showToast('Order deleted!', 'success');
    loadOrders();
  } catch (error) {
    console.error('Error deleting order:', error);
    showToast('Failed to delete order', 'error');
  }
}

// ============ Confirm Modal ============
let confirmResolve = null;

function showConfirmModal(title, message) {
  elements.confirmModalTitle.textContent = title;
  elements.confirmModalMessage.textContent = message;
  elements.confirmModal.classList.add('show');
  
  return new Promise((resolve) => {
    confirmResolve = resolve;
    
    // One-time listener for OK button
    const handleOk = () => {
      cleanup();
      resolve(true);
    };
    
    // Cleanup listeners
    const cleanup = () => {
      elements.confirmOkBtn.removeEventListener('click', handleOk);
      confirmResolve = null;
      closeConfirmModal();
    };
    
    elements.confirmOkBtn.addEventListener('click', handleOk, { once: true });
    
    // If modal is closed via other means (cancel, overlay click), resolve(false)
    // accessing the existing logic in closeConfirmModal
  });
}

function closeConfirmModal() {
  elements.confirmModal.classList.remove('show');
  if (confirmResolve) {
    confirmResolve(false);
    confirmResolve = null;
  }
}

// ============ Settings ============
async function loadSettings() {
  try {
    const settings = await fetchAPI('/settings');
    elements.settingsStoreName.value = settings.storeName || '';
    elements.settingsStoreNameFr.value = settings.storeNameFr || '';
    elements.settingsOutOfStock.value = settings.outOfStockMessage || '';
    elements.settingsOutOfStockFr.value = settings.outOfStockMessageFr || '';
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

async function handleSettingsSubmit(e) {
  e.preventDefault();
  
  const settingsData = {
    storeName: elements.settingsStoreName.value.trim(),
    storeNameFr: elements.settingsStoreNameFr.value.trim(),
    outOfStockMessage: elements.settingsOutOfStock.value.trim(),
    outOfStockMessageFr: elements.settingsOutOfStockFr.value.trim()
  };
  
  try {
    await fetchAPI('/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData)
    });
    showToast('Settings saved!', 'success');
  } catch (error) {
    console.error('Error saving settings:', error);
    showToast('Failed to save settings', 'error');
  }
}

// ============ Toast Notifications ============
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
    <span class="toast-message">${message}</span>
  `;
  
  elements.toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(100px); }
  }
`;
document.head.appendChild(style);
