/**
 * The API charges the cart subtotal only, so shipping must stay free here or
 * the displayed total would not match the amount Razorpay collects.
 */
export const SHIPPING_COST = 0;

export function shippingFor(subtotal: number) {
  return subtotal > 0 ? SHIPPING_COST : 0;
}
