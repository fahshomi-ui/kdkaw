import { getCartPricing, getDeliveryFee } from '@/lib/pricing';
import { getPrepFeesForItem } from '@/lib/preparations';

const PAYMENT_FLOW_STORAGE_KEY = 'makani_payment_flow_state';

type PaymentFlowState = Record<string, any>;

export const normalizePaymentPricing = <T extends PaymentFlowState>(state: T): T => {
  // Preserve completed order snapshots; refresh only an unfinished checkout.
  if (state.orderNumber || !Array.isArray(state.items) || !state.items.every(item => item.product && typeof item.product.price === 'number')) return state;
  const preparationFees = state.items.reduce((sum: number, item: any) => sum + getPrepFeesForItem(item.preparations, item.quantity), 0);
  return { ...state, ...getCartPricing(state.items, preparationFees), preparationFees, deliveryFee: getDeliveryFee(), couponCode: '' };
};

export const getPaymentFlowState = <T extends PaymentFlowState = PaymentFlowState>(): T | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(PAYMENT_FLOW_STORAGE_KEY);
    return raw ? normalizePaymentPricing(JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

export const savePaymentFlowState = (state: PaymentFlowState) => {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(PAYMENT_FLOW_STORAGE_KEY, JSON.stringify(normalizePaymentPricing(state)));
  } catch {
    // Ignore storage write failures.
  }
};