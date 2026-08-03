# Vietnam Legacy Administrative Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the incomplete mock location catalog with the full 63-province legacy Vietnam catalog, remap every affected database reference, and permanently remove `Quận Mẫu 1` without changing application source code or database schema.

**Architecture:** A custom Drizzle SQL migration stages the pinned v2.4.1 administrative snapshot in temporary tables, captures all current foreign-key mappings, replaces the three location catalogs using official numeric codes as the existing integer ids, then restores references and validates the result in one transaction. A standalone SQL verification contract fails on the current mock database and passes after the migration; the same contract runs in a rollback dry-run before the live transaction.

**Tech Stack:** PostgreSQL, Supabase, Drizzle custom migrations, postgres.js, PowerShell

## Global Constraints

- This is database-only: do not modify backend or frontend runtime source files.
- Do not add columns, tables, enums, dependencies, or change existing database types.
- Use the three-tier 63-province legacy snapshot from `thanglequoc/vietnamese-provinces-database` release `v2.4.1`, commit `fc33b74`.
- Accept only the source file with SHA-256 `04bc47b359a9a122b2a3d13a5e90e066f44dc1671a01c1aaa5fb59cc8d05e444` and byte length `1,132,216`.
- Final catalog counts must be exactly 63 provinces, 696 districts, and 10,035 wards.
- Preserve the two `room_listings` rows whose `ward_id` is null.
- Remap 215 room listings, one roommate post, and 27 roommate-profile district preferences currently referencing the old catalog.
- Remove `Quận Mẫu 1` and every fake ward below it.
- Run destructive replacement and all assertions in one transaction; take a recoverable JSON backup immediately before the live transaction.

---

## File Structure

- `backend/supabase/tests/verify_vietnam_legacy_locations.sql`: Reusable database contract for catalog counts, referential integrity, fake-data removal, and serial sequences.
- `backend/supabase/migrations/0001_vietnam_legacy_locations.sql`: Complete custom migration, including staged snapshot rows, deterministic reference mapping, replacement, restoration, and inline safety assertions.
- `backend/supabase/migrations/meta/_journal.json`: Registers the custom migration with Drizzle; no schema snapshot changes are needed because the schema is unchanged.
- `backend/supabase/data/vietnam-admin-v2.4.1-NOTICE.md`: Records source URL, tag, commit, input checksum, expected counts, and the upstream MIT notice.
- `docs/superpowers/specs/2026-08-03-vietnam-legacy-administrative-data-design.md`: Adds the discovered roommate-post and roommate-profile foreign-key requirements.

### Task 1: Create the failing database verification contract

**Files:**
- Create: `backend/supabase/tests/verify_vietnam_legacy_locations.sql`

**Interfaces:**
- Consumes: The live `provinces`, `districts`, `wards`, `room_listings`, `roommate_posts`, and `roommate_profiles` tables.
- Produces: A SQL contract that returns normally only when the database satisfies the approved catalog and reference requirements.

- [ ] **Step 1: Write the verification SQL**

Create `backend/supabase/tests/verify_vietnam_legacy_locations.sql` with exact assertions:

```sql
DO $$
DECLARE
  province_count integer;
  district_count integer;
  ward_count integer;
  orphan_district_count integer;
  orphan_ward_count integer;
  orphan_room_count integer;
  orphan_post_count integer;
  orphan_profile_count integer;
  mock_district_count integer;
BEGIN
  SELECT count(*) INTO province_count FROM provinces;
  SELECT count(*) INTO district_count FROM districts;
  SELECT count(*) INTO ward_count FROM wards;

  IF province_count <> 63 THEN
    RAISE EXCEPTION 'expected 63 provinces, found %', province_count;
  END IF;
  IF district_count <> 696 THEN
    RAISE EXCEPTION 'expected 696 districts, found %', district_count;
  END IF;
  IF ward_count <> 10035 THEN
    RAISE EXCEPTION 'expected 10035 wards, found %', ward_count;
  END IF;

  SELECT count(*) INTO orphan_district_count
  FROM districts d LEFT JOIN provinces p ON p.id = d.province_id
  WHERE p.id IS NULL;

  SELECT count(*) INTO orphan_ward_count
  FROM wards w LEFT JOIN districts d ON d.id = w.district_id
  WHERE d.id IS NULL;

  SELECT count(*) INTO orphan_room_count
  FROM room_listings r LEFT JOIN wards w ON w.id = r.ward_id
  WHERE r.ward_id IS NOT NULL AND w.id IS NULL;

  SELECT count(*) INTO orphan_post_count
  FROM roommate_posts rp LEFT JOIN wards w ON w.id = rp.ward_id
  WHERE rp.ward_id IS NOT NULL AND w.id IS NULL;

  SELECT count(*) INTO orphan_profile_count
  FROM roommate_profiles rp LEFT JOIN districts d ON d.id = rp.preferred_district_id
  WHERE rp.preferred_district_id IS NOT NULL AND d.id IS NULL;

  SELECT count(*) INTO mock_district_count
  FROM districts WHERE name = 'Quận Mẫu 1';

  IF orphan_district_count + orphan_ward_count + orphan_room_count
     + orphan_post_count + orphan_profile_count <> 0 THEN
    RAISE EXCEPTION 'location foreign-key verification failed';
  END IF;

  IF mock_district_count <> 0 THEN
    RAISE EXCEPTION 'Quận Mẫu 1 still exists';
  END IF;

  IF EXISTS (
    SELECT 1 FROM room_listings
    WHERE ward_id IS NOT NULL AND nullif(btrim(address_detail), '') IS NULL
  ) THEN
    RAISE EXCEPTION 'a located room listing has no address_detail';
  END IF;

  IF EXISTS (
    SELECT 1 FROM roommate_posts
    WHERE ward_id IS NOT NULL AND nullif(btrim(address_detail), '') IS NULL
  ) THEN
    RAISE EXCEPTION 'a located roommate post has no address_detail';
  END IF;

  IF (SELECT last_value FROM provinces_id_seq) < (SELECT max(id) FROM provinces)
     OR (SELECT last_value FROM districts_id_seq) < (SELECT max(id) FROM districts)
     OR (SELECT last_value FROM wards_id_seq) < (SELECT max(id) FROM wards) THEN
    RAISE EXCEPTION 'a location sequence is behind its table maximum';
  END IF;
END $$;
```

- [ ] **Step 2: Run the contract against the current database and verify failure**

Run from `backend`:

```powershell
npx --% tsx -e "import {config} from 'dotenv'; import postgres from 'postgres'; import {readFileSync} from 'node:fs'; config({path:'.env'}); const sql=postgres(process.env.DATABASE_URL!,{prepare:false}); const run=async()=>{await sql.unsafe(readFileSync('supabase/tests/verify_vietnam_legacy_locations.sql','utf8')); await sql.end();}; run().catch(async error=>{console.error(error.message); await sql.end(); process.exit(1);});"
```

Expected: FAIL with `expected 63 provinces, found 6`. This proves the contract detects the current incomplete catalog.

- [ ] **Step 3: Commit the failing database contract**

```powershell
git add backend/supabase/tests/verify_vietnam_legacy_locations.sql
git commit -m "test: define Vietnam location catalog contract"
```

### Task 2: Build the complete database migration

**Files:**
- Create: `backend/supabase/migrations/0001_vietnam_legacy_locations.sql`
- Create: `backend/supabase/data/vietnam-admin-v2.4.1-NOTICE.md`
- Modify: `backend/supabase/migrations/meta/_journal.json`

**Interfaces:**
- Consumes: The pinned upstream JSON hierarchy and all current foreign keys into `districts` and `wards`.
- Produces: An idempotent custom Drizzle migration that leaves the existing schema unchanged and satisfies the Task 1 SQL contract.

- [ ] **Step 1: Register a custom Drizzle migration**

Run from `backend`:

```powershell
npx drizzle-kit generate --custom --name vietnam_legacy_locations
```

Expected: Drizzle creates the `0001_vietnam_legacy_locations.sql` custom migration and adds index 1 to `supabase/migrations/meta/_journal.json`. Do not generate or modify a schema snapshot.

- [ ] **Step 2: Download and authenticate the exact upstream source**

Run from the repository root:

```powershell
$sourceUrl = 'https://raw.githubusercontent.com/thanglequoc/vietnamese-provinces-database/fc33b74/json/vn_only_simplified_json_generated_data_vn_units.json'
$sourcePath = Join-Path ([IO.Path]::GetTempPath()) 'vietnam-admin-fc33b74.json'
Invoke-WebRequest -UseBasicParsing -Uri $sourceUrl -OutFile $sourcePath
$sourceFile = Get-Item -LiteralPath $sourcePath
$sourceHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $sourcePath).Hash.ToLowerInvariant()
if ($sourceFile.Length -ne 1132216) { throw "Unexpected source length: $($sourceFile.Length)" }
if ($sourceHash -ne '04bc47b359a9a122b2a3d13a5e90e066f44dc1671a01c1aaa5fb59cc8d05e444') { throw "Unexpected source hash: $sourceHash" }
Write-Output "Verified $sourcePath"
```

Expected: prints `Verified ...vietnam-admin-fc33b74.json`.

- [ ] **Step 3: Generate only the staged catalog rows from the authenticated JSON**

Mechanically transform the source into three temporary-table inserts. The transformation must:

```text
for each province:
  emit (province.Code, province.FullName)
  for each district:
    emit (district.Code, district.ProvinceCode, district.FullName)
    for each ward:
      emit (ward.Code, ward.DistrictCode, ward.FullName)
```

Escape each SQL string by replacing `'` with `''`. Generate these exact temporary interfaces:

```sql
CREATE TEMP TABLE _source_provinces (
  code text PRIMARY KEY,
  full_name text NOT NULL
) ON COMMIT DROP;

CREATE TEMP TABLE _source_districts (
  code text PRIMARY KEY,
  province_code text NOT NULL,
  full_name text NOT NULL
) ON COMMIT DROP;

CREATE TEMP TABLE _source_wards (
  code text PRIMARY KEY,
  district_code text NOT NULL,
  full_name text NOT NULL
) ON COMMIT DROP;
```

The generated statements must target only `_source_provinces`, `_source_districts`, and `_source_wards`; do not create upstream administrative-region/unit tables in the application database.

- [ ] **Step 4: Add the deterministic real-address pool**

Inside the migration, create `_location_pool(group_name, slot, ward_id, street_name)` and insert these reviewed targets:

```sql
INSERT INTO _location_pool(group_name, slot, ward_id, street_name) VALUES
  ('hcm', 1, 26740, 'Lê Thánh Tôn'),
  ('hcm', 2, 27139, 'Nguyễn Đình Chiểu'),
  ('hcm', 3, 26920, 'Nguyễn Gia Trí'),
  ('hcm', 4, 26884, 'Quang Trung'),
  ('hcm', 5, 26965, 'Bạch Đằng'),
  ('hcm', 6, 26956, 'Nguyễn Hữu Cảnh'),
  ('hcm', 7, 26800, 'Hoàng Diệu 2'),
  ('hcm', 8, 27088, 'Nguyễn Văn Hưởng'),
  ('hanoi', 1, 00175, 'Trần Duy Hưng'),
  ('hanoi', 2, 00167, 'Xuân Thủy'),
  ('hanoi', 3, 00163, 'Hồ Tùng Mậu'),
  ('hanoi', 4, 00199, 'Láng Hạ'),
  ('hanoi', 5, 00277, 'Tạ Quang Bửu'),
  ('hanoi', 6, 00346, 'Nguyễn Trãi'),
  ('hanoi', 7, 00625, 'Lê Đức Thọ'),
  ('hanoi', 8, 09541, 'Trần Phú'),
  ('hub', 1, 20242, 'Nguyễn Văn Linh'),
  ('hub', 2, 20272, 'Phạm Văn Đồng'),
  ('hub', 3, 31149, 'Nguyễn Văn Cừ'),
  ('hub', 4, 11405, 'Trần Nguyên Hãn'),
  ('hub', 5, 25942, 'Nguyễn An Ninh'),
  ('hub', 6, 25966, 'Cách Mạng Tháng Tám'),
  ('hub', 7, 26008, 'Đồng Khởi'),
  ('regional', 1, 19783, 'Nguyễn Huệ'),
  ('regional', 2, 22363, 'Trần Phú'),
  ('regional', 3, 26509, 'Phan Chu Trinh'),
  ('regional', 4, 24781, 'Bùi Thị Xuân'),
  ('regional', 5, 21577, 'Nguyễn Thái Học'),
  ('regional', 6, 16672, 'Lê Hồng Phong'),
  ('regional', 7, 14782, 'Hải Thượng Lãn Ông'),
  ('regional', 8, 06673, 'Hạ Long'),
  ('regional', 9, 05440, 'Hoàng Văn Thụ'),
  ('regional', 10, 24136, 'Phan Chu Trinh'),
  ('regional', 11, 28249, 'Ấp Bắc'),
  ('regional', 12, 30280, 'Lý Tự Trọng'),
  ('regional', 13, 30745, 'Nguyễn Trung Trực'),
  ('regional', 14, 32008, 'Phan Ngọc Hiển');
```

Before remapping, assert every `ward_id` in `_location_pool` exists in `_source_wards`.

- [ ] **Step 5: Capture every current foreign-key mapping before deletion**

Create temporary maps with the current record ids and target official ids:

```sql
CREATE TEMP TABLE _room_location_map (
  room_id integer PRIMARY KEY,
  target_ward_id integer NOT NULL,
  new_address_detail text NOT NULL
) ON COMMIT DROP;

CREATE TEMP TABLE _post_location_map (
  post_id integer PRIMARY KEY,
  target_ward_id integer NOT NULL,
  new_address_detail text NOT NULL
) ON COMMIT DROP;

CREATE TEMP TABLE _profile_district_map (
  profile_id integer PRIMARY KEY,
  target_district_id integer NOT NULL
) ON COMMIT DROP;
```

For rooms, select a group with `mod(room_listings.id, 100)`:

```sql
CASE
  WHEN mod(r.id, 100) < 33 THEN 'hcm'
  WHEN mod(r.id, 100) < 60 THEN 'hanoi'
  WHEN mod(r.id, 100) < 85 THEN 'hub'
  ELSE 'regional'
END
```

Within the group, choose `slot = 1 + mod(r.id, group_size)` and build the address as:

```sql
(20 + mod(r.id * 37, 480))::text || ' ' || street_name
```

Map the one fake roommate post to ward `26740` with `(20 + mod(post_id * 37, 480)) || ' Lê Thánh Tôn'`.

Map all current roommate-profile preferences with this exact rule:

```sql
CASE d.name
  WHEN 'Quận Mẫu 1' THEN (ARRAY[760, 764, 765, 769])[1 + mod(rp.id, 4)]
  WHEN 'Quận Cầu Giấy' THEN 5
  WHEN 'Quận 1' THEN 760
  WHEN 'Quận 2' THEN 769
  WHEN 'Quận 3' THEN 770
  WHEN 'Quận 10' THEN 771
  WHEN 'Quận Gò Vấp' THEN 764
  WHEN 'TP. Thủ Đức' THEN 769
  ELSE NULL
END
```

Assert `_room_location_map` covers every non-null `room_listings.ward_id`, `_post_location_map` covers every non-null `roommate_posts.ward_id`, and `_profile_district_map` covers every non-null `roommate_profiles.preferred_district_id`. Abort instead of deleting if any reference is unmapped.

- [ ] **Step 6: Replace catalogs and restore references inside the transaction**

After capturing the maps, execute the minimal replacement:

```sql
UPDATE room_listings SET ward_id = NULL
WHERE id IN (SELECT room_id FROM _room_location_map);

UPDATE roommate_posts SET ward_id = NULL
WHERE id IN (SELECT post_id FROM _post_location_map);

UPDATE roommate_profiles SET preferred_district_id = NULL
WHERE id IN (SELECT profile_id FROM _profile_district_map);

DELETE FROM wards;
DELETE FROM districts;
DELETE FROM provinces;

INSERT INTO provinces(id, name)
SELECT code::integer, full_name FROM _source_provinces ORDER BY code::integer;

INSERT INTO districts(id, province_id, name)
SELECT code::integer, province_code::integer, full_name
FROM _source_districts ORDER BY code::integer;

INSERT INTO wards(id, district_id, name)
SELECT code::integer, district_code::integer, full_name
FROM _source_wards ORDER BY code::integer;

UPDATE room_listings r
SET ward_id = m.target_ward_id, address_detail = m.new_address_detail
FROM _room_location_map m WHERE m.room_id = r.id;

UPDATE roommate_posts rp
SET ward_id = m.target_ward_id, address_detail = m.new_address_detail
FROM _post_location_map m WHERE m.post_id = rp.id;

UPDATE roommate_profiles rp
SET preferred_district_id = m.target_district_id
FROM _profile_district_map m WHERE m.profile_id = rp.id;

SELECT setval(pg_get_serial_sequence('provinces', 'id'), (SELECT max(id) FROM provinces), true);
SELECT setval(pg_get_serial_sequence('districts', 'id'), (SELECT max(id) FROM districts), true);
SELECT setval(pg_get_serial_sequence('wards', 'id'), (SELECT max(id) FROM wards), true);
```

Wrap replacement logic in an idempotency guard: if counts are already `63/696/10035` and `Quận Mẫu 1` is absent, validate references and return without deleting or remapping again.

- [ ] **Step 7: Add inline preconditions and postconditions**

Before deletion, assert source counts, source parent codes, target pool wards, and complete map coverage. After restoration, assert exact counts, zero orphan references, no `Quận Mẫu 1`, no fake wards, restored reference counts, and sequences at or above maximum ids. Every failure must use `RAISE EXCEPTION` so the outer transaction rolls back.

- [ ] **Step 8: Record source and license**

Create `backend/supabase/data/vietnam-admin-v2.4.1-NOTICE.md` containing:

```markdown
# Vietnam administrative data v2.4.1 notice

- Source: https://github.com/thanglequoc/vietnamese-provinces-database
- Release: https://github.com/thanglequoc/vietnamese-provinces-database/releases/tag/v2.4.1
- Commit: fc33b74
- Input: json/vn_only_simplified_json_generated_data_vn_units.json
- Bytes: 1,132,216
- SHA-256: 04bc47b359a9a122b2a3d13a5e90e066f44dc1671a01c1aaa5fb59cc8d05e444
- Expected records: 63 provinces, 696 districts, 10,035 wards

MIT License

Copyright (c) 2021 Thang Le Quoc

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 9: Validate generated files statically**

Run from the repository root:

```powershell
git diff --check
rg -n "fc33b74|04bc47b359a9a122b2a3d13a5e90e066f44dc1671a01c1aaa5fb59cc8d05e444|Quận Mẫu 1|10035|roommate_posts|roommate_profiles" backend/supabase
git diff --name-only
```

Expected: only database migration/test/data files, Drizzle journal metadata, the approved spec, and this plan are changed; no file under `backend/src` or `frontend/src` appears.

### Task 3: Prove the migration in a rollback dry-run

**Files:**
- Test: `backend/supabase/tests/verify_vietnam_legacy_locations.sql`
- Test: `backend/supabase/migrations/0001_vietnam_legacy_locations.sql`

**Interfaces:**
- Consumes: The complete Task 2 migration and Task 1 verification contract.
- Produces: Evidence that the migration passes on the real current data while leaving that database unchanged.

- [ ] **Step 1: Record the pre-dry-run fingerprint**

Query and save the counts of provinces, districts, wards, located rooms, located roommate posts, and preferred districts. Expected current values are `6`, `11`, `13`, `215`, `1`, and `27` respectively.

- [ ] **Step 2: Execute migration plus verification and force rollback**

Run from `backend`:

```powershell
npx --% tsx -e "import {config} from 'dotenv'; import postgres from 'postgres'; import {readFileSync} from 'node:fs'; config({path:'.env'}); const sql=postgres(process.env.DATABASE_URL!,{prepare:false}); const migration=readFileSync('supabase/migrations/0001_vietnam_legacy_locations.sql','utf8'); const verify=readFileSync('supabase/tests/verify_vietnam_legacy_locations.sql','utf8'); const run=async()=>{try{await sql.begin(async tx=>{await tx.unsafe(migration); await tx.unsafe(verify); throw new Error('__EXPECTED_ROLLBACK__');});}catch(error){if(error instanceof Error&&error.message==='__EXPECTED_ROLLBACK__'){console.log('migration verification passed; rollback complete');}else{throw error;}}finally{await sql.end();}}; run();"
```

Expected: `migration verification passed; rollback complete`.

- [ ] **Step 3: Confirm rollback restored the pre-dry-run fingerprint**

Re-run the Task 3 Step 1 counts. Expected: exactly `6`, `11`, `13`, `215`, `1`, and `27`, proving the dry-run did not mutate the live database.

- [ ] **Step 4: Commit the migration implementation**

```powershell
git add backend/supabase/migrations/0001_vietnam_legacy_locations.sql backend/supabase/migrations/meta/_journal.json backend/supabase/data/vietnam-admin-v2.4.1-NOTICE.md
git commit -m "feat: replace mock Vietnam location catalog"
```

### Task 4: Back up and apply the live database transaction

**Files:**
- No repository file changes.
- Create outside the repository: `%TEMP%/trouytin-location-backup-2026-08-03.json`.

**Interfaces:**
- Consumes: The dry-run-proven migration and live `DATABASE_URL`.
- Produces: The full real catalog and remapped references in the live database, plus a recoverable pre-migration JSON snapshot.

- [ ] **Step 1: Export the exact recoverable backup**

Using postgres.js, write one JSON object containing all rows from `provinces`, `districts`, and `wards`, plus `id/ward_id/address_detail` from both listing tables and `id/preferred_district_id` from `roommate_profiles`, to:

```text
%TEMP%/trouytin-location-backup-2026-08-03.json
```

After writing, confirm the file exists, is non-empty, and contains counts `6/11/13/217/1/27` for catalog/listing/profile collections. Do not add the backup to git.

- [ ] **Step 2: Apply migration and verification in one committed transaction**

Run from `backend` with the same postgres.js loader used in Task 3, but remove the rollback sentinel:

```ts
await sql.begin(async (tx) => {
  await tx.unsafe(migration);
  await tx.unsafe(verify);
});
```

Expected: transaction commits with no exception.

- [ ] **Step 3: Run the verification contract independently**

Run the Task 1 verification command again.

Expected: PASS with exit code 0.

- [ ] **Step 4: Verify exact post-migration summaries**

Run read-only queries and confirm:

- catalog counts are `63/696/10035`;
- `Quận Mẫu 1` count is `0`;
- non-null room `ward_id` count remains `215` and null count remains `2`;
- non-null roommate-post `ward_id` count remains `1`;
- non-null roommate-profile `preferred_district_id` count remains `27`;
- joined room locations include multiple provinces and districts in the four requested allocation groups.

### Task 5: Verify the application and update PR #6

**Files:**
- No expected repository source changes.

**Interfaces:**
- Consumes: The migrated live database and existing backend/frontend applications.
- Produces: Browser and API evidence, pushed commits, and an updated existing pull request.

- [ ] **Step 1: Run repository checks**

```powershell
git diff --check
git status --short --branch
```

Run from `frontend`:

```powershell
npm test
```

Expected: the existing 15 frontend utility tests pass. Do not fix unrelated baseline TypeScript build errors.

- [ ] **Step 2: Verify the backend API**

With the backend server running on port 3000, request the room-listing endpoint and inspect a sample. Confirm joined province/district/ward names are non-null and `Quận Mẫu 1` does not appear.

- [ ] **Step 3: Browser-QA the three affected flows**

Open the existing frontend at `http://localhost:5173` and verify:

- homepage cards show varied real districts;
- search location filter lists all 63 provinces and loads correct districts for at least Hà Nội, Thành phố Hồ Chí Minh, and Đà Nẵng;
- post-listing selectors load valid district and ward children;
- searching the rendered page text finds no `Quận Mẫu 1`.

- [ ] **Step 4: Push and inspect PR #6**

```powershell
git push origin feat/home-search-listing-improvements
gh pr view 6 --json url,state,headRefName,commits
```

Expected: PR #6 remains open, points to `feat/home-search-listing-improvements`, and includes the verification-contract and migration commits.

- [ ] **Step 5: Report destructive-change recovery details**

Report that the old partial catalog and `Quận Mẫu 1` were removed, list the live post-migration counts, and provide the exact temporary backup path for recovery. Do not claim success without the fresh SQL, API, browser, and git outputs from the preceding steps.
