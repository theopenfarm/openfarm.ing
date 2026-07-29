-- The stitched image a flight produces, alongside the vectors it produces.
--
-- A mapping flight lands two things: the detections and prescription the site
-- already stores, and the orthomosaic - the hundreds of overlapping frames
-- stitched and orthorectified into one picture of the whole field. Only the
-- second one lets a farmer see the ground rather than a plan of it, so the
-- map needs it as a basemap under the vectors.
--
-- The image itself lives on disk (or a bucket) and only its address is stored
-- here: orthomosaics run to hundreds of megabytes and have no business in a
-- row. `orthomosaic_bounds` registers it to the field's own normalised 0..1
-- space as [minX, minY, maxX, maxY], because a stitch always covers more
-- ground than the boundary - the aircraft overflies the edges - so drawing it
-- at 0,0,1,1 would put the image out of register with every detection on top
-- of it. `orthomosaic_resolution_cm` is the stitched output's ground sample
-- distance, which is usually coarser than the capture resolution the
-- detection pass ran at.
--
-- Hand-written because `buddy generate:migrations` diffs a model's attributes
-- into a CREATE TABLE, and this table already exists.
ALTER TABLE "missions" ADD COLUMN "orthomosaic_url" TEXT;
ALTER TABLE "missions" ADD COLUMN "orthomosaic_bounds" TEXT;
ALTER TABLE "missions" ADD COLUMN "orthomosaic_resolution_cm" INTEGER;
