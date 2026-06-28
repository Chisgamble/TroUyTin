import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { roommatePostService } from "../services/roommates";
import { Loader, ChevronRight, ChevronLeft, Check, Plus, Trash2, MapPin, ListPlus, ShieldAlert, Image } from "lucide-react";

export default function RoommatePostCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    area: "",
    pricePerMonth: "",
    roomType: "PHONG_TRO",
    wardId: "",
    addressDetail: "",
    availableFrom: "",
    amenities: [] as string[],
    rules: "",
  });

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageInput.trim()) return;
    
    if (images.length < 20) {
      setImages([...images, imageInput.trim()]);
      setImageInput("");
    } else {
      alert("Hệ thống giới hạn tối đa 20 ảnh đầu vào.");
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // HTML Validation bổ sung cho bước cuối cùng
    if (!form.title || !form.pricePerMonth) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc trước khi đăng!");
      return;
    }

    setLoading(true);
    try {
      const postRes = await roommatePostService.createPost({
        ...form,
        area: form.area ? parseFloat(form.area) : null,
        wardId: form.wardId ? parseInt(form.wardId) : null,
        amenities: form.amenities,
      });

      const postId = postRes.data.id;

      // Chạy vòng lặp upload ảnh tuần tự lên Backend
      for (let i = 0; i < images.length; i++) {
        await roommatePostService.uploadImage(postId, images[i], i);
      }

      alert("Bài đăng tuyển ở ghép đã được tạo thành công!");
      // SỬA: Điều hướng chuẩn xác về Route danh sách bài đăng có trong App.tsx
      navigate("/roommate-posts");
    } catch (error) {
      console.error("Error:", error);
      alert("Lỗi hệ thống khi tạo bài đăng");
    } finally {
      setLoading(false);
    }
  };

  const amenityOptions = ["Wifi", "Điều hòa", "Bếp", "Phòng tắm riêng", "Chỗ để xe", "Máy giặt", "Nóng lạnh", "TV"];

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  // Định nghĩa các bước Wizard
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
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* BƯỚC 1: THÔNG TIN CƠ BẢN */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Bước 1: Khai báo thông tin cơ bản</h3>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Tiêu đề bài viết bài đăng *</label>
                <input
                  type="text"
                  required
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
                    required
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
                  required
                  value={form.wardId}
                  onChange={(e) => handleChange("wardId", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                  placeholder="Nhập mã ID hành chính của Phường"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Địa chỉ chi tiết viết tay</label>
                <input
                  type="text"
                  value={form.addressDetail}
                  onChange={(e) => handleChange("addressDetail", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                  placeholder="Số nhà, tên hẻm, tên đường, tên tòa nhà thương mại..."
                />
              </div>
            </div>
          )}

          {/* BƯỚC 3: TIỆN ÍCH & NỘI QUY */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Bước 3: Tiện ích cơ sở vật chất & Quy định</h3>
              
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-3">Tích chọn các tiện ích phòng đang sở hữu</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {amenityOptions.map((amenity) => {
                    const isChecked = form.amenities.includes(amenity);
                    return (
                      <label 
                        key={amenity} 
                        className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer select-none transition-all text-xs font-medium ${
                          isChecked 
                            ? "bg-emerald-50 border-emerald-400 text-emerald-900" 
                            : "bg-white border-gray-100 text-gray-600 hover:border-gray-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleChange("amenities", [...form.amenities, amenity]);
                            } else {
                              handleChange("amenities", form.amenities.filter((a) => a !== amenity));
                            }
                          }}
                          className="w-3.5 h-3.5 accent-emerald-600 rounded"
                        />
                        {amenity}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Quy định chung của phòng nội bộ</label>
                <textarea
                  value={form.rules}
                  onChange={(e) => handleChange("rules", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all h-28 resize-none"
                  placeholder="VD: Không tụ tập bạn bè nhậu nhẹt sau 11h đêm, giữ vệ sinh chung luân phiên dọn dẹp hàng tuần..."
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
                    placeholder="Dán mã liên kết HTTP/HTTPS của ảnh vào đây"
                    className="flex-1 border border-gray-200 bg-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-xl flex items-center justify-center transition-colors shadow-sm"
                    title="Thêm ảnh vào danh sách chờ"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Mẹo: Bạn có thể nhập mã link ảnh mẫu CDN rồi ấn dấu cộng hoặc bấm phím Enter để kích hoạt lưu danh sách tạm.</p>
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