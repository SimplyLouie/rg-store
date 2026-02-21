import { useState, useEffect } from 'react';
import { Product, ProductFormData } from '../types';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import { formatCurrency } from '../lib/utils';
import {
  Search,
  Scan,
  Plus,
  Pencil,
  Trash2,
  ArrowUpDown,
  PackageOpen,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { useProducts, useCategories, useProductMutations } from '../hooks/useProducts';
import { productsApi } from '../api/products';

const CATEGORIES = [
  'Beverages', 'Snacks', 'Noodles', 'Cleaning', 'Personal Care',
  'Dairy', 'Tobacco', 'Canned Goods', 'Condiments', 'Frozen Foods', 'Other',
];

const emptyForm: ProductFormData = {
  name: '', sku: '', barcode: '', category: '', price: 0, cost: 0, stock: 0, lowStockThreshold: 10,
};

export default function InventoryPage() {
  const { data: products = [], isLoading: loading } = useProducts();
  const { data: categories = [] } = useCategories();
  const { createMutation, updateMutation, deleteMutation, adjustStockMutation } = useProductMutations();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showLowStock, setShowLowStock] = useState(false);
  const [sortField, setSortField] = useState<keyof Product>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [showScanner, setShowScanner] = useState(false);
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [showStockAdjust, setShowStockAdjust] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyForm);
  const [adjustData, setAdjustData] = useState({ quantity: 1, type: 'IN' as 'IN' | 'OUT', reason: '' });
  const [skuAvailable, setSkuAvailable] = useState<boolean | null>(null);
  const [checkingSku, setCheckingSku] = useState(false);

  useEffect(() => {
    if (!showAddEdit || !formData.sku || (selectedProduct && formData.sku === selectedProduct.sku)) {
      setSkuAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingSku(true);
      try {
        const { available } = await productsApi.checkSku(formData.sku, selectedProduct?.id);
        setSkuAvailable(available);
      } catch {
        setSkuAvailable(null);
      } finally {
        setCheckingSku(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.sku, showAddEdit, selectedProduct]);

  const filteredProducts = products
    .filter((p) => {
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (showLowStock && !p.isLowStock) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode?.includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      const cmp = String(av) < String(bv) ? -1 : String(av) > String(bv) ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const handleSort = (field: keyof Product) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: keyof Product }) =>
    sortField === field
      ? sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      : <ArrowUpDown className="h-3 w-3 opacity-30" />;

  const openAdd = () => {
    setSelectedProduct(null);
    setFormData(emptyForm);
    setShowAddEdit(true);
  };

  const openEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name, sku: product.sku, barcode: product.barcode || '',
      category: product.category, price: product.price, cost: product.cost,
      stock: product.stock, lowStockThreshold: product.lowStockThreshold,
    });
    setShowAddEdit(true);
  };

  const openStockAdjust = (product: Product) => {
    setSelectedProduct(product);
    setAdjustData({ quantity: 1, type: 'IN', reason: '' });
    setShowStockAdjust(true);
  };

  const openDelete = (product: Product) => {
    setSelectedProduct(product);
    setShowDelete(true);
  };

  const handleBarcodeScan = async (barcode: string) => {
    setShowScanner(false);
    try {
      const product = await productsApi.getByBarcode(barcode);
      openEdit(product);
    } catch {
      setFormData((f) => ({ ...f, barcode }));
      setShowAddEdit(true);
      toast({ title: 'Barcode set', description: 'Product not found — creating new one.' });
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.sku || !formData.category || formData.price <= 0) {
      toast({ variant: 'destructive', title: 'Please fill all required fields' });
      return;
    }

    if (skuAvailable === false) {
      toast({ variant: 'destructive', title: 'SKU already exists', description: 'Please use a unique SKU.' });
      return;
    }

    try {
      if (selectedProduct) {
        await updateMutation.mutateAsync({ id: selectedProduct.id, data: formData });
        toast({ title: 'Product updated', variant: 'default' });
      } else {
        await createMutation.mutateAsync(formData);
        toast({ title: 'Product created' });
      }
      setShowAddEdit(false);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to save product';
      const details = err.response?.data?.details;
      console.error('Save error:', err.response?.data || err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: details ? `${msg}: ${JSON.stringify(details)}` : msg
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || adjustStockMutation.isPending;

  const handleAdjustStock = async () => {
    if (!selectedProduct || adjustData.quantity <= 0) return;
    try {
      await adjustStockMutation.mutateAsync({ id: selectedProduct.id, data: adjustData });
      toast({ title: `Stock ${adjustData.type === 'IN' ? 'added' : 'removed'} successfully` });
      setShowStockAdjust(false);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to adjust stock';
      toast({ variant: 'destructive', title: 'Error', description: msg });
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    try {
      await deleteMutation.mutateAsync(selectedProduct.id);
      toast({ title: 'Product deleted' });
      setShowDelete(false);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to delete product';
      toast({ variant: 'destructive', title: 'Error', description: msg });
    }
  };

  const lowStockCount = products.filter((p) => p.isLowStock).length;

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 overflow-x-hidden w-full box-border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500">{products.length} products</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowScanner(true)} className="gap-1.5">
            <Scan className="h-4 w-4" /> Scan
          </Button>
          <Button size="sm" onClick={openAdd} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <div
          className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-yellow-100 transition-colors"
          onClick={() => setShowLowStock(!showLowStock)}
        >
          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">
              {lowStockCount} product{lowStockCount !== 1 ? 's' : ''} low on stock
            </p>
          </div>
          <Badge variant="warning">{showLowStock ? 'Show All' : 'View Only'}</Badge>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, SKU, or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3"><Skeleton className="h-4 w-24" /></th>
                    <th className="px-3 py-3 hidden sm:table-cell"><Skeleton className="h-4 w-16" /></th>
                    <th className="px-3 py-3 hidden md:table-cell"><Skeleton className="h-4 w-20" /></th>
                    <th className="px-3 py-3"><Skeleton className="h-4 w-16 ml-auto" /></th>
                    <th className="px-3 py-3"><Skeleton className="h-4 w-12 ml-auto" /></th>
                    <th className="px-3 py-3"><Skeleton className="h-4 w-20 ml-auto" /></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32 mb-1" /><Skeleton className="h-3 w-24" /></td>
                      <td className="px-3 py-3 hidden sm:table-cell"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-3 py-3 hidden md:table-cell"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-3 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                      <td className="px-3 py-3"><Skeleton className="h-4 w-12 ml-auto" /></td>
                      <td className="px-3 py-3"><Skeleton className="h-8 w-24 ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <PackageOpen className="h-12 w-12 mb-3 opacity-30" />
              <p>No products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      <button className="flex items-center gap-1 hover:text-gray-900" onClick={() => handleSort('name')}>
                        Product <SortIcon field="name" />
                      </button>
                    </th>
                    <th className="text-left px-3 py-3 font-medium text-gray-600 hidden sm:table-cell">SKU</th>
                    <th className="text-left px-3 py-3 font-medium text-gray-600 hidden md:table-cell">Category</th>
                    <th className="text-right px-3 py-3 font-medium text-gray-600">
                      <button className="flex items-center gap-1 ml-auto hover:text-gray-900" onClick={() => handleSort('price')}>
                        Price <SortIcon field="price" />
                      </button>
                    </th>
                    <th className="text-right px-3 py-3 font-medium text-gray-600">
                      <button className="flex items-center gap-1 ml-auto hover:text-gray-900" onClick={() => handleSort('stock')}>
                        Stock <SortIcon field="stock" />
                      </button>
                    </th>
                    <th className="text-right px-3 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          {product.barcode && (
                            <p className="text-xs text-gray-400">{product.barcode}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-500 hidden sm:table-cell">{product.sku}</td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                      </td>
                      <td className="px-3 py-3 text-right font-medium">{formatCurrency(product.price)}</td>
                      <td className="px-3 py-3 text-right">
                        <span
                          className={`font-semibold ${product.stock === 0
                            ? 'text-red-600'
                            : product.isLowStock
                              ? 'text-yellow-600'
                              : 'text-green-600'
                            }`}
                        >
                          {product.stock}
                        </span>
                        {product.isLowStock && product.stock > 0 && (
                          <AlertTriangle className="h-3 w-3 text-yellow-500 inline ml-1" />
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openStockAdjust(product)}
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-500 transition-colors"
                            title="Adjust Stock"
                          >
                            <ArrowUpDown className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEdit(product)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDelete(product)}
                            className="p-1.5 rounded hover:bg-red-50 text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={showAddEdit} onOpenChange={setShowAddEdit}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1">
              <Label>Product Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Coca Cola 1.5L"
              />
            </div>

            <div className="space-y-1">
              <Label className={skuAvailable === false ? 'text-red-500' : ''}>
                SKU * {skuAvailable === false && <span className="text-xs font-normal">(Taken)</span>}
              </Label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData((f) => ({ ...f, sku: e.target.value.toUpperCase() }))}
                placeholder="e.g. BEV-001"
                className={skuAvailable === false ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {checkingSku && <p className="text-[10px] text-gray-400 animate-pulse">Checking availability...</p>}
            </div>

            <div className="space-y-1">
              <Label>Barcode</Label>
              <div className="flex gap-1">
                <Input
                  value={formData.barcode}
                  onChange={(e) => setFormData((f) => ({ ...f, barcode: e.target.value }))}
                  placeholder="Scan or type"
                />
                <Button type="button" variant="outline" size="icon" onClick={() => setShowScanner(true)}>
                  <Scan className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="col-span-2 space-y-1">
              <Label>Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Selling Price (₱) *</Label>
              <Input
                type="number"
                value={formData.price || ''}
                onChange={(e) => setFormData((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-1">
              <Label>Cost Price (₱) *</Label>
              <Input
                type="number"
                value={formData.cost || ''}
                onChange={(e) => setFormData((f) => ({ ...f, cost: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            {!selectedProduct && (
              <div className="space-y-1">
                <Label>Initial Stock</Label>
                <Input
                  type="number"
                  value={formData.stock || ''}
                  onChange={(e) => setFormData((f) => ({ ...f, stock: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  min="0"
                />
              </div>
            )}

            <div className="space-y-1">
              <Label>Low Stock Threshold</Label>
              <Input
                type="number"
                value={formData.lowStockThreshold || ''}
                onChange={(e) => setFormData((f) => ({ ...f, lowStockThreshold: parseInt(e.target.value) || 10 }))}
                placeholder="10"
                min="1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEdit(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : selectedProduct ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={showStockAdjust} onOpenChange={setShowStockAdjust}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium">{selectedProduct?.name}</p>
              <p className="text-sm text-gray-500">Current stock: <span className="font-semibold">{selectedProduct?.stock}</span></p>
            </div>

            <div className="space-y-1">
              <Label>Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['IN', 'OUT'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setAdjustData((d) => ({ ...d, type: t }))}
                    className={`py-2 rounded-lg border-2 font-medium text-sm transition-colors ${adjustData.type === t
                      ? t === 'IN' ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-600'
                      }`}
                  >
                    {t === 'IN' ? '+ Add Stock' : '- Remove Stock'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={adjustData.quantity || ''}
                onChange={(e) => setAdjustData((d) => ({ ...d, quantity: parseInt(e.target.value) || 0 }))}
                min="1"
                placeholder="0"
              />
            </div>

            <div className="space-y-1">
              <Label>Reason (optional)</Label>
              <Input
                value={adjustData.reason}
                onChange={(e) => setAdjustData((d) => ({ ...d, reason: e.target.value }))}
                placeholder="e.g. Restock delivery"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStockAdjust(false)}>Cancel</Button>
            <Button
              onClick={handleAdjustStock}
              disabled={isSaving || adjustData.quantity <= 0}
              className={adjustData.type === 'OUT' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {isSaving ? 'Saving...' : 'Apply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{selectedProduct?.name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
              {isSaving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
