import { useEffect, useState } from "react";
import { AlertTriangle, Flag, Loader2, Mail, X } from "lucide-react";
import toast from "react-hot-toast";

const REPORT_REASONS = [
  "Địa chỉ / Vị trí phòng không có thật",
  "Giá phòng thực tế khác so với giá đăng",
  "Hình ảnh phòng không giống thực tế",
  "Số điện thoại / Thông tin liên hệ không đúng",
  "Phòng đã cho thuê / Đã ghép xong nhưng không cập nhật",
  "Chủ trọ / Người đăng có hành vi lừa đảo, cọc ảo",
  "Lý do khác",
] as const;

export type ReportPayload = {
  postId: number | string;
  postTitle: string;
  reasons: string[];
  description: string;
  contactEmail: string;
  createdAt: string;
};

type ReportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  postId: number | string;
  postTitle: string;
  onSubmit?: (payload: ReportPayload) => Promise<void> | void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ReportModal({
  isOpen,
  onClose,
  postId,
  postTitle,
  onSubmit,
}: ReportModalProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, submitting]);

  const resetForm = () => {
    setSelectedReasons([]);
    setDescription("");
    setContactEmail("");
  };

  const closeModal = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const toggleReason = (reason: string) => {
    setSelectedReasons((current) =>
      current.includes(reason)
        ? current.filter((item) => item !== reason)
        : [...current, reason],
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (selectedReasons.length === 0) {
      toast.error("Vui lòng chọn ít nhất một lý do khiếu nại.");
      return;
    }

    const normalizedEmail = contactEmail.trim();
    if (!normalizedEmail) {
      toast.error("Vui lòng nhập email liên hệ.");
      return;
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      toast.error("Email liên hệ chưa đúng định dạng.");
      return;
    }

    const payload: ReportPayload = {
      postId,
      postTitle,
      reasons: selectedReasons,
      description: description.trim(),
      contactEmail: normalizedEmail,
      createdAt: new Date().toISOString(),
    };

    try {
      setSubmitting(true);
      if (onSubmit) {
        await onSubmit(payload);
      } else {
        const existingReports = JSON.parse(
          localStorage.getItem("tro-uy-tin:pending-reports") || "[]",
        ) as ReportPayload[];
        localStorage.setItem(
          "tro-uy-tin:pending-reports",
          JSON.stringify([...existingReports, payload]),
        );
        await new Promise((resolve) => window.setTimeout(resolve, 500));
      }

      toast.success("Đã tiếp nhận khiếu nại. TroUyTin sẽ sớm kiểm tra tin đăng.");
      resetForm();
      onClose();
    } catch (error) {
      console.error("Không thể gửi khiếu nại:", error);
      toast.error("Không thể gửi khiếu nại lúc này. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 rounded-xl bg-amber-100 p-2.5 text-amber-700">
              <AlertTriangle size={22} />
            </span>
            <div>
              <h2 id="report-modal-title" className="text-xl font-black text-slate-900">
                Báo cáo / Khiếu nại tin đăng
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Thông tin của bạn giúp cộng đồng tránh các tin sai lệch.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            disabled={submitting}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Đóng cửa sổ khiếu nại"
          >
            <X size={22} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-7">
          <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-600">
              Tin đăng được báo cáo
            </div>
            <div className="text-sm font-bold text-slate-900">#{postId} · {postTitle}</div>
          </div>

          <fieldset>
            <legend className="mb-3 flex items-center gap-2 text-sm font-black text-slate-800">
              <Flag size={17} className="text-rose-500" />
              Vấn đề bạn gặp phải <span className="text-rose-500">*</span>
            </legend>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => {
                const checked = selectedReasons.includes(reason);
                return (
                  <label
                    key={reason}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                      checked
                        ? "border-blue-400 bg-blue-50 text-blue-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleReason(reason)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-600"
                    />
                    <span className="font-medium leading-5">{reason}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-black text-slate-800">Mô tả chi tiết</span>
            <textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ví dụ: thời gian liên hệ, thông tin thực tế khác với bài đăng..."
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-black text-slate-800">
              Email liên hệ <span className="text-rose-500">*</span>
            </span>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                placeholder="ban@example.com"
                className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
          <button
            type="button"
            onClick={closeModal}
            disabled={submitting}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : <Flag size={18} />}
            {submitting ? "Đang gửi..." : "Gửi khiếu nại"}
          </button>
        </div>
      </form>
    </div>
  );
}
