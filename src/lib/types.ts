/**
 * A gift idea
 */
export type Gift = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceRange: {
    min: number;
    max: number;
  };
  image: string;
  link: string;
  tags: string[];
  isHidden: boolean;
};

/**
 * A wishlist
 */
export type Wishlist = {
  slug: string;
  name: string;
  description: string;
  gifts: Gift[];
};
