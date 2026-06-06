---
name: china-shopping-price-check
description: Search, normalize, compare, and explain current product prices across Chinese shopping platforms such as Taobao, Tmall, JD, Pinduoduo, Suning, Vipshop, Douyin Shop, and Kuaishou Shop. Use when a user asks to 查价, 询价, 比价, 找最低价, calculate 券后价/到手价, compare the same SKU across Chinese e-commerce apps, or build a China-focused shopping price lookup workflow. Supports official APIs, authenticated browser sessions, user-supplied links or screenshots, and compliant third-party extraction services.
---

# China Shopping Price Check

Produce reproducible price comparisons, not a bare list of search-result prices.

## Core rules

1. Compare the same product and SKU. Treat capacity, color, model, bundle, warranty, condition, region, and seller type as material differences.
2. Report the payable price. Separate base price, shop coupon, platform coupon, subsidy, membership discount, trade-in discount, shipping, and required conditions.
3. Never present a login-only, region-specific, invite-only, new-user, installment, deposit, trade-in, or limited-quantity price as unconditional.
4. Attach source URL, platform, seller, collection time, and confidence to every quote.
5. Prefer authorized data access. Do not bypass CAPTCHA, access controls, rate limits, or platform anti-bot protections.

## Choose a data route

Use the first viable route:

1. **Official or partner API**: Best for a production tool. Use documented affiliate/open-platform APIs and obey their display and caching terms.
2. **Authenticated browser**: Best for an individual lookup because member, region, and account-specific prices may be visible. Ask the user to log in manually when needed; never request their password.
3. **User evidence**: Parse product links, copied checkout text, or screenshots. Mark values as user-supplied and preserve the evidence timestamp.
4. **Compliant extraction provider**: Use Apify or another provider only when its actor explicitly supports the target page and the use complies with platform terms.
5. **Public web search**: Use for discovery only. Mark snippet prices as `discovery_only`; verify on the product or checkout page before recommending.

Read [references/platforms.md](references/platforms.md) before querying a platform. Read [references/quote-schema.md](references/quote-schema.md) when integrating a new connector or returning machine-readable data.

## Workflow

### 1. Define the target

Extract:

- product name, brand, model, and category
- required SKU attributes
- new/used condition
- delivery region
- quantity
- acceptable seller type
- membership, coupon, trade-in, and payment eligibility

If the request is underspecified, search broadly but label ambiguous matches. Ask only for attributes that can change the buying decision.

### 2. Collect candidates

Search at least two viable platforms when the user asks for comparison. For each candidate, capture the fields in the quote schema.

Do not silently substitute:

- a lower-capacity or older model
- refurbished/open-box for new
- bare device for a bundle, or vice versa
- deposit/interest-per-period for total price
- wholesale price with a minimum quantity

### 3. Verify the payable price

Use this precedence:

1. checkout payable total for the exact SKU and region
2. product-page price with selectable SKU and explicit discounts
3. search-result card price
4. search-engine snippet

Set `price_stage` accordingly. Include shipping and mandatory fees. Exclude uncertain coupons from `final_price`; list them under `conditional_discounts`.

### 4. Normalize and rank

Save collected quotes as UTF-8 JSON, then run:

```powershell
node scripts/normalize-quotes.mjs quotes.json --format markdown
```

Use `--format json` when another tool will consume the result. The script computes comparable payable prices, flags stale or conditional quotes, and ranks verified exact-SKU offers above weak headline prices.

### 5. Present the answer

Return:

- a one-sentence recommendation
- a comparison table with final price and conditions
- mismatch or uncertainty warnings
- collection time and delivery region
- direct product links where available

State that prices can change and that the checkout page is authoritative. Do not claim “lowest on the whole internet” unless coverage is genuinely exhaustive.

## Production-tool guidance

For a reusable web tool, keep platform connectors separate from normalization:

```text
connectors -> raw quote schema -> validation -> price normalization -> ranking -> UI/API
```

Store provenance for each field. Cache conservatively. Re-check the winning offer before redirecting the user. Design connectors so a blocked or changed platform cannot break the whole comparison service.

Do not make browser scraping the only production data source. Chinese commerce pages frequently require login, render prices dynamically, vary by account/region, and change markup.

## Failure handling

- CAPTCHA or risk-control page: stop automation and request manual verification.
- Login required: ask the user to log in through their browser, then continue.
- SKU cannot be aligned: show separate groups rather than ranking them together.
- Coupon eligibility unknown: show a verified price plus a conditional best-case price.
- Quote older than the task's freshness requirement: re-check or mark stale.
- No reliable current price: say so directly and return discovery links, not invented values.
