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
  FROM districts d
  LEFT JOIN provinces p ON p.id = d.province_id
  WHERE p.id IS NULL;

  SELECT count(*) INTO orphan_ward_count
  FROM wards w
  LEFT JOIN districts d ON d.id = w.district_id
  WHERE d.id IS NULL;

  SELECT count(*) INTO orphan_room_count
  FROM room_listings r
  LEFT JOIN wards w ON w.id = r.ward_id
  WHERE r.ward_id IS NOT NULL AND w.id IS NULL;

  SELECT count(*) INTO orphan_post_count
  FROM roommate_posts rp
  LEFT JOIN wards w ON w.id = rp.ward_id
  WHERE rp.ward_id IS NOT NULL AND w.id IS NULL;

  SELECT count(*) INTO orphan_profile_count
  FROM roommate_profiles rp
  LEFT JOIN districts d ON d.id = rp.preferred_district_id
  WHERE rp.preferred_district_id IS NOT NULL AND d.id IS NULL;

  SELECT count(*) INTO mock_district_count
  FROM districts
  WHERE name = 'Quận Mẫu 1';

  IF orphan_district_count
     + orphan_ward_count
     + orphan_room_count
     + orphan_post_count
     + orphan_profile_count <> 0 THEN
    RAISE EXCEPTION 'location foreign-key verification failed';
  END IF;

  IF mock_district_count <> 0 THEN
    RAISE EXCEPTION 'Quận Mẫu 1 still exists';
  END IF;

  IF NOT has_table_privilege('anon', 'public.provinces', 'SELECT')
     OR NOT has_table_privilege('anon', 'public.districts', 'SELECT')
     OR NOT has_table_privilege('anon', 'public.wards', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.provinces', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.districts', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.wards', 'SELECT') THEN
    RAISE EXCEPTION 'location catalog is not readable by application roles';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM room_listings
    WHERE ward_id IS NOT NULL
      AND nullif(btrim(address_detail), '') IS NULL
  ) THEN
    RAISE EXCEPTION 'a located room listing has no address_detail';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM roommate_posts
    WHERE ward_id IS NOT NULL
      AND nullif(btrim(address_detail), '') IS NULL
  ) THEN
    RAISE EXCEPTION 'a located roommate post has no address_detail';
  END IF;

  IF (SELECT last_value FROM provinces_id_seq) < (SELECT max(id) FROM provinces)
     OR (SELECT last_value FROM districts_id_seq) < (SELECT max(id) FROM districts)
     OR (SELECT last_value FROM wards_id_seq) < (SELECT max(id) FROM wards) THEN
    RAISE EXCEPTION 'a location sequence is behind its table maximum';
  END IF;
END $$;
