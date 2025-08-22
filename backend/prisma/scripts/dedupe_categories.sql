-- Dedupe Category rows by (companyId, name)
-- Strategy: keep the best candidate (active preferred, then oldest), reassign references, delete duplicates.

BEGIN;

WITH ranked AS (
  SELECT
    id,
    "companyId",
    name,
    "deletedAt",
    "createdAt",
    ROW_NUMBER() OVER (
      PARTITION BY "companyId", name
      ORDER BY (CASE WHEN "deletedAt" IS NULL THEN 0 ELSE 1 END), "createdAt" ASC, id ASC
    ) AS rn
  FROM "Category"
),
keepers AS (
  SELECT id AS keep_id, "companyId", name FROM ranked WHERE rn = 1
),
dups AS (
  SELECT r.id AS dup_id, k.keep_id
  FROM ranked r
  JOIN keepers k
    ON r."companyId" = k."companyId" AND r.name = k.name
  WHERE r.rn > 1
)
-- Reassign children categories' parentId from duplicate to keeper
UPDATE "Category" c
SET "parentId" = d.keep_id
FROM dups d
WHERE c."parentId" = d.dup_id;

-- Reassign products to keeper category
UPDATE "Product" p
SET "categoryId" = d.keep_id
FROM dups d
WHERE p."categoryId" = d.dup_id;

-- Finally, delete duplicate categories
DELETE FROM "Category" c
USING dups d
WHERE c.id = d.dup_id;

COMMIT;
