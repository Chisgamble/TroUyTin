import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bookmark,
  Heart,
  Home,
  Loader,
  RefreshCcw,
  RotateCcw,
  SlidersHorizontal,
  ThumbsUp,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { chatService } from "../services/chatService";
import { roommateService } from "../services/roommates";

const MISSING_PROFILE_TOAST_ID = "roommate-matching-missing-profile";

interface RoommateCandidate {
  id: number;
  userId: string;
  fullName?: string;
  avatarUrl?: string;
  gender: string;
  age: number;
  hometown: string;
  schoolOrJob: string;
  budgetMin?: number | string | null;
  budgetMax?: number | string | null;
  compatibilityPct: number;
  hasPet: boolean;
  sleepSchedule: string;
  tidiness?: string;
  cleaningFreq?: string;
  smoking?: string;
  drinking?: string;
  cookingFreq?: string;
  hasRoom?: boolean;
  roomId?: number | string;
  roomAddress?: string;
}

const GENDER_OPTIONS = [
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
];

const SLEEP_OPTIONS = [
  { value: "EARLY", label: "Sớm" },
  { value: "FLEXIBLE", label: "Linh hoạt" },
  { value: "LATE", label: "Cú đêm" },
];

const TIDINESS_OPTIONS = [
  { value: "MESSY", label: "Thả lỏng" },
  { value: "MODERATE", label: "Vừa phải" },
  { value: "VERY_TIDY", label: "Kỹ tính" },
];

const FREQUENCY_OPTIONS = [
  { value: "NEVER", label: "Không bao giờ" },
  { value: "RARELY", label: "Hiếm khi" },
  { value: "SOMETIMES", label: "Thỉnh thoảng" },
  { value: "OFTEN", label: "Thường xuyên" },
  { value: "ALWAYS", label: "Luôn luôn" },
];

const HABIT_OPTIONS = [
  { value: "NO", label: "Không" },
  { value: "SOMETIMES", label: "Thỉnh thoảng" },
  { value: "YES", label: "Thường xuyên" },
];

const PET_OPTIONS = [
  { value: "any", label: "Bất kỳ" },
  { value: "yes", label: "Có" },
  { value: "no", label: "Không" },
];

const DISPLAY_LABELS: Record<string, string> = {
  EARLY: "Sớm",
  FLEXIBLE: "Linh hoạt",
  LATE: "Cú đêm",
  MESSY: "Thả lỏng",
  MODERATE: "Vừa phải",
  VERY_TIDY: "Kỹ tính",
  NEVER: "Không bao giờ",
  RARELY: "Hiếm khi",
  SOMETIMES: "Thỉnh thoảng",
  OFTEN: "Thường xuyên",
  ALWAYS: "Luôn luôn",
  NO: "Không",
  YES: "Có",
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

const normalizeValue = (value?: string | null) => {
  if (!value) return "";
  const normalized = value.toUpperCase();
  return normalized === "OCCASIONALLY" ? "SOMETIMES" : normalized;
};

const displayValue = (value?: string | null) => DISPLAY_LABELS[normalizeValue(value)] ?? value ?? "";

const formatCurrency = (value?: number | string | null) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return "Chưa cập nhật";
  }

  return `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
};

const parseOptionalNumber = (value: string) => {
  if (!value.trim()) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

export default function RoommateMatching() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<RoommateCandidate[]>([]);
  const [savedUserIds, setSavedUserIds] = useState<string[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [minCompatibility, setMinCompatibility] = useState(0);
  const [filterGender, setFilterGender] = useState<string[]>([]);
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [filterSleep, setFilterSleep] = useState<string[]>([]);
  const [filterTidiness, setFilterTidiness] = useState<string[]>([]);
  const [filterCleaning, setFilterCleaning] = useState<string[]>([]);
  const [filterCooking, setFilterCooking] = useState<string[]>([]);
  const [filterSmoking, setFilterSmoking] = useState<string[]>([]);
  const [filterDrinking, setFilterDrinking] = useState<string[]>([]);
  const [filterPet, setFilterPet] = useState("any");

  useEffect(() => {
    void Promise.all([loadCandidates(), loadSavedState()]);
  }, []);

  const loadSavedState = async () => {
    try {
      const [savedRes, savedCountRes] = await Promise.all([
        roommateService.getSavedRoommates(),
        roommateService.getSavedRoommatesCount(),
      ]);

      const savedIds = savedRes.data.map((item: any) => item.userId).filter(Boolean);
      setSavedUserIds(savedIds);
      setSavedCount(savedCountRes.data?.count ?? savedIds.length);
    } catch (error) {
      console.error("Error loading saved roommate state:", error);
    }
  };

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const res = await roommateService.getDiscover();
      setCandidates(res.data);
    } catch (error: any) {
      console.error("Error:", error);

      if (error.response?.status === 400) {
        toast.error("Bạn cần hoàn thiện hồ sơ thói quen sinh hoạt trước khi tìm bạn ở ghép!", {
          id: MISSING_PROFILE_TOAST_ID,
        });
        navigate("/roommate-onboarding");
      } else {
        toast.error("Lỗi khi tải danh sách ứng viên");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReloadCandidates = async () => {
    try {
      setReloading(true);
      await roommateService.resetDiscover();
      await loadCandidates();
      toast.success("Đã tải lại toàn bộ danh sách ứng viên");
    } catch (error) {
      console.error("Error reloading candidates:", error);
      toast.error("Không thể tải lại danh sách ứng viên");
    } finally {
      setReloading(false);
      void loadSavedState();
    }
  };

  const handleAction = async (
    targetUserId: string,
    action: "PASS" | "SAVE" | "LIKE"
  ) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để thực hiện chức năng này!");
      navigate("/login");
      return;
    }

    if (String(user.id) === String(targetUserId)) {
      toast.error("Bạn không thể tự kết nối với chính mình!");
      return;
    }

    try {
      setActionLoading(`${targetUserId}-${action}`);

      if (action === "SAVE") {
        const isAlreadySaved = savedUserIds.includes(targetUserId);
        if (isAlreadySaved) {
          await roommateService.removeSavedRoommate(targetUserId);
          toast.success("Đã bỏ lưu hồ sơ!");
        } else {
          await roommateService.saveRoommate(targetUserId);
          toast.success("Đã lưu hồ sơ ứng viên!");
        }
        void loadSavedState();
        return;
      }

      if (action === "LIKE") {
        const conversationId = await chatService.getOrCreateConversation(
          String(user.id),
          String(targetUserId)
        );

        toast.success("Đang chuyển đến phòng trò chuyện...");

        navigate("/chat", {
          state: {
            conversationId,
            participantId: targetUserId,
          },
        });
        return;
      }

      if (action === "PASS") {
        await roommateService.createMatch(targetUserId, "PASS");
        toast("Đã bỏ qua ứng viên", { icon: "👋" });
        setCandidates((prev) => prev.filter((candidate) => candidate.userId !== targetUserId));
      }
    } catch (error: any) {
      console.error("Lỗi khi xử lý thao tác:", error);
      if (error.response?.status === 409) {
        toast.error("Đã tương tác với người này rồi!");
        setCandidates((prev) => prev.filter((candidate) => candidate.userId !== targetUserId));
      } else {
        const message = error instanceof Error ? error.message : "Lỗi hệ thống, vui lòng thử lại sau";
        toast.error(message);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const resetFilters = () => {
    setMinCompatibility(0);
    setFilterGender([]);
    setAgeMin("");
    setAgeMax("");
    setBudgetMin("");
    setBudgetMax("");
    setFilterSleep([]);
    setFilterTidiness([]);
    setFilterCleaning([]);
    setFilterCooking([]);
    setFilterSmoking([]);
    setFilterDrinking([]);
    setFilterPet("any");
  };

  const toggleFilterValue = (
    value: string,
    current: string[],
    setter: Dispatch<SetStateAction<string[]>>
  ) => {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const filteredCandidates = useMemo(() => {
    const minAge = parseOptionalNumber(ageMin);
    const maxAge = parseOptionalNumber(ageMax);
    const minBudget = parseOptionalNumber(budgetMin);
    const maxBudget = parseOptionalNumber(budgetMax);

    return candidates.filter((candidate) => {
      const candidateAge = Number(candidate.age);
      const candidateBudgetMin = candidate.budgetMin != null ? Number(candidate.budgetMin) : null;
      const candidateBudgetMax = candidate.budgetMax != null ? Number(candidate.budgetMax) : null;

      if (candidate.compatibilityPct < minCompatibility) return false;
      if (filterGender.length > 0 && !filterGender.includes(normalizeValue(candidate.gender))) return false;
      if (minAge !== null && candidateAge < minAge) return false;
      if (maxAge !== null && candidateAge > maxAge) return false;

      if (minBudget !== null || maxBudget !== null) {
        if (
          candidateBudgetMin === null ||
          candidateBudgetMax === null ||
          !Number.isFinite(candidateBudgetMin) ||
          !Number.isFinite(candidateBudgetMax)
        ) {
          return false;
        }

        const desiredMin = minBudget ?? 0;
        const desiredMax = maxBudget ?? Number.MAX_SAFE_INTEGER;

        if (desiredMin > candidateBudgetMax || desiredMax < candidateBudgetMin) {
          return false;
        }
      }

      if (filterSleep.length > 0 && !filterSleep.includes(normalizeValue(candidate.sleepSchedule))) return false;
      if (filterTidiness.length > 0 && !filterTidiness.includes(normalizeValue(candidate.tidiness))) return false;
      if (filterCleaning.length > 0 && !filterCleaning.includes(normalizeValue(candidate.cleaningFreq))) return false;
      if (filterCooking.length > 0 && !filterCooking.includes(normalizeValue(candidate.cookingFreq))) return false;
      if (filterSmoking.length > 0 && !filterSmoking.includes(normalizeValue(candidate.smoking))) return false;
      if (filterDrinking.length > 0 && !filterDrinking.includes(normalizeValue(candidate.drinking))) return false;
      if (filterPet === "yes" && !candidate.hasPet) return false;
      if (filterPet === "no" && candidate.hasPet) return false;
      return true;
    });
  }, [
    candidates,
    minCompatibility,
    filterGender,
    ageMin,
    ageMax,
    budgetMin,
    budgetMax,
    filterSleep,
    filterTidiness,
    filterCleaning,
    filterCooking,
    filterSmoking,
    filterDrinking,
    filterPet,
  ]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (minCompatibility > 0) count += 1;
    if (filterGender.length > 0) count += 1;
    if (ageMin || ageMax) count += 1;
    if (budgetMin || budgetMax) count += 1;
    if (filterSleep.length > 0) count += 1;
    if (filterTidiness.length > 0) count += 1;
    if (filterCleaning.length > 0) count += 1;
    if (filterCooking.length > 0) count += 1;
    if (filterSmoking.length > 0) count += 1;
    if (filterDrinking.length > 0) count += 1;
    if (filterPet !== "any") count += 1;
    return count;
  }, [
    minCompatibility,
    filterGender,
    ageMin,
    ageMax,
    budgetMin,
    budgetMax,
    filterSleep,
    filterTidiness,
    filterCleaning,
    filterCooking,
    filterSmoking,
    filterDrinking,
    filterPet,
  ]);

  const getTags = (candidate: RoommateCandidate) => {
    const tags = [];
    if (candidate.hasPet) tags.push({ label: "🐕 Có thú cưng", type: "error" });
    if (candidate.sleepSchedule) tags.push({ label: `⏰ ${displayValue(candidate.sleepSchedule)}`, type: "info" });
    if (candidate.tidiness) tags.push({ label: `✨ ${displayValue(candidate.tidiness)}`, type: "info" });
    if (candidate.cleaningFreq) tags.push({ label: `🧹 ${displayValue(candidate.cleaningFreq)}`, type: "info" });
    if (candidate.cookingFreq) tags.push({ label: `🍳 ${displayValue(candidate.cookingFreq)}`, type: "info" });
    if (candidate.smoking) tags.push({ label: `🚭 ${displayValue(candidate.smoking)}`, type: "info" });
    if (candidate.drinking) tags.push({ label: `🍻 ${displayValue(candidate.drinking)}`, type: "info" });
    return tags;
  };

  const renderFilterGroup = (
    title: string,
    options: { value: string; label: string }[],
    selected: string[],
    setter: Dispatch<SetStateAction<string[]>>
  ) => (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">
        {title}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleFilterValue(option.value, selected, setter)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                active
                  ? "bg-[var(--brand-600)] text-white border-[var(--brand-600)] shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderFilterPanel = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-[var(--brand-600)]" />
          Bộ lọc
          {activeFilterCount > 0 && (
            <span className="text-[10px] bg-[var(--brand-600)] text-white rounded-full px-1.5 py-0.5 leading-none">
              {activeFilterCount}
            </span>
          )}
        </h3>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-[11px] text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
          >
            <RotateCcw size={11} />
            Xóa
          </button>
        )}
      </div>

      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">
          Tương thích tối thiểu <span className="normal-case text-[var(--brand-600)]">{minCompatibility}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={minCompatibility}
          onChange={(event) => setMinCompatibility(Number(event.target.value))}
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--brand-600)]"
        />
        <div className="mt-1 flex justify-between text-[10px] text-gray-400">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="h-px bg-gray-100" />

      {renderFilterGroup("Giới tính", GENDER_OPTIONS, filterGender, setFilterGender)}

      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">
          Độ tuổi
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            value={ageMin}
            onChange={(event) => setAgeMin(event.target.value)}
            placeholder="Từ"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[var(--brand-600)]"
          />
          <input
            type="number"
            min={0}
            value={ageMax}
            onChange={(event) => setAgeMax(event.target.value)}
            placeholder="Đến"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[var(--brand-600)]"
          />
        </div>
      </div>

      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">
          Ngân sách mong muốn
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            value={budgetMin}
            onChange={(event) => setBudgetMin(event.target.value)}
            placeholder="Từ"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[var(--brand-600)]"
          />
          <input
            type="number"
            min={0}
            value={budgetMax}
            onChange={(event) => setBudgetMax(event.target.value)}
            placeholder="Đến"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[var(--brand-600)]"
          />
        </div>
        <p className="text-[11px] text-gray-400 mt-1">Lọc theo khoảng ngân sách của ứng viên.</p>
      </div>

      <div className="h-px bg-gray-100" />

      {renderFilterGroup("Giờ giấc ngủ", SLEEP_OPTIONS, filterSleep, setFilterSleep)}
      {renderFilterGroup("Độ ngăn nắp", TIDINESS_OPTIONS, filterTidiness, setFilterTidiness)}
      {renderFilterGroup("Dọn dẹp", FREQUENCY_OPTIONS, filterCleaning, setFilterCleaning)}
      {renderFilterGroup("Nấu ăn", FREQUENCY_OPTIONS, filterCooking, setFilterCooking)}
      {renderFilterGroup("Hút thuốc", HABIT_OPTIONS, filterSmoking, setFilterSmoking)}
      {renderFilterGroup("Uống rượu", HABIT_OPTIONS, filterDrinking, setFilterDrinking)}

      <div className="h-px bg-gray-100" />

      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">
          Thú cưng
        </label>
        <div className="flex gap-1.5">
          {PET_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilterPet(option.value)}
              className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                filterPet === option.value
                  ? "bg-[var(--brand-600)] text-white border-[var(--brand-600)] shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-3 text-[var(--brand-600)]" size={40} />
          <div className="text-gray-600 font-medium">Đang tìm kiếm các ứng viên phù hợp...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Khám phá bạn cùng phòng</h1>
            <p className="text-sm text-gray-500 mt-1">
              Hệ thống đã chọn lọc những người có độ tương thích cao nhất với bạn
            </p>
          </div>

          <div className="flex flex-wrap gap-3 w-full xl:w-auto">
            <button
              type="button"
              onClick={() => setShowMobileFilters((prev) => !prev)}
              className="xl:hidden flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all font-semibold shadow-sm shrink-0 text-sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Bộ lọc {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
            </button>

            <button
              type="button"
              onClick={() => navigate("/saved-roommates")}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 transition-all font-semibold shadow-sm shrink-0 text-sm"
            >
              <Bookmark className="w-4 h-4 fill-amber-700" />
              Hồ sơ đã lưu ({savedCount})
            </button>

            <button
              type="button"
              onClick={handleReloadCandidates}
              disabled={loading || reloading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-all font-semibold shadow-sm shrink-0 text-sm disabled:opacity-60"
            >
              <RefreshCcw className={reloading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
              Tải lại
            </button>
          </div>
        </div>

        {showMobileFilters && (
          <div className="xl:hidden mb-6">
            {renderFilterPanel()}
          </div>
        )}

        <div className="flex flex-col xl:flex-row items-start gap-8">
          <aside className="hidden xl:block w-full xl:w-[300px] xl:shrink-0 xl:sticky xl:top-6">
            {renderFilterPanel()}
          </aside>

          <section className="w-full flex-1 xl:pl-3">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Danh sách matching</h2>
                <p className="text-sm text-gray-500">
                  Hiển thị {filteredCandidates.length} / {candidates.length} ứng viên
                </p>
              </div>
            </div>

            {candidates.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
                <div className="text-6xl mb-4">✨</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Không còn ứng viên nào mới</h2>
                <p className="text-gray-500 max-w-sm mx-auto mb-6 text-sm">
                  Bạn đã lướt hết các gợi ý hiện tại. Hãy quay lại sau hoặc cập nhật thêm thói quen tại hồ sơ cá nhân để mở rộng tệp tìm kiếm.
                </p>
                <button
                  type="button"
                  onClick={handleReloadCandidates}
                  className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-semibold py-2.5 px-6 rounded-xl shadow-sm transition-colors text-sm"
                >
                  Cập nhật lại danh sách
                </button>
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="text-5xl mb-4">🧩</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Không có ứng viên phù hợp bộ lọc hiện tại</h2>
                <p className="text-gray-500 max-w-md mx-auto mb-6 text-sm">
                  Hãy nới lỏng một vài tiêu chí hoặc giảm ngưỡng tương thích để xem thêm gợi ý.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-6 rounded-xl transition-colors text-sm"
                >
                  <RotateCcw size={14} />
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                {filteredCandidates.map((candidate) => {
                  const isSaved = savedUserIds.includes(candidate.userId);

                  return (
                    <div
                      key={candidate.userId}
                      className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 transition duration-200 overflow-hidden flex flex-col"
                    >
                      <div className="h-44 bg-gradient-to-br from-[var(--brand-800)] via-[var(--brand-600)] to-[#7c3aed] flex items-center justify-center relative shrink-0">
                        {candidate.hasRoom && (
                          <div className="absolute top-4 left-4 bg-blue-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm z-10 flex items-center gap-1 border border-blue-400">
                            <Home size={12} /> Đã có phòng
                          </div>
                        )}

                        {candidate.avatarUrl ? (
                          <img
                            src={candidate.avatarUrl}
                            alt={candidate.fullName}
                            className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-sm"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full border-4 border-white bg-blue-100 flex items-center justify-center text-4xl shadow-sm select-none">
                            👤
                          </div>
                        )}

                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl p-2 min-w-[56px] text-center shadow-md border border-blue-100">
                          <p className="text-lg font-black text-[var(--brand-600)] leading-none">
                            {candidate.compatibilityPct}%
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider">
                            Hợp gu
                          </p>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 truncate mb-1">
                            {candidate.fullName || "Sinh viên ẩn danh"}
                          </h3>

                          <p className="text-xs font-semibold text-[var(--brand-600)] bg-blue-50 inline-block px-2 py-0.5 rounded-md mb-4">
                            {candidate.age} tuổi • {displayValue(candidate.gender)}
                          </p>

                          <div className="space-y-2 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 shrink-0">📍</span>
                              <span className="truncate">Quê quán: {candidate.hometown || "Chưa cập nhật"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 shrink-0">🎓</span>
                              <span className="line-clamp-1">
                                Học vấn/Công việc: {candidate.schoolOrJob || "Chưa cập nhật"}
                              </span>
                            </div>
                          </div>

                          {getTags(candidate).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {getTags(candidate).map((tag, index) => (
                                <span
                                  key={`${candidate.userId}-${index}`}
                                  className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md ${
                                    tag.type === "error"
                                      ? "bg-rose-50 text-rose-700 border border-rose-100"
                                      : "bg-blue-50 text-blue-700 border border-blue-100"
                                  }`}
                                >
                                  {tag.label}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 mb-4">
                            <div className="text-[10px] uppercase tracking-wide font-bold text-emerald-500 mb-1">
                              Ngân sách
                            </div>
                            <div className="text-xs font-semibold text-emerald-800">
                              {formatCurrency(candidate.budgetMin)} - {formatCurrency(candidate.budgetMax)}
                            </div>
                          </div>
                        </div>

                        <div>
                          {candidate.hasRoom && candidate.roomAddress && (
                            <div className="flex items-start gap-2 text-sm text-blue-700 mb-4 bg-blue-50/80 border border-blue-100 rounded-xl p-2.5">
                              <span className="shrink-0">🏠</span>
                              <span className="line-clamp-2">Địa chỉ phòng: {candidate.roomAddress}</span>
                            </div>
                          )}

                          {candidate.hasRoom && candidate.roomId && (
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/roommate-posts/${candidate.roomId}`, {
                                  state: { compatibilityPct: candidate.compatibilityPct },
                                })
                              }
                              className="w-full mt-3 mb-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-2 rounded-xl text-xs transition-colors border border-blue-200 flex items-center justify-center gap-1.5"
                            >
                              <Home size={14} /> Xem phòng của họ
                            </button>
                          )}

                          <div className="flex gap-2 pt-4 border-t border-gray-100 mt-4">
                            <button
                              type="button"
                              onClick={() => handleAction(candidate.userId, "PASS")}
                              disabled={!!actionLoading}
                              className="flex-1 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 text-gray-600 py-2 rounded-xl flex items-center justify-center gap-1 transition-colors font-semibold text-xs border border-gray-200"
                            >
                              {actionLoading === `${candidate.userId}-PASS` ? (
                                <Loader size={14} className="animate-spin" />
                              ) : (
                                <>
                                  <X size={14} />
                                  Bỏ qua
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAction(candidate.userId, "SAVE")}
                              disabled={!!actionLoading}
                              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1 transition-all font-semibold text-xs border ${
                                isSaved
                                  ? "bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 shadow-sm"
                                  : "bg-amber-50 hover:bg-amber-100/80 text-amber-700 border-amber-100"
                              } disabled:opacity-50`}
                            >
                              {actionLoading === `${candidate.userId}-SAVE` ? (
                                <Loader size={14} className="animate-spin" />
                              ) : (
                                <>
                                  <Heart size={14} className={isSaved ? "fill-rose-500 text-rose-500" : ""} />
                                  {isSaved ? "Đã lưu" : "Lưu"}
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAction(candidate.userId, "LIKE")}
                              disabled={!!actionLoading}
                              className="flex-1 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] disabled:opacity-50 text-white py-2 rounded-xl flex items-center justify-center gap-1 transition-colors font-semibold text-xs shadow-sm shadow-blue-100"
                            >
                              {actionLoading === `${candidate.userId}-LIKE` ? (
                                <Loader size={14} className="animate-spin" />
                              ) : (
                                <>
                                  <ThumbsUp size={14} />
                                  Chat ngay
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
