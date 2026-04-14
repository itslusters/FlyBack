/**
 * Amazon order history category → CPSC recall category buckets.
 *
 * Keys are case-insensitive substring matches against Amazon's category string.
 * Values are the `Products[].Type` values returned by the CPSC REST API.
 *
 * Purpose: pre-filter the recall_db before Fuse.js runs, shrinking the
 * search space from ~15k rows to ~200–500 per query.
 *
 * Import this in core-utils.ts instead of the inline CATEGORY_MAP const.
 */
export const AMAZON_TO_CPSC: Record<string, string[]> = {
  Electronics:  ['Electronics', 'Consumer Electronics', 'Electrical Equipment'],
  Computer:     ['Electronics', 'Electrical Equipment'],
  Camera:       ['Electronics', 'Consumer Electronics'],
  Kitchen:      ['Kitchen & Bath', 'Appliances', 'Cookware'],
  Appliance:    ['Appliances', 'Electrical Equipment', 'Household Products'],
  Baby:         ["Children's Products", 'Baby', 'Infant/Toddler Products'],
  Toy:          ["Children's Products", 'Toys', 'Recreational Equipment'],
  Game:         ["Children's Products", 'Toys'],
  Tool:         ['Tools & Hardware', 'Power Tools', 'Electrical Equipment'],
  Outdoor:      ['Outdoor & Recreation', 'Sports Equipment'],
  Sport:        ['Sports & Recreation', 'Bicycles', 'Exercise Equipment'],
  Health:       ['Medical Devices', 'Health Products', 'Personal Care'],
  Beauty:       ['Personal Care', 'Health Products'],
  Furniture:    ['Furniture', 'Home Furnishings'],
  Lighting:     ['Electrical Equipment', 'Lighting'],
  Automotive:   ['Automotive', 'Motor Vehicles'],
  Pet:          ['Pet Products'],
  Clothing:     ['Clothing', 'Apparel'],
  Shoes:        ['Clothing', 'Footwear'],
  Food:         ['Food', 'Dietary Supplements'],
  Supplement:   ['Dietary Supplements', 'Food'],
}

/**
 * Resolve Amazon category string → CPSC category bucket list.
 * Returns [] if no mapping found (triggers global fallback search).
 */
export function toCpscCategories(amazonCategory: string | null): string[] {
  if (!amazonCategory) return []
  const lc = amazonCategory.toLowerCase()
  for (const [key, buckets] of Object.entries(AMAZON_TO_CPSC)) {
    if (lc.includes(key.toLowerCase())) return buckets
  }
  return []
}
