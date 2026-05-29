# Database Schema

## Database

Name: `soukclick`

Use PostgreSQL with SQLAlchemy and Alembic migrations.

## Core Tables

### products

- `id`
- `slug`
- `name`
- `darija_name`
- `headline`
- `subheadline`
- `description`
- `category_id`
- `base_price`
- `currency`
- `is_active`
- `stock_quantity`
- `stock_status`
- `created_at`
- `updated_at`

### product_media

- `id`
- `product_id`
- `type` (`image`, `video`)
- `url`
- `alt_text`
- `sort_order`
- `is_primary`

### product_offers

- `id`
- `product_id`
- `quantity`
- `price`
- `label`
- `badge`
- `savings_text`
- `is_default`

Default offers:

- Quantity 1: 199 MAD.
- Quantity 2: 279 MAD.
- Quantity 3: 349 MAD.

### categories

- `id`
- `slug`
- `name`
- `darija_name`
- `description`
- `sort_order`
- `is_active`

### product_reviews

- `id`
- `product_id`
- `customer_name`
- `city`
- `rating`
- `body`
- `is_featured`
- `created_at`

### product_faqs

- `id`
- `product_id`
- `question`
- `answer`
- `sort_order`

### product_cro_blocks

- `id`
- `product_id`
- `block_type`
- `title`
- `body`
- `image_url`
- `sort_order`

Block types:

- `problem`
- `solution`
- `benefit`
- `before_after`
- `ugc`
- `trust`

### product_relations

- `id`
- `product_id`
- `related_product_id`
- `relation_type`
- `sort_order`

Relation types:

- `cross_sell`
- `frequently_bought_together`
- `upsell`

## Orders

### orders

- `id`
- `public_order_id`
- `customer_name`
- `phone_raw`
- `phone_normalized`
- `city`
- `address`
- `subtotal`
- `delivery_fee`
- `discount_total`
- `total`
- `currency`
- `payment_method`
- `status`
- `confirmation_status`
- `fraud_status`
- `fraud_score`
- `ip_address`
- `user_agent`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `fbp`
- `fbc`
- `ttp`
- `snap_click_id`
- `created_at`
- `updated_at`

### order_items

- `id`
- `order_id`
- `product_id`
- `product_name_snapshot`
- `quantity`
- `unit_price`
- `total_price`
- `offer_label`
- `item_type`

Item types:

- `main`
- `cross_sell`
- `upsell`

### order_events

- `id`
- `order_id`
- `event_type`
- `payload`
- `created_at`

Use for audit trail:

- `created`
- `upsell_accepted`
- `upsell_skipped`
- `webhook_sent`
- `tracking_sent`
- `fraud_flagged`

## Fraud

### fraud_checks

- `id`
- `order_id`
- `phone_normalized`
- `ip_address`
- `country_code`
- `is_vpn`
- `is_proxy`
- `is_suspicious`
- `duplicate_phone_count`
- `velocity_count`
- `decision`
- `reason`
- `created_at`

## Tracking

### tracking_events

- `id`
- `event_id`
- `event_name`
- `order_id`
- `platform`
- `payload`
- `sent_at`
- `status`
- `error_message`
- `created_at`

## Future Admin Tables

When admin is built, add:

- `admin_users`
- `product_inventory_movements`
- `discount_rules`
- `shipping_zones`
- `confirmation_agents`

