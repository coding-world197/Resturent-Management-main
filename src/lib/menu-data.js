import burger from "@/assets/food-burger.jpg";
import burger2 from "@/assets/food-burger2.jpg";
import pizza from "@/assets/food-pizza.jpg";
import fries from "@/assets/food-fries.jpg";
import drink from "@/assets/food-drink.jpg";
import wings from "@/assets/food-wings.jpg";
import dessert from "@/assets/food-dessert.jpg";
import nachos from "@/assets/food-nachos.jpg";
export const menu = [
  {
    id: "1",
    name: "Classic Cheeseburger",
    description: "Juicy beef patty, cheddar, fresh lettuce & tomato.",
    price: 8.99,
    image: burger,
    category: "Burgers",
    rating: 4.8,
    bestseller: true,
  },
  {
    id: "2",
    name: "Double Bacon Stack",
    description: "Two patties, crispy bacon, molten cheddar.",
    price: 12.5,
    image: burger2,
    category: "Burgers",
    rating: 4.9,
    bestseller: true,
  },
  {
    id: "3",
    name: "Pepperoni Pizza",
    description: "Wood-fired crust, mozzarella, spicy pepperoni.",
    price: 14.0,
    image: pizza,
    category: "Pizza",
    rating: 4.7,
    spicy: true,
    bestseller: true,
  },
  {
    id: "4",
    name: "Golden Fries",
    description: "Hand-cut, sea-salted, crispy perfection.",
    price: 3.99,
    image: fries,
    category: "Sides",
    rating: 4.6,
    veg: true,
  },
  {
    id: "5",
    name: "Loaded Nachos",
    description: "Melted cheese, jalapeños, salsa & sour cream.",
    price: 7.5,
    image: nachos,
    category: "Sides",
    rating: 4.5,
    spicy: true,
    veg: true,
  },
  {
    id: "6",
    name: "Buffalo Wings",
    description: "Crispy wings tossed in fiery hot sauce.",
    price: 9.99,
    image: wings,
    category: "Sides",
    rating: 4.8,
    spicy: true,
    bestseller: true,
  },
  {
    id: "7",
    name: "Iced Cola",
    description: "Ice-cold refreshing classic cola.",
    price: 2.5,
    image: drink,
    category: "Beverages",
    rating: 4.4,
    veg: true,
  },
  {
    id: "8",
    name: "Molten Lava Cake",
    description: "Warm chocolate cake with vanilla ice cream.",
    price: 5.99,
    image: dessert,
    category: "Desserts",
    rating: 4.9,
    veg: true,
    bestseller: true,
  },
];
export const categories = ["Burgers", "Pizza", "Sides", "Beverages", "Desserts"];
