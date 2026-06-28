// ============================================================
// MOCK DATA – TroUyTin
// Dữ liệu giả lập cho phát triển UI
// ============================================================

// ---------- TYPES ----------

export type User = {
  id: string | number;
  email: string;
  phone: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  auth_provider: 'EMAIL' | 'GOOGLE';
  role: 'TENANT' | 'LANDLORD' | 'ROOMMATE_SEEKER' | 'BROKER' | 'ADMIN';
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
};

export type Province = {
  id: number;
  name: string;
};

export type District = {
  id: number;
  province_id: number;
  name: string;
};

export type Ward = {
  id: number;
  district_id: number;
  name: string;
};

export type Amenity = {
  id: number;
  name: string;
  icon: string;
};

export type RoomListing = {
  id: number | string;
  landlord_id: string | number;
  title: string;
  description: string;
  price: number;
  deposit: number;
  area: number;
  room_type: 'PHONG_TRO' | 'CAN_HO_MINI' | 'KTX' | 'NGUYEN_CAN';
  ward_id: number;
  address_detail: string;
  latitude: number;
  longitude: number;
  status: 'AVAILABLE' | 'RENTED' | 'PENDING' | 'HIDDEN';
  is_verified: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  // Computed / joined fields
  images: string[];
  amenity_ids: number[];
  district_name: string;
  ward_name: string;
  landlord?: User;
};

export type Review = {
  id: number;
  reviewer_id: number;
  reviewee_id: number;
  listing_id: number | null;
  rating: number;
  comment: string;
  created_at: string;
  reviewer?: User;
};

export type RoommateProfile = {
  id: number;
  user_id: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  age: number;
  hometown: string;
  school_or_job: string;
  budget_min: number;
  budget_max: number;
  preferred_district_id: number;
  smoking: 'YES' | 'NO' | 'OCCASIONALLY';
  drinking: 'YES' | 'NO' | 'OCCASIONALLY';
  sleep_schedule: 'EARLY' | 'LATE' | 'FLEXIBLE';
  tidiness: 'VERY_TIDY' | 'MODERATE' | 'MESSY';
  cleaning_freq: 'DAILY' | 'WEEKLY' | 'BIWEEKLY';
  has_pet: boolean;
  allow_overnight_guest: boolean;
  cooking_freq: 'NEVER' | 'SOMETIMES' | 'OFTEN' | 'DAILY';
  has_room: boolean;
  created_at: string;
  user?: User;
  compatibility_pct?: number;
};

export type ChatConversation = {
  id: number;
  participant_1_id: number;
  participant_2_id: number;
  listing_id: number | null;
  roommate_match_id: number | null;
  created_at: string;
  last_message_at: string;
  other_user?: User;
  last_message?: string;
  unread_count?: number;
};

export type Message = {
  id: number;
  conversation_id: number;
  sender_id: number;
  content_type: 'TEXT' | 'IMAGE' | 'LOCATION';
  content: string;
  is_read: boolean;
  sent_at: string;
};

export type Notification = {
  id: number;
  user_id: number;
  type: 'NEW_MESSAGE' | 'MATCH' | 'LISTING_UPDATE' | 'REPORT' | 'SYSTEM';
  title: string;
  body: string;
  action_url: string;
  is_read: boolean;
  created_at: string;
};

export type SavedListing = {
  id: number;
  user_id: number;
  listing_id: number;
  saved_at: string;
};

// ---------- MOCK DATA ----------

export const CURRENT_USER: User = {
  id: 1,
  email: 'nguyenvana@gmail.com',
  phone: '0901234567',
  full_name: 'Nguyễn Văn An',
  avatar_url: 'https://i.pravatar.cc/150?img=11',
  bio: 'Sinh viên Bách Khoa, thích đọc sách và chơi thể thao.',
  auth_provider: 'EMAIL',
  role: 'TENANT',
  is_verified: true,
  is_active: true,
  created_at: '2024-01-15T08:00:00Z',
};

export const USERS: User[] = [
  CURRENT_USER,
  {
    id: 2,
    email: 'chilan@gmail.com',
    phone: '0912345678',
    full_name: 'Chị Lan',
    avatar_url: 'https://i.pravatar.cc/150?img=5',
    bio: 'Chủ trọ uy tín tại Quận 1, hoạt động 2 năm trên TroUyTin.',
    auth_provider: 'EMAIL',
    role: 'LANDLORD',
    is_verified: true,
    is_active: true,
    created_at: '2023-06-01T08:00:00Z',
  },
  {
    id: 3,
    email: 'tranthib@gmail.com',
    phone: '0923456789',
    full_name: 'Trần Thị B',
    avatar_url: 'https://i.pravatar.cc/150?img=9',
    bio: 'Nhân viên văn phòng, tìm phòng sạch sẽ gần trung tâm.',
    auth_provider: 'GOOGLE',
    role: 'TENANT',
    is_verified: true,
    is_active: true,
    created_at: '2024-03-10T08:00:00Z',
  },
  {
    id: 4,
    email: 'leminh@gmail.com',
    phone: '0934567890',
    full_name: 'Lê Minh',
    avatar_url: 'https://i.pravatar.cc/150?img=12',
    bio: 'Chủ trọ 5 năm kinh nghiệm, nhiều phòng khu vực Bình Thạnh.',
    auth_provider: 'EMAIL',
    role: 'LANDLORD',
    is_verified: true,
    is_active: true,
    created_at: '2022-11-20T08:00:00Z',
  },
  {
    id: 5,
    email: 'phamhuong@gmail.com',
    phone: '0945678901',
    full_name: 'Phạm Hương',
    avatar_url: 'https://i.pravatar.cc/150?img=25',
    bio: 'Sinh viên ĐH Kinh tế, muốn tìm bạn ở ghép tiết kiệm chi phí.',
    auth_provider: 'EMAIL',
    role: 'ROOMMATE_SEEKER',
    is_verified: false,
    is_active: true,
    created_at: '2024-05-01T08:00:00Z',
  },
  {
    id: 6,
    email: 'hoangnam@gmail.com',
    phone: '0956789012',
    full_name: 'Hoàng Nam',
    avatar_url: 'https://i.pravatar.cc/150?img=15',
    bio: 'Freelancer IT, làm việc tại nhà, cần phòng yên tĩnh.',
    auth_provider: 'GOOGLE',
    role: 'ROOMMATE_SEEKER',
    is_verified: true,
    is_active: true,
    created_at: '2024-02-14T08:00:00Z',
  },
  {
    id: 7,
    email: 'vuthao@gmail.com',
    phone: '0967890123',
    full_name: 'Vũ Thảo',
    avatar_url: 'https://i.pravatar.cc/150?img=32',
    bio: 'Giáo viên tiểu học, sống ngăn nắp, thích nấu ăn.',
    auth_provider: 'EMAIL',
    role: 'TENANT',
    is_verified: true,
    is_active: true,
    created_at: '2024-04-20T08:00:00Z',
  },
  {
    id: 8,
    email: 'dangkhoa@gmail.com',
    phone: '0978901234',
    full_name: 'Đặng Khoa',
    avatar_url: 'https://i.pravatar.cc/150?img=53',
    bio: 'Kỹ sư xây dựng, thích thể thao và du lịch.',
    auth_provider: 'EMAIL',
    role: 'LANDLORD',
    is_verified: true,
    is_active: true,
    created_at: '2023-09-15T08:00:00Z',
  },
];

export const PROVINCES: Province[] = [
  { id: 1, name: 'TP. Hồ Chí Minh' },
  { id: 2, name: 'Hà Nội' },
];

export const DISTRICTS: District[] = [
  { id: 1, province_id: 1, name: 'Quận 1' },
  { id: 2, province_id: 1, name: 'Quận 3' },
  { id: 3, province_id: 1, name: 'Quận 7' },
  { id: 4, province_id: 1, name: 'Quận Bình Thạnh' },
  { id: 5, province_id: 1, name: 'Quận Phú Nhuận' },
  { id: 6, province_id: 1, name: 'Quận Tân Bình' },
  { id: 7, province_id: 1, name: 'Quận Gò Vấp' },
  { id: 8, province_id: 1, name: 'TP. Thủ Đức' },
];

export const WARDS: Ward[] = [
  { id: 1, district_id: 1, name: 'Phường Bến Nghé' },
  { id: 2, district_id: 1, name: 'Phường Nguyễn Thái Bình' },
  { id: 3, district_id: 2, name: 'Phường Võ Thị Sáu' },
  { id: 4, district_id: 4, name: 'Phường 25' },
  { id: 5, district_id: 5, name: 'Phường 2' },
  { id: 6, district_id: 6, name: 'Phường 2' },
  { id: 7, district_id: 3, name: 'Phường Tân Phú' },
  { id: 8, district_id: 7, name: 'Phường 1' },
  { id: 9, district_id: 8, name: 'Phường Linh Trung' },
  { id: 10, district_id: 4, name: 'Phường 1' },
];

export const AMENITIES: Amenity[] = [
  { id: 1, name: 'Wifi', icon: '📶' },
  { id: 2, name: 'Điều hòa', icon: '❄️' },
  { id: 3, name: 'Máy giặt', icon: '🧺' },
  { id: 4, name: 'Bếp', icon: '🍳' },
  { id: 5, name: 'Chỗ để xe', icon: '🏍️' },
  { id: 6, name: 'Tự do giờ giấc', icon: '🕐' },
  { id: 7, name: 'Ban công', icon: '🌿' },
  { id: 8, name: 'Nóng lạnh', icon: '🚿' },
  { id: 9, name: 'Tủ lạnh', icon: '🧊' },
  { id: 10, name: 'Thang máy', icon: '🛗' },
  { id: 11, name: 'Bảo vệ 24/7', icon: '🛡️' },
  { id: 12, name: 'CCTV', icon: '📹' },
];

// Room listing images from Unsplash
const ROOM_IMAGES = [
  [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&h=600&fit=crop',
  ],
  [
    'https://images.unsplash.com/photo-1598928506311-c55ez637a58c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
  ],
  [
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=600&fit=crop',
  ],
  [
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=600&fit=crop',
  ],
  [
    'https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800&h=600&fit=crop',
  ],
  [
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop',
  ],
];

export const ROOM_LISTINGS: RoomListing[] = [
  {
    id: 1,
    landlord_id: 2,
    title: 'Căn hộ mini cao cấp, đầy đủ tiện nghi',
    description:
      'Phòng sạch sẽ, thoáng mát, khu vực an ninh yên tĩnh. Giờ giấc tự do, không chung chủ. Gần chợ, siêu thị, các trường đại học lớn và trung tâm thương mại. Thích hợp cho sinh viên hoặc người đi làm mong muốn một không gian sống hiện đại, tiện nghi.',
    price: 3500000,
    deposit: 3500000,
    area: 25,
    room_type: 'CAN_HO_MINI',
    ward_id: 2,
    address_detail: 'Nguyễn Đình Chiểu',
    latitude: 10.7769,
    longitude: 106.7009,
    status: 'AVAILABLE',
    is_verified: true,
    view_count: 234,
    created_at: '2024-10-01T08:00:00Z',
    updated_at: '2024-10-15T10:00:00Z',
    images: ROOM_IMAGES[0],
    amenity_ids: [1, 2, 3, 4, 5, 6],
    district_name: 'Quận 1',
    ward_name: 'Phường Nguyễn Thái Bình',
  },
  {
    id: 2,
    landlord_id: 4,
    title: 'Phòng trọ giá rẻ gần ĐH Bách Khoa',
    description:
      'Phòng trọ sạch sẽ, an ninh, gần trường ĐH Bách Khoa và các tiện ích xung quanh. Giờ giấc tự do, có chỗ để xe rộng rãi. Phù hợp cho sinh viên.',
    price: 2200000,
    deposit: 2200000,
    area: 18,
    room_type: 'PHONG_TRO',
    ward_id: 4,
    address_detail: '268 Lý Thường Kiệt',
    latitude: 10.7725,
    longitude: 106.6576,
    status: 'AVAILABLE',
    is_verified: true,
    view_count: 567,
    created_at: '2024-09-15T08:00:00Z',
    updated_at: '2024-10-10T10:00:00Z',
    images: ROOM_IMAGES[1],
    amenity_ids: [1, 5, 6, 8],
    district_name: 'Quận Bình Thạnh',
    ward_name: 'Phường 25',
  },
  {
    id: 3,
    landlord_id: 2,
    title: 'Studio hiện đại Quận 7, view sông',
    description:
      'Căn hộ studio thiết kế hiện đại, full nội thất, view sông Sài Gòn. Gần Lotte Mart, SC VivoCity. An ninh 24/7, có thang máy.',
    price: 5500000,
    deposit: 11000000,
    area: 35,
    room_type: 'CAN_HO_MINI',
    ward_id: 7,
    address_detail: '107 Trần Trọng Cung',
    latitude: 10.7345,
    longitude: 106.7233,
    status: 'AVAILABLE',
    is_verified: true,
    view_count: 891,
    created_at: '2024-08-20T08:00:00Z',
    updated_at: '2024-10-05T10:00:00Z',
    images: ROOM_IMAGES[2],
    amenity_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    district_name: 'Quận 7',
    ward_name: 'Phường Tân Phú',
  },
  {
    id: 4,
    landlord_id: 8,
    title: 'Phòng trọ Gò Vấp, giá sinh viên',
    description:
      'Phòng trọ khép kín, có gác lửng, giá cả phải chăng. Khu dân cư an ninh, gần chợ và trường học.',
    price: 1800000,
    deposit: 1800000,
    area: 15,
    room_type: 'PHONG_TRO',
    ward_id: 8,
    address_detail: '15/3 Nguyễn Oanh',
    latitude: 10.8283,
    longitude: 106.6798,
    status: 'AVAILABLE',
    is_verified: false,
    view_count: 123,
    created_at: '2024-10-10T08:00:00Z',
    updated_at: '2024-10-12T10:00:00Z',
    images: ROOM_IMAGES[3],
    amenity_ids: [1, 5, 8],
    district_name: 'Quận Gò Vấp',
    ward_name: 'Phường 1',
  },
  {
    id: 5,
    landlord_id: 4,
    title: 'Căn hộ dịch vụ Phú Nhuận, full nội thất',
    description:
      'Căn hộ dịch vụ cao cấp, full nội thất mới 100%. Khu vực trung tâm Phú Nhuận, gần sân bay. Bao gồm dọn phòng hàng tuần.',
    price: 6800000,
    deposit: 13600000,
    area: 40,
    room_type: 'CAN_HO_MINI',
    ward_id: 5,
    address_detail: '22 Phan Xích Long',
    latitude: 10.7989,
    longitude: 106.6829,
    status: 'AVAILABLE',
    is_verified: true,
    view_count: 456,
    created_at: '2024-09-01T08:00:00Z',
    updated_at: '2024-10-14T10:00:00Z',
    images: ROOM_IMAGES[4],
    amenity_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    district_name: 'Quận Phú Nhuận',
    ward_name: 'Phường 2',
  },
  {
    id: 6,
    landlord_id: 8,
    title: 'Phòng trọ Tân Bình gần sân bay',
    description:
      'Phòng sạch sẽ, yên tĩnh, gần sân bay Tân Sơn Nhất. Thích hợp cho người đi làm, tiếp viên hàng không.',
    price: 2800000,
    deposit: 2800000,
    area: 20,
    room_type: 'PHONG_TRO',
    ward_id: 6,
    address_detail: '45 Cộng Hòa',
    latitude: 10.8015,
    longitude: 106.6526,
    status: 'AVAILABLE',
    is_verified: false,
    view_count: 189,
    created_at: '2024-10-05T08:00:00Z',
    updated_at: '2024-10-13T10:00:00Z',
    images: ROOM_IMAGES[5],
    amenity_ids: [1, 2, 5, 6, 8],
    district_name: 'Quận Tân Bình',
    ward_name: 'Phường 2',
  },
  {
    id: 7,
    landlord_id: 2,
    title: 'KTX cao cấp Thủ Đức, gần ĐH Quốc Gia',
    description:
      'Ký túc xá hiện đại, phòng 2 người, có máy lạnh và wifi tốc độ cao. Gần ĐH Quốc Gia, khu CNC.',
    price: 1500000,
    deposit: 1500000,
    area: 12,
    room_type: 'KTX',
    ward_id: 9,
    address_detail: 'Đường Võ Văn Ngân',
    latitude: 10.8512,
    longitude: 106.7718,
    status: 'AVAILABLE',
    is_verified: true,
    view_count: 345,
    created_at: '2024-09-20T08:00:00Z',
    updated_at: '2024-10-11T10:00:00Z',
    images: ROOM_IMAGES[0].slice(0, 3),
    amenity_ids: [1, 2, 5, 11, 12],
    district_name: 'TP. Thủ Đức',
    ward_name: 'Phường Linh Trung',
  },
  {
    id: 8,
    landlord_id: 4,
    title: 'Nguyên căn 2 phòng ngủ Bình Thạnh',
    description:
      'Nhà nguyên căn 2 phòng ngủ, 1 phòng khách, bếp riêng. Khu dân cư yên tĩnh, gần Landmark 81.',
    price: 8500000,
    deposit: 17000000,
    area: 60,
    room_type: 'NGUYEN_CAN',
    ward_id: 10,
    address_detail: '12 Nguyễn Hữu Cảnh',
    latitude: 10.7944,
    longitude: 106.7219,
    status: 'AVAILABLE',
    is_verified: true,
    view_count: 678,
    created_at: '2024-08-10T08:00:00Z',
    updated_at: '2024-10-14T10:00:00Z',
    images: ROOM_IMAGES[4],
    amenity_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    district_name: 'Quận Bình Thạnh',
    ward_name: 'Phường 1',
  },
];

// Attach landlord data
ROOM_LISTINGS.forEach((listing) => {
  listing.landlord = USERS.find((u) => u.id === listing.landlord_id);
});

export const REVIEWS: Review[] = [
  {
    id: 1,
    reviewer_id: 1,
    reviewee_id: 2,
    listing_id: 1,
    rating: 5,
    comment:
      'Phòng rất sạch sẽ, chủ nhà nhiệt tình. Vị trí ngay trung tâm, đi lại rất thuận tiện. Các tiện ích xung quanh đầy đủ, mình rất hài lòng khi ở đây.',
    created_at: '2024-08-15T08:00:00Z',
  },
  {
    id: 2,
    reviewer_id: 3,
    reviewee_id: 2,
    listing_id: 1,
    rating: 4,
    comment:
      'Vị trí thuận tiện, an ninh tốt. Không gian yên tĩnh phù hợp để làm việc. Điểm trừ nhỏ là chỗ để xe hơi chật vào buổi tối.',
    created_at: '2024-05-20T08:00:00Z',
  },
  {
    id: 3,
    reviewer_id: 7,
    reviewee_id: 2,
    listing_id: 1,
    rating: 5,
    comment:
      'Chủ nhà rất dễ thương, phòng đúng như mô tả. Wifi mạnh, điều hòa mát. Sẽ giới thiệu cho bạn bè.',
    created_at: '2024-07-01T08:00:00Z',
  },
  {
    id: 4,
    reviewer_id: 1,
    reviewee_id: 4,
    listing_id: 2,
    rating: 4,
    comment:
      'Phòng sạch sẽ, gần trường. Chủ nhà ok, giá cả hợp lý cho sinh viên.',
    created_at: '2024-09-10T08:00:00Z',
  },
  {
    id: 5,
    reviewer_id: 5,
    reviewee_id: 4,
    listing_id: 2,
    rating: 5,
    comment:
      'Giá rẻ mà chất lượng tốt. Khu vực an ninh, gần chợ và tiện đi học.',
    created_at: '2024-08-25T08:00:00Z',
  },
  {
    id: 6,
    reviewer_id: 3,
    reviewee_id: 2,
    listing_id: 3,
    rating: 5,
    comment:
      'Studio cực đẹp, view sông tuyệt vời! Nội thất mới, bảo vệ 24/7. Worth every dong!',
    created_at: '2024-09-05T08:00:00Z',
  },
  {
    id: 7,
    reviewer_id: 6,
    reviewee_id: 8,
    listing_id: 4,
    rating: 3,
    comment:
      'Phòng ổn cho giá tiền. Hơi ồn vào giờ cao điểm nhưng tổng thể chấp nhận được.',
    created_at: '2024-10-01T08:00:00Z',
  },
  {
    id: 8,
    reviewer_id: 7,
    reviewee_id: 4,
    listing_id: 5,
    rating: 5,
    comment:
      'Căn hộ siêu đẹp, dọn phòng hàng tuần rất tiện. Vị trí trung tâm Phú Nhuận, đi đâu cũng gần.',
    created_at: '2024-09-20T08:00:00Z',
  },
];

// Attach reviewer data
REVIEWS.forEach((review) => {
  review.reviewer = USERS.find((u) => u.id === review.reviewer_id);
});

export const ROOMMATE_PROFILES: RoommateProfile[] = [
  {
    id: 1,
    user_id: 5,
    gender: 'FEMALE',
    age: 21,
    hometown: 'Đà Nẵng',
    school_or_job: 'SV ĐH Kinh tế TP.HCM',
    budget_min: 1500000,
    budget_max: 2500000,
    preferred_district_id: 4,
    smoking: 'NO',
    drinking: 'NO',
    sleep_schedule: 'EARLY',
    tidiness: 'VERY_TIDY',
    cleaning_freq: 'DAILY',
    has_pet: false,
    allow_overnight_guest: false,
    cooking_freq: 'SOMETIMES',
    has_room: false,
    created_at: '2024-05-01T08:00:00Z',
    user: USERS.find((u) => u.id === 5),
    compatibility_pct: 92,
  },
  {
    id: 2,
    user_id: 6,
    gender: 'MALE',
    age: 26,
    hometown: 'Huế',
    school_or_job: 'Freelancer IT',
    budget_min: 2000000,
    budget_max: 4000000,
    preferred_district_id: 5,
    smoking: 'NO',
    drinking: 'OCCASIONALLY',
    sleep_schedule: 'LATE',
    tidiness: 'MODERATE',
    cleaning_freq: 'WEEKLY',
    has_pet: false,
    allow_overnight_guest: true,
    cooking_freq: 'OFTEN',
    has_room: true,
    created_at: '2024-02-14T08:00:00Z',
    user: USERS.find((u) => u.id === 6),
    compatibility_pct: 85,
  },
  {
    id: 3,
    user_id: 7,
    gender: 'FEMALE',
    age: 28,
    hometown: 'Nha Trang',
    school_or_job: 'Giáo viên tiểu học',
    budget_min: 2000000,
    budget_max: 3500000,
    preferred_district_id: 7,
    smoking: 'NO',
    drinking: 'NO',
    sleep_schedule: 'EARLY',
    tidiness: 'VERY_TIDY',
    cleaning_freq: 'DAILY',
    has_pet: false,
    allow_overnight_guest: false,
    cooking_freq: 'DAILY',
    has_room: false,
    created_at: '2024-04-20T08:00:00Z',
    user: USERS.find((u) => u.id === 7),
    compatibility_pct: 78,
  },
  {
    id: 4,
    user_id: 3,
    gender: 'FEMALE',
    age: 24,
    hometown: 'Cần Thơ',
    school_or_job: 'Nhân viên Marketing',
    budget_min: 2500000,
    budget_max: 4000000,
    preferred_district_id: 1,
    smoking: 'NO',
    drinking: 'OCCASIONALLY',
    sleep_schedule: 'FLEXIBLE',
    tidiness: 'MODERATE',
    cleaning_freq: 'WEEKLY',
    has_pet: false,
    allow_overnight_guest: true,
    cooking_freq: 'SOMETIMES',
    has_room: false,
    created_at: '2024-03-10T08:00:00Z',
    user: USERS.find((u) => u.id === 3),
    compatibility_pct: 71,
  },
];

export const CHAT_CONVERSATIONS: ChatConversation[] = [
  {
    id: 1,
    participant_1_id: 1,
    participant_2_id: 2,
    listing_id: 1,
    roommate_match_id: null,
    created_at: '2024-10-10T08:00:00Z',
    last_message_at: '2024-10-15T14:30:00Z',
    other_user: USERS.find((u) => u.id === 2),
    last_message: 'Phòng vẫn còn trống không chị?',
    unread_count: 2,
  },
  {
    id: 2,
    participant_1_id: 1,
    participant_2_id: 4,
    listing_id: 2,
    roommate_match_id: null,
    created_at: '2024-10-12T08:00:00Z',
    last_message_at: '2024-10-14T16:00:00Z',
    other_user: USERS.find((u) => u.id === 4),
    last_message: 'Em có thể đến xem phòng chiều nay không ạ?',
    unread_count: 0,
  },
  {
    id: 3,
    participant_1_id: 1,
    participant_2_id: 5,
    listing_id: null,
    roommate_match_id: 1,
    created_at: '2024-10-13T08:00:00Z',
    last_message_at: '2024-10-15T09:00:00Z',
    other_user: USERS.find((u) => u.id === 5),
    last_message: 'Mình thấy profile bạn phù hợp, mình chat thêm nhé!',
    unread_count: 1,
  },
];

export const MESSAGES: Record<number, Message[]> = {
  1: [
    {
      id: 1,
      conversation_id: 1,
      sender_id: 1,
      content_type: 'TEXT',
      content: 'Chào chị, em thấy phòng trên TroUyTin. Phòng còn trống không ạ?',
      is_read: true,
      sent_at: '2024-10-10T08:00:00Z',
    },
    {
      id: 2,
      conversation_id: 1,
      sender_id: 2,
      content_type: 'TEXT',
      content: 'Chào em, phòng vẫn còn nhé. Em muốn đến xem phòng khi nào?',
      is_read: true,
      sent_at: '2024-10-10T08:15:00Z',
    },
    {
      id: 3,
      conversation_id: 1,
      sender_id: 1,
      content_type: 'TEXT',
      content: 'Em có thể đến chiều thứ 7 được không ạ? Khoảng 2h chiều.',
      is_read: true,
      sent_at: '2024-10-10T08:20:00Z',
    },
    {
      id: 4,
      conversation_id: 1,
      sender_id: 2,
      content_type: 'TEXT',
      content: 'Được em, chị sẽ ở nhà đợi. Em nhớ mang CCCD nhé.',
      is_read: true,
      sent_at: '2024-10-10T08:30:00Z',
    },
    {
      id: 5,
      conversation_id: 1,
      sender_id: 1,
      content_type: 'TEXT',
      content: 'Dạ em cảm ơn chị!',
      is_read: true,
      sent_at: '2024-10-10T08:32:00Z',
    },
    {
      id: 6,
      conversation_id: 1,
      sender_id: 2,
      content_type: 'TEXT',
      content: 'Phòng vẫn còn trống không chị?',
      is_read: false,
      sent_at: '2024-10-15T14:30:00Z',
    },
  ],
  2: [
    {
      id: 7,
      conversation_id: 2,
      sender_id: 1,
      content_type: 'TEXT',
      content: 'Anh ơi, phòng gần Bách Khoa còn không ạ?',
      is_read: true,
      sent_at: '2024-10-12T08:00:00Z',
    },
    {
      id: 8,
      conversation_id: 2,
      sender_id: 4,
      content_type: 'TEXT',
      content: 'Còn em nhé, em qua xem phòng lúc nào cũng được.',
      is_read: true,
      sent_at: '2024-10-12T09:00:00Z',
    },
    {
      id: 9,
      conversation_id: 2,
      sender_id: 1,
      content_type: 'TEXT',
      content: 'Em có thể đến xem phòng chiều nay không ạ?',
      is_read: true,
      sent_at: '2024-10-14T16:00:00Z',
    },
  ],
  3: [
    {
      id: 10,
      conversation_id: 3,
      sender_id: 5,
      content_type: 'TEXT',
      content: 'Hi bạn! Mình thấy profile bạn phù hợp, mình chat thêm nhé!',
      is_read: true,
      sent_at: '2024-10-13T08:00:00Z',
    },
    {
      id: 11,
      conversation_id: 3,
      sender_id: 1,
      content_type: 'TEXT',
      content: 'Chào bạn! Mình cũng đang tìm bạn ở ghép. Bạn đang tìm phòng ở khu vực nào?',
      is_read: true,
      sent_at: '2024-10-13T08:10:00Z',
    },
    {
      id: 12,
      conversation_id: 3,
      sender_id: 5,
      content_type: 'TEXT',
      content: 'Mình muốn ở khu Bình Thạnh hoặc Phú Nhuận, ngân sách khoảng 2-2.5 triệu/người. Bạn thấy sao?',
      is_read: false,
      sent_at: '2024-10-15T09:00:00Z',
    },
  ],
};

export const NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    user_id: 1,
    type: 'NEW_MESSAGE',
    title: 'Tin nhắn mới',
    body: 'Chị Lan đã gửi tin nhắn cho bạn',
    action_url: '/chat',
    is_read: false,
    created_at: '2024-10-15T14:30:00Z',
  },
  {
    id: 2,
    user_id: 1,
    type: 'MATCH',
    title: 'Có người phù hợp!',
    body: 'Phạm Hương có 92% tương thích với bạn',
    action_url: '/o-ghep',
    is_read: false,
    created_at: '2024-10-14T10:00:00Z',
  },
  {
    id: 3,
    user_id: 1,
    type: 'LISTING_UPDATE',
    title: 'Phòng mới trong khu vực',
    body: 'Có 3 phòng mới được đăng tại Quận Bình Thạnh',
    action_url: '/tim-kiem?district=4',
    is_read: true,
    created_at: '2024-10-13T08:00:00Z',
  },
  {
    id: 4,
    user_id: 1,
    type: 'SYSTEM',
    title: 'Chào mừng bạn đến TroUyTin!',
    body: 'Hoàn thiện hồ sơ để tìm phòng nhanh hơn',
    action_url: '/ho-so',
    is_read: true,
    created_at: '2024-01-15T08:00:00Z',
  },
];

export const SAVED_LISTINGS: SavedListing[] = [
  { id: 1, user_id: 1, listing_id: 1, saved_at: '2024-10-12T08:00:00Z' },
  { id: 2, user_id: 1, listing_id: 3, saved_at: '2024-10-13T09:00:00Z' },
  { id: 3, user_id: 1, listing_id: 5, saved_at: '2024-10-14T10:00:00Z' },
];

// ---------- HELPER FUNCTIONS ----------

export function formatPrice(price: number): string {
  if (price >= 1000000) {
    const millions = price / 1000000;
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)} triệu`;
  }
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

export function formatPriceVND(price: number): string {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

export function getListingById(id: number): RoomListing | undefined {
  return ROOM_LISTINGS.find((l) => l.id === id);
}

export function getReviewsByListingId(listingId: number): Review[] {
  return REVIEWS.filter((r) => r.listing_id === listingId);
}

export function getAmenitiesByIds(ids: number[]): Amenity[] {
  return AMENITIES.filter((a) => ids.includes(a.id));
}

export function getDistrictById(id: number): District | undefined {
  return DISTRICTS.find((d) => d.id === id);
}

export function isListingSaved(listingId: number): boolean {
  return SAVED_LISTINGS.some((s) => s.listing_id === listingId);
}

export function getRoomTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    PHONG_TRO: 'Phòng trọ',
    CAN_HO_MINI: 'Căn hộ mini',
    KTX: 'Ký túc xá',
    NGUYEN_CAN: 'Nguyên căn',
  };
  return labels[type] || type;
}

export function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return 'Hôm nay';
  if (days === 1) return 'Hôm qua';
  if (days < 7) return `${days} ngày trước`;
  if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
  if (days < 365) return `${Math.floor(days / 30)} tháng trước`;
  return `${Math.floor(days / 365)} năm trước`;
}
