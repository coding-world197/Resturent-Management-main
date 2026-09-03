// src/lib/chefSerializer.js
// Helper that returns a sanitized order object for Chef views.

export function sanitizeOrderForChef(order) {
  return {
    id: order.id,
    items: order.items,
    status: order.status,
    created_at: order.created_at,
    kitchen_notes: order.kitchen_notes || null,
  };
}
