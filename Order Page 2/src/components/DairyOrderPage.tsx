import { useState } from 'react';
import { ProductCatalog } from './ProductCatalog';
import { ShoppingCart } from './ShoppingCart';
import { Search, ShoppingCart as CartIcon, Milk, LogOut, User } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  image: string;
  category: string;
}

export interface CartItem extends Product {
  quantity: number;
}

interface DairyOrderPageProps {
  user: {
    name: string;
    email: string;
  };
  onLogout: () => void;
}

const products: Product[] = [
  {
    id: '1',
    name: 'Fresh Whole Milk',
    price: 60,
    unit: '1 Liter',
    image: 'https://images.unsplash.com/photo-1569696074196-402ff5882e23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    category: 'Milk'
  },
  {
    id: '2',
    name: 'Toned Milk',
    price: 50,
    unit: '1 Liter',
    image: 'https://images.unsplash.com/photo-1569696074196-402ff5882e23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    category: 'Milk'
  },
  {
    id: '3',
    name: 'Fresh Curd',
    price: 45,
    unit: '500g',
    image: 'https://images.unsplash.com/photo-1633383718081-22ac93e3db65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    category: 'Dairy'
  },
  {
    id: '4',
    name: 'Fresh Paneer',
    price: 120,
    unit: '250g',
    image: 'https://images.unsplash.com/photo-1701579231378-3726490a407b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    category: 'Dairy'
  },
  {
    id: '5',
    name: 'Fresh Butter',
    price: 85,
    unit: '200g',
    image: 'https://images.unsplash.com/photo-1660798670183-333ac43c3c4a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    category: 'Dairy'
  },
  {
    id: '6',
    name: 'Buttermilk',
    price: 30,
    unit: '500ml',
    image: 'https://images.unsplash.com/photo-1569696074196-402ff5882e23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    category: 'Beverages'
  },
  {
    id: '7',
    name: 'Pure Ghee',
    price: 550,
    unit: '500g',
    image: 'https://images.unsplash.com/photo-1573812461383-e5f8b759d12e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    category: 'Dairy'
  },
  {
    id: '8',
    name: 'Vanilla Ice Cream',
    price: 180,
    unit: '500ml',
    image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    category: 'Ice Cream'
  },
  {
    id: '9',
    name: 'Chocolate Ice Cream',
    price: 180,
    unit: '500ml',
    image: 'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    category: 'Ice Cream'
  },
  {
    id: '10',
    name: 'Strawberry Milk',
    price: 40,
    unit: '200ml',
    image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    category: 'Beverages'
  },
  {
    id: '11',
    name: 'Chocolate Milk',
    price: 40,
    unit: '200ml',
    image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    category: 'Beverages'
  },
  {
    id: '12',
    name: 'Gulab Jamun',
    price: 150,
    unit: '1kg',
    image: 'https://images.unsplash.com/photo-1666190092159-3171cf0fbb12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    category: 'Sweets'
  },
  {
    id: '13',
    name: 'Cheese Namkeen',
    price: 95,
    unit: '250g',
    image: 'https://images.unsplash.com/photo-1764315975176-a0281c4b4f08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    category: 'Snacks'
  }
];

export function DairyOrderPage({ user, onLogout }: DairyOrderPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== id));
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === id ? { ...item, quantity } : item
        )
      );
    }
  };

  const removeFromCart = (id: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Milk className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-green-600">Fresh Dairy Farm</h1>
                <p className="text-sm text-gray-600">Farm Fresh Products</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-3">
              {/* User Info */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-600" />
                <div className="text-sm">
                  <p className="text-gray-700">{user.name}</p>
                </div>
              </div>

              {/* Cart Button */}
              <button
                onClick={() => setShowCart(!showCart)}
                className="relative p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CartIcon className="w-6 h-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2>Our Products</h2>
              {searchQuery && (
                <p className="text-gray-600 mt-2">
                  {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found for "{searchQuery}"
                </p>
              )}
            </div>
            <ProductCatalog products={filteredProducts} onAddToCart={addToCart} />
          </div>

          {/* Shopping Cart */}
          <div className={`lg:col-span-1 ${showCart ? 'block' : 'hidden lg:block'}`}>
            <ShoppingCart
              cart={cart}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
            />
          </div>
        </div>
      </div>
    </div>
  );
}