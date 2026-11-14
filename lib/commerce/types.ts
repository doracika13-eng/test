export type Money = { amount: string; currencyCode: string };

export type ProductImage = { src: string; alt: string; view: string; width?: number; height?: number };

export type ColorwayStatus = "reference" | "under-review" | "approved";

export type Colorway = {
  id: string;
  name: string;
  hex: string;
  status: ColorwayStatus;
  images: ProductImage[];
};

export type Variant = {
  id: string;
  colorwayId: string;
  size: string;
  availableForSale: boolean;
  price: Money | null;
};

export type SizeChart = {
  unit: "cm" | "in";
  note?: string;
  columns: string[];
  rows: { label: string; values: (string | number)[] }[];
};

export type ProductStatus = "in-development" | "coming-soon" | "available" | "sold-out";

export type Product = {
  handle: string;
  code: string;
  title: string;
  subtitle: string;
  collection: string;
  description: string;
  status: ProductStatus;
  price: Money | null;
  sizes: string[];
  colorways: Colorway[];
  variants: Variant[];
  highlights: string[];
  sizeChart: SizeChart | null;
  /** true when images are AI concept references, not product photography */
  conceptImagery: boolean;
};

export type Collection = {
  slug: string;
  name: string;
  kicker: string;
  tagline: string;
  description: string;
  image: string;
  imageAlt: string;
  tone: "bone" | "bordeaux" | "charcoal" | "black";
};

export type ProductDetails = {
  materials: string;
  fit: string;
  construction: string;
  care: string;
  shipping: string;
  returns: string;
};

export type CartLineInput = { variantId: string; quantity: number };
