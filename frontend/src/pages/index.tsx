import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { SearchBar } from '@/components/SearchBar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { SweetsGrid } from '@/components/SweetGrid';
import { AdminPanel } from '@/components/AdminPanel';
import { AuthDialog } from '@/components/AuthDialog';
import { Footer } from '@/components/Footer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { categories } from '@/data/mockSweets';
import { mockSweets } from '@/data/mockSweets';
import { Sweet } from '@/types/sweet';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const Index = () => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; isAdmin: boolean } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authDialogMode, setAuthDialogMode] = useState<'login' | 'register'>('login');
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  // Sweets state
  const [sweets, setSweets] = useState<Sweet[]>(mockSweets);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20]);

  // Cart state
  const [cartCount, setCartCount] = useState(0);

  // Edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    id: '',
    name: '',
    category: '',
    price: '',
    quantity: '',
  });

  // Max price for slider
  const maxPrice = useMemo(() => Math.max(...sweets.map((s) => s.price)), [sweets]);

  // Filtered sweets
  const filteredSweets = useMemo(() => {
    return sweets.filter((sweet) => {
      const matchesSearch = sweet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sweet.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || sweet.category === selectedCategory;
      const matchesPrice = sweet.price >= priceRange[0] && sweet.price <= priceRange[1];
      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [sweets, searchQuery, selectedCategory, priceRange]);

  // Handlers
  const handleAuthSuccess = (payload: { user: { name: string; email: string; isAdmin: boolean }, token: string }) => {
    setUser(payload.user);
    setToken(payload.token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setCartCount(0);
    toast({
      title: 'Logged out',
      description: 'See you next time!',
    });
  };

  const { data: sweetsData, refetch } = useQuery({
    queryKey: ['sweets'],
    enabled: !!token,
    queryFn: async () => {
      const list = await api.getSweets(token as string);
      const mapped: Sweet[] = list.map((s) => ({
        id: s._id,
        name: s.name,
        category: s.category,
        price: s.price,
        quantity: s.quantity,
      }));
      return mapped;
    },
  });

  useEffect(() => {
    if (sweetsData) {
      setSweets(sweetsData);
    }
  }, [sweetsData]);

  const handlePurchase = (sweet: Sweet) => {
    if (!isAuthenticated) {
      setAuthDialogMode('login');
      setIsAuthDialogOpen(true);
      toast({
        title: 'Please sign in',
        description: 'You need to be logged in to make a purchase.',
      });
      return;
    }

    if (token) {
      api.purchase(token, sweet.id)
        .then(() => {
          setSweets((prev) =>
            prev.map((s) =>
              s.id === sweet.id ? { ...s, quantity: Math.max(0, s.quantity - 1) } : s
            )
          );
          setCartCount((prev) => prev + 1);
          toast({
            title: 'Added to cart!',
            description: `${sweet.name} has been added to your cart.`,
          });
        })
        .catch((err) => {
          toast({
            title: 'Purchase failed',
            description: err?.message || 'Unable to complete purchase',
          });
        });
    }

  };

  const handleAddSweet = (newSweet: Omit<Sweet, 'id'>) => {
    if (!token) return;
    api.createSweet(token, {
      name: newSweet.name,
      category: newSweet.category,
      price: newSweet.price,
      quantity: newSweet.quantity,
    })
      .then((res) => {
        const sweet: Sweet = {
          id: res.sweet._id,
          name: res.sweet.name,
          category: res.sweet.category,
          price: res.sweet.price,
          quantity: res.sweet.quantity,
        };
        setSweets((prev) => [...prev, sweet]);
        toast({ title: 'Sweet added', description: `${sweet.name} has been added.` });
      })
      .catch((err) => {
        toast({ title: 'Add sweet failed', description: err?.message || 'Error adding sweet' });
      });
  };

  const handleRestock = (sweetId: string, quantity: number) => {
    if (!token) return;
    api.restock(token, sweetId, quantity)
      .then(() => {
        setSweets((prev) =>
          prev.map((s) =>
            s.id === sweetId ? { ...s, quantity: s.quantity + quantity } : s
          )
        );
        toast({ title: 'Restocked', description: 'Inventory updated.' });
      })
      .catch((err) => {
        toast({ title: 'Restock failed', description: err?.message || 'Error restocking' });
      });
  };

  const handleDeleteSweet = (sweet: Sweet) => {
    if (!token) return;
    api.deleteSweet(token, sweet.id)
      .then(() => {
        setSweets((prev) => prev.filter((s) => s.id !== sweet.id));
        toast({
          title: 'Sweet deleted',
          description: `${sweet.name} has been removed from the inventory.`,
        });
      })
      .catch((err) => {
        toast({ title: 'Delete failed', description: err?.message || 'Error deleting sweet' });
      });
  };

  const handleEditSweet = (sweet: Sweet) => {
    setEditData({
      id: sweet.id,
      name: sweet.name,
      category: sweet.category,
      price: String(sweet.price),
      quantity: String(sweet.quantity),
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateSweet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editData.id) return;
    api
      .updateSweet(token, editData.id, {
        name: editData.name,
        category: editData.category,
        price: parseFloat(editData.price),
        quantity: parseInt(editData.quantity),
      })
      .then((res) => {
        setSweets((prev) =>
          prev.map((s) =>
            s.id === editData.id
              ? {
                  id: res.sweet._id,
                  name: res.sweet.name,
                  category: res.sweet.category,
                  price: res.sweet.price,
                  quantity: res.sweet.quantity,
                }
              : s
          )
        );
        toast({ title: 'Sweet updated', description: `${res.sweet.name} has been updated.` });
        setIsEditDialogOpen(false);
        setEditData({ id: '', name: '', category: '', price: '', quantity: '' });
      })
      .catch((err) => {
        toast({ title: 'Update failed', description: err?.message || 'Error updating sweet' });
      });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        isAuthenticated={isAuthenticated}
        userName={user?.name}
        isAdmin={user?.isAdmin}
        onLoginClick={() => {
          setAuthDialogMode('login');
          setIsAuthDialogOpen(true);
        }}
        onRegisterClick={() => {
          setAuthDialogMode('register');
          setIsAuthDialogOpen(true);
        }}
        onLogout={handleLogout}
        cartCount={cartCount}
      />

      <main>
        <HeroSection />

        <section id="sweets" className="container mx-auto px-4 py-12">
          {/* Admin Panel */}
          {user?.isAdmin && (
            <AdminPanel
              onAddSweet={handleAddSweet}
              onRestock={handleRestock}
              sweets={sweets}
            />
          )}

          {/* Search and Filter */}
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
            maxPrice={maxPrice}
          />

          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />

          {/* Results count */}
          <div className="mb-6 text-sm text-muted-foreground">
            Showing {filteredSweets.length} of {sweets.length} sweets
          </div>

          {/* Sweets Grid */}
          <SweetsGrid
            sweets={filteredSweets}
            isAdmin={user?.isAdmin}
            onPurchase={handlePurchase}
            onEdit={handleEditSweet}
            onDelete={handleDeleteSweet}
          />
        </section>
      </main>

      <Footer />

      {/* Auth Dialog */}
      <AuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
        mode={authDialogMode}
        onModeSwitch={() =>
          setAuthDialogMode((prev) => (prev === 'login' ? 'register' : 'login'))
        }
        onSuccess={handleAuthSuccess}
      />

      {/* Edit Sweet Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Edit Sweet</DialogTitle>
            <DialogDescription>Update sweet details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSweet} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={editData.category}
                  onValueChange={(value) => setEditData({ ...editData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((c) => c.value !== 'all')
                      .map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.emoji} {cat.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price ($)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editData.price}
                  onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="0"
                  value={editData.quantity}
                  onChange={(e) => setEditData({ ...editData, quantity: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="candy">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
