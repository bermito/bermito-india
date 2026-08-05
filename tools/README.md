# One-off preparation scripts

Not needed at runtime or to deploy. Kept so the generated data can be
reproduced or regenerated.

- `build-geodata.py` — rebuilds `scripts/geo-data.js` from Natural Earth
  sources. Requires `world-atlas` (npm) and `ne_10m_admin_1_states_provinces.geojson`
  in the working directory. See `../GEODATA-LICENCE.md`.
- `extract-brand-assets.py` — recovers the approved logo, tagline disk, tasting
  illustrations and value icons as SVG from `Bermito_Guidelines_2026.pdf`.
  Requires `pdftocairo` (poppler) output in `svg/pNN.svg` and `svgelements`.
  Only needed if Curb Studio's master SVGs never turn up.
