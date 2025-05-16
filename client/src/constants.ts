export const RESTAURANT_INFO = {
  name: "Opa que delicia",
  email: "reservas@opaquedelicia.pt",
  phone: "+351912345678",
  whatsapp: "+351912345678",
  founded: 2020,
};

export const EVENT_INFO = {
  name: "Convenção MSBN Europa",
  location: "Centro de Eventos MSBN",
  address: "Rua das Marinhas do Tejo nº 51",
  postalCode: "2690-366",
  city: "Santa Iria de Azóia",
  country: "Portugal",
  startDate: "2025-05-29",
  endDate: "2025-06-01",
  hours: "11h00 às 22h00",
};

export const SUPPORTED_LANGUAGES = [
  { code: "pt", name: "Português", flag: "pt" },
  { code: "en", name: "English", flag: "gb" },
  { code: "es", name: "Español", flag: "es" },
];

export const BRASIL_COLORS = {
  green: "#009c3b",
  yellow: "#ffdf00",
  blue: "#002776",
  red: "#c8102e",
};

export const PAYMENT_METHODS = [
  { id: "card", name: "Cartão de Crédito", icon: "fa-credit-card" },
  { id: "mbway", name: "MBWay", icon: "fa-mobile-alt" },
  { id: "multibanco", name: "Multibanco", icon: "fa-university" },
  { id: "transfer", name: "Transferência Bancária", icon: "fa-exchange-alt" },
];

export const MENU_SECTIONS = [
  { id: "entradas", name: "Entradas", icon: "fa-utensils" },
  { id: "pratos-principais", name: "Pratos Principais", icon: "fa-drumstick-bite" },
  { id: "sobremesas", name: "Sobremesas", icon: "fa-ice-cream" },
  { id: "bebidas", name: "Bebidas", icon: "fa-cocktail" },
];

export const TABLE_CATEGORIES = [
  { id: "standard", name: "Standard" },
  { id: "vip", name: "VIP" },
];

export const RESERVATION_STATUS = [
  { id: "pending", name: "Pendente", color: "yellow" },
  { id: "confirmed", name: "Confirmada", color: "green" },
  { id: "cancelled", name: "Cancelada", color: "red" },
];

export const PAYMENT_STATUS = [
  { id: "pending", name: "Pendente", color: "yellow" },
  { id: "completed", name: "Concluído", color: "green" },
  { id: "failed", name: "Falhou", color: "red" },
  { id: "refunded", name: "Reembolsado", color: "blue" },
];
