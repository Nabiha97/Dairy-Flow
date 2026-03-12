import { ShoppingCart } from 'lucide-react';
import { Product } from './DairyOrderPage';

interface ProductCatalogProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export function ProductCatalog({ products, onAddToCart }: ProductCatalogProps) {
  const handleBuyNow = (product: Product) => {
    onAddToCart(product);
    // Scroll to cart
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <p className="text-gray-500">No products found matching your search.</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-6">
      {products.map(product => (
        <div
          key={product.id}
          className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="aspect-square overflow-hidden bg-gray-100">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="p-4">
            <div className="mb-3">
              <h3 className="mb-1">{product.name}</h3>
              <p className="text-sm text-gray-600">{product.unit}</p>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-green-600">₹{product.price}</span>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                {product.category}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onAddToCart(product)}
                className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-green-600 text-green-600 py-2 px-4 rounded-lg hover:bg-green-50 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
              <button
                onClick={() => handleBuyNow(product)}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
