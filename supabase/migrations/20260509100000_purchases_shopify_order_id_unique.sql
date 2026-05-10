create unique index if not exists purchases_shopify_order_id_unique
on public.purchases (shopify_order_id)
where shopify_order_id is not null and shopify_order_id <> '';
