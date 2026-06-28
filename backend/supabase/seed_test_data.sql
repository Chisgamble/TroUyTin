-- Insert 2 Mock Users (1 Tenant, 1 Landlord)
INSERT INTO profiles (id, email, username, full_name, role, is_verified, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'tenant@test.com', 'tenant1', 'Nguyen Van Tenant', 'TENANT', true, true),
  ('22222222-2222-2222-2222-222222222222', 'landlord@test.com', 'landlord1', 'Tran Van Landlord', 'LANDLORD', true, true)
ON CONFLICT (id) DO NOTHING;

-- Insert 1 Mock Room Listing
INSERT INTO room_listings (id, landlord_id, title, description, price, area, room_type, status, is_verified)
VALUES
  (9999, '22222222-2222-2222-2222-222222222222', 'Phòng trọ cao cấp', 'Phòng đẹp có điều hòa', 3000000, 25, 'PHONG_TRO', 'RENTED', true)
ON CONFLICT (id) DO NOTHING;

