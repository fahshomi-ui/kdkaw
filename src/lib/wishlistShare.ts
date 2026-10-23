// Encode/decode wishlist IDs into a shareable short string

export const encodeWishlist = (ids: string[]): string => {
  try {
    const json = JSON.stringify(ids);
    return btoa(unescape(encodeURIComponent(json)));
  } catch {
    return '';
  }
};

export const decodeWishlist = (encoded: string): string[] => {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

export const buildWishlistShareUrl = (ids: string[]): string => {
  const encoded = encodeWishlist(ids);
  return `${window.location.origin}/wishlist?shared=${encoded}`;
};
