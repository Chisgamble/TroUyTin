import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { roommateService } from "../services/roommates";
import { 
  User, Calendar, MapPin, Briefcase, DollarSign, 
  Moon, Cigarette, Beer, Sparkles, Sliders, Loader 
} from "lucide-react";

export default function RoommateOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    gender: "",
    age: "",
    hometown: "",
    schoolOrJob: "",
    budgetMin: "",
    budgetMax: "",
    smoking: "NO",
    drinking: "NO",
    sleepSchedule: "10PM-6AM",
    tidiness: "MEDIUM",
    cleaningFreq: "SOMETIMES",
    hasPet: false,
    allowOvernightGuest: false,
    hasRoom: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // HTML Validation bổ sung kiểm tra logic số liệu tài chính
    if (Number(form.budgetMin) > Number(form.budgetMax)) {
      alert("Ngân sách tối thiểu không được lớn hơn ngân sách tối đa!");
      return;
    }

    setLoading(true);
    try {
      await roommateService.createOrUpdateProfile(form);
      navigate("/roommate-matching");
    } catch (error) {
      console.error("Error:", error);
      alert("Lỗi khi lưu hồ sơ lối sống");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 p-4 sm:p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-emerald-100 p-6 sm:p-10 my-4">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-2xl mb-3">
            <Sparkles size={28} className="animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Thiết lập hồ sơ ở ghép
          </h1>
          <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
            Hệ thống dựa trên thói quen của bạn để tự động tính toán mức độ hợp cạ (Cosine Similarity)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SECTION 1: THÔNG TIN CƠ BẢN */}
          <div className="bg-gray-50/60 border border-gray-100 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2 mb-2">
              <User size={16} /> 1. Thông tin cá nhân
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Giới tính</label>
                <select
                  required
                  value={form.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                  className="w-full border border-gray-200 bg-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                >
                  <option value="">-- Chọn giới tính --</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Tuổi của bạn</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="18"
                    max="80"
                    value={form.age}
                    onChange={(e) => handleChange("age", e.target.value)}
                    className="w-full border border-gray-200 bg-white rounded-xl p-3 pl-9 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                    placeholder="Nhập tuổi (18+)"
                  />
                  <Calendar className="absolute left-3 top-3.5 text-gray-400" size={16} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Quê quán / Vùng miền</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={form.hometown}
                    onChange={(e) => handleChange("hometown", e.target.value)}
                    className="w-full border border-gray-200 bg-white rounded-xl p-3 pl-9 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                    placeholder="VD: Huế, Hà Nội, TP.HCM"
                  />
                  <MapPin className="absolute left-3 top-3.5 text-gray-400" size={16} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Trường học / Nghề nghiệp</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={form.schoolOrJob}
                    onChange={(e) => handleChange("schoolOrJob", e.target.value)}
                    className="w-full border border-gray-200 bg-white rounded-xl p-3 pl-9 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                    placeholder="VD: ĐH Khoa học Tự nhiên"
                  />
                  <Briefcase className="absolute left-3 top-3.5 text-gray-400" size={16} />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: TÀI CHÍNH & VỊ TRÍ */}
          <div className="bg-gray-50/60 border border-gray-100 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2 mb-2">
              <DollarSign size={16} /> 2. Ngân sách chi trả gánh được
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Tối thiểu (VNĐ / Tháng)</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    step="50000"
                    value={form.budgetMin}
                    onChange={(e) => handleChange("budgetMin", e.target.value)}
                    className="w-full border border-gray-200 bg-white rounded-xl p-3 pl-9 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                    placeholder="VD: 1,500,000"
                  />
                  <span className="absolute left-3 top-3 font-bold text-gray-400 text-sm">₫</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Tối đa gánh được (VNĐ / Tháng)</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    step="50000"
                    value={form.budgetMax}
                    onChange={(e) => handleChange("budgetMax", e.target.value)}
                    className="w-full border border-gray-200 bg-white rounded-xl p-3 pl-9 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                    placeholder="VD: 3,500,000"
                  />
                  <span className="absolute left-3 top-3 font-bold text-gray-400 text-sm">₫</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: THÓI QUEN TRỰC QUAN (CARD SELECTION) */}
          <div className="space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
              <Sliders size={16} /> 3. Thói quen sinh hoạt cá nhân
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Giờ giấc ngủ */}
              <div className="bg-gray-50/40 p-4 border border-gray-100 rounded-2xl">
                <label className="block text-xs font-black text-gray-700 uppercase mb-2 flex items-center gap-1.5">
                  <Moon size={14} className="text-indigo-500" /> Giờ giấc ngủ
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "8PM-5AM", label: "Sớm" },
                    { value: "10PM-6AM", label: "Chuẩn" },
                    { value: "12AM-8AM", label: "Cú đêm" },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.value}
                      onClick={() => handleChange("sleepSchedule", item.value)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                        form.sleepSchedule === item.value
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mức độ ngăn nắp */}
              <div className="bg-gray-50/40 p-4 border border-gray-100 rounded-2xl">
                <label className="block text-xs font-black text-gray-700 uppercase mb-2 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" /> Độ ngăn nắp
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "LOW", label: "Thả lỏng" },
                    { value: "MEDIUM", label: "Vừa phải" },
                    { value: "HIGH", label: "Kỹ tính" },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.value}
                      onClick={() => handleChange("tidiness", item.value)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                        form.tidiness === item.value
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tần suất hút thuốc */}
              <div className="bg-gray-50/40 p-4 border border-gray-100 rounded-2xl">
                <label className="block text-xs font-black text-gray-700 uppercase mb-2 flex items-center gap-1.5">
                  <Cigarette size={14} className="text-rose-500" /> Hút thuốc
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "NO", label: "Không" },
                    { value: "SOMETIMES", label: "Ít/Lễ hội" },
                    { value: "YES", label: "Thường xuyên" },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.value}
                      onClick={() => handleChange("smoking", item.value)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                        form.smoking === item.value
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tần suất uống rượu */}
              <div className="bg-gray-50/40 p-4 border border-gray-100 rounded-2xl">
                <label className="block text-xs font-black text-gray-700 uppercase mb-2 flex items-center gap-1.5">
                  <Beer size={14} className="text-orange-500" /> Đồ uống có cồn
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "NO", label: "Không" },
                    { value: "SOMETIMES", label: "Thỉnh thoảng" },
                    { value: "YES", label: "Hay nhậu" },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.value}
                      onClick={() => handleChange("drinking", item.value)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                        form.drinking === item.value
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Các tùy chọn Boolean nhanh dạng dải hàng ngang */}
            <div className="space-y-3 pt-2">
              {[
                { field: "hasPet", label: "🐾 Tôi định nuôi hoặc mang theo thú cưng vào phòng" },
                { field: "allowOvernightGuest", label: "🤝 Tôi muốn được phép dẫn bạn bè/Người yêu qua đêm" },
                { field: "hasRoom", label: "🏠 Hiện tôi ĐÃ CÓ PHÒNG SẴN, chỉ tuyển người vào gánh tiền phụ" },
              ].map((item) => (
                <label
                  key={item.field}
                  className={`flex items-center gap-4 p-3 border rounded-xl cursor-pointer select-none transition-all ${
                    (form as any)[item.field]
                      ? "bg-emerald-50/60 border-emerald-400 text-emerald-900 font-medium"
                      : "bg-white border-gray-100 text-gray-600 hover:border-gray-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={(form as any)[item.field]}
                    onChange={(e) => handleChange(item.field, e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                  <span className="text-xs sm:text-sm">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-100 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={16} />
                Đang mã hóa hồ sơ...
              </>
            ) : (
              "Hoàn tất & Khám phá ứng viên phù hợp"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}