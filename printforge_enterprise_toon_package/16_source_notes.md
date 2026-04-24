# PrintForge Ops source notes

These notes summarize selected official or vendor-primary references checked on 2026-04-23 to ground parts of the starter package.

## Printers
- Bambu Lab A1 technical specs page indicated a 256 x 256 x 256 mm build volume.
- Bambu Lab P1S official store pages indicated a 256 x 256 x 256 mm build volume.
- Bambu Lab X1 Carbon technical specification PDF indicated a 256 x 256 x 256 mm build volume.
- Bambu Lab X1E technical specification PDF indicated a 256 x 256 x 256 mm build volume and active chamber-heating support.
- Anycubic Kobra S1 official store page indicated a 250 x 250 x 250 mm build volume, enclosed CoreXY construction, and 320C hotend language.
- Creality K2 Plus official store pages indicated a 350 x 350 x 350 mm build volume.
- Sovol SV08 official product page indicated a 350 x 350 x 345 mm build volume and open-source / CoreXY positioning.
- Elegoo Saturn 4 Ultra 16K official product pages indicated a high-speed 16K resin workflow with up to 150 mm/h speed.

## Materials / brands
- Bambu Lab maintains official filament collection structures.
- Polymaker and Fiberon maintain official product structures for major filament categories and composite families.
- eSUN maintains official filament category structures spanning multiple material families.

## Siraya Tech
- Siraya Tech official resin collection pages indicated a broad 3D printing resin catalog and engineering resin grouping.
- Official engineering collection references explicitly included lines such as Tenacious, Blu, and Magna.
- The platform package therefore models Siraya as a flexible brand catalog, not a fixed hardcoded list.

## Firebase
- Firebase official docs describe Firestore as a document-oriented database with collections, documents, and subcollections.
- Firebase official docs support Google sign-in, real-time listeners, and Cloud Storage upload flows.

This starter package uses those references to shape the seed dataset and architecture, but it intentionally remains extensible rather than pretending to mirror every live vendor catalog SKU in existence.