import React from "react";
import { Search, Plus, X, Star, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function MenuManagementTab({
  filteredMenu,
  selectedCategory,
  setSelectedCategory,
  availableCategories,
  menuSearch,
  setMenuSearch,
  handleOpenAddDish,
  handleOpenEditDish,
  editingDish,
  dishForm,
  setDishForm,
  handleImageFileUpload,
  handleToggleStock,
  handleDeleteDish,
  handleSaveDish,
  toast,
}) {
  return (
    <div className="mt-6 space-y-6 animate-in fade-in-50 duration-300">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        {/* Category selector */}
        <div className="flex overflow-x-auto gap-1.5 w-full sm:w-auto scrollbar-none">
          {["All", ...availableCategories].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                selectedCategory === cat
                  ? "bg-brand text-brand-foreground font-semibold"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search and Add Button */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search dishes..."
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              className="pl-9 h-9 text-xs rounded-full"
            />
          </div>
          <Button
            onClick={handleOpenAddDish}
            size="sm"
            className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90 gap-1.5 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add Dish
          </Button>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMenu.map((dish) => (
          <div
            key={dish.id}
            className={`group relative flex flex-col justify-between rounded-3xl border border-border bg-card overflow-hidden shadow-sm transition hover:shadow-md ${
              dish.inStock === false ? "opacity-60" : ""
            }`}
          >
            <div className="relative h-44 w-full bg-secondary">
              <img src={dish.image} alt={dish.name} className="h-full w-full object-cover" />
              <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                <Badge
                  variant="secondary"
                  className="bg-background/80 backdrop-blur-sm text-[10px]"
                >
                  {dish.category}
                </Badge>
                {dish.bestseller && (
                  <Badge className="bg-brand text-brand-foreground text-[10px]">★ Bestseller</Badge>
                )}
                {dish.spicy && (
                  <Badge className="bg-rose-500 text-white text-[10px]">🌶️ Spicy</Badge>
                )}
                {dish.veg && (
                  <Badge className="bg-emerald-600 text-white text-[10px]">🌱 Veg</Badge>
                )}
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm line-clamp-1">{dish.name}</h3>
                  <span className="font-display text-lg text-brand shrink-0">
                    ${Number(dish.price || 0).toFixed(2)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {dish.description}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  {dish.rating || 4.8}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full hover:bg-secondary"
                    onClick={() => handleToggleStock(dish.id)}
                  >
                    {dish.inStock !== false ? "In Stock" : "Sold Out"}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteDish(dish.id, dish.name)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleOpenEditDish(dish)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
