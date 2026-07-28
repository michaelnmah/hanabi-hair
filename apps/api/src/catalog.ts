export type CatalogProduct = {
  slug: string;
  name: string;
  description: string;
  price_gbp: number;
  texture: string;
  active: boolean;
};

export const fallbackCatalog: CatalogProduct[] = [
  {
    slug: "silk-straight",
    name: "Silk Straight",
    description: "Polished, fluid strands with an effortless natural fall.",
    price_gbp: 95,
    texture: "Straight",
    active: true,
  },
  {
    slug: "body-wave",
    name: "Body Wave",
    description: "Soft, sculpted movement with luminous, touchable body.",
    price_gbp: 110,
    texture: "Body wave",
    active: true,
  },
  {
    slug: "deep-wave",
    name: "Deep Wave",
    description: "Defined, romantic waves designed to hold their character.",
    price_gbp: 125,
    texture: "Deep wave",
    active: true,
  },
];

