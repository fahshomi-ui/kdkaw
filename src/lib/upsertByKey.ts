// [fix] دمج بمفتاح فريد بدل الإلحاق
export function upsertByKey<T extends Record<string, any>>(
  list: T[], item: T, keyOf?: (x: T) => string
): T[] {
  const kf = keyOf || ((x: any) => (x.store || "") + ":" + x.id);
  const k = kf(item);
  const i = list.findIndex(x => kf(x) === k);
  if (i === -1) return [item, ...list];
  const c = list.slice(); c[i] = { ...c[i], ...item }; return c;
}
