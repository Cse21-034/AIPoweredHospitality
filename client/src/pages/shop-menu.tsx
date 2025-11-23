import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Edit2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface ShopMenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string | number;
  image?: string;
  isAvailable: boolean;
  preparationTime?: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function ShopMenuPage() {
  const { toast } = useToast();
  const [propertyId, setPropertyId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShopMenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "food",
    price: "",
    preparationTime: "",
    isAvailable: true,
  });

  // Get properties
  const { data: properties = [] } = useQuery({
    queryKey: ["/api/properties"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/properties");
      return res.json();
    },
  });

  // Get shop menu items
  const { data: menuItems = [], refetch } = useQuery({
    queryKey: [`/api/shop-menu?propertyId=${propertyId}`],
    queryFn: async () => {
      if (!propertyId) return [];
      const res = await apiRequest("GET", `/api/shop-menu?propertyId=${propertyId}`);
      return res.json();
    },
    enabled: !!propertyId,
  });

  // Create/Update mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingItem ? `/api/shop-menu/${editingItem.id}` : "/api/shop-menu";
      const method = editingItem ? "PUT" : "POST";

      const res = await apiRequest(method, url, {
        ...data,
        propertyId,
        displayOrder: editingItem?.displayOrder || 0,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: editingItem ? "Menu item updated" : "Menu item created",
      });
      refetch();
      setIsOpen(false);
      setEditingItem(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/shop-menu/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Menu item deleted",
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "food",
      price: "",
      preparationTime: "",
      isAvailable: true,
    });
  };

  const handleEdit = (item: ShopMenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      category: item.category,
      price: item.price.toString(),
      preparationTime: item.preparationTime?.toString() || "",
      isAvailable: item.isAvailable,
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: formData.name,
      description: formData.description,
      category: formData.category,
      price: parseFloat(formData.price),
      preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : null,
      isAvailable: formData.isAvailable,
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingItem(null);
      resetForm();
    }
  };

  const categories = ["food", "beverage", "snacks", "other"];

  if (!propertyId) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Shop Menu Management</h1>
        <Card className="p-6">
          <Label>Select Property</Label>
          <Select value={propertyId} onValueChange={setPropertyId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a property..." />
            </SelectTrigger>
            <SelectContent>
              {properties.map((prop: any) => (
                <SelectItem key={prop.id} value={prop.id}>
                  {prop.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Shop Menu Management</h1>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingItem(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit" : "Add"} Menu Item</DialogTitle>
              <DialogDescription>
                {editingItem ? "Update the menu item details" : "Create a new menu item"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Caesar Salad"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the item..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prep-time">Prep Time (minutes)</Label>
                  <Input
                    id="prep-time"
                    type="number"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                    placeholder="15"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Available</span>
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Saving..." : editingItem ? "Update Item" : "Create Item"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {menuItems.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <p>No menu items yet. Create your first item to get started!</p>
          </Card>
        ) : (
          menuItems.map((item: ShopMenuItem) => (
            <Card key={item.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <Badge variant={item.isAvailable ? "default" : "secondary"}>
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </Badge>
                    <Badge variant="outline">{item.category}</Badge>
                  </div>
                  {item.description && <p className="text-sm text-gray-600 mb-2">{item.description}</p>}
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span className="font-semibold text-green-600">${Number(item.price).toFixed(2)}</span>
                    {item.preparationTime && <span>⏱️ {item.preparationTime} min</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(item.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
