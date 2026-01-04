/**
 * Landing Page JavaScript
 * Handles product display, language switching, variant selection, and order submission
 */

// ============ Configuration ============
const API_BASE = '/api';

// ============ Translations ============
const translations = {
  ar: {
    inStock: 'متوفر',
    outOfStock: 'نفذت الكمية',
    selectVariant: 'اختر النوع',
    selectVariantError: 'يرجى اختيار نوع المنتج',
    orderForm: 'نموذج الطلب',
    firstName: 'الاسم',
    lastName: 'اللقب',
    phone: 'رقم الهاتف',
    state: 'الولاية',
    selectState: 'اختر الولاية',
    municipality: 'البلدية',
    address: 'العنوان الكامل',
    orderNow: 'اطلب الآن',
    close: 'إغلاق',
    allRights: 'جميع الحقوق محفوظة',
    loading: 'جاري التحميل...',
    error: 'حدث خطأ',
    requiredField: 'هذا الحقل مطلوب',
    invalidPhone: 'رقم الهاتف غير صالح',
    noVariants: 'لا توجد أنواع متاحة',
    successMessage: 'شكرا لك! تم استلام طلبك بنجاح. سنتصل بك قريبا لتأكيد الطلب.',
    selectState: 'اختر الولاية',
    selectCommune: 'اختر البلدية',
    langSwitch: 'FR'
  },
  fr: {
    inStock: 'En stock',
    outOfStock: 'Rupture de stock',
    selectVariant: 'Choisir une variante',
    selectVariantError: 'Veuillez sélectionner une variante',
    orderForm: 'Formulaire de commande',
    firstName: 'Prénom',
    lastName: 'Nom de famille',
    phone: 'Numéro de téléphone',
    state: 'Wilaya',
    selectState: 'Sélectionner la wilaya',
    municipality: 'Commune',
    address: 'Adresse complète',
    orderNow: 'Commander maintenant',
    close: 'Fermer',
    allRights: 'Tous droits réservés',
    loading: 'Chargement...',
    error: 'Une erreur est survenue',
    requiredField: 'Ce champ est obligatoire',
    invalidPhone: 'Numéro de téléphone invalide',
    noVariants: 'Aucune variante disponible',
    successMessage: 'Merci ! Votre commande a été reçue avec succès. Nous vous contacterons bientôt pour confirmer.',
    selectState: 'Choisir la Wilaya',
    selectCommune: 'Choisir la Commune',
    langSwitch: 'AR'
  }
};

// ============ State ============
let currentLang = 'ar';
let currentProduct = null;
let selectedVariantId = null;
let storeSettings = null;
let wilayasData = [];

// ============ DOM Elements ============
const elements = {
  langSwitch: document.getElementById('langSwitch'),
  langText: document.querySelector('.lang-text'),
  storeName: document.getElementById('storeName'),
  mainProductImage: document.getElementById('mainProductImage'),
  productName: document.getElementById('productName'),
  productPrice: document.getElementById('productPrice'),
  stockBadge: document.getElementById('stockBadge'),
  variantsGrid: document.getElementById('variantsGrid'),
  variantError: document.getElementById('variantError'),
  orderForm: document.getElementById('orderForm'),
  submitBtn: document.getElementById('submitBtn'),
  successMessage: document.getElementById('successMessage'),
  successText: document.getElementById('successText'),
  closeSuccess: document.getElementById('closeSuccess'),
  // Searchable select elements for wilaya
  stateInput: document.getElementById('stateInput'),
  stateHidden: document.getElementById('state'),
  stateDropdown: document.getElementById('stateDropdown'),
  stateWrapper: document.getElementById('stateSelectWrapper'),
  // Searchable select elements for commune
  municipalityInput: document.getElementById('municipalityInput'),
  municipalityHidden: document.getElementById('municipality'),
  municipalityDropdown: document.getElementById('municipalityDropdown'),
  municipalityWrapper: document.getElementById('municipalitySelectWrapper'),
  // Other
  productIdInput: document.getElementById('productId'),
  variantIdInput: document.getElementById('variantId')
};

// ============ Initialization ============
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  // Set up event listeners
  setupEventListeners();
  
  // Load product data, settings, and wilayas
  await Promise.all([
    loadProduct(),
    loadSettings(),
    loadWilayas()
  ]);
}

async function loadWilayas() {
  try {
    wilayasData = await fetchAPI('/wilayas');
    populateWilayas();
  } catch (error) {
    console.error('Error loading wilayas:', error);
  }
}

function populateWilayas(filter = '') {
  if (!elements.stateDropdown || wilayasData.length === 0) return;
  
  elements.stateDropdown.innerHTML = '';
  const filterLower = filter.toLowerCase().trim();
  
  let filtered = wilayasData;
  if (filterLower) {
    filtered = wilayasData.filter(wilaya => {
      const nameAr = wilaya.nameAr || '';
      const nameFr = (wilaya.nameFr || '').toLowerCase();
      const code = String(wilaya.wilayaCode);
      return nameAr.includes(filter) || nameFr.includes(filterLower) || code.includes(filterLower);
    });
  }
  
  if (filtered.length === 0) {
    elements.stateDropdown.innerHTML = `<div class="select-no-results">${currentLang === 'ar' ? 'لا توجد نتائج' : 'Aucun résultat'}</div>`;
    return;
  }
  
  filtered.forEach(wilaya => {
    const div = document.createElement('div');
    div.className = 'select-option';
    div.dataset.value = wilaya.nameFr;
    div.dataset.code = wilaya.wilayaCode;
    div.dataset.nameAr = wilaya.nameAr;
    div.dataset.nameFr = wilaya.nameFr;
    
    const displayName = currentLang === 'ar' ? wilaya.nameAr : wilaya.nameFr;
    div.innerHTML = `<span class="option-code">${wilaya.wilayaCode}</span> ${displayName}`;
    
    div.addEventListener('click', () => selectWilaya(wilaya));
    elements.stateDropdown.appendChild(div);
  });
}

function selectWilaya(wilaya) {
  const displayName = currentLang === 'ar' ? wilaya.nameAr : wilaya.nameFr;
  elements.stateInput.value = `${wilaya.wilayaCode} - ${displayName}`;
  elements.stateHidden.value = wilaya.nameFr;
  elements.stateDropdown.classList.remove('show');
  
  // Store selected wilaya code for commune population
  elements.stateInput.dataset.selectedCode = wilaya.wilayaCode;
  
  // Clear municipality selection
  elements.municipalityInput.value = '';
  elements.municipalityHidden.value = '';
  
  // Populate communes for selected wilaya
  populateCommunes(wilaya.wilayaCode);
  
  // Show commune dropdown
  elements.municipalityDropdown.classList.add('show');
  elements.municipalityInput.focus();
}

function populateCommunes(wilayaCode, filter = '') {
  if (!elements.municipalityDropdown) return;
  
  elements.municipalityDropdown.innerHTML = '';
  
  const wilaya = wilayasData.find(w => w.wilayaCode == wilayaCode);
  if (!wilaya || !wilaya.communes) {
    elements.municipalityDropdown.innerHTML = `<div class="select-no-results">${currentLang === 'ar' ? 'اختر ولاية أولاً' : 'Sélectionnez d\'abord une wilaya'}</div>`;
    return;
  }
  
  const filterLower = filter.toLowerCase().trim();
  let filtered = wilaya.communes;
  
  if (filterLower) {
    filtered = wilaya.communes.filter(commune => {
      const nameAr = commune.nameAr || '';
      const nameFr = (commune.nameFr || '').toLowerCase();
      return nameAr.includes(filter) || nameFr.includes(filterLower);
    });
  }
  
  if (filtered.length === 0) {
    elements.municipalityDropdown.innerHTML = `<div class="select-no-results">${currentLang === 'ar' ? 'لا توجد نتائج' : 'Aucun résultat'}</div>`;
    return;
  }
  
  filtered.forEach(commune => {
    const div = document.createElement('div');
    div.className = 'select-option';
    div.dataset.value = commune.nameFr;
    div.dataset.nameAr = commune.nameAr;
    div.dataset.nameFr = commune.nameFr;
    
    const displayName = currentLang === 'ar' ? commune.nameAr : commune.nameFr;
    div.textContent = displayName;
    
    div.addEventListener('click', () => selectCommune(commune));
    elements.municipalityDropdown.appendChild(div);
  });
}

function selectCommune(commune) {
  const displayName = currentLang === 'ar' ? commune.nameAr : commune.nameFr;
  elements.municipalityInput.value = displayName;
  elements.municipalityHidden.value = commune.nameFr;
  elements.municipalityDropdown.classList.remove('show');
}

async function loadSettings() {
  try {
    storeSettings = await fetchAPI('/settings');
    if (storeSettings) {
      updateStoreInfo();
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

function updateStoreInfo() {
  if (!storeSettings) return;
  const name = currentLang === 'ar' ? storeSettings.storeName : storeSettings.storeNameFr;
  if (name) {
    elements.storeName.textContent = name;
  }
}

// ============ API Functions ============
async function fetchAPI(endpoint) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

async function postAPI(endpoint, data) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ============ Load Product ============
async function loadProduct() {
  try {
    // Get first product
    const products = await fetchAPI('/products');
    
    if (products.length === 0) {
      elements.productName.textContent = 'لا يوجد منتجات';
      return;
    }
    
    currentProduct = products[0];
    elements.productIdInput.value = currentProduct.id;
    
    // Update UI
    updateProductDisplay();
    
    // Load variants
    await loadVariants(currentProduct.id);
    
  } catch (error) {
    console.error('Error loading product:', error);
    elements.productName.textContent = translations[currentLang].error;
  }
}

function updateProductDisplay() {
  if (!currentProduct) return;
  
  // Product name based on language
  elements.productName.textContent = currentLang === 'ar' 
    ? currentProduct.name 
    : (currentProduct.nameFr || currentProduct.name);

  // Product price
  const price = currentProduct.price;
  if (price) {
    const currency = currentLang === 'ar' ? 'دج' : 'DA';
    elements.productPrice.textContent = `${price} ${currency}`;
    elements.productPrice.style.display = 'block';
  } else {
    elements.productPrice.textContent = '';
    elements.productPrice.style.display = 'none';
  }
  
  // Main image
  if (currentProduct.mainImage) {
    elements.mainProductImage.src = currentProduct.mainImage;
    elements.mainProductImage.alt = elements.productName.textContent;
  }
  
  // Stock badge
  if (currentProduct.inStock) {
    elements.stockBadge.className = 'stock-badge in-stock';
    elements.stockBadge.querySelector('span').textContent = translations[currentLang].inStock;
  } else {
    elements.stockBadge.className = 'stock-badge out-of-stock';
    elements.stockBadge.querySelector('span').textContent = translations[currentLang].outOfStock;
  }
}

// ============ Load Variants ============
// Global variables
let currentVariants = [];

// ... existing code ...

async function loadVariants(productId) {
  try {
    const variants = await fetchAPI(`/variants/${productId}`);
    currentVariants = variants; // Store for later use
    
    elements.variantsGrid.innerHTML = '';
    
    if (variants.length === 0) {
      elements.variantsGrid.innerHTML = `<p style="color: var(--gray-400);">${translations[currentLang].noVariants}</p>`;
      return;
    }
    
    variants.forEach(variant => {
      const variantEl = createVariantElement(variant);
      elements.variantsGrid.appendChild(variantEl);
    });
    
  } catch (error) {
    console.error('Error loading variants:', error);
  }
}

function createVariantElement(variant) {
  const wrapper = document.createElement('div');
  wrapper.className = 'variant-wrapper';
  wrapper.dataset.variantId = variant.id;
  
  const name = currentLang === 'ar' ? variant.name : (variant.nameFr || variant.name);
  
  // Image container
  const item = document.createElement('div');
  item.className = 'variant-item';
  item.innerHTML = `
    <img src="${variant.imageUrl}" alt="${name}" loading="lazy">
    <span class="check-mark">✓</span>
  `;
  
  // Name element
  const nameSpan = document.createElement('span');
  nameSpan.className = 'variant-name';
  nameSpan.textContent = name;
  
  wrapper.appendChild(item);
  wrapper.appendChild(nameSpan);
  
  return wrapper;
}

function selectVariant(variantId, element) {
  // Remove previous selection
  document.querySelectorAll('.variant-wrapper').forEach(el => {
    el.classList.remove('selected');
  });
  
  // Select new variant
  element.classList.add('selected');
  selectedVariantId = variantId;
  elements.variantIdInput.value = variantId;
  
  // Hide error
  elements.variantError.classList.remove('show');
}

// ============ Event Listeners ============
function setupEventListeners() {
  // Language Switch
  elements.langSwitch.addEventListener('click', () => {
    toggleLanguage();
  });

  // ========== Searchable Wilaya Dropdown ==========
  const showWilayaDropdown = () => {
    // If input has a value that matches a selection, maybe we should clear it or show all?
    // Current behavior: show all on focus/click
    populateWilayas(''); 
    elements.stateDropdown.classList.add('show');
  };

  elements.stateInput.addEventListener('focus', showWilayaDropdown);
  elements.stateInput.addEventListener('click', showWilayaDropdown);
  
  // Filter on input
  elements.stateInput.addEventListener('input', (e) => {
    elements.stateHidden.value = ''; // Clear hidden value when typing
    populateWilayas(e.target.value);
    elements.stateDropdown.classList.add('show');
  });
  
  // Hide dropdown on blur (with delay for click to register)
  elements.stateInput.addEventListener('blur', () => {
    setTimeout(() => {
      elements.stateDropdown.classList.remove('show');
    }, 200);
  });

  // ========== Searchable Municipality Dropdown ==========
  const showMunicipalityDropdown = () => {
    const wilayaCode = elements.stateInput.dataset.selectedCode;
    if (wilayaCode) {
      // Populate with empty filter to show all communes for this wilaya
      populateCommunes(wilayaCode, '');
      elements.municipalityDropdown.classList.add('show');
    } else {
      // Show message if no wilaya selected
      elements.municipalityDropdown.innerHTML = `<div class="select-no-results">${currentLang === 'ar' ? 'اختر ولاية أولاً' : 'Sélectionnez d\'abord une wilaya'}</div>`;
      elements.municipalityDropdown.classList.add('show');
    }
  };

  elements.municipalityInput.addEventListener('focus', showMunicipalityDropdown);
  elements.municipalityInput.addEventListener('click', showMunicipalityDropdown);
  
  // Filter on input
  elements.municipalityInput.addEventListener('input', (e) => {
    elements.municipalityHidden.value = ''; // Clear hidden value when typing
    const wilayaCode = elements.stateInput.dataset.selectedCode;
    if (wilayaCode) {
      populateCommunes(wilayaCode, e.target.value);
      elements.municipalityDropdown.classList.add('show');
    }
  });
  
  // Hide dropdown on blur (with delay for click to register)
  elements.municipalityInput.addEventListener('blur', () => {
    setTimeout(() => {
      elements.municipalityDropdown.classList.remove('show');
    }, 200);
  });

  // ========== Close dropdowns when clicking outside ==========
  document.addEventListener('click', (e) => {
    if (!elements.stateWrapper.contains(e.target)) {
      elements.stateDropdown.classList.remove('show');
    }
    if (!elements.municipalityWrapper.contains(e.target)) {
      elements.municipalityDropdown.classList.remove('show');
    }
  });

  // Variant Selection (Event Delegation)
  elements.variantsGrid.addEventListener('click', (e) => {
    const wrapper = e.target.closest('.variant-wrapper');
    if (wrapper) {
      selectVariant(wrapper.dataset.variantId, wrapper);
    }
  });

  // Form submission
  elements.orderForm.addEventListener('submit', handleSubmit);
  
  // Close success message
  elements.closeSuccess.addEventListener('click', closeSuccessMessage);
  elements.successMessage.addEventListener('click', (e) => {
    if (e.target === elements.successMessage) {
      closeSuccessMessage();
    }
  });
  
  // Clear errors on input
  const formInputs = elements.orderForm.querySelectorAll('input, select, textarea');
  formInputs.forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('error');
      const errorEl = document.getElementById(`${input.id}Error`);
      if (errorEl) errorEl.textContent = '';
    });
  });
}

// ============ Language Toggle ============
function toggleLanguage() {
  currentLang = currentLang === 'ar' ? 'fr' : 'ar';
  
  // Update HTML attributes
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  document.body.classList.toggle('lang-fr', currentLang === 'fr');
  
  // Update lang switch button
  elements.langText.textContent = translations[currentLang].langSwitch;
  
  // Update all translatable elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (translations[currentLang][key]) {
      el.textContent = translations[currentLang][key];
    }
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (translations[currentLang][key]) {
      el.placeholder = translations[currentLang][key];
    }
  });
  
  // Update product display
  updateProductDisplay();
  
  // Reload variants to update names
  if (currentProduct) {
    loadVariants(currentProduct.id);
  }
  
  // Update store info
  updateStoreInfo();
  
  // Update wilaya display if selected
  const selectedWilayaCode = elements.stateInput.dataset.selectedCode;
  if (selectedWilayaCode) {
    const wilaya = wilayasData.find(w => w.wilayaCode == selectedWilayaCode);
    if (wilaya) {
      const displayName = currentLang === 'ar' ? wilaya.nameAr : wilaya.nameFr;
      elements.stateInput.value = `${wilaya.wilayaCode} - ${displayName}`;
    }
  }
  
  // Update commune display if selected
  const selectedCommuneValue = elements.municipalityHidden.value;
  if (selectedCommuneValue && selectedWilayaCode) {
    const wilaya = wilayasData.find(w => w.wilayaCode == selectedWilayaCode);
    if (wilaya && wilaya.communes) {
      const commune = wilaya.communes.find(c => c.nameFr === selectedCommuneValue);
      if (commune) {
        const displayName = currentLang === 'ar' ? commune.nameAr : commune.nameFr;
        elements.municipalityInput.value = displayName;
      }
    }
  }
}

// ============ Form Validation ============
function validateForm() {
  let isValid = true;
  const t = translations[currentLang];
  
  // Check variant selection
  if (!selectedVariantId) {
    elements.variantError.classList.add('show');
    isValid = false;
  }
  
  // Required fields
  const requiredFields = ['firstName', 'lastName', 'phone', 'state', 'municipality', 'address'];
  
  requiredFields.forEach(fieldId => {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}Error`);
    
    if (!input.value.trim()) {
      input.classList.add('error');
      if (errorEl) errorEl.textContent = t.requiredField;
      isValid = false;
    }
  });
  
  // Phone validation
  const phone = document.getElementById('phone');
  const phoneError = document.getElementById('phoneError');
  if (phone.value && !/^[0-9+\s-]{8,15}$/.test(phone.value)) {
    phone.classList.add('error');
    if (phoneError) phoneError.textContent = t.invalidPhone;
    isValid = false;
  }
  
  return isValid;
}

// ============ Form Submission ============
async function handleSubmit(e) {
  e.preventDefault();
  
  if (!validateForm()) {
    // Check if variant error is shown and scroll to it
    if (elements.variantError.classList.contains('show')) {
      elements.variantsGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }
  
  // Disable button
  elements.submitBtn.disabled = true;
  const originalContent = elements.submitBtn.innerHTML;
  elements.submitBtn.innerHTML = '<span class="spinner"></span>';
  
  /* restored try block */ 
  try {
    // Get selected variant info
    let variantImage = '';
    let variantName = '';
    
    // Try data lookup first
    if (selectedVariantId && typeof currentVariants !== 'undefined') {
      const variant = currentVariants.find(v => String(v.id) === String(selectedVariantId));
      if (variant) {
         variantImage = variant.imageUrl;
         variantName = currentLang === 'ar' ? variant.name : (variant.nameFr || variant.name);
      }
    }

    // Fallback to DOM if data lookup failed or yielded no image
    if (!variantImage) {
      const selectedWrapper = document.querySelector('.variant-wrapper.selected');
      if (selectedWrapper) {
        variantImage = selectedWrapper.querySelector('img')?.src || '';
        variantName = selectedWrapper.querySelector('.variant-name')?.textContent || '';
      }
    }

    console.log('Submitting Order with Variant Image:', variantImage);

    const formData = {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      state: document.getElementById('state').value,
      municipality: document.getElementById('municipality').value.trim(),
      address: document.getElementById('address').value.trim(),
      productId: elements.productIdInput.value,
      variantId: selectedVariantId,
      variantImage: variantImage,
      variantName: variantName
    };
    
    const result = await postAPI('/orders', formData);
    
    if (result.success || result.id) {
      // Show out of stock message from settings if available (per user request to keep just the "first" message)
      let successMsg = currentLang === 'ar' ? storeSettings?.outOfStockMessage : storeSettings?.outOfStockMessageFr;
      if (!successMsg) {
        successMsg = translations[currentLang].successMessage;
      }
      
      elements.successText.textContent = successMsg;
      elements.successMessage.classList.add('show');
      
      // Reset form
      elements.orderForm.reset();
      selectedVariantId = null;
      document.querySelectorAll('.variant-item').forEach(el => {
        el.classList.remove('selected');
      });
    } else {
      throw new Error(result.error || 'Order failed');
    }
    
  } catch (error) {
    console.error('Order submission error:', error);
    alert(translations[currentLang].error);
  } finally {
    elements.submitBtn.disabled = false;
    elements.submitBtn.innerHTML = originalContent;
  }
}

// ============ Success Message ============
function closeSuccessMessage() {
  elements.successMessage.classList.remove('show');
}
