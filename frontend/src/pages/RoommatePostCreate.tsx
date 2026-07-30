import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { roommatePostService } from "../services/roommates";
import { getAmenities, type Amenity } from "../services/roomListing";
import { getIcon } from "../utils/iconMap";
import { 
  Loader, ChevronRight, ChevronLeft, Check, Plus, Trash2, 
  MapPin, ListPlus, ShieldAlert, Image, Search, X 
} from "lucide-react";
import toast from "react-hot-toast";

export default function RoommatePostCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState("");
  
  // State quản lý tiện ích từ DB
  const [amenitiesList, setAmenitiesList] = useState<Amenity[]>([]);
  const [searchAmenity, setSearchAmenity] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    area: "",
    pricePerMonth: "",
    roomType: "PHONG_TRO",
    wardId: "",
    addressDetail: "",
    availableFrom: "",
    amenityIds: [] as number[], // Đổi thành mảng ID số
    rules: "",
  });

  // Fetch danh sách tiện ích khi load form
  useEffect(() => {
    getAmenities()
      .then(setAmenitiesList)
      .catch((err) => console.error("Lỗi lấy amenities:", err));
  }, []);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddImage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!imageInput.trim()) return;
    
    if (images.length < 20) {
      setImages([...images, imageInput.trim()]);
      setImageInput("");
      toast.success("Đã thêm ảnh vào danh sách!");
    } else {
      toast.error("Hệ thống giới hạn tối đa 20 ảnh đầu vào.");
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    toast.success("Đã xóa ảnh");
  };

  // 🔥 ĐIỀU HƯỚNG BƯỚC BẰNG TYPE="BUTTON" + VALIDATION TỪNG BƯỚC
  const nextStep = (e: React.MouseEvent) => {
    e.preventDefault(); // Chặn mọi trigger submit form

    if (currentStep === 1) {
      if (!form.title.trim()) {
        toast.error("Vui lòng nhập tiêu đề bài đăng!");
        return;
      }
      if (!form.pricePerMonth) {
        toast.error("Vui lòng nhập giá thuê mỗi tháng!");
        return;
      }
    }

    if (currentStep === 2) {
      if (!form.wardId) {
        toast.error("Vui lòng nhập Mã phường / Xã (Ward ID)!");
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🔥 BẢO VỆ TẦNG DUYỆT: Tuyệt đối không submit nếu chưa tới bước 4
    if (currentStep !== 4) {
      return;
    }

    if (!form.title || !form.pricePerMonth) {
      toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc!");
      return;
    }

    setLoading(true);
    try {
      const postRes = await roommatePostService.createPost({
        ...form,
        area: form.area ? parseFloat(form.area) : null,
        wardId: form.wardId ? parseInt(form.wardId) : null,
        amenityIds: form.amenityIds, // Gửi mảng ID
      });

      const postId = postRes.data.id;

      // Upload chuỗi danh sách ảnh lên backend (roommate_post_images)
      for (let i = 0; i < images.length; i++) {
        await roommatePostService.uploadImage(postId, images[i], i);
      }

      toast.success("Bài đăng tuyển ở ghép đã được tạo thành công!");
      navigate("/roommate-posts");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Lỗi hệ thống khi tạo bài đăng. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const stepsMeta = [
    { step: 1, label: "Thông tin", icon: <ListPlus size={16} /> },
    { step: 2, label: "Vị trí", icon: <MapPin size={16} /> },
    { step: 3, label: "Tiện ích & Nội quy", icon: <ShieldAlert size={16} /> },
    { step: 4, label: "Hình ảnh", icon: <Image size={16} /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-10 my-4">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            📝 Đăng bài tìm người ở ghép
          </h1>
          <p className="text-sm text-gray-500 mt-1.5">
            Chia sẻ không gian phòng trọ của bạn để tìm kiếm mảnh ghép lối sống phù hợp nhất
          </p>
        </div>

        {/* Dynamic Wizard Progress Steps Bar */}
        <div className="mb-10 relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-emerald-600 -translate-y-1/2 transition-all duration-300 z-0" 
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          />
          <div className="flex justify-between relative z-10">
            {stepsMeta.map((s) => (
              <div key={s.step} className="flex flex-col items-center">
                <div 
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all duration-300 ${
                    currentStep >= s.step 
                      ? "bg-emerald-600 text-white ring-4 ring-emerald-50" 
                      : "bg-white text-gray-400 border border-gray-200"
                  }`}
                >
                  {currentStep > s.step ? <Check size={14} /> : s.icon}
                </div>
                <span className={`text-[11px] font-bold mt-2 uppercase tracking-wide ${currentStep >= s.step ? "text-emerald-700" : "text-gray-400"}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Wizard Forms */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (currentStep === 4) {
              handleSubmit(e);
            }
          }} 
          className="space-y-6"
        >
          
          {/* BƯỚC 1: THÔNG TIN CƠ BẢN */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Bước 1: Khai báo thông tin cơ bản</h3>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Tiêu đề bài viết bài đăng *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                  placeholder="VD: Phòng trọ ban công gần ĐH KHTN, ở ghép 2 triệu/tháng"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Mô tả chi tiết phòng</label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all h-32 resize-none"
                  placeholder="Mô tả cụ thể về chi phí điện nước, không gian phòng, thói quen của phòng hiện tại..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Loại hình phòng *</label>
                  <select
                    value={form.roomType}
                    onChange={(e) => handleChange("roomType", e.target.value)}
                    className="w-full border border-gray-200 bg-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                  >
                    <option value="PHONG_TRO">Phòng trọ</option>
                    <option value="CAN_HO_MINI">Căn hộ mini</option>
                    <option value="KTX">Ký túc xá</option>
                    <option value="NGUYEN_CAN">Nhà nguyên căn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Diện tích (m²)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={form.area}
                    onChange={(e) => handleChange("area", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                    placeholder="25"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Giá thuê / Tháng (VNĐ) *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.pricePerMonth}
                    onChange={(e) => handleChange("pricePerMonth", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                    placeholder="2000000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Thời gian có thể dọn vào liền</label>
                <input
                  type="date"
                  value={form.availableFrom}
                  onChange={(e) => handleChange("availableFrom", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* BƯỚC 2: VỊ TRÍ TOẠ ĐỘ */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Bước 2: Xác định vị trí</h3>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Mã phường / Xã (Ward ID) *</label>
                <input
                  type="number"
                  value={form.wardId}
                  onChange={(e) => handleChange("wardId", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                  placeholder="Nhập mã ID hành chính của Phường (VD: 1)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Địa chỉ chi tiết</label>
                <input
                  type="text"
                  value={form.addressDetail}
                  onChange={(e) => handleChange("addressDetail", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                  placeholder="Số nhà, tên hẻm, tên đường, tên tòa nhà..."
                />
              </div>
            </div>
          )}

          {/* BƯỚC 3: TIỆN ÍCH & NỘI QUY */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Bước 3: Tiện ích cơ sở vật chất & Quy định</h3>
              
              <div className="space-y-4">
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Tiện ích phòng đang sở hữu</label>
                
                {/* Ô tìm kiếm */}
                <div className="relative mb-3">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchAmenity}
                    onChange={e => setSearchAmenity(e.target.value)}
                    placeholder="Tìm tiện ích..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Chips tiện ích đã chọn */}
                {form.amenityIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {form.amenityIds.map((id) => {
                      const a = amenitiesList.find(x => x.id === id);
                      if (!a) return null;
                      return (
                        <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-semibold">
                          {a.name}
                          <button 
                            type="button" 
                            onClick={() => handleChange("amenityIds", form.amenityIds.filter(x => x !== id))} 
                            className="hover:text-emerald-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Grid danh sách tiện ích */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {amenitiesList.filter(a => a.name.toLowerCase().includes(searchAmenity.toLowerCase())).length === 0 ? (
                    <p className="col-span-full text-sm text-gray-400 py-4 text-center">Không tìm thấy tiện ích phù hợp.</p>
                  ) : (
                    amenitiesList
                      .filter(a => a.name.toLowerCase().includes(searchAmenity.toLowerCase()))
                      .map(a => {
                        const Icon = getIcon(a.icon);
                        const isSelected = form.amenityIds.includes(a.id);
                        return (
                          <button
                            key={a.id}
                            type="button" // Ngăn chặn trigger submit
                            onClick={() => {
                              handleChange("amenityIds", isSelected 
                                ? form.amenityIds.filter(id => id !== a.id) 
                                : [...form.amenityIds, a.id]
                              );
                            }}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                              isSelected
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-400 hover:bg-emerald-50'
                            }`}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{a.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 ml-auto flex-shrink-0" />}
                          </button>
                        );
                      })
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 mt-4">
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Quy định chung của phòng nội bộ</label>
                <textarea
                  value={form.rules}
                  onChange={(e) => handleChange("rules", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all h-28 resize-none"
                  placeholder="VD: Không tụ tập bạn bè nhậu nhẹt sau 11h đêm, giữ vệ sinh chung..."
                />
              </div>
            </div>
          )}

          {/* BƯỚC 4: UPLOAD HÌNH ẢNH MINH HOẠ */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-fadeIn">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Bước 4: Cập nhật hình ảnh không gian phòng</h3>
              
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-5">
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Đường dẫn liên kết hình ảnh (Image URL)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImage();
                      }
                    }}
                    placeholder="Dán mã liên kết HTTP/HTTPS của ảnh vào đây"
                    className="flex-1 border border-gray-200 bg-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={(e) => handleAddImage(e)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-xl flex items-center justify-center transition-colors shadow-sm"
                    title="Thêm ảnh vào danh sách chờ"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Mẹo: Dán link ảnh rồi nhấn Enter hoặc bấm nút + để lưu vào danh sách xem trước.</p>
              </div>

              {/* Render Images Gallery Preview */}
              {images.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Hình ảnh hiện tại ({images.length}/20)</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {images.map((img, i) => (
                      <div key={i} className="relative group aspect-video rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                        <img src={img} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200 font-bold text-xs gap-1 cursor-pointer"
                        >
                          <Trash2 size={12} /> Xóa ảnh
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black/50 text-[10px] px-1.5 py-0.5 text-white rounded font-bold">
                          #{i + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Wizard Footer Controls Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-100 mt-8">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1 || loading}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} /> Quay lại
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-50 transition"
              >
                Tiếp tục <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-100 disabled:opacity-50 transition"
              >
                {loading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Đang truyền tải...
                  </>
                ) : (
                  "Đăng bài lên hệ thống"
                )}
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}