import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Search,
  ShoppingCart,
  Menu,
  Heart,
  Plus,
  Grid,
  List,
  Leaf,
  Droplet,
  Egg,
  Fish,
  Home,
  Zap,
  Layers,
  User,
  Pencil,
  Trash2,
  Save,
  X,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import './Shop.css';
import shopLogo from '../assets/cattle-logo.png';
import {
  clearShopSession,
  getShopEmail,
  getShopRole,
  getShopToken,
  getShopUsername,
} from '../utils/sessionStorage';
import { buildApiUrl } from '../api/http';

const API_BASE_URL = buildApiUrl('');
const SHOP_PRODUCTS_API = '/api/shop-products';
const PRODUCT_CATEGORIES = ['Dairy', 'Poultry', 'Fish'];

const EMPTY_PRODUCT_FORM = {
  name: '',
  category: 'Dairy',
  price: '',
  unit: '',
};

const FALLBACK_IMAGE =
  '';

const CATEGORY_ICON_MAP = {
  Dairy: Droplet,
  Poultry: Egg,
  Fish,
};

const renderCategoryIcon = (categoryName) => {
  const IconComponent = categoryName === 'All' ? Leaf : CATEGORY_ICON_MAP[categoryName] || Leaf;
  return <IconComponent size={20} />;
};

const normalizeCategoryForForm = (categoryValue) => {
  if (PRODUCT_CATEGORIES.includes(categoryValue)) {
    return categoryValue;
  }

  const normalized = typeof categoryValue === 'string' ? categoryValue.trim().toLowerCase() : '';
  if (normalized === 'diary' || normalized === 'dairy') return 'Dairy';
  if (normalized === 'polutry' || normalized === 'poultry') return 'Poultry';
  if (normalized === 'fish') return 'Fish';
  return 'Dairy';
};

const resolveProductImage = (imageUrl) => {
  if (!imageUrl) return FALLBACK_IMAGE;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  return `${API_BASE_URL}${imageUrl}`;
};

const Shop = ({ onShopLogout }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);
  const [editingProductId, setEditingProductId] = useState(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedImageName, setSelectedImageName] = useState('');
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const navigate = useNavigate();
  const token = getShopToken();
  const username = getShopUsername();
  const email = getShopEmail();
  const shopRole = getShopRole();
  const isShopkeeper = shopRole === 'shopkeeper';

  const categories = useMemo(() => {
    return [
      { name: 'All', icon: renderCategoryIcon('All') },
      ...PRODUCT_CATEGORIES.map((name) => ({
        name,
        icon: renderCategoryIcon(name),
      })),
    ];
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const normalizedCategory = normalizeCategoryForForm(product.category);
      const matchesCategory = activeCategory === 'All' || normalizedCategory === activeCategory;

      if (!normalizedSearch) {
        return matchesCategory;
      }

      const searchable = `${product.name} ${normalizedCategory} ${product.unit}`.toLowerCase();
      return matchesCategory && searchable.includes(normalizedSearch);
    });
  }, [activeCategory, products, searchQuery]);

  const loadProducts = useCallback(async () => {
    setIsLoadingProducts(true);

    try {
      const response = await axios.get(SHOP_PRODUCTS_API);
      const normalizedProducts = Array.isArray(response.data)
        ? response.data.map((product) => ({
          ...product,
          category: normalizeCategoryForForm(product.category),
        }))
        : [];

      setProducts(normalizedProducts);
      setFeedback((prev) => (prev.type === 'error' ? { type: '', message: '' } : prev));
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Could not load shop products right now.',
      });
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleLogout = () => {
    clearShopSession();
    if (onShopLogout) onShopLogout();
    navigate('/shop/login');
  };

  const sideMenuItems = ['Sales', 'Inventory', 'Product Settings'];

  const toggleSideMenu = () => {
    setIsSideMenuOpen((prev) => !prev);
  };

  const closeSideMenu = () => {
    setIsSideMenuOpen(false);
  };

  const resetProductForm = () => {
    setProductForm(EMPTY_PRODUCT_FORM);
    setEditingProductId(null);
    setSelectedImageFile(null);
    setSelectedImageName('');
  };

  const openAddProductModal = () => {
    resetProductForm();
    setIsProductFormOpen(true);
    setFeedback({ type: '', message: '' });
  };

  const closeProductFormModal = () => {
    if (isSavingProduct) return;
    setIsProductFormOpen(false);
  };

  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
    setFeedback({ type: '', message: '' });
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setSelectedImageFile(file);
    setSelectedImageName(file ? file.name : '');
  };

  const startEditingProduct = (product) => {
    setEditingProductId(product._id);
    setProductForm({
      name: product.name || '',
      category: normalizeCategoryForForm(product.category),
      price: typeof product.price === 'number' ? String(product.price) : '',
      unit: product.unit || '',
    });
    setSelectedImageFile(null);
    setSelectedImageName('');
    setIsProductFormOpen(true);
    setFeedback({ type: '', message: '' });
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();

    if (!isShopkeeper || !token) {
      setFeedback({
        type: 'error',
        message: 'Only signed-in shopkeepers can manage products.',
      });
      return;
    }

    const normalizedCategory = normalizeCategoryForForm(productForm.category);

    const payload = {
      name: productForm.name.trim(),
      category: normalizedCategory,
      unit: productForm.unit.trim(),
      price: Number(productForm.price),
    };

    if (!payload.name || !payload.category || !payload.unit || Number.isNaN(payload.price) || payload.price < 0) {
      setFeedback({
        type: 'error',
        message: 'Please enter valid name, category, unit, and price.',
      });
      return;
    }

    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('category', payload.category);
    formData.append('unit', payload.unit);
    formData.append('price', String(payload.price));

    if (selectedImageFile) {
      formData.append('image', selectedImageFile);
    }

    setIsSavingProduct(true);

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (editingProductId) {
        await axios.put(`${SHOP_PRODUCTS_API}/${editingProductId}`, formData, config);
        setFeedback({ type: 'success', message: 'Product updated successfully.' });
      } else {
        await axios.post(SHOP_PRODUCTS_API, formData, config);
        setFeedback({ type: 'success', message: 'Product added successfully.' });
      }

      await loadProducts();
      resetProductForm();
      setIsProductFormOpen(false);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Unable to save this product.',
      });
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!isShopkeeper || !token) {
      setFeedback({ type: 'error', message: 'Only signed-in shopkeepers can delete products.' });
      return;
    }

    if (!window.confirm('Delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${SHOP_PRODUCTS_API}/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (editingProductId === productId) {
        resetProductForm();
      }

      await loadProducts();
      setFeedback({ type: 'success', message: 'Product deleted successfully.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Unable to delete this product.',
      });
    }
  };

  return (
    <div className="shop-page">
      <div
        className={`side-menu-overlay ${isSideMenuOpen ? 'open' : ''}`}
        onClick={closeSideMenu}
      >
        <aside className={`side-menu-drawer ${isSideMenuOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="side-menu-header">
            <div className="side-menu-brand">
              <img src={shopLogo} alt="GreenGeoFarm Logo" className="side-menu-brand-logo" />
              <span className="side-menu-brand-name">GreenGeoFarm</span>
            </div>
            <button type="button" className="side-menu-close-btn" onClick={closeSideMenu}>
              <X size={18} />
            </button>
          </div>
          <nav className="side-menu-list">
            {sideMenuItems.map((item) => (
              <button key={item} type="button" className="side-menu-item" onClick={closeSideMenu}>
                {item}
              </button>
            ))}
          </nav>
        </aside>
      </div>

      <header className="shop-header">
        <div className="header-content">
          <div className="left-group">
            <button type="button" className="menu-trigger-btn" onClick={toggleSideMenu} aria-label="Open menu">
              <Menu className="menu-icon" />
            </button>
            <h1 className="shop-brand">GreenGeoFarm</h1>
          </div>
          <div className="header-actions-right">
            {token ? (
              <div className="profile-container">
                <div className="user-greeting" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                  <User size={18} />
                  <span>Hi, {username}</span>
                </div>
                {showProfileMenu && (
                  <div className="profile-dropdown">
                    <div className="dropdown-info">
                      <p className="dropdown-user">{username}</p>
                      <p className="dropdown-role">{isShopkeeper ? 'Shopkeeper' : 'Customer'}</p>
                      <p className="dropdown-email">{email || 'Email not available'}</p>
                    </div>
                    <button
                      type="button"
                      className="profile-action-btn"
                      onClick={() => navigate('/support')}
                    >
                      <Lock size={16} />
                      <span>Change password</span>
                    </button>
                    <hr />
                    <button className="logout-btn" onClick={handleLogout}>Log Out</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/shop/login" className="btn-signin-shop">Sign In</Link>
                <Link to="/shop/signup" className="btn-signup-shop">Sign Up</Link>
              </div>
            )}
            <div className="cart-container">
              <ShoppingCart size={24} />
              <span className="cart-count">3</span>
            </div>
          </div>
        </div>
      </header>

      <main className="shop-main">
        <div className="main-container">
          <section className="welcome-section">
            <span className="welcome-subtitle">DIGITAL GREENHOUSE</span>
            <h2 className="welcome-title">Fresh Daily Harvest</h2>

            <div className="shop-search-bar">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search farm fresh products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </section>

          {feedback.message && (
            <div className={`shop-feedback ${feedback.type}`}>{feedback.message}</div>
          )}

          <section className="categories-section">
            <div className="section-header">
              <h3>Categories</h3>
              <button className="view-all" onClick={() => setActiveCategory('All')}>View All</button>
            </div>
            <div className="categories-list">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  className={`category-item ${activeCategory === cat.name ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.name)}
                >
                  <div className="category-icon">{cat.icon}</div>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="shop-banner">
            <div className="banner-content">
              <span className="banner-tag">LIMITED OFFER</span>
              <h3>Harvest Fresh Morning Box</h3>
              <p>Delivered within 4 hours</p>
              <button className="banner-btn">Get 20% Off</button>
            </div>
            <div className="banner-image"></div>
          </section>

          <section className="picks-section">
            <div className="section-header">
              <h3>Today's Picks</h3>
              <div className="view-toggles">
                <button
                  className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid size={18} />
                </button>
                <button
                  className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <List size={18} />
                </button>
              </div>
            </div>

            {isLoadingProducts ? (
              <p className="no-products-message">Loading products...</p>
            ) : filteredProducts.length === 0 && !isShopkeeper ? (
              <p className="no-products-message">No products found for this filter yet.</p>
            ) : (
              <div className={`products-${viewMode}`}>
                {isShopkeeper && (
                  <button type="button" className="product-card rectangular-tile add-product-tile" onClick={openAddProductModal}>
                    <div className="add-product-icon">
                      <Plus size={32} />
                    </div>
                    <h4>Add Product</h4>
                    <p>Click to open product form</p>
                  </button>
                )}

                {filteredProducts.map((product) => (
                  <div key={product._id} className="product-card rectangular-tile">
                    <div className="product-image-container">
                      <img src={resolveProductImage(product.imageUrl)} alt={product.name} />
                      <button className="wishlist-btn" type="button">
                        <Heart size={18} />
                      </button>
                    </div>
                    <div className="product-info">
                      <span className="product-cat">{normalizeCategoryForForm(product.category)}</span>
                      <h4 className="product-name">{product.name}</h4>
                      <p className="product-unit">{product.unit}</p>
                      <div className="product-footer">
                        <span className="product-price">${Number(product.price).toFixed(2)}</span>
                        <button className="add-to-cart-btn" type="button">
                          <Plus size={20} />
                        </button>
                      </div>
                      {isShopkeeper && (
                        <div className="product-admin-actions">
                          <button
                            type="button"
                            className="product-admin-btn edit"
                            onClick={() => startEditingProduct(product)}
                          >
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            type="button"
                            className="product-admin-btn delete"
                            onClick={() => handleDeleteProduct(product._id)}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="farm-status">
            <div className="status-header">
              <h3>Farm Status</h3>
              <div className="live-badge">
                <span className="pulse"></span>
                LIVE
              </div>
            </div>
            <p className="status-desc">Live monitoring active</p>
          </section>
        </div>
      </main>

      {isShopkeeper && isProductFormOpen && (
        <div className="product-form-overlay" onClick={closeProductFormModal}>
          <div className="product-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="product-form-header">
              <h3>{editingProductId ? 'Edit Product' : 'Add Product'}</h3>
              <button type="button" className="product-form-close" onClick={closeProductFormModal}>
                <X size={18} />
              </button>
            </div>

            <form className="product-form" onSubmit={handleProductSubmit}>
              <div className="product-form-grid">
                <div className="product-form-field">
                  <label>Product Name</label>
                  <input
                    name="name"
                    placeholder="Product name"
                    value={productForm.name}
                    onChange={handleProductFormChange}
                    required
                  />
                </div>

                <div className="product-form-field">
                  <label>Category</label>
                  <select name="category" value={productForm.category} onChange={handleProductFormChange} required>
                    {PRODUCT_CATEGORIES.map((categoryOption) => (
                      <option key={categoryOption} value={categoryOption}>
                        {categoryOption}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="product-form-field">
                  <label>Price</label>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                    value={productForm.price}
                    onChange={handleProductFormChange}
                    required
                  />
                </div>

                <div className="product-form-field">
                  <label>Unit Details</label>
                  <input
                    name="unit"
                    placeholder="Example: 1 Litre - Farm Fresh"
                    value={productForm.unit}
                    onChange={handleProductFormChange}
                    required
                  />
                </div>
              </div>

              <div className="product-form-file">
                <label>Product Image</label>
                <input type="file" accept="image/*" onChange={handleImageFileChange} />
                {selectedImageName ? (
                  <p className="selected-image-name">Selected: {selectedImageName}</p>
                ) : editingProductId ? (
                  <p className="existing-image-note">No new file selected. Existing image will be kept.</p>
                ) : null}
              </div>

              <div className="product-form-actions">
                <button type="button" className="product-form-cancel" onClick={closeProductFormModal}>
                  Cancel
                </button>
                <button type="submit" className="product-form-submit" disabled={isSavingProduct}>
                  {isSavingProduct ? (
                    <>
                      <Save size={16} /> Saving...
                    </>
                  ) : editingProductId ? (
                    <>
                      <Save size={16} /> Update Product
                    </>
                  ) : (
                    <>
                      <Plus size={16} /> Add Product
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <nav className="bottom-nav">
        <button className="nav-item active">
          <Home size={24} />
          <span>STORE</span>
        </button>
        <button className="nav-item">
          <Zap size={24} />
          <span>AUTOMATION</span>
        </button>
        <button className="nav-item">
          <Layers size={24} />
          <span>SOLUTIONS</span>
        </button>
        <button className="nav-item">
          <User size={24} />
          <span>ACCOUNT</span>
        </button>
      </nav>
    </div>
  );
};

export default Shop;
