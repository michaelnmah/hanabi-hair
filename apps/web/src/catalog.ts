export type Product = {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  price: number;
  texture: string;
  imagePosition: string;
};

export const products: Product[] = [
  {
    slug: "silk-straight",
    name: "Silk Straight",
    eyebrow: "The signature",
    description: "Polished, fluid strands with an effortless natural fall.",
    price: 95,
    texture: "Straight",
    imagePosition: "82% 50%",
  },
  {
    slug: "body-wave",
    name: "Body Wave",
    eyebrow: "The icon",
    description: "Soft, sculpted movement with luminous, touchable body.",
    price: 110,
    texture: "Body wave",
    imagePosition: "51% 54%",
  },
  {
    slug: "deep-wave",
    name: "Deep Wave",
    eyebrow: "The muse",
    description: "Defined, romantic waves designed to hold their character.",
    price: 125,
    texture: "Deep wave",
    imagePosition: "18% 62%",
  },
];

