/** Labels shared by server and client code. */
export const ORDER_STATUS_LABEL = {
  pending_payment: 'Awaiting payment',
  confirmed: 'Confirmed',
  processing: 'Being prepared',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
} as const
export type OrderStatus = keyof typeof ORDER_STATUS_LABEL

export const DELIVERY_STATUS_LABEL = {
  pending: 'Waiting for a partner',
  assigned: 'Assigned',
  accepted: 'Accepted',
  out_for_delivery: 'On the way',
  delivered: 'Delivered',
  failed: 'Attempt failed',
} as const

export const EVENT_LABEL: Record<string, string> = {
  placed: 'Order placed',
  paid: 'Payment received',
  confirmed: 'Order confirmed',
  processing: 'Being prepared',
  assigned: 'Delivery partner assigned',
  out_for_delivery: 'Out for delivery',
  delivery_failed: 'Delivery attempt failed',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}
