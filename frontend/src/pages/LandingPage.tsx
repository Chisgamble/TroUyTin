import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  Ghost,
  Globe,
  House,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Quote,
  ScanFace,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import { getDistricts, type District } from "../services/roomListing";

const HCM_PROVINCE_ID = 79;

const PRICE_OPTIONS = [
  { value: "", label: "Mức giá" },
  { value: "0-2000000", label: "Dưới 2 triệu" },
  { value: "2000000-4000000", label: "2 - 4 triệu" },
  { value: "4000000-6000000", label: "4 - 6 triệu" },
  { value: "6000000-", label: "Trên 6 triệu" },
];

const ROOM_TYPE_OPTIONS = [
  { value: "", label: "Loại hình" },
  { value: "PHONG_TRO", label: "Phòng trọ" },
  { value: "CAN_HO_MINI", label: "Căn hộ mini" },
  { value: "KTX", label: "Ký túc xá" },
  { value: "NGUYEN_CAN", label: "Nhà nguyên căn" },
];

const PAIN_POINTS = [
  {
    icon: Ghost,
    title: "Tin ảo, ảnh một đằng thực tế một nẻo",
    body: "Lặn lội cả buổi chiều tới xem phòng, mở cửa ra mới biết ảnh trên mạng là phòng khác. Có tin còn đã cho thuê từ mấy tháng trước nhưng không ai gỡ.",
  },
  {
    icon: Users,
    title: "Sợ mâu thuẫn lối sống khi ở ghép",
    body: "Ở ghép với người lạ là đánh cược: bạn ngủ sớm thì gặp người thức khuya, bạn thích sạch sẽ thì gặp người bừa bộn. Ở được một tháng là muốn dọn đi.",
  },
  {
    icon: Wallet,
    title: "Chi phí ẩn và nỗi lo mất cọc",
    body: "Giá đăng 2 triệu, tới lúc ký mới lộ thêm phí điện nước, phí giữ xe, phí quản lý. Đến khi dọn ra thì chủ trọ tìm đủ lý do để giữ lại tiền cọc.",
  },
];

const SOLUTIONS = [
  {
    icon: ShieldCheck,
    badge: "Tin được xác thực",
    title: "Duyệt tin nghiêm ngặt, minh bạch chi phí",
    body: "Tin đăng trải qua quy trình duyệt trước khi lên sàn: đối chiếu địa chỉ, kiểm tra ảnh thật và yêu cầu chủ trọ khai báo đầy đủ chi phí. Tin sai lệch bị gỡ khi có khiếu nại.",
    points: [
      "Chủ trọ xác minh danh tính trước khi đăng tin",
      "Bảng chi phí điện, nước, giữ xe công khai từ đầu",
      "Nút báo cáo tin sai ngay trên trang xem phòng",
    ],
    accent: "blue" as const,
  },
  {
    icon: ScanFace,
    badge: "Gợi ý lối sống",
    title: "Lifestyle Match - ghép đúng người hợp cạ",
    body: "Thuật toán so khớp dựa trên giờ giấc sinh hoạt, thói quen vệ sinh, ngân sách và các thói quen sống khác, để bạn thấy trước mức độ hợp nhau thay vì ở thử rồi mới biết.",
    points: [
      "So khớp giờ giấc ngủ - thức và nhịp sinh hoạt",
      "Đối chiếu mức độ ngăn nắp và thói quen vệ sinh",
      "Khớp ngân sách để không ai phải cố quá sức",
    ],
    accent: "violet" as const,
  },
];

const STEPS = [
  {
    icon: Sparkles,
    step: "Bước 1",
    title: "Tạo profile lối sống",
    time: "1 phút",
    body: "Trả lời vài câu về giờ giấc, lối sống và ngân sách của bạn. Chỉ một phút là xong.",
  },
  {
    icon: Search,
    step: "Bước 2",
    title: "Lướt phòng & bạn ở ghép đã xác thực",
    time: "Tin sạch",
    body: "Xem danh sách phòng trọ và bạn ở ghép đã qua kiểm duyệt, kèm điểm hợp gu tính riêng cho bạn.",
  },
  {
    icon: CalendarCheck,
    step: "Bước 3",
    title: "Kết nối trực tiếp & chốt hợp đồng an tâm",
    time: "An tâm",
    body: "Chat thẳng với chủ trọ hoặc bạn ở ghép, xem phòng rồi ký hợp đồng với chi phí đã minh bạch từ đầu.",
  },
];

const STATS = [
  { num: "1,200+", label: "Sinh viên đã ghép thành công" },
  { num: "500+", label: "Phòng trọ tin sạch" },
  { num: "90%+", label: "Độ khớp lối sống" },
  { num: "4.8/5", label: "Điểm hài lòng người dùng" },
];

const TESTIMONIALS = [
  {
    name: "Lâm Hữu Khánh",
    school: "HCMUS - Công nghệ thông tin",
    initials: "HK",
    quote:
      "Trước đây mình đi xem 5 phòng thì 3 phòng khác hẳn ảnh. Trên Trọ Uy Tín thì phòng đúng như tin đăng, chi phí điện nước ghi rõ từ đầu nên không bị hớ.",
    tone: "blue" as const,
  },
  {
    name: "Nguyễn Hoàng Quân",
    school: "UEH - Quản trị",
    initials: "HQ",
    quote:
      "Mình thức khuya học bài nên sợ nhất là ở ghép với người ngủ sớm. Match được bạn cùng 94% giờ giấc, ở ba tháng rồi chưa có lần nào phải nhắc nhau.",
    tone: "emerald" as const,
  },
  {
    name: "Trần Minh Vương",
    school: "HCMUT - Cơ khí",
    initials: "MV",
    quote:
      "Là sinh viên năm nhất từ quê lên, mình không biết bắt đầu từ đâu. Lọc theo khu gần trường với đúng ngân sách, hai ngày là tìm được phòng và bạn ở ghép.",
    tone: "violet" as const,
  },
];

const ACCENT_STYLES = {
  blue: {
    card: "border-blue-100 bg-blue-50/60",
    iconBox: "bg-blue-600 text-white",
    badge: "bg-blue-100 text-blue-700",
    check: "text-blue-600",
  },
  violet: {
    card: "border-violet-100 bg-violet-50/60",
    iconBox: "bg-violet-600 text-white",
    badge: "bg-violet-100 text-violet-700",
    check: "text-violet-600",
  },
} as const;

const AVATAR_TONES = {
  blue: "bg-blue-100 text-blue-700",
  violet: "bg-violet-100 text-violet-700",
  emerald: "bg-emerald-100 text-emerald-700",
} as const;

const SOCIAL_LINKS = [
  { icon: Globe, label: "Fanpage Trọ Uy Tín" },
  { icon: Video, label: "Kênh video Trọ Uy Tín" },
  { icon: Mail, label: "Email hỗ trợ" },
  { icon: Link2, label: "Cộng đồng sinh viên" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [districts, setDistricts] = useState<District[]>([]);
  const [districtId, setDistrictId] = useState("");
  const [price, setPrice] = useState("");
  const [roomType, setRoomType] = useState("");

  useEffect(() => {
    let cancelled = false;

    getDistricts(HCM_PROVINCE_ID)
      .then((loaded) => {
        if (!cancelled) setDistricts(loaded);
      })
      .catch((error) => {
        console.error("Không thể tải danh sách quận/huyện:", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const districtOptions = useMemo(
    () =>
      districts.map((district) => ({
        value: String(district.id),
        label: district.name,
      })),
    [districts],
  );

  const handleQuickSearch = (event: React.FormEvent) => {
    event.preventDefault();

    const params = new URLSearchParams();
    if (districtId) {
      params.set("province", String(HCM_PROVINCE_ID));
      params.set("district", districtId);
    }
    if (roomType) params.set("type", roomType);
    if (price) {
      const [min, max] = price.split("-");
      if (min) params.set("minPrice", min);
      if (max) params.set("maxPrice", max);
    }

    const queryString = params.toString();
    navigate(queryString ? `/tim-kiem?${queryString}` : "/tim-kiem");
  };

  return (
    <div className="bg-white">
      {/* ═══════════ 1. HERO ═══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-800 via-blue-600 to-violet-700 px-5 pb-16 pt-16 sm:px-8 sm:pb-20 sm:pt-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl"
        />

        <div className="relative mx-auto max-w-5xl text-center">
          {/* Tên thương hiệu */}
          <div className="mb-6 flex items-center justify-center gap-3">
            <span className="text-4xl font-black tracking-tight text-white sm:text-6xl">
              Trọ Uy Tín
            </span>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-sm sm:text-sm">
            <BadgeCheck size={16} />
            Nền tảng tìm trọ &amp; ở ghép dành riêng cho sinh viên
          </span>

          <h1 className="mt-6 text-2xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Tìm Phòng Trọ Sạch - Ghép Đội Hợp Cạ.
            <span className="mt-2 block bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
              Không Lừa Đảo, Không Tin Rác.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-blue-50/90 sm:text-lg">
            Nền tảng minh bạch danh cho sinh viên: mọi tin đăng đều được xác thực,
            mọi chi phí đều công khai, và bạn ở ghép được gợi ý theo đúng lối sống của bạn.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/tim-kiem"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-blue-700 shadow-lg transition hover:bg-blue-50 sm:w-auto sm:text-base"
            >
              <Search size={19} />
              Tìm phòng ngay
            </Link>
            <Link
              to="/roommate-matching"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-white/70 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20 sm:w-auto sm:text-base"
            >
              <Users size={19} />
              Tìm bạn ở ghép
            </Link>
          </div>

          {/* Quick Search Box */}
          <form
            onSubmit={handleQuickSearch}
            className="mx-auto mt-10 max-w-4xl rounded-2xl border border-white/40 bg-white/95 p-4 shadow-2xl backdrop-blur sm:p-5"
          >
            <div className="mb-3 flex items-center gap-2 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
              <Sparkles size={14} className="text-blue-600" />
              Bộ lọc nhanh
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
              <label className="relative block text-left">
                <span className="sr-only">Khu vực</span>
                <MapPin
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={districtId}
                  onChange={(event) => setDistrictId(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Khu vực</option>
                  {districtOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-left">
                <span className="sr-only">Mức giá</span>
                <select
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {PRICE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-left">
                <span className="sr-only">Loại hình</span>
                <select
                  value={roomType}
                  onChange={(event) => setRoomType(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {ROOM_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Search size={17} />
                Tìm kiếm
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ═══════════ 2. PAIN POINTS ═══════════ */}
      <section className="bg-slate-50 px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-rose-600">
              Nỗi đau có thật
            </span>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Đi tìm trọ, sinh viên sợ nhất điều gì?
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              Ba nỗi đau dưới đây được ghi nhận qua các buổi phỏng vấn sinh viên đang thuê trọ tại TP.HCM.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {PAIN_POINTS.map((pain) => {
              const Icon = pain.icon;

              return (
                <article
                  key={pain.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-rose-200 hover:shadow-md"
                >
                  <span className="inline-flex rounded-xl bg-rose-100 p-3 text-rose-600">
                    <Icon size={22} />
                  </span>
                  <h3 className="mt-4 text-base font-black text-slate-900 sm:text-lg">
                    {pain.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{pain.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ 3. SOLUTION & CORE VALUE ═══════════ */}
      <section className="px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
              Giải pháp Trọ Uy Tín
            </span>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Hai điều chúng tôi làm khác đi
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              Chặn tin rác ngay từ cửa vào, và ghép bạn ở cùng người thực sự hợp lối sống.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {SOLUTIONS.map((solution) => {
              const Icon = solution.icon;
              const styles = ACCENT_STYLES[solution.accent];

              return (
                <article
                  key={solution.title}
                  className={`rounded-3xl border p-7 shadow-sm sm:p-8 ${styles.card}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex rounded-2xl p-3 shadow-sm ${styles.iconBox}`}>
                      <Icon size={24} />
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${styles.badge}`}
                    >
                      {solution.badge}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-black text-slate-900 sm:text-2xl">
                    {solution.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">{solution.body}</p>

                  <ul className="mt-5 space-y-2.5">
                    {solution.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <CheckCircle2
                          size={17}
                          className={`mt-0.5 shrink-0 ${styles.check}`}
                        />
                        <span className="font-medium">{point}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ 4. HOW IT WORKS ═══════════ */}
      <section className="bg-slate-900 px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
              Cách hoạt động
            </span>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-4xl">
              Ba bước đơn giản là xong
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {STEPS.map((item, index) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex rounded-xl bg-blue-600 p-3 text-white">
                      <Icon size={22} />
                    </span>
                    <span className="text-4xl font-black text-white/10">{index + 1}</span>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <span className="rounded-full bg-blue-500/20 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-blue-300">
                      {item.step}
                    </span>
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                      {item.time}
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-black text-white sm:text-lg">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ 5. SOCIAL PROOF & NUMBERS ═══════════ */}
      <section className="px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 text-center shadow-sm"
              >
                <div className="text-3xl font-black text-blue-700 sm:text-4xl">{stat.num}</div>
                <div className="mt-1.5 text-xs font-bold text-slate-600 sm:text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-16 max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
              Sinh viên nói gì
            </span>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Cảm nhận từ người đã dùng
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <article
                key={testimonial.name}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <Quote size={26} className="text-blue-200" />

                <div className="mt-1 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star
                      key={starIndex}
                      size={15}
                      className="fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-700">
                  “{testimonial.quote}”
                </p>

                <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                  <span
                    className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black ${AVATAR_TONES[testimonial.tone]}`}
                  >
                    {testimonial.initials}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-slate-900">
                      {testimonial.name}
                    </div>
                    <div className="truncate text-xs font-medium text-slate-500">
                      {testimonial.school}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 6. FINAL CTA & FOOTER ═══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-violet-700 px-5 py-16 sm:px-8 sm:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-black leading-tight tracking-tight text-white sm:text-4xl">
            Bắt đầu tìm phòng sạch &amp; bạn hợp cạ ngay hôm nay
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-blue-50/90 sm:text-base">
            Tạo tài khoản miễn phí, dựng profile lối sống trong một phút và xem ngay những
            phòng trọ đã được xác thực quanh trường bạn.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-black text-blue-700 shadow-lg transition hover:bg-blue-50 sm:w-auto sm:text-base"
            >
              Đăng ký tài khoản miễn phí
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/tim-kiem"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-white/70 bg-white/10 px-8 py-4 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20 sm:w-auto sm:text-base"
            >
              <MessageCircle size={18} />
              Xem phòng trước đã
            </Link>
          </div>

          <p className="mt-5 text-xs text-blue-100/80">
            Miễn phí hoàn toàn cho sinh viên · Không thu phí môi giới
          </p>

          {/* Liên kết MXH + điều khoản bảo mật */}
          <div className="mt-12 border-t border-white/20 pt-8">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;

                return (
                  <a
                    key={social.label}
                    href="/"
                    aria-label={social.label}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition hover:bg-white/20"
                  >
                    <Icon size={19} />
                  </a>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-blue-50/90">
              <Link to="/" className="transition hover:text-white hover:underline">
                Điều khoản sử dụng
              </Link>
              <Link to="/" className="transition hover:text-white hover:underline">
                Chính sách bảo mật
              </Link>
              <Link to="/" className="transition hover:text-white hover:underline">
                Quy chế hoạt động
              </Link>
              <Link to="/" className="transition hover:text-white hover:underline">
                Liên hệ hỗ trợ
              </Link>
            </div>

            <p className="mt-6 text-xs text-blue-100/70">
              © 2026 Trọ Uy Tín · Nền tảng tìm trọ &amp; ở ghép minh bạch cho sinh viên
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
