-- Casa del Vino — the two configuration rows the shop needs. Safe to run on a
-- project where 0001_schema.sql has already been applied; re-running is harmless.
-- No bottles are added here: those come from Admin → Add bottle.

-- The shelves from the design. Add more with another insert if needed.
insert into public.categories (id, name, icon, sort) values
  ('red-wine',            'Red wine',            'wine',    1),
  ('white-wine',          'White wine',          'wine',    2),
  ('vermouth',            'Vermouth',            'martini', 3),
  ('vodka',               'Vodka',               'glass',   4),
  ('cream-liqueur',       'Cream liqueur',       'cream',   5),
  ('scotch-whisky',       'Scotch whisky',       'whisky',  6),
  ('non-alcoholic-red',   'Non-alcoholic red',   'leaf',    7),
  ('non-alcoholic-white', 'Non-alcoholic white', 'leaf',    8)
on conflict (id) do nothing;

-- The single settings row read by checkout and the Contact page.
-- Placeholders — change them in Admin → Settings.
insert into public.settings (id, email, phone, hours, address, free_ship_cents, standard_ship_cents, express_ship_cents) values
  (1, 'info@casadelvino.shop', '+34 600 000 000', 'Mon–Sat, 10:00–20:00', 'Calle del Vino 12, Madrid', 6000, 690, 1290)
on conflict (id) do nothing;
