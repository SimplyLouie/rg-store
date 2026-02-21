import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { WelcomeSection } from '../components/WelcomeSection';
import { productsApi } from '../api/products';
import { salesApi } from '../api/sales';
import { Product, CartItem } from '../types';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { formatCurrency, cn } from '../lib/utils';
import {
  Search,
  Scan,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  Banknote,
  CheckCircle,
  Printer,
  X,
  AlertCircle,
} from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { useProducts, useCategories, productKeys } from '../hooks/useProducts';

export default function POSPage() {
  const queryClient = useQueryClient();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: categories = [] } = useCategories();

  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [checkoutState, setCheckoutState] = useState<'cart' | 'payment' | 'success'>('cart');
  const [lastSale, setLastSale] = useState<{ id: string; total: number; change: number | null } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, selectedCategory]);

  const filterProducts = () => {
    let filtered = products.filter((p) => p.stock > 0);
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode?.includes(q)
      );
    }
    setFilteredProducts(filtered);
  };

  const handleBarcodeScanned = useCallback(
    async (barcode: string) => {
      setShowScanner(false);
      try {
        const product = await productsApi.getByBarcode(barcode);
        addToCart(product);
        toast({ title: `Added: ${product.name}`, variant: 'default' });
      } catch {
        toast({ variant: 'destructive', title: 'Product not found', description: `Barcode: ${barcode}` });
      }
    },
    [toast]
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      // If already in cart, remove it (unselect)
      if (existing) {
        return prev.filter((i) => i.product.id !== product.id);
      }

      // If not in cart, add it (qty 1)
      if (product.stock <= 0) {
        toast({ variant: 'destructive', title: 'Out of stock' });
        return prev;
      }

      return [
        ...prev,
        { product, quantity: 1, unitPrice: product.price, subtotal: product.price },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.product.id !== productId) return i;
          const newQty = i.quantity + delta;
          if (newQty <= 0) return null as unknown as CartItem;
          if (newQty > i.product.stock) {
            toast({ variant: 'destructive', title: 'Insufficient stock' });
            return i;
          }
          return { ...i, quantity: newQty, subtotal: newQty * i.unitPrice };
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCheckoutState('cart');
    setShowMobileCart(false);
    setAmountTendered('');
    setLastSale(null);
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.subtotal, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const change = paymentMethod === 'cash' && amountTendered ? parseFloat(amountTendered) - cartTotal : null;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'cash') {
      const tendered = parseFloat(amountTendered);
      if (!amountTendered || isNaN(tendered) || tendered < cartTotal) {
        toast({ variant: 'destructive', title: 'Insufficient amount tendered' });
        return;
      }
    }

    setIsProcessing(true);
    try {
      const sale = await salesApi.create({
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity, unitPrice: i.unitPrice })),
        paymentMethod,
        amountTendered: paymentMethod === 'cash' ? parseFloat(amountTendered) : undefined,
      });

      setLastSale({
        id: sale.id,
        total: sale.totalAmount,
        change: sale.change ?? null,
      });
      setCheckoutState('success');
      // Invalidate products query instead of manual reload
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process sale';
      toast({ variant: 'destructive', title: 'Checkout failed', description: msg });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Quick amount buttons
  const quickAmounts = [50, 100, 200, 500, 1000];

  return (
    <div className="h-[calc(100dvh-3.5rem)] flex flex-col md:flex-row overflow-hidden w-full relative bg-gray-50">
      {/* Left: Products */}
      <div className={cn(
        "flex-1 flex flex-col min-h-0 overflow-hidden",
        showMobileCart ? "hidden md:flex" : "flex"
      )}>
        {/* Search & filters */}
        <div className="px-3 pt-3 pb-2 bg-white border-b space-y-3">
          <WelcomeSection />

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchRef}
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-1.5 shrink-0"
            >
              <Scan className="h-4 w-4" />
              <span className="hidden sm:inline">Scan</span>
            </Button>
          </div>

          {/* Category filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {['All', ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="p-3 rounded-lg border-2 border-gray-100 bg-white space-y-2">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-16 mt-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <ShoppingCart className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {filteredProducts.map((product) => {
                const inCart = cart.find((i) => i.product.id === product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`relative text-left p-3 rounded-lg border-2 transition-all hover:shadow-md active:scale-95 ${inCart
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                      }`}
                  >
                    {inCart && (
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {inCart.quantity}
                      </span>
                    )}
                    <p className="text-xs text-gray-400 mb-0.5 truncate">{product.category}</p>
                    <p className="font-medium text-sm leading-tight line-clamp-2 mb-1">{product.name}</p>
                    <p className="text-blue-600 font-bold text-sm">{formatCurrency(product.price)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Stock: {product.stock}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Buttons (Mobile Only) */}
      <div className="md:hidden fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3 transition-all duration-300">
        {/* Floating Scan Icon */}
        {!showMobileCart && checkoutState === 'cart' && (
          <button
            onClick={() => setShowScanner(true)}
            className={cn(
              "bg-blue-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-95",
              cartCount > 0 ? "scale-90 opacity-80" : "scale-100 opacity-100"
            )}
          >
            <Scan className="h-7 w-7" />
          </button>
        )}

        {/* Floating Cart Button */}
        {!showMobileCart && checkoutState === 'cart' && cartCount > 0 && (
          <button
            onClick={() => setShowMobileCart(true)}
            className="bg-blue-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center animate-in slide-in-from-bottom-4 fade-in zoom-in duration-300 active:scale-95"
          >
            <div className="relative">
              <ShoppingCart className="h-7 w-7" />
              <Badge className="absolute -top-3 -right-3 h-6 w-6 rounded-full flex items-center justify-center p-0 bg-red-500 border-2 border-white font-black text-xs">
                {cartCount}
              </Badge>
            </div>
          </button>
        )}
      </div>

      {/* Right: Cart/Checkout Panel */}
      <div className={cn(
        "w-full md:w-80 lg:w-96 border-l bg-white flex flex-col overflow-hidden border-t md:border-t-0 md:border-l shadow-lg",
        showMobileCart ? "fixed inset-0 z-50 h-full w-full" : "hidden md:flex"
      )}>
        {checkoutState === 'success' ? (
          /* Success screen */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center" id="receipt-print">
            <div className="bg-green-100 rounded-full p-4 mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Payment Successful!</h2>
            <p className="text-gray-500 text-sm mb-4">Sale #{lastSale?.id.slice(-8).toUpperCase()}</p>

            <div className="w-full bg-gray-50 rounded-lg p-4 space-y-2 mb-4 text-sm">
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>Total</span>
                <span>{formatCurrency(lastSale?.total ?? 0)}</span>
              </div>
              {lastSale?.change !== null && lastSale?.change !== undefined && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Change</span>
                  <span>{formatCurrency(lastSale.change)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 w-full">
              <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1 gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button onClick={clearCart} className="flex-1">
                New Sale
              </Button>
            </div>
          </div>
        ) : checkoutState === 'payment' ? (
          /* Payment screen */
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="font-semibold">Payment</h2>
              <button onClick={() => setCheckoutState('cart')} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-gray-800 uppercase italic">Checkout</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCheckoutState('cart');
                      setShowMobileCart(false);
                    }}
                    className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add more items
                  </Button>
                </div>
                <p className="text-3xl font-bold text-blue-700">{formatCurrency(cartTotal)}</p>
                <p className="text-xs text-gray-400">{cartCount} item{cartCount !== 1 ? 's' : ''}</p>
              </div>

              {/* Payment method */}
              <div className="space-y-3">
                <p className="text-base font-bold text-gray-700">Payment Method</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['cash', 'card'] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => method === 'cash' && setPaymentMethod(method)}
                      disabled={method === 'card'}
                      className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 font-bold transition-all ${method === 'card'
                        ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                        : paymentMethod === method
                          ? 'border-blue-600 bg-blue-50 text-blue-700 active:scale-95'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300 active:scale-95'
                        }`}
                    >
                      {method === 'card' && (
                        <Badge variant="secondary" className="absolute -top-2 -right-2 px-1.5 py-0 text-[10px] bg-gray-200 text-gray-500 border-none font-bold uppercase">
                          Soon
                        </Badge>
                      )}
                      {method === 'cash' ? <Banknote className="h-8 w-8" /> : <CreditCard className="h-8 w-8" />}
                      <span className="text-sm uppercase tracking-wide">{method}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash amount input */}
              {paymentMethod === 'cash' && (
                <div className="space-y-3 pt-2">
                  <p className="text-base font-bold text-gray-700">Amount Tendered</p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-400">₱</span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amountTendered}
                      onChange={(e) => setAmountTendered(e.target.value)}
                      className="text-3xl font-black text-center h-20 pl-10 bg-gray-50 border-gray-300 focus:bg-white transition-colors"
                      min={cartTotal}
                      step="0.01"
                    />
                  </div>

                  {/* Quick amount buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {quickAmounts.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setAmountTendered(amt.toString())}
                        className="text-lg py-3 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl font-black shadow-sm transition-all active:scale-95"
                      >
                        {amt}
                      </button>
                    ))}
                  </div>

                  {change !== null && change >= 0 && (
                    <div className="bg-green-100 border-2 border-green-200 rounded-2xl p-4 text-center shadow-inner">
                      <p className="text-sm text-green-700 font-bold uppercase tracking-widest">Your Change</p>
                      <p className="text-4xl font-black text-green-800">{formatCurrency(change)}</p>
                    </div>
                  )}

                  {change !== null && change < 0 && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
                      <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
                      <p className="text-base text-red-700 font-bold">Still lacking {formatCurrency(Math.abs(change))}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 shrink-0 pb-[calc(var(--sab,0px)+1rem)]">
              <Button
                className="w-full h-16 text-xl font-black shadow-xl rounded-2xl transition-all hover:translate-y-[-2px] active:translate-y-[0px] active:shadow-inner"
                onClick={handleCheckout}
                disabled={isProcessing || (paymentMethod === 'cash' && (change === null || change < 0))}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                    Processing...
                  </span>
                ) : (
                  `Pay ${formatCurrency(cartTotal)} Now`
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Cart screen */
          <div className="flex flex-col h-full bg-white">
            {/* Cart Header - Fixed */}
            <div className="px-4 py-4 border-b space-y-3 shrink-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold">Your Cart</h2>
                  {cart.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearCart}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-10 px-2 ml-1"
                      title="Clear Cart"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMobileCart(false)}
                    className="md:hidden h-10 px-3 text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add more items
                  </Button>
                </div>
              </div>


            </div>

            {/* Cart Items - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 px-6 text-center">
                  <ShoppingCart className="h-16 w-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium">Your cart is empty</p>
                  <p className="text-sm mt-2">Pick an item from the left or use the floating Scan button to start.</p>
                </div>
              ) : (
                <div className="divide-y border-b">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex flex-col p-4 space-y-3 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-gray-900 leading-tight">{item.product.name}</p>
                          <p className="text-sm text-gray-500 font-medium">{formatCurrency(item.unitPrice)} / unit</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-gray-400 hover:text-red-500 p-2 -mr-2"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center bg-gray-100 rounded-xl p-1">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="h-11 w-11 rounded-lg bg-white shadow-sm flex items-center justify-center active:scale-90 transition-transform border border-gray-200"
                          >
                            <Minus className="h-6 w-6 text-gray-600" />
                          </button>
                          <span className="w-14 text-center text-lg font-black">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="h-11 w-11 rounded-lg bg-white shadow-sm flex items-center justify-center active:scale-90 transition-transform border border-gray-200"
                          >
                            <Plus className="h-6 w-6 text-blue-600" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-black text-blue-700">{formatCurrency(item.subtotal)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer - Sticky */}
            <div className="p-4 bg-gray-50 border-t shrink-0 pb-[calc(var(--sab,0px)+1rem)]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600 font-bold text-base">{cartCount} Item{cartCount !== 1 ? 's' : ''}</span>
                <div className="text-right">
                  <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Total Amount</p>
                  <p className="text-3xl font-black text-blue-700">{formatCurrency(cartTotal)}</p>
                </div>
              </div>

              <Button
                className="w-full h-16 text-xl font-black shadow-xl rounded-2xl transition-all hover:translate-y-[-2px] active:translate-y-[0px] active:shadow-inner"
                disabled={cart.length === 0}
                onClick={() => setCheckoutState('payment')}
              >
                <CreditCard className="h-6 w-6 mr-3" />
                Go to Checkout
              </Button>
            </div>
          </div>
        )}
      </div>

      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
