# Product photos from a designer's spec book

Extracted by `tools/designer-specbook-images.py` and committed so Airtable can
ingest them by URL into the Palettes `Photo` field. Airtable copies an image on
ingest, so nothing here is hot-linked once the load has run.

Named `<spec tag>-<model>-<description>`. The tag is the designer's code for
that job (`PL-1`, `HD-7`); it is kept in the filename only as provenance - a tag
means something different on the next job, which is why it lives on Selections
and not in the catalog.

**Products only.** The extractor matches a photo to a tagged product caption, so
the room renderings, elevations and finish boards in these books are never
picked up. Nothing here identifies a client. Tile and slab boards are also left
out: they name a pattern and a size but no manufacturer, so they are not catalog
rows yet.
