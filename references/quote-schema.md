# Quote Schema

Input is a JSON array. Monetary values are numbers in yuan.

## Required fields

| Field | Type | Meaning |
| --- | --- | --- |
| `platform` | string | Platform name |
| `title` | string | Listing title |
| `base_price` | number | Exact-SKU price before discounts |
| `collected_at` | ISO 8601 string | Time observed |

## Recommended fields

| Field | Type | Meaning |
| --- | --- | --- |
| `product_id` | string | Platform product ID |
| `sku_id` | string | Platform SKU ID |
| `canonical_model` | string | Normalized manufacturer model |
| `sku` | object | Capacity, color, bundle, condition, and other attributes |
| `seller` | string | Seller/store name |
| `seller_type` | string | self_operated, flagship, marketplace, resale |
| `url` | string | Direct source URL |
| `region` | string | Delivery region used for the quote |
| `shipping` | number | Freight and mandatory delivery fees |
| `discounts` | array | Unconditional discount objects |
| `conditional_discounts` | array | Discounts requiring eligibility or action |
| `observed_final_price` | number | Checkout-observed payable total |
| `price_stage` | string | checkout, product_page, search_card, discovery_only |
| `stock` | string | in_stock, low_stock, out_of_stock, unknown |
| `match` | string | exact, probable, ambiguous, mismatch |
| `confidence` | number | Source confidence from 0 to 1 |
| `notes` | array | Human-readable caveats |

Each discount object should contain `type`, `amount`, and optionally `condition`.

## Example

```json
{
  "platform": "JD",
  "title": "Example Phone 12GB+256GB",
  "base_price": 3999,
  "shipping": 0,
  "discounts": [{"type": "platform_coupon", "amount": 200}],
  "conditional_discounts": [{"type": "trade_in", "amount": 300, "condition": "eligible device required"}],
  "observed_final_price": 3799,
  "price_stage": "checkout",
  "match": "exact",
  "confidence": 0.98,
  "collected_at": "2026-06-06T08:00:00Z"
}
```
