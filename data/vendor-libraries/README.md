# Vendor Material Libraries

Generated: 2026-04-24T02:06:25.395Z

This dataset is a best-effort pull from official vendor sources checked on 2026-04-24.

Important caveat: "entire library" is realistic at the current product-line/storefront level, but not as an immutable all-time SKU mirror.
Color variants, bundles, refill/spool choices, and packaging weights change frequently on vendor stores.

## Filament Coverage

| Brand | Coverage | Count | Primary source |
| --- | --- | ---: | --- |
| Bambu Lab | product_line_level_from_official_sitemap | 39 | https://us.store.bambulab.com/sitemap_products_1.xml |
| Elegoo | official_storefront_product_feed | 17 | https://us.elegoo.com/ |
| eSUN | official_filament_index_pages | 73 | https://www.esun3d.com/filaments/ |
| SUNLU | official_catalog_navigation_material_lines | 53 | https://sunlu.com/collections/3d-printer-filament |
| Siraya Tech | official_storefront_product_feed | 23 | https://siraya.tech/ |
| Polymaker | official_storefront_product_feed | 76 | https://us.polymaker.com/ |
| Overture | official_storefront_product_feed | 42 | https://overture3d.com/ |
| ProtoPasta | official_storefront_product_feed | 191 | https://proto-pasta.com/ |

## Resin Coverage

| Brand | Coverage | Count | Primary source |
| --- | --- | ---: | --- |
| Siraya Tech | official_storefront_product_feed | 22 | https://siraya.tech/ |

## Notes

- `Bambu Lab` was built from the official product sitemap. Titles are inferred from official product handles where the storefront did not expose a clean product feed.
- `SUNLU` was built from the official catalog navigation payload because the site did not expose a stable public product JSON feed.
- `eSUN` was built from the official paginated filament index pages.
- `Elegoo`, `Siraya Tech`, `Polymaker`, `Overture`, and `ProtoPasta` were built from official storefront JSON feeds.
- `Siraya Tech resin library` is separate from the filament brands list and includes official resin product pages only.

