# Platform Notes

Use these notes as connector guidance. Platform behavior and API availability can change; verify current official documentation before implementation.

## Taobao and Tmall

- Treat Taobao marketplace sellers and Tmall stores as different seller types.
- Check SKU-specific price, shop coupon, platform coupon, cross-store promotion, membership price, freight, and presale deposit/final-payment rules.
- Search cards often show a promotional floor price that applies only to selected SKUs or eligible accounts.
- Prefer Taobao Open Platform or authorized affiliate/partner access for a production integration.

## JD

- Distinguish JD self-operated, brand flagship, and marketplace sellers.
- Record JD Plus pricing, government/platform subsidies, coupons, trade-in bonuses, service plans, and regional stock.
- Delivery and after-sales value may justify ranking a slightly higher self-operated offer separately.
- Prefer JD Open Platform or an authorized affiliate interface.

## Pinduoduo

- Distinguish normal purchase, group purchase, new-user price, limited subsidy, and invitation-dependent offers.
- Record whether the quote is from 百亿补贴 and whether the exact SKU is covered.
- Treat extremely low search-card prices as unverified until the SKU and checkout amount are visible.
- Use authorized open-platform or promotion APIs where available.

## Suning and Vipshop

- Verify inventory by delivery region.
- Record membership, flash-sale windows, coupons, and seller/fulfillment identity.
- Treat expired campaign landing-page prices as stale.

## Douyin Shop and Kuaishou Shop

- Live-room, fan, new-user, timed, and creator-specific coupons are conditional.
- A video or live-room headline is discovery evidence, not a verified payable price.
- Prefer authorized commerce/open-platform APIs; browser automation may be fragile and account-specific.

## Xianyu and other resale markets

- Never mix used/refurbished listings with new retail offers.
- Record condition, seller claims, included accessories, warranty, inspection support, and shipping.
- Price alone is not enough to rank unique second-hand goods.

## Connector checklist

For every connector:

1. Document authentication and authorization.
2. Capture exact SKU attributes and product identifiers.
3. Preserve source URL and collection timestamp.
4. Return raw price components, not only one computed number.
5. Surface CAPTCHA, login, unavailable stock, and parsing uncertainty as explicit states.
6. Add a fixture for each page/API response shape before changing normalization logic.
