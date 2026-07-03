import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getIcon } from '../utils/iconMap';
import { getProfile, type Profile } from '../services/profiles';
import {
  getAmenities, getProvinces, getDistricts, getWards,
  createListing, uploadListingImage,
  type Amenity, type Province, type District, type Ward, type RoomType,
} from '../services/roomListing';
import {
  ChevronRight, ChevronLeft, Check, Upload, X, Search,
  MapPin, LayoutGrid, FileText, Eye, Loader2,
  ImageIcon, Trash2, GripVertical, AlertCircle,
} from 'lucide-react';
import '../components/ui/Button.css';

// ─── Local types ──────────────────────────────────────────────────────────────

interface FormData {
  // Step 1
  title: string;
  description: string;
  room_type: RoomType | '';
  price: string;
  deposit: string;
  area: string;
  // Step 2
  amenity_ids: number[];
  // Step 3
  images: UploadedImage[];
  // Step 4 – location
  province_id: string;
  district_id: string;
  ward_id: string;
  address_detail: string;
}

interface UploadedImage {
  file: File;
  preview: string;
  uploading: boolean;
  url: string | null;
  path?: string | null; 
  error: string | null;
}

const DEFAULT_FORM: FormData = {
    title: 'Phòng trọ giá rẻ',
    description: '',
    room_type: 'PHONG_TRO',
    price: '3000000',
    deposit: '1000000',
    area: '12',

    amenity_ids: [],

    images: [],

    province_id: '', 
    district_id: '',
    ward_id: '',
    address_detail: '',
};

// ─── Constants ───────────────────────────────────────────────────────────────

const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: 'PHONG_TRO', label: 'Phòng trọ' },
  { value: 'CAN_HO_MINI', label: 'Căn hộ mini' },
  { value: 'CAN_HO', label: 'Căn hộ' },
  { value: 'NGUYEN_CAN', label: 'Nhà nguyên căn' },
  { value: 'KTX', label: 'Ký túc xá' },
];

const STEPS = [
  { label: 'Thông tin cơ bản', icon: FileText },
  { label: 'Tiện ích & Vị trí', icon: LayoutGrid },
  { label: 'Upload Ảnh', icon: ImageIcon },
  { label: 'Preview & Đăng', icon: Eye },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatVND(val: string) {
  const n = parseInt(val.replace(/\D/g, ''), 10);
  if (isNaN(n)) return '';
  return n.toLocaleString('vi-VN');
}

// ─── Step components ─────────────────────────────────────────────────────────

// Step 1 – Basic info
function Step1({
  data, onChange,
}: {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
}) {
  return (
    <div className="space-y-6">
      <StepHeader
        number={1}
        title="Thông tin cơ bản"
        desc="Cung cấp các thông tin chính về bất động sản bạn muốn cho thuê. Thông tin càng chi tiết, khả năng tiếp cận khách hàng càng cao."
      />

      {/* Title */}
      <Field label="Tiêu đề tin đăng" required hint="Nên viết ngắn gọn, súc tích và nêu bật ưu điểm của phòng.">
        <input
          type="text"
          value={data.title}
          onChange={e => onChange({ title: e.target.value })}
          placeholder="VD: Cho thuê phòng trọ mới xây, full nội thất, gần ĐH Quốc Gia"
          className={inputCls}
        />
      </Field>

      {/* Room type */}
      <Field label="Loại phòng" required>
        <div className="relative">
          <select
            value={data.room_type}
            onChange={e => onChange({ room_type: e.target.value as RoomType })}
            className={inputCls + ' appearance-none'}
          >
            <option value="">Chọn loại phòng</option>
            {ROOM_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </Field>

      {/* Price + Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Giá cho thuê" required>
          <div className="relative">
            <input
              type="text"
              value={data.price ? formatVND(data.price) : ''}
              onChange={e => onChange({ price: e.target.value.replace(/\D/g, '') })}
              placeholder="Ví dụ: 3,000,000"
              className={inputCls + ' pr-24'}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">VNĐ/tháng</span>
          </div>
        </Field>
        <Field label="Diện tích" required>
          <div className="relative">
            <input
              type="number"
              value={data.area}
              onChange={e => onChange({ area: e.target.value })}
              placeholder="Ví dụ: 25"
              className={inputCls + ' pr-12'}
              min={1}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">m²</span>
          </div>
        </Field>
      </div>

      {/* Deposit */}
      <Field label="Tiền đặt cọc" hint="Để trống nếu không yêu cầu đặt cọc.">
        <div className="relative">
          <input
            type="text"
            value={data.deposit ? formatVND(data.deposit) : ''}
            onChange={e => onChange({ deposit: e.target.value.replace(/\D/g, '') })}
            placeholder="Ví dụ: 1,000,000"
            className={inputCls + ' pr-16'}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">VNĐ</span>
        </div>
      </Field>

      {/* Description */}
      <Field label="Mô tả chi tiết" hint="Mô tả nội thất, môi trường xung quanh, quy định thuê trọ...">
        <textarea
          value={data.description}
          onChange={e => onChange({ description: e.target.value })}
          placeholder="Phòng trọ mới xây, thoáng mát, có cửa sổ lớn. Khu vực an ninh, gần chợ, siêu thị..."
          rows={4}
          className={inputCls + ' resize-none'}
        />
      </Field>
    </div>
  );
}

// Step 2 – Amenities + Location
function Step2({
  data,
  onChange,
  amenities,
  provinces,
  districts,
  wards,
  loadingGeo,
  onProvinceChange,
  onDistrictChange,
}: {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  amenities: Amenity[];
  provinces: Province[];
  districts: District[];
  wards: Ward[];
  loadingGeo: boolean;
  onProvinceChange: (id: string) => void;
  onDistrictChange: (id: string) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = amenities.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: number) => {
    onChange({
      amenity_ids: data.amenity_ids.includes(id)
        ? data.amenity_ids.filter(x => x !== id)
        : [...data.amenity_ids, id],
    });
  };

  return (
    <div className="space-y-8">
      <StepHeader
        number={2}
        title="Tiện ích & Vị trí"
        desc="Chọn các tiện ích có trong phòng và nhập địa chỉ cụ thể để khách thuê dễ tìm kiếm."
      />

      {/* Amenities */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">Tiện ích phòng</label>
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm tiện ích..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {data.amenity_ids.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {data.amenity_ids.map(id => {
              const a = amenities.find(x => x.id === id);
              if (!a) return null;
              return (
                <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  {a.name}
                  <button onClick={() => toggle(id)} className="hover:text-blue-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <p className="col-span-full text-sm text-slate-400 py-4 text-center">Không tìm thấy tiện ích phù hợp.</p>
          ) : filtered.map(a => {
            const Icon = getIcon(a.icon);
            const selected = data.amenity_ids.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggle(a.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                  selected
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{a.name}</span>
                {selected && <Check className="w-3.5 h-3.5 ml-auto flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          <MapPin className="inline w-4 h-4 mr-1 text-blue-500" />
          Địa chỉ
        </label>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Province */}
            <div className="relative">
              <select
                value={data.province_id}
                onChange={e => { onChange({ province_id: e.target.value, district_id: '', ward_id: '' }); onProvinceChange(e.target.value); }}
                className={inputCls + ' appearance-none'}
                disabled={loadingGeo}
              >
                <option value="">Tỉnh / Thành phố</option>
                {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            {/* District */}
            <div className="relative">
              <select
                value={data.district_id}
                onChange={e => { onChange({ district_id: e.target.value, ward_id: '' }); onDistrictChange(e.target.value); }}
                className={inputCls + ' appearance-none'}
                disabled={!data.province_id || loadingGeo}
              >
                <option value="">Quận / Huyện</option>
                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            {/* Ward */}
            <div className="relative">
              <select
                value={data.ward_id}
                onChange={e => onChange({ ward_id: e.target.value })}
                className={inputCls + ' appearance-none'}
                disabled={!data.district_id || loadingGeo}
              >
                <option value="">Phường / Xã</option>
                {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <input
            type="text"
            value={data.address_detail}
            onChange={e => onChange({ address_detail: e.target.value })}
            placeholder="Số nhà, tên đường, hẻm... (VD: 123 Nguyễn Trãi)"
            className={inputCls}
          />
        </div>
      </div>
    </div>
  );
}

// Step 3 – Image upload
function Step3({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!arr.length) return;

    const newImgs: UploadedImage[] = arr.map(f => ({
      file: f,
      preview: URL.createObjectURL(f),
      uploading: true,
      url: null,
      error: null,
    }));

    onChange({ images: [...data.images, ...newImgs] });

    // Upload each to supabase storage via service
    const uploaded = await Promise.all(newImgs.map(async (img) => {
      try {
        const res = await uploadListingImage(img.file);
        return { ...img, uploading: false, url: res.publicUrl, path: res.path, error: null };
      } catch {
        return { ...img, uploading: false, url: null, error: 'Upload thất bại' };
      }
    }));

    onChange({
    images: [...data.images.filter(i => !i.uploading), ...uploaded],
    });
  }, [data.images, onChange]);

  const removeImage = (idx: number) => {
    const updated = [...data.images];
    URL.revokeObjectURL(updated[idx].preview);
    updated.splice(idx, 1);
    onChange({ images: updated });
  };

  return (
    <div className="space-y-6">
      <StepHeader
        number={3}
        title="Hình ảnh phòng trọ"
        desc="Ảnh chất lượng cao giúp tin đăng của bạn nổi bật hơn. Nên thêm ít nhất 3 ảnh, bao gồm ảnh phòng, toilet và lối vào."
      />

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
        }`}
      >
        <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600">Kéo thả ảnh vào đây hoặc <span className="text-blue-600">chọn từ máy tính</span></p>
        <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP • Tối đa 10 ảnh</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={e => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* Preview grid */}
      {data.images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.images.map((img, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video bg-slate-100">
              <img src={img.preview} alt="" className="w-full h-full object-cover" />
              {img.uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
              {img.error && (
                <div className="absolute inset-0 bg-rose-500/80 flex flex-col items-center justify-center gap-1 p-2">
                  <AlertCircle className="w-5 h-5 text-white" />
                  <span className="text-white text-xs text-center">{img.error}</span>
                </div>
              )}
              {!img.uploading && !img.error && (
                <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); removeImage(idx); }}
                    className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {idx === 0 && (
                <span className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">Ảnh bìa</span>
              )}
              <GripVertical className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 text-white/50" />
            </div>
          ))}
        </div>
      )}
      {data.images.length === 0 && (
        <p className="text-sm text-slate-400 text-center">Chưa có ảnh nào được thêm.</p>
      )}
    </div>
  );
}

// Step 4 – Preview & Submit
function Step4({
  data,
  amenities,
  provinces,
  districts,
  wards,
}: {
  data: FormData;
  amenities: Amenity[];
  provinces: Province[];
  districts: District[];
  wards: Ward[];
}) {
  const province = provinces.find(p => String(p.id) === data.province_id);
  const district = districts.find(d => String(d.id) === data.district_id);
  const ward = wards.find(w => String(w.id) === data.ward_id);
  const roomLabel = ROOM_TYPES.find(t => t.value === data.room_type)?.label ?? '—';
  const selectedAmenities = amenities.filter(a => data.amenity_ids.includes(a.id));

  const fullAddress = [data.address_detail, ward?.name, district?.name, province?.name]
    .filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      <StepHeader
        number={4}
        title="Xem lại & Đăng tin"
        desc="Kiểm tra lại toàn bộ thông tin trước khi đăng. Tin sẽ được duyệt trong vòng 24 giờ."
      />

      {/* Cover image */}
      {data.images[0] && (
        <div className="rounded-2xl overflow-hidden aspect-video bg-slate-100">
          <img src={data.images[0].preview} alt="cover" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Info card */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 divide-y divide-slate-200">
        <PreviewRow label="Tiêu đề" value={data.title || '—'} />
        <PreviewRow label="Loại phòng" value={roomLabel} />
        <PreviewRow
          label="Giá thuê"
          value={data.price ? `${Number(data.price).toLocaleString('vi-VN')} VNĐ/tháng` : '—'}
        />
        <PreviewRow
          label="Đặt cọc"
          value={data.deposit ? `${Number(data.deposit).toLocaleString('vi-VN')} VNĐ` : 'Không yêu cầu'}
        />
        <PreviewRow label="Diện tích" value={data.area ? `${data.area} m²` : '—'} />
        <PreviewRow label="Địa chỉ" value={fullAddress || '—'} />
        {data.description && (
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Mô tả</p>
            <p className="text-sm text-slate-700 whitespace-pre-line">{data.description}</p>
          </div>
        )}
      </div>

      {/* Amenities preview */}
      {selectedAmenities.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Tiện ích ({selectedAmenities.length})</h4>
          <div className="flex flex-wrap gap-2">
            {selectedAmenities.map(a => {
              const Icon = getIcon(a.icon);
              return (
                <span key={a.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm text-slate-700">
                  <Icon className="w-3.5 h-3.5 text-blue-500" />
                  {a.name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Extra images */}
      {data.images.length > 1 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Ảnh phòng ({data.images.length})</h4>
          <div className="grid grid-cols-4 gap-2">
            {data.images.slice(1, 9).map((img, i) => (
              <div key={i} className="aspect-video rounded-xl overflow-hidden bg-slate-100">
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          Sau khi đăng, tin của bạn sẽ được đội ngũ kiểm duyệt trong vòng <strong>24 giờ</strong> trước khi xuất hiện công khai.
        </p>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepHeader({ number, title, desc }: { number: number; title: string; desc: string }) {
  return (
    <div className="pb-2 border-b border-slate-100">
      <h2 className="text-xl font-bold text-slate-900">{number}. {title}</h2>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </div>
  );
}

function Field({
  label, required, hint, children,
}: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1.5">{hint}</p>}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start px-5 py-3.5 gap-4">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-24 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-slate-800 font-medium">{value}</span>
    </div>
  );
}

const inputCls =
  'block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-sm';

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PostListingPage() {
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Geo data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [amenities, setAmenities] = useState<Amenity[]>([]);

  const [profileRole, setProfileRole] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    if (!user) {
        navigate('/login', { replace: true });
        return;
    }
    getProfile(user.id)
        .then(p => {
        if (p?.role !== 'LANDLORD') {
            navigate('/', { replace: true, state: { errorToast: 'Chỉ chủ nhà mới có thể đăng tin.' } });
        } else {
            setProfileRole(p.role);
        }
        })
        .catch(() => navigate('/', { replace: true }))
        .finally(() => setCheckingRole(false));
    }, [user, navigate]);

    if (checkingRole) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    );
    }

  const patch = useCallback((p: Partial<FormData>) => setForm(f => ({ ...f, ...p })), []);

  // Load amenities on mount
  useEffect(() => {
    getAmenities().then(setAmenities).catch(() => {});
    getProvinces().then(setProvinces).catch(() => {});
  }, []);

  const handleProvinceChange = async (provinceId: string) => {
    if (!provinceId) { setDistricts([]); setWards([]); return; }
    setLoadingGeo(true);
    try {
      setDistricts(await getDistricts(Number(provinceId)));
      setWards([]);
    } finally { setLoadingGeo(false); }
  };

  const handleDistrictChange = async (districtId: string) => {
    if (!districtId) { setWards([]); return; }
    setLoadingGeo(true);
    try {
      setWards(await getWards(Number(districtId)));
    } finally { setLoadingGeo(false); }
  };

  // Validation per step
  const validateStep = (): string => {
    if (step === 0) {
      if (!form.title.trim()) return 'Vui lòng nhập tiêu đề tin đăng.';
      if (!form.room_type) return 'Vui lòng chọn loại phòng.';
      if (!form.price || Number(form.price) <= 0) return 'Vui lòng nhập giá cho thuê hợp lệ.';
      if (!form.price || form.price.trim() === '') {
        return 'Vui lòng nhập giá thuê.';
      }

      if (!form.area || Number(form.area) <= 0) return 'Vui lòng nhập diện tích hợp lệ.';
    }
    if (step === 1) {
      if (!form.province_id) return 'Vui lòng chọn tỉnh / thành phố.';
      if (!form.address_detail.trim()) return 'Vui lòng nhập địa chỉ cụ thể.';
    }
    if (step === 2) {
      const readyImgs = form.images.filter(i => i.url && !i.error);
      if (readyImgs.length === 0) return 'Vui lòng upload ít nhất 1 ảnh.';
      if (form.images.some(i => i.uploading)) return 'Vui lòng đợi ảnh upload xong.';
    }
    return '';
  };

  const next = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const back = () => {
    setError('');
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!user) { setError('Bạn cần đăng nhập để đăng tin.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await createListing({
        landlordId: user.id,
        title: form.title,
        description: form.description || undefined,
        price: Number(form.price),
        deposit: form.deposit ? Number(form.deposit) : null,
        area: Number(form.area),
        roomType: form.room_type as RoomType,
        wardId: form.ward_id ? Number(form.ward_id) : null,
        addressDetail: form.address_detail || undefined,
        amenityIds: form.amenity_ids,
        imageUrls: form.images
        .filter(i => i.url)
        .map(i => i.url as string),

        imagePaths: form.images
        .filter(i => i.url)
        .map(i => (i as any).path), 
      });

      navigate('/', { state: { successToast: 'Tin đăng đã được gửi và đang chờ duyệt!' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Progress bar header */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between relative">
            {/* Connector line */}
            <div className="absolute left-0 right-0 top-5 h-0.5 bg-slate-200 z-0 mx-10" />
            <div
              className="absolute left-0 top-5 h-0.5 bg-blue-600 z-0 ml-10 transition-all duration-500"
              style={{ width: `calc(${(step / (STEPS.length - 1)) * 100}% - ${step === 0 ? 40 : step === STEPS.length - 1 ? 40 : 0}px)` }}
            />

            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = i < step;
              const active = i === step;
              return (
                <div key={i} className="flex flex-col items-center z-10 gap-1.5 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    done
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : active
                      ? 'bg-white border-blue-600 text-blue-600 shadow-md shadow-blue-100'
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    {done ? <Check className="w-4.5 h-4.5" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-xs font-semibold hidden sm:block text-center leading-tight ${
                    active ? 'text-blue-600' : done ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8 pb-36">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-10">
          {step === 0 && <Step1 data={form} onChange={patch} />}
          {step === 1 && (
            <Step2
              data={form} onChange={patch}
              amenities={amenities}
              provinces={provinces} districts={districts} wards={wards}
              loadingGeo={loadingGeo}
              onProvinceChange={handleProvinceChange}
              onDistrictChange={handleDistrictChange}
            />
          )}
          {step === 2 && <Step3 data={form} onChange={patch} />}
          {step === 3 && (
            <Step4
              data={form} amenities={amenities}
              provinces={provinces} districts={districts} wards={wards}
            />
          )}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex-1">
            {error && (
              <div className="flex items-center gap-2 text-rose-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={step === 0 ? () => navigate(-1) : back}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              Quay lại
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={next}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-sm font-bold shadow-sm shadow-blue-200 transition-all"
              >
                Tiếp tục
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-sm font-bold shadow-sm shadow-blue-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Đang đăng...</>
                ) : (
                  <><Check className="w-4 h-4" />Xác nhận đăng tin</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}