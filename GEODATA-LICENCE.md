# Geographic data — sources and licence

## Source

All coastlines, country outlines and state boundaries used in the map journey
come from **Natural Earth**.

| Layer in `scripts/geo-data.js` | Natural Earth dataset | Scale |
|---|---|---|
| `world` | `ne_110m_land` (via the `world-atlas` package) | 1:110m |
| `neighbours` | `ne_50m_admin_0_countries` (via `world-atlas`) | 1:50m |
| `india` | `ne_10m_admin_0_countries` (via `world-atlas`) | 1:10m |
| `indiaStates` | `ne_10m_admin_1_states_provinces` | 1:10m |
| `keralaMid`, `keralaHi` | `ne_10m_admin_1_states_provinces` (Kerala) | 1:10m |
| `nearStates` | `ne_10m_admin_1_states_provinces` (Karnataka, Tamil Nadu, Puducherry) | 1:10m |

- Natural Earth: https://www.naturalearthdata.com
- Repository used: https://github.com/nvkelso/natural-earth-vector
- Package used for the topology: `world-atlas` (npm), ISC licensed, data public domain

## Licence

**Natural Earth is in the public domain.** From the Natural Earth terms of use:
the data may be used, modified and redistributed for any purpose, commercial or
non-commercial, without permission or attribution. Attribution is nevertheless
credited in the site footer and here, because it costs nothing and is good
practice.

No licence fee, API key, attribution watermark or usage cap applies.

## What is deliberately NOT used

- **No Google Maps or Google Earth imagery.** Nothing has been screen-recorded,
  exported, scraped, traced or embedded from either product. Google's terms
  prohibit using Earth/Maps imagery as promotional footage, and no part of this
  site relies on it.
- **No commercial tile provider.** There is no Mapbox, Maptiler or similar
  dependency, so there is no API key to manage and no tile bill.
- **No satellite raster imagery of any kind.** The "satellite-inspired" look is
  achieved purely with vector fills and a colour ramp, so nothing needs to be
  licensed.

## How the data was prepared

`geo.py` (kept with the project handover, not required at runtime):

1. decodes the TopoJSON / GeoJSON sources,
2. splits any ring crossing the antimeridian so SVG fills correctly,
3. simplifies with Ramer–Douglas–Peucker at a tolerance chosen per layer,
4. projects to a Web-Mercator-style coordinate space,
5. writes `scripts/geo-data.js` (~150 KB uncompressed, ~45 KB gzipped).

To change a camera stop, edit `journey[].bounds` in `content/brandStory.js` —
regenerating the geography is not needed.
