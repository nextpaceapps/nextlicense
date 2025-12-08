import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Product } from '../types';
import { Plus, Trash2, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Products: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProducts = async () => {
      try {
        const data = await api.products.getAll();
        setProducts(data);
      } catch (error) {
        console.error('Failed to load products', error);
      }
  };
  
  useEffect(() => {
    if (!authLoading && user) {
      loadProducts();
    }
  }, [authLoading, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const productData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        ...(formData.description.trim() && { description: formData.description.trim() })
      };
      
      await api.products.add(productData);
      setIsModalOpen(false);
      setFormData({ name: '', code: '', description: '' });
      await loadProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save product. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(confirm('Are you sure? This will not delete associated licenses but may break relations.')) {
      setDeletingId(id);
      setError(null);
      try {
        await api.products.delete(id);
        await loadProducts();
      } catch (err) {
        console.error('Error deleting product:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete product. Please try again.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button 
          onClick={() => {
            setError(null);
            setIsModalOpen(true);
          }}
          className="bg-primary hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <button 
                  onClick={() => handleDelete(product.id)} 
                  disabled={deletingId === product.id}
                  className="text-gray-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete product"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
              <p className="text-xs font-mono text-gray-500 mb-2 bg-gray-100 inline-block px-2 py-1 rounded">Code: {product.code}</p>
              {product.description && (
                <p className="text-sm text-gray-600 mt-2">{product.description}</p>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
                <span className="text-gray-500">ID: {product.id.substring(0,8)}...</span>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            No products defined yet.
          </div>
        )}
      </div>
      {error && !isModalOpen && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">New Product</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input required className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Code</label>
                <input required className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
                  value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="e.g. TRADER-PRO" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 text-xs">(optional)</span></label>
                <textarea className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => {
                  setError(null);
                  setIsModalOpen(false);
                }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700">
                    {loading ? 'Saving...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
