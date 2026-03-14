import { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { CartItem } from './DairyOrderPage';
import { CheckoutModal } from './CheckoutModal';

interface ShoppingCartProps {
  cart: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
}

export function ShoppingCart({ cart, onUpdateQuantity, onRemoveItem }: ShoppingCartProps) {
  const [showCheckout, setShowCheckout] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = cart.length > 0 ? 40 : 0;
  const total = subtotal + delivery;

  const handleCheckout = () => {
    if (cart.length > 0) {
      setShowCheckout(true);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
        <h2 className="flex items-center gap-2 mb-4">
          <ShoppingBag className="w-6 h-6 text-green-600" />
          Shopping Cart
        </h2>

        {cart.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Your cart is empty</p>
            <p className="text-sm text-gray-400 mt-1">Add products to get started</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex gap-3 pb-4 border-b last:border-b-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="text-sm mb-1">{item.name}</h4>
                    <p className="text-sm text-gray-600">₹{item.price} / {item.unit}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="ml-auto p-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-600">₹{item.price * item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-4 pb-4 border-b">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery</span>
                <span>₹{delivery}</span>
              </div>
            </div>

            <div className="flex justify-between mb-6">
              <span>Total</span>
              <span className="text-green-600">₹{total}</span>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
            >
              Proceed to Checkout
            </button>
          </>
        )}
      </div>

      {showCheckout && (
        <CheckoutModal
          cart={cart}
          total={total}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </>
  );
}
