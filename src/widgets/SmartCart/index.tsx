import React, { useState, useEffect } from 'react';
import { WidgetProps, WidgetEvent, PricingRequest, PricingResponse } from '../types';
import './SmartCart.css';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
  sku?: string;
  metadata?: Record<string, any>;
}

export interface UpsellItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  description: string;
  reason: string; // AI-generated reason for upsell
  confidence: number; // 0-1 confidence score
}

export interface SmartCartConfig {
  id: string;
  currency?: string;
  locale?: string;
  theme?: 'light' | 'dark' | 'branded';
  enableUpsells?: boolean;
  enableQuantityAdjust?: boolean;
  enablePromoCode?: boolean;
  checkoutUrl?: string;
  shippingThreshold?: number; // Free shipping threshold
  taxRate?: number;
  aiUpsellEngine?: boolean;
}

export interface SmartCartData {
  items: CartItem[];
  upsells?: UpsellItem[];
  promoCode?: {
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
  };
  shipping?: {
    cost: number;
    method: string;
    estimatedDays: number;
  };
  tax?: number;
}

export interface SmartCartProps extends WidgetProps {
  config: SmartCartConfig;
  data: SmartCartData;
}

const SmartCart: React.FC<SmartCartProps> = ({
  config,
  data,
  onEvent,
  analytics
}) => {
  const [items, setItems] = useState<CartItem[]>(data.items);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(data.promoCode);
  const [showUpsells, setShowUpsells] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    currency = 'USD',
    locale = 'en-US',
    theme = 'light',
    enableUpsells = true,
    enableQuantityAdjust = true,
    enablePromoCode = true,
    shippingThreshold = 50,
    taxRate = 0.08,
    aiUpsellEngine = true
  } = config;

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const promoDiscount = appliedPromo 
    ? appliedPromo.type === 'percentage' 
      ? subtotal * (appliedPromo.discount / 100)
      : appliedPromo.discount
    : 0;
  const subtotalAfterPromo = subtotal - promoDiscount;
  const shipping = data.shipping?.cost || (subtotalAfterPromo >= shippingThreshold ? 0 : 9.99);
  const tax = subtotalAfterPromo * (taxRate || 0);
  const total = subtotalAfterPromo + shipping + tax;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(price);
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));

    analytics?.track('cart_quantity_updated', {
      widget_id: config.id,
      item_id: itemId,
      new_quantity: newQuantity
    });

    onEvent?.({
      type: 'cart_updated',
      widgetId: config.id,
      data: { itemId, quantity: newQuantity, action: 'quantity_update' }
    });
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    
    analytics?.track('cart_item_removed', {
      widget_id: config.id,
      item_id: itemId
    });

    onEvent?.({
      type: 'cart_updated',
      widgetId: config.id,
      data: { itemId, action: 'remove' }
    });
  };

  const addUpsellItem = (upsell: UpsellItem) => {
    const cartItem: CartItem = {
      id: upsell.id,
      name: upsell.name,
      price: upsell.price,
      quantity: 1,
      image: upsell.image
    };

    setItems(prev => {
      const existing = prev.find(item => item.id === upsell.id);
      if (existing) {
        return prev.map(item => 
          item.id === upsell.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, cartItem];
    });

    analytics?.track('upsell_added', {
      widget_id: config.id,
      upsell_id: upsell.id,
      upsell_price: upsell.price,
      confidence: upsell.confidence
    });

    onEvent?.({
      type: 'upsell_accepted',
      widgetId: config.id,
      data: { upsellId: upsell.id, price: upsell.price }
    });
  };

  const applyPromoCode = () => {
    if (!promoCode.trim()) return;

    setIsLoading(true);

    // Simulate promo code validation
    setTimeout(() => {
      // Mock validation - in real app, this would call an API
      if (promoCode.toLowerCase() === 'save10') {
        setAppliedPromo({
          code: promoCode,
          discount: 10,
          type: 'percentage'
        });
        setPromoCode('');
        
        analytics?.track('promo_code_applied', {
          widget_id: config.id,
          promo_code: promoCode,
          discount_amount: subtotal * 0.1
        });
      } else {
        analytics?.track('promo_code_failed', {
          widget_id: config.id,
          promo_code: promoCode
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleCheckout = () => {
    analytics?.track('checkout_initiated', {
      widget_id: config.id,
      item_count: items.length,
      total_amount: total,
      has_promo: !!appliedPromo
    });

    onEvent?.({
      type: 'checkout_initiated',
      widgetId: config.id,
      data: {
        items,
        total,
        subtotal,
        shipping,
        tax,
        promoCode: appliedPromo
      }
    });

    if (config.checkoutUrl) {
      window.location.href = config.checkoutUrl;
    }
  };

  // Load upsells when cart changes
  useEffect(() => {
    if (enableUpsells && aiUpsellEngine && items.length > 0) {
      setShowUpsells(true);
    }
  }, [items, enableUpsells, aiUpsellEngine]);

  // Track cart impression
  useEffect(() => {
    analytics?.track('smart_cart_impression', {
      widget_id: config.id,
      item_count: items.length,
      subtotal,
      theme
    });
  }, []);

  if (items.length === 0) {
    return (
      <div className={`smart-cart smart-cart--${theme} smart-cart--empty`}>
        <div className="smart-cart__empty">
          <div className="smart-cart__empty-icon">🛒</div>
          <h3 className="smart-cart__empty-title">Your cart is empty</h3>
          <p className="smart-cart__empty-message">Add some items to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`smart-cart smart-cart--${theme}`} data-widget-id={config.id}>
      <div className="smart-cart__header">
        <h3 className="smart-cart__title">Shopping Cart ({items.length})</h3>
      </div>

      <div className="smart-cart__items">
        {items.map((item) => (
          <div key={item.id} className="smart-cart__item">
            {item.image && (
              <div className="smart-cart__item-image">
                <img src={item.image} alt={item.name} />
              </div>
            )}
            
            <div className="smart-cart__item-details">
              <h4 className="smart-cart__item-name">{item.name}</h4>
              {item.variant && (
                <p className="smart-cart__item-variant">{item.variant}</p>
              )}
              <p className="smart-cart__item-price">{formatPrice(item.price)}</p>
            </div>

            <div className="smart-cart__item-controls">
              {enableQuantityAdjust && (
                <div className="smart-cart__quantity">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="smart-cart__quantity-btn"
                    disabled={item.quantity <= 1}
                  >
                    −
                  </button>
                  <span className="smart-cart__quantity-value">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="smart-cart__quantity-btn"
                  >
                    +
                  </button>
                </div>
              )}
              
              <button
                onClick={() => removeItem(item.id)}
                className="smart-cart__remove-btn"
                title="Remove item"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* AI Upsells */}
      {enableUpsells && showUpsells && data.upsells && data.upsells.length > 0 && (
        <div className="smart-cart__upsells">
          <h4 className="smart-cart__upsells-title">🤖 Recommended for you</h4>
          <div className="smart-cart__upsells-list">
            {data.upsells.slice(0, 2).map((upsell) => (
              <div key={upsell.id} className="smart-cart__upsell">
                {upsell.image && (
                  <img src={upsell.image} alt={upsell.name} className="smart-cart__upsell-image" />
                )}
                <div className="smart-cart__upsell-details">
                  <h5 className="smart-cart__upsell-name">{upsell.name}</h5>
                  <p className="smart-cart__upsell-reason">{upsell.reason}</p>
                  <div className="smart-cart__upsell-price">
                    {upsell.originalPrice && (
                      <span className="smart-cart__upsell-original-price">
                        {formatPrice(upsell.originalPrice)}
                      </span>
                    )}
                    <span className="smart-cart__upsell-current-price">
                      {formatPrice(upsell.price)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => addUpsellItem(upsell)}
                  className="smart-cart__upsell-btn"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Promo Code */}
      {enablePromoCode && (
        <div className="smart-cart__promo">
          {!appliedPromo ? (
            <div className="smart-cart__promo-input">
              <input
                type="text"
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="smart-cart__promo-field"
              />
              <button
                onClick={applyPromoCode}
                disabled={!promoCode.trim() || isLoading}
                className="smart-cart__promo-btn"
              >
                {isLoading ? 'Applying...' : 'Apply'}
              </button>
            </div>
          ) : (
            <div className="smart-cart__promo-applied">
              <span className="smart-cart__promo-code">
                ✓ {appliedPromo.code} applied
              </span>
              <button
                onClick={() => setAppliedPromo(undefined)}
                className="smart-cart__promo-remove"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      {/* Totals */}
      <div className="smart-cart__totals">
        <div className="smart-cart__total-row">
          <span>Subtotal:</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        
        {appliedPromo && (
          <div className="smart-cart__total-row smart-cart__total-row--discount">
            <span>Discount ({appliedPromo.code}):</span>
            <span>-{formatPrice(promoDiscount)}</span>
          </div>
        )}
        
        <div className="smart-cart__total-row">
          <span>Shipping:</span>
          <span>
            {shipping === 0 ? 'Free' : formatPrice(shipping)}
            {subtotalAfterPromo < shippingThreshold && (
              <small className="smart-cart__shipping-note">
                Add {formatPrice(shippingThreshold - subtotalAfterPromo)} for free shipping
              </small>
            )}
          </span>
        </div>
        
        <div className="smart-cart__total-row">
          <span>Tax:</span>
          <span>{formatPrice(tax)}</span>
        </div>
        
        <div className="smart-cart__total-row smart-cart__total-row--final">
          <span>Total:</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        className="smart-cart__checkout-btn"
        disabled={items.length === 0}
      >
        Proceed to Checkout
      </button>
    </div>
  );
};

export default SmartCart;
