
// Kept as data rather than accepting arbitrary client-supplied preparation prices.
const group = (ids) => new Set(ids);

export const PREP_PRICES = Object.freeze({
  clean: 0, scale: 0, head_remove: 0.15, skin: 0.25, slice: 0.25, fillet: 0.5,
  grill_ready: 0.75, peel: 0.35, devein: 0.35, tail_keep: 0, thaw_pack: 0, keep_frozen: 0,
  skin_remove: 0.25, cut_4: 0.25, cut_8: 0.35, butterfly: 0.35,
  marinate_arabic: 0.5, marinate_spicy: 0.5, cut_quarters: 0, cut_pieces: 0,
  cut_cubes: 0.5, mince: 0.75, bone_remove: 1, fat_trim: 0.5,
  thickness_thin: 0, thickness_thick: 0, tenderize: 0.35, marinate_bbq: 0.5,
  fat_low: 0, fat_regular: 0, pack_500g: 0.25, cut_strips: 0.5,
  wash: 0, cut_slices: 0.25, extra_pack: 0.15, gift_pack: 0.5,
});

// These are the exact option ids exposed by the original preparation groups.
const FISH = ['clean', 'scale', 'head_remove', 'skin', 'slice', 'fillet', 'grill_ready'];
const SHRIMP = ['clean', 'peel', 'devein', 'tail_keep', 'grill_ready'];
const SEAFOOD_READY = ['thaw_pack', 'keep_frozen'];
const POULTRY_WHOLE = ['clean', 'skin_remove', 'cut_4', 'cut_8', 'butterfly', 'grill_ready', 'marinate_arabic', 'marinate_spicy'];
const POULTRY_PARTS = ['skin_remove', 'bone_remove', 'marinate_arabic', 'marinate_spicy'];
const LAMB = ['cut_quarters', 'cut_pieces', 'cut_cubes', 'mince', 'bone_remove', 'fat_trim', 'grill_ready'];
const BEEF_STEAK = ['thickness_thin', 'thickness_thick', 'tenderize', 'marinate_bbq'];
const BEEF_GROUND = ['fat_low', 'fat_regular', 'pack_500g'];
const BEEF_CUTS = ['cut_cubes', 'cut_strips', 'bone_remove'];
const VEG = ['wash', 'cut_cubes', 'cut_slices', 'peel'];
const FRUIT = ['wash', 'peel', 'cut_pieces'];
const EGGS = ['extra_pack', 'gift_pack'];
const DELIVERY = ['keep_frozen', 'gift_pack'];
const DRY = ['gift_pack'];
const FROZEN = ['keep_frozen', 'thaw_pack'];
const CHILLED = ['keep_chilled'];

const SUB_SLUG_GROUPS = {
  'sub-seafood-whole': [FISH, DELIVERY],
  'sub-seafood-fillet': [['slice', 'grill_ready'], DELIVERY],
  'sub-seafood-shrimp': [SHRIMP, DELIVERY],
  'sub-seafood-shellfish': [SHRIMP, DELIVERY],
  'sub-seafood-ready': [SEAFOOD_READY],
  'sub-poultry-whole': [POULTRY_WHOLE, DELIVERY],
  'sub-poultry-breasts': [POULTRY_PARTS, DELIVERY],
  'sub-poultry-legs': [POULTRY_PARTS, DELIVERY],
  'sub-poultry-wings': [POULTRY_PARTS, DELIVERY],
  'sub-poultry-liver': [DELIVERY],
  'sub-poultry-ready': [SEAFOOD_READY],
  'sub-lamb-all': [LAMB, DELIVERY],
  'sub-beef-steak': [BEEF_STEAK, DELIVERY],
  'sub-beef-ground': [BEEF_GROUND, DELIVERY],
  'sub-beef-cuts': [BEEF_CUTS, DELIVERY],
  'sub-beef-ready': [SEAFOOD_READY],
  'sub-buffalo-steak': [BEEF_STEAK, DELIVERY],
  'sub-buffalo-ground': [BEEF_GROUND, DELIVERY],
  'sub-buffalo-ready': [SEAFOOD_READY],
  'sub-veg': [VEG],
  'sub-fruits': [FRUIT],
  'sub-eggs': [EGGS],
  'sub-bakery': [DELIVERY],
  'sub-desserts': [DELIVERY, DRY],
  'sub-frozen-veg': [FROZEN],
  'sub-frozen-fruits': [FROZEN],
  'sub-fries': [FROZEN],
  'sub-appetizers': [FROZEN],
  'sub-pasta': [DRY],
  'sub-pizza': [FROZEN],
  'sub-cheese': [CHILLED],
  'sub-cream': [CHILLED],
  'sub-milk-yogurt': [CHILLED],
  'sub-nuts': [DRY],
  'sub-dried-fruits': [DRY],
  'sub-canned-tomato': [DRY],
  'sub-canned-other': [DRY],
  'sub-grains': [DRY],
  'sub-pantry': [DRY],
  'sub-rice': [DRY],
  'sub-breakfast-cereal': [DRY],
  'sub-snacks': [DRY],
  'sub-spices': [DRY],
  'sub-sugar': [DRY],
  'sub-oils-oil': [DRY],
  'sub-oils-ghee': [DRY],
  'sub-oils-fat': [DRY],
  'sub-oils-blend': [DRY],
  'sub-sauces': [DRY],
  'sub-pickles': [DRY],
  'sub-water': [], 'sub-tea': [], 'sub-coffee': [], 'sub-syrups': [],
};

const PARENT_SLUG_GROUPS = {
  'main-seafood': [FISH, DELIVERY], 'main-poultry': [POULTRY_WHOLE, DELIVERY],
  'main-lamb': [LAMB, DELIVERY], 'main-beef': [BEEF_STEAK, DELIVERY],
  'main-buffalo': [BEEF_STEAK, DELIVERY], 'main-fresh-veg-fruits': [VEG],
  'main-bakery-desserts': [DELIVERY], 'main-frozen-veg-fruits': [FROZEN],
  'main-fries-appetizers': [FROZEN], 'main-pasta-pizza': [FROZEN],
  'main-dairy-eggs': [CHILLED], 'main-nuts-dried': [DRY], 'main-canned': [DRY],
  'main-grains-pantry': [DRY], 'main-breakfast-snacks': [DRY],
  'main-spices-sugar': [DRY], 'main-oils': [DRY], 'main-sauces': [DRY], 'main-beverages': [],
};

export function getAllowedPreparations(subSlug, parentSlug) {
  const groups = (subSlug && SUB_SLUG_GROUPS[subSlug] !== undefined)
    ? SUB_SLUG_GROUPS[subSlug]
    : (parentSlug && PARENT_SLUG_GROUPS[parentSlug]) || [];
  return new Set(groups.flat());
}

export function getPrepFeesForItem(preparations, quantity = 1) {
  if (!Array.isArray(preparations) || preparations.length === 0) return 0;
  return preparations.reduce((sum, id) => sum + (PREP_PRICES[id] ?? 0), 0) * quantity;
}

export function validatePreparations(preparations, subSlug, parentSlug) {
  if (preparations === undefined || preparations === null) return [];
  if (!Array.isArray(preparations) || preparations.length > 20 || preparations.some((id) => typeof id !== 'string' || !/^[a-z0-9_:-]{1,80}$/.test(id))) {
    const error = new Error('Invalid preparations'); error.code = 'INVALID_PREPARATIONS'; error.status = 400; throw error;
  }
  const allowed = getAllowedPreparations(subSlug, parentSlug);
  const unique = [...new Set(preparations)];
  if (unique.some((id) => !allowed.has(id) || !(id in PREP_PRICES))) {
    const error = new Error('Preparation is not available for this product'); error.code = 'INVALID_PREPARATIONS'; error.status = 400; throw error;
  }
  return unique;
}
