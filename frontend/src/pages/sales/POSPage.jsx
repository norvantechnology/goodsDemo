import { useState, useEffect, useRef } from 'react';
import { salesService, productService, customerService, inventoryService, settingsService } from '../../services';
import { EmptyState } from '../../components';
import { fmt, getError } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Package,
  ShoppingCart,
  ScanBarcode,
  Search,
  Check,
  Coins,
  CreditCard,
  Building2,
  FileText,
  CheckCircle2,
  Trash2,
  X,
  Store,
  ReceiptText,
  ArrowRight
} from 'lucide-react';

export default function POSPage() {
  const { user } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [showInvoice, setShowInvoice] = useState(null);
  const [locationInventory, setLocationInventory] = useState({});
  const [mobileTab, setMobileTab] = useState('products');
  const searchRef = useRef(null);

  useEffect(() => {
    settingsService.getLocations().then(r => {
      const shopLocs = r.data.data.filter(l => l.type === 'shop');
      setLocations(shopLocs);
      if (user?.role === 'shop_user' && user?.locationIds?.length > 0) {
        const userLocId = user.locationIds[0]?._id || user.locationIds[0];
        const userLoc = shopLocs.find(l => l._id === userLocId);
        if (userLoc) setSelectedLocation(userLoc._id);
      }
    });
    customerService.getAll({ limit: 100 }).then(r => setCustomers(r.data.data));
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      productService.getAll({ limit: 200, status: 'active' }).then(r => setProducts(r.data.data));
      inventoryService.getAll({ locationId: selectedLocation }).then(r => {
        const inv = {};
        r.data.data.forEach(i => { inv[i.productId?._id] = i.quantity; });
        setLocationInventory(inv);
      });
    }
  }, [selectedLocation]);

  const filteredProducts = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search))
  ).slice(0, 30);

  const handleBarcodeSearch = async () => {
    if (!barcodeInput) return;
    try {
      const res = await productService.getByBarcode(barcodeInput);
      addToCart(res.data.data);
      setBarcodeInput('');
    } catch {
      toast.error('Product not found by barcode');
    }
  };

  const addToCart = (product) => {
    if (!selectedLocation) return toast.error('Please select a shop location first');
    const stock = locationInventory[product._id] || 0;
    if (stock === 0) return toast.error(`${product.name} is out of stock at this location`);
    setCart(prev => {
      const existing = prev.find(i => i.productId === product._id);
      if (existing) {
        if (existing.quantity >= stock) return toast.error(`Only ${stock} in stock`) && prev;
        return prev.map(i => i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        productId: product._id, name: product.name, sku: product.sku,
        price: product.sellingPrice, quantity: 1, tax: product.taxRate || 0,
        maxStock: stock
      }];
    });
  };

  const updateQty = (productId, qty) => {
    if (qty < 1) { removeFromCart(productId); return; }
    setCart(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      if (qty > i.maxStock) { toast.error(`Only ${i.maxStock} in stock`); return i; }
      return { ...i, quantity: qty };
    }));
  };

  const removeFromCart = (productId) => setCart(prev => prev.filter(i => i.productId !== productId));

  const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
  const taxAmount = cart.reduce((s, i) => s + (i.price * i.quantity * (i.tax / 100)), 0);
  const grandTotal = subtotal + taxAmount - discount;

  const handleCompleteSale = async () => {
    if (!selectedLocation) return toast.error('Select a shop location');
    if (cart.length === 0) return toast.error('Add items to cart');
    if (grandTotal <= 0) return toast.error('Invalid total');

    setSubmitting(true);
    try {
      const items = cart.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
        discount: 0,
        taxAmount: i.price * i.quantity * (i.tax / 100),
        total: i.price * i.quantity * (1 + i.tax / 100)
      }));

      const res = await salesService.create({
        locationId: selectedLocation,
        customerId: selectedCustomer || undefined,
        items, subtotal, discount, taxAmount, grandTotal,
        paymentMethod, paidAmount: grandTotal
      });

      toast.success('Sale completed successfully');
      setShowInvoice(res.data.data);
      setCart([]);
      setDiscount(0);
      setSelectedCustomer('');
      inventoryService.getAll({ locationId: selectedLocation }).then(r => {
        const inv = {};
        r.data.data.forEach(i => { inv[i.productId?._id] = i.quantity; });
        setLocationInventory(inv);
      });
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Location Selector */}
      {!selectedLocation && (
        <div style={{ marginBottom: 14 }}>
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 12 }}>
              <Store size={18} /> Select Shop Location
            </h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {locations.map(l => (
                <button
                  key={l._id}
                  className={`btn btn-lg ${selectedLocation === l._id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedLocation(l._id)}
                >
                  <Store size={15} /> {l.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedLocation && (
        <>
          {/* Location indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="badge badge-info" style={{ fontSize: '0.82rem', padding: '5px 12px' }}>
              <Store size={13} style={{ marginRight: 4 }} /> {locations.find(l => l._id === selectedLocation)?.name}
            </span>
            {user?.role === 'admin' && (
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedLocation('')}>Change Location</button>
            )}
          </div>

          {/* Mobile Tab Toggle */}
          <div className="pos-mobile-toggle">
            <button className={`pos-toggle-btn ${mobileTab === 'products' ? 'active' : ''}`} onClick={() => setMobileTab('products')}>
              <Package size={15} /> Products ({filteredProducts.length})
            </button>
            <button className={`pos-toggle-btn ${mobileTab === 'cart' ? 'active' : ''}`} onClick={() => setMobileTab('cart')}>
              <ShoppingCart size={15} /> Cart ({cart.reduce((s, i) => s + i.quantity, 0)}) · {fmt(grandTotal)}
            </button>
          </div>

          <div className={`pos-layout show-${mobileTab}`}>
            {/* Product Search Panel */}
            <div className="pos-products">
              <div className="card" style={{ marginBottom: 12 }}>
                {/* Barcode Input */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      className="form-control"
                      placeholder="Scan barcode..."
                      value={barcodeInput}
                      onChange={e => setBarcodeInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleBarcodeSearch()}
                    />
                  </div>
                  <button className="btn btn-secondary" onClick={handleBarcodeSearch}>
                    <ScanBarcode size={15} /> Scan
                  </button>
                </div>
                <div className="search-box" style={{ maxWidth: '100%' }}>
                  <span className="search-icon"><Search size={14} /></span>
                  <input
                    ref={searchRef}
                    className="form-control"
                    placeholder="Search by name or SKU..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Product Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                {filteredProducts.map(p => {
                  const stock = locationInventory[p._id] || 0;
                  const inCart = cart.find(i => i.productId === p._id);
                  return (
                    <div
                      key={p._id}
                      onClick={() => stock > 0 && addToCart(p)}
                      style={{
                        background: 'var(--bg-card)',
                        border: `1px solid ${inCart ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius)',
                        padding: 12,
                        cursor: stock > 0 ? 'pointer' : 'not-allowed',
                        opacity: stock === 0 ? 0.45 : 1,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 4, lineHeight: 1.2, color: 'var(--text)' }}>{p.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6 }}>{p.sku}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: '0.9rem' }}>{fmt(p.sellingPrice)}</span>
                        <span className={`badge ${stock === 0 ? 'badge-danger' : stock <= (p.minimumStock || 5) ? 'badge-warning' : 'badge-gray'}`} style={{ fontSize: '0.65rem' }}>
                          {stock}
                        </span>
                      </div>
                      {inCart && (
                        <div style={{ marginTop: 6, textAlign: 'center', fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <Check size={12} /> In cart ({inCart.quantity})
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <EmptyState icon={<Search size={22} />} title="No products found" description="Try a different search" />
                  </div>
                )}
              </div>
            </div>

            {/* Cart Panel */}
            <div className="pos-cart">
              <div className="pos-cart-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.88rem' }}>
                  <ShoppingCart size={16} /> Cart
                </div>
                <select className="form-select" style={{ fontSize: '0.8rem', width: 'auto', minWidth: 150 }} value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}>
                  <option value="">Walk-in Customer</option>
                  {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div className="pos-cart-items">
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 36, color: 'var(--text-muted)' }}>
                    <ShoppingCart size={28} style={{ opacity: 0.35, marginBottom: 8 }} />
                    <p style={{ fontSize: '0.82rem' }}>Cart is empty</p>
                  </div>
                ) : cart.map(item => (
                  <div key={item.productId} className="cart-item">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{fmt(item.price)} each</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button className="qty-btn" onClick={() => updateQty(item.productId, item.quantity - 1)}>-</button>
                      <input className="qty-input" type="number" value={item.quantity} onChange={e => updateQty(item.productId, +e.target.value)} min="1" max={item.maxStock} />
                      <button className="qty-btn" onClick={() => updateQty(item.productId, item.quantity + 1)}>+</button>
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', marginLeft: 8, minWidth: 65, textAlign: 'right' }}>
                      {fmt(item.price * item.quantity)}
                    </div>
                    <button onClick={() => removeFromCart(item.productId)} style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: 4 }} aria-label="Remove item">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pos-cart-footer">
                {/* Payment Details */}
                <div style={{ marginBottom: 10 }}>
                  <div className="pos-summary-row">
                    <span>Subtotal</span>
                    <span>{fmt(subtotal)}</span>
                  </div>
                  {taxAmount > 0 && (
                    <div className="pos-summary-row">
                      <span>Tax</span>
                      <span>{fmt(taxAmount)}</span>
                    </div>
                  )}
                  <div className="pos-summary-row">
                    <span>Discount</span>
                    <input
                      type="number"
                      value={discount}
                      onChange={e => setDiscount(Math.max(0, +e.target.value))}
                      min="0"
                      max={subtotal}
                      style={{ width: 80, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', color: 'var(--text)', fontSize: '0.82rem', textAlign: 'right' }}
                    />
                  </div>
                  <div className="pos-summary-row total">
                    <span>Total</span>
                    <span>{fmt(grandTotal)}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 10 }}>
                  {[
                    { id: 'cash', label: 'Cash', icon: Coins },
                    { id: 'card', label: 'Card', icon: CreditCard },
                    { id: 'bank', label: 'Bank', icon: Building2 },
                    { id: 'credit', label: 'Credit', icon: FileText }
                  ].map(m => {
                    const MethodIcon = m.icon;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`btn btn-sm ${paymentMethod === m.id ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '6px 2px', fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: 2 }}
                      >
                        <MethodIcon size={13} />
                        {m.label}
                      </button>
                    );
                  })}
                </div>

                <button
                  className="btn btn-primary w-100 btn-lg"
                  onClick={handleCompleteSale}
                  disabled={cart.length === 0 || submitting}
                  style={{ fontWeight: 700 }}
                >
                  {submitting ? 'Processing...' : `Complete Sale ${cart.length > 0 ? '· ' + fmt(grandTotal) : ''}`}
                </button>
                {cart.length > 0 && (
                  <button className="btn btn-ghost w-100 btn-sm mt-2" onClick={() => { setCart([]); setDiscount(0); }}>
                    <Trash2 size={13} /> Clear Cart
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Floating Mobile Cart Bar when viewing products with items in cart */}
          {mobileTab === 'products' && cart.length > 0 && (
            <div className="pos-mobile-floating-cart" onClick={() => setMobileTab('cart')}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShoppingCart size={15} /> {cart.reduce((s, i) => s + i.quantity, 0)} items in cart
              </span>
              <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                Review & Pay · {fmt(grandTotal)} <ArrowRight size={14} />
              </span>
            </div>
          )}
        </>
      )}

      {/* Invoice Modal */}
      {showInvoice && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowInvoice(null)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.95rem' }}>
                <CheckCircle2 size={18} color="var(--success)" /> Sale Complete
              </h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowInvoice(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: 'var(--primary-light)', marginBottom: 12 }}>
                <ReceiptText size={26} color="var(--primary)" />
              </div>
              <h2 style={{ marginBottom: 4 }}>{showInvoice.invoiceNumber}</h2>
              <p className="text-muted fs-13" style={{ marginBottom: 16 }}>{showInvoice.locationId?.name}</p>
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12, marginBottom: 14, textAlign: 'left' }}>
                {showInvoice.items?.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.82rem' }}>
                    <span>{item.productId?.name} x{item.quantity}</span>
                    <span style={{ fontWeight: 500 }}>{fmt(item.total)}</span>
                  </div>
                ))}
                <hr style={{ borderColor: 'var(--border)', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--text)' }}>{fmt(showInvoice.grandTotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span>Payment</span>
                  <span style={{ textTransform: 'capitalize' }}>{showInvoice.paymentMethod}</span>
                </div>
              </div>
              <button className="btn btn-primary w-100" onClick={() => setShowInvoice(null)}>
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
