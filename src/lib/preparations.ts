// نظام خيارات المنتجات — يدعم نوعين:
// 1) free: خيارات بدون رسوم (اختيار فقط)
// 2) paid: خيارات بأسعار رمزية تُضاف لسعر المنتج

export type PrepIcon =
  | 'scissors' | 'flame' | 'package' | 'snowflake'
  | 'flower' | 'spice' | 'leaf' | 'fish' | 'egg';

export interface PrepOption {
  id: string;
  labelAr: string;
  labelEn: string;
  icon: PrepIcon;
  price: number; // 0 = مجاني
}

export interface PrepGroup {
  id: string;
  titleAr: string;
  titleEn: string;
  noteAr?: string;
  noteEn?: string;
  options: PrepOption[];
}

// ═════════ مجموعات خيارات قابلة لإعادة الاستخدام ═════════

const fishGroup: PrepGroup = {
  id: 'fish-prep',
  titleAr: 'خيارات تحضير السمك',
  titleEn: 'Fish Preparation',
  noteAr: 'التنظيف مجاني • أسعار رمزية',
  noteEn: 'Free cleaning • Symbolic fees',
  options: [
    { id: 'clean', labelAr: 'تنظيف وغسيل', labelEn: 'Clean & Wash', icon: 'scissors', price: 0 },
    { id: 'scale', labelAr: 'إزالة القشور', labelEn: 'Scaling', icon: 'fish', price: 0 },
    { id: 'head_remove', labelAr: 'إزالة الرأس', labelEn: 'Head Removal', icon: 'scissors', price: 0.150 },
    { id: 'skin', labelAr: 'سلخ', labelEn: 'Skinning', icon: 'package', price: 0.250 },
    { id: 'slice', labelAr: 'تقطيع شرائح', labelEn: 'Slicing', icon: 'scissors', price: 0.250 },
    { id: 'fillet', labelAr: 'تقطيع فيليه', labelEn: 'Filleting', icon: 'scissors', price: 0.500 },
    { id: 'grill_ready', labelAr: 'جاهز للشوي', labelEn: 'Grill Ready', icon: 'flame', price: 0.500 },
  ],
};

const shrimpGroup: PrepGroup = {
  id: 'shrimp-prep',
  titleAr: 'خيارات تحضير الروبيان',
  titleEn: 'Shrimp Preparation',
  options: [
    { id: 'clean', labelAr: 'تنظيف', labelEn: 'Cleaning', icon: 'scissors', price: 0 },
    { id: 'peel', labelAr: 'تقشير', labelEn: 'Peeling', icon: 'package', price: 0.500 },
    { id: 'devein', labelAr: 'إزالة العرق', labelEn: 'Deveining', icon: 'scissors', price: 0.350 },
    { id: 'tail_keep', labelAr: 'إبقاء الذيل', labelEn: 'Keep Tail', icon: 'fish', price: 0 },
    { id: 'grill_ready', labelAr: 'جاهز للشوي', labelEn: 'Grill Ready', icon: 'flame', price: 0.500 },
  ],
};

const seafoodReadyGroup: PrepGroup = {
  id: 'seafood-ready-prep',
  titleAr: 'طريقة التقديم',
  titleEn: 'Serving Style',
  options: [
    { id: 'thaw_pack', labelAr: 'تذويب قبل التوصيل', labelEn: 'Thaw Before Delivery', icon: 'snowflake', price: 0 },
    { id: 'keep_frozen', labelAr: 'إبقاء مجمد', labelEn: 'Keep Frozen', icon: 'snowflake', price: 0 },
  ],
};

const wholePoultryGroup: PrepGroup = {
  id: 'poultry-whole-prep',
  titleAr: 'خيارات تحضير الدواجن',
  titleEn: 'Poultry Preparation',
  noteAr: 'التنظيف مجاني',
  noteEn: 'Free cleaning',
  options: [
    { id: 'clean', labelAr: 'تنظيف وتنشيف', labelEn: 'Clean & Dry', icon: 'scissors', price: 0 },
    { id: 'skin_remove', labelAr: 'إزالة الجلد', labelEn: 'Skin Removal', icon: 'package', price: 0.250 },
    { id: 'cut_4', labelAr: 'تقطيع 4 قطع', labelEn: 'Cut into 4', icon: 'scissors', price: 0.250 },
    { id: 'cut_8', labelAr: 'تقطيع 8 قطع', labelEn: 'Cut into 8', icon: 'scissors', price: 0.350 },
    { id: 'butterfly', labelAr: 'فتح فراشة', labelEn: 'Butterfly Cut', icon: 'scissors', price: 0.350 },
    { id: 'grill_ready', labelAr: 'جاهز للشوي', labelEn: 'Grill Ready', icon: 'flame', price: 0.500 },
    { id: 'marinate_arabic', labelAr: 'تتبيل عربي', labelEn: 'Arabic Marinade', icon: 'spice', price: 0.500 },
    { id: 'marinate_spicy', labelAr: 'تتبيل حار', labelEn: 'Spicy Marinade', icon: 'spice', price: 0.500 },
  ],
};

const poultryPartsGroup: PrepGroup = {
  id: 'poultry-parts-prep',
  titleAr: 'خيارات إضافية',
  titleEn: 'Add-on Options',
  options: [
    { id: 'skin_remove', labelAr: 'إزالة الجلد', labelEn: 'Skin Removal', icon: 'package', price: 0.250 },
    { id: 'bone_remove', labelAr: 'إزالة العظم', labelEn: 'Boneless', icon: 'scissors', price: 0.500 },
    { id: 'marinate_arabic', labelAr: 'تتبيل عربي', labelEn: 'Arabic Marinade', icon: 'spice', price: 0.500 },
    { id: 'marinate_spicy', labelAr: 'تتبيل حار', labelEn: 'Spicy Marinade', icon: 'spice', price: 0.500 },
  ],
};

const lambGroup: PrepGroup = {
  id: 'lamb-prep',
  titleAr: 'خيارات تقطيع اللحم',
  titleEn: 'Meat Cutting Options',
  noteAr: 'يتم التقطيع حسب طلبك',
  noteEn: 'Cut to your specification',
  options: [
    { id: 'cut_quarters', labelAr: 'تقطيع أرباع', labelEn: 'Quarters', icon: 'scissors', price: 0 },
    { id: 'cut_pieces', labelAr: 'تقطيع قطع متوسطة', labelEn: 'Medium Pieces', icon: 'scissors', price: 0 },
    { id: 'cut_cubes', labelAr: 'تقطيع مكعبات', labelEn: 'Cubes', icon: 'scissors', price: 0.500 },
    { id: 'mince', labelAr: 'فرم (مفروم)', labelEn: 'Minced', icon: 'scissors', price: 0.750 },
    { id: 'bone_remove', labelAr: 'إزالة العظم', labelEn: 'Boneless', icon: 'scissors', price: 1.000 },
    { id: 'fat_trim', labelAr: 'إزالة الدهون', labelEn: 'Fat Trimming', icon: 'package', price: 0.500 },
    { id: 'grill_ready', labelAr: 'جاهز للشوي', labelEn: 'Grill Ready', icon: 'flame', price: 0.750 },
  ],
};

const beefSteakGroup: PrepGroup = {
  id: 'beef-steak-prep',
  titleAr: 'خيارات الستيك',
  titleEn: 'Steak Options',
  options: [
    { id: 'thickness_thin', labelAr: 'شرائح رفيعة', labelEn: 'Thin Cut', icon: 'scissors', price: 0 },
    { id: 'thickness_thick', labelAr: 'شرائح سميكة', labelEn: 'Thick Cut', icon: 'scissors', price: 0 },
    { id: 'tenderize', labelAr: 'دق وتطرية', labelEn: 'Tenderize', icon: 'scissors', price: 0.350 },
    { id: 'marinate_bbq', labelAr: 'تتبيل باربكيو', labelEn: 'BBQ Marinade', icon: 'spice', price: 0.500 },
  ],
};

const beefGroundGroup: PrepGroup = {
  id: 'beef-ground-prep',
  titleAr: 'خيارات اللحم المفروم',
  titleEn: 'Ground Meat Options',
  options: [
    { id: 'fat_low', labelAr: 'قليل الدهون', labelEn: 'Low Fat', icon: 'package', price: 0 },
    { id: 'fat_regular', labelAr: 'دهون عادية', labelEn: 'Regular Fat', icon: 'package', price: 0 },
    { id: 'pack_500g', labelAr: 'تقسيم لأكياس 500غ', labelEn: 'Split into 500g bags', icon: 'package', price: 0.250 },
  ],
};

const beefCutsGroup: PrepGroup = {
  id: 'beef-cuts-prep',
  titleAr: 'خيارات التقطيع',
  titleEn: 'Cutting Options',
  options: [
    { id: 'cut_cubes', labelAr: 'مكعبات', labelEn: 'Cubes', icon: 'scissors', price: 0.500 },
    { id: 'cut_strips', labelAr: 'شرائح طويلة', labelEn: 'Strips', icon: 'scissors', price: 0.500 },
    { id: 'bone_remove', labelAr: 'إزالة العظم', labelEn: 'Boneless', icon: 'scissors', price: 1.000 },
  ],
};

const vegGroup: PrepGroup = {
  id: 'veg-prep',
  titleAr: 'خيارات التحضير',
  titleEn: 'Preparation',
  noteAr: 'الغسيل مجاني',
  noteEn: 'Free washing',
  options: [
    { id: 'wash', labelAr: 'غسيل وتنظيف', labelEn: 'Wash & Clean', icon: 'leaf', price: 0 },
    { id: 'cut_cubes', labelAr: 'تقطيع مكعبات', labelEn: 'Diced', icon: 'scissors', price: 0.250 },
    { id: 'cut_slices', labelAr: 'تقطيع شرائح', labelEn: 'Sliced', icon: 'scissors', price: 0.250 },
    { id: 'peel', labelAr: 'تقشير', labelEn: 'Peeled', icon: 'package', price: 0.250 },
  ],
};

const fruitGroup: PrepGroup = {
  id: 'fruit-prep',
  titleAr: 'خيارات التحضير',
  titleEn: 'Preparation',
  noteAr: 'الغسيل مجاني',
  noteEn: 'Free washing',
  options: [
    { id: 'wash', labelAr: 'غسيل', labelEn: 'Wash', icon: 'leaf', price: 0 },
    { id: 'peel', labelAr: 'تقشير', labelEn: 'Peeled', icon: 'package', price: 0.350 },
    { id: 'cut_pieces', labelAr: 'تقطيع جاهز للأكل', labelEn: 'Ready-to-eat Cut', icon: 'scissors', price: 0.500 },
  ],
};

const eggsGroup: PrepGroup = {
  id: 'eggs-prep',
  titleAr: 'خيارات التغليف',
  titleEn: 'Packaging',
  options: [
    { id: 'extra_pack', labelAr: 'تغليف إضافي للحماية', labelEn: 'Extra Protective Packaging', icon: 'package', price: 0.150 },
    { id: 'gift_pack', labelAr: 'تغليف هدية', labelEn: 'Gift Packaging', icon: 'flower', price: 0.500 },
  ],
};

const baseDeliveryGroup: PrepGroup = {
  id: 'delivery-prefs',
  titleAr: 'تفضيلات التوصيل',
  titleEn: 'Delivery Preferences',
  options: [
    { id: 'keep_frozen', labelAr: 'إبقاء مجمد عند التسليم', labelEn: 'Keep Frozen at Delivery', icon: 'snowflake', price: 0 },
    { id: 'gift_pack', labelAr: 'تغليف هدية', labelEn: 'Gift Wrapping', icon: 'flower', price: 0.500 },
  ],
};

const dryGoodsGroup: PrepGroup = {
  id: 'dry-prefs',
  titleAr: 'خيارات التغليف',
  titleEn: 'Packaging Options',
  options: [
    { id: 'gift_pack', labelAr: 'تغليف هدية', labelEn: 'Gift Wrapping', icon: 'flower', price: 0.500 },
  ],
};

// مجموعة للمنتجات المجمدة (خضار/فواكه/بطاطا/مقبلات/باستا/بيتزا)
const frozenGroup: PrepGroup = {
  id: 'frozen-prefs',
  titleAr: 'تفضيلات التوصيل',
  titleEn: 'Delivery Preferences',
  options: [
    { id: 'keep_frozen', labelAr: 'إبقاء مجمد عند التسليم', labelEn: 'Keep Frozen at Delivery', icon: 'snowflake', price: 0 },
    { id: 'thaw_pack', labelAr: 'تذويب جزئي قبل التوصيل', labelEn: 'Partial Thaw Before Delivery', icon: 'snowflake', price: 0 },
  ],
};

// لمنتجات الألبان والأجبان (تبريد فقط)
const chilledGroup: PrepGroup = {
  id: 'chilled-prefs',
  titleAr: 'تفضيلات التوصيل',
  titleEn: 'Delivery Preferences',
  options: [
    { id: 'keep_chilled', labelAr: 'حفظ بارد عند التسليم', labelEn: 'Keep Chilled at Delivery', icon: 'snowflake', price: 0 },
  ],
};

// ═════════ خريطة slug الفئة الفرعية → المجموعات ═════════
const SUB_SLUG_GROUPS: Record<string, PrepGroup[]> = {
  // ── المأكولات البحرية ──
  'sub-seafood-whole': [fishGroup, baseDeliveryGroup],
  'sub-seafood-fillet': [{ ...fishGroup, options: fishGroup.options.filter(o => ['slice','grill_ready'].includes(o.id)) }, baseDeliveryGroup],
  'sub-seafood-shrimp': [shrimpGroup, baseDeliveryGroup],
  'sub-seafood-shellfish': [shrimpGroup, baseDeliveryGroup],
  'sub-seafood-ready': [seafoodReadyGroup],
  // ── الدواجن ──
  'sub-poultry-whole': [wholePoultryGroup, baseDeliveryGroup],
  'sub-poultry-breasts': [poultryPartsGroup, baseDeliveryGroup],
  'sub-poultry-legs': [poultryPartsGroup, baseDeliveryGroup],
  'sub-poultry-wings': [poultryPartsGroup, baseDeliveryGroup],
  'sub-poultry-liver': [baseDeliveryGroup],
  'sub-poultry-ready': [seafoodReadyGroup],
  // ── اللحوم ──
  'sub-lamb-all': [lambGroup, baseDeliveryGroup],
  'sub-beef-steak': [beefSteakGroup, baseDeliveryGroup],
  'sub-beef-ground': [beefGroundGroup, baseDeliveryGroup],
  'sub-beef-cuts': [beefCutsGroup, baseDeliveryGroup],
  'sub-beef-ready': [seafoodReadyGroup],
  'sub-buffalo-steak': [beefSteakGroup, baseDeliveryGroup],
  'sub-buffalo-ground': [beefGroundGroup, baseDeliveryGroup],
  'sub-buffalo-ready': [seafoodReadyGroup],
  // ── خضار وفواكه طازجة ──
  'sub-veg': [vegGroup],
  'sub-fruits': [fruitGroup],
  // ── البيض ──
  'sub-eggs': [eggsGroup],
  // ── المخبوزات والحلويات ──
  'sub-bakery': [baseDeliveryGroup],
  'sub-desserts': [baseDeliveryGroup, dryGoodsGroup],
  // ── منتجات مجمدة (خضار/فواكه/بطاطا/مقبلات/باستا/بيتزا) ──
  'sub-frozen-veg': [frozenGroup],
  'sub-frozen-fruits': [frozenGroup],
  'sub-fries': [frozenGroup],
  'sub-appetizers': [frozenGroup],
  'sub-pasta': [dryGoodsGroup],
  'sub-pizza': [frozenGroup],
  // ── ألبان وأجبان (تبريد) ──
  'sub-cheese': [chilledGroup],
  'sub-cream': [chilledGroup],
  'sub-milk-yogurt': [chilledGroup],
  // ── مكسرات وفواكه مجففة ──
  'sub-nuts': [dryGoodsGroup],
  'sub-dried-fruits': [dryGoodsGroup],
  // ── معلبات ──
  'sub-canned-tomato': [dryGoodsGroup],
  'sub-canned-other': [dryGoodsGroup],
  // ── حبوب ومؤن وأرز ──
  'sub-grains': [dryGoodsGroup],
  'sub-pantry': [dryGoodsGroup],
  'sub-rice': [dryGoodsGroup],
  // ── حبوب فطور ووجبات خفيفة ──
  'sub-breakfast-cereal': [dryGoodsGroup],
  'sub-snacks': [dryGoodsGroup],
  // ── توابل وسكر ──
  'sub-spices': [dryGoodsGroup],
  'sub-sugar': [dryGoodsGroup],
  // ── زيوت ──
  'sub-oils-oil': [dryGoodsGroup],
  'sub-oils-ghee': [dryGoodsGroup],
  'sub-oils-fat': [dryGoodsGroup],
  'sub-oils-blend': [dryGoodsGroup],
  // ── صلصات ومخللات ──
  'sub-sauces': [dryGoodsGroup],
  'sub-pickles': [dryGoodsGroup],
  // ── مشروبات (بدون أي خيارات) ──
  'sub-water': [],
  'sub-tea': [],
  'sub-coffee': [],
  'sub-syrups': [],
};

// خريطة افتراضية للفئة الرئيسية (احتياطي إن غابت الفرعية)
const PARENT_SLUG_GROUPS: Record<string, PrepGroup[]> = {
  'main-seafood': [fishGroup, baseDeliveryGroup],
  'main-poultry': [wholePoultryGroup, baseDeliveryGroup],
  'main-lamb': [lambGroup, baseDeliveryGroup],
  'main-beef': [beefSteakGroup, baseDeliveryGroup],
  'main-buffalo': [beefSteakGroup, baseDeliveryGroup],
  'main-fresh-veg-fruits': [vegGroup],
  'main-bakery-desserts': [baseDeliveryGroup],
  'main-frozen-veg-fruits': [frozenGroup],
  'main-fries-appetizers': [frozenGroup],
  'main-pasta-pizza': [frozenGroup],
  'main-dairy-eggs': [chilledGroup],
  'main-nuts-dried': [dryGoodsGroup],
  'main-canned': [dryGoodsGroup],
  'main-grains-pantry': [dryGoodsGroup],
  'main-breakfast-snacks': [dryGoodsGroup],
  'main-spices-sugar': [dryGoodsGroup],
  'main-oils': [dryGoodsGroup],
  'main-sauces': [dryGoodsGroup],
  'main-beverages': [],
};

export function getPrepGroups(subSlug?: string | null, parentSlug?: string | null): PrepGroup[] {
  if (subSlug && SUB_SLUG_GROUPS[subSlug] !== undefined) return SUB_SLUG_GROUPS[subSlug];
  if (parentSlug && PARENT_SLUG_GROUPS[parentSlug]) return PARENT_SLUG_GROUPS[parentSlug];
  return []; // لا تعرض خيارات افتراضية إذا لم تُعرَّف للفئة
}

// ═════════ بحث سريع للأسعار/التسميات (للسلة والفاتورة) ═════════
const ALL_OPTIONS: Record<string, PrepOption> = {};
[
  fishGroup, shrimpGroup, seafoodReadyGroup, wholePoultryGroup, poultryPartsGroup,
  lambGroup, beefSteakGroup, beefGroundGroup, beefCutsGroup,
  vegGroup, fruitGroup, eggsGroup, baseDeliveryGroup, dryGoodsGroup,
  frozenGroup, chilledGroup,
].forEach(g => g.options.forEach(o => { ALL_OPTIONS[o.id] = o; }));

export const PREP_PRICES: Record<string, number> = Object.fromEntries(
  Object.entries(ALL_OPTIONS).map(([id, o]) => [id, o.price])
);

export const PREP_LABELS: Record<string, { ar: string; en: string }> = Object.fromEntries(
  Object.entries(ALL_OPTIONS).map(([id, o]) => [id, { ar: o.labelAr, en: o.labelEn }])
);

export const getPrepFeesForItem = (preparations?: string[], quantity = 1): number => {
  if (!preparations || preparations.length === 0) return 0;
  const perUnit = preparations.reduce((sum, id) => sum + (PREP_PRICES[id] ?? 0), 0);
  return perUnit * quantity;
};
