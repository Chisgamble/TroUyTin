import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import './ui/Button.css';
import { api } from '../lib/axios';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  revieweeId: string;
  listingId: number;
}

interface ReviewFormInputs {
  rating: number;
  comment: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, revieweeId, listingId }) => {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<ReviewFormInputs>({
    defaultValues: {
      rating: 0,
      comment: '',
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const currentRating = watch('rating');

  const onSubmit = async (data: ReviewFormInputs) => {
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post('/api/reviews', {
        revieweeId,
        listingId,
        rating: data.rating,
        comment: data.comment,
      });
      setSuccessMsg('Đánh giá thành công!');
      setTimeout(() => {
        reset();
        onClose();
        setSuccessMsg('');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Đã xảy ra lỗi khi gửi đánh giá');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200" style={{ padding: '20px 24px' }}>
          <h2 className="text-lg font-bold text-gray-800">Đánh giá trải nghiệm của bạn</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          {/* Body */}
          <div style={{ padding: '24px' }}>
            {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{errorMsg}</div>}
            {successMsg && <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-100">{successMsg}</div>}

            {/* Rating */}
            <div className="mb-8">
              <p className="text-center text-[15px] text-gray-600 mb-4">
                Bạn cảm thấy phòng trọ này như thế nào?
              </p>
              <div className="flex justify-center space-x-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setValue('rating', star, { shouldValidate: true })}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <svg
                      className={`w-10 h-10 ${currentRating >= star
                        ? 'text-[#FFB800] fill-current stroke-current'
                        : 'text-[#C9C9C9] fill-transparent stroke-current'
                        }`}
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </button>
                ))}
              </div>
              <input
                type="hidden"
                {...register('rating', { required: 'Vui lòng chọn số sao', min: 1, max: 5 })}
              />
              {errors.rating && <p className="text-red-500 text-xs mt-2 text-center">{errors.rating.message}</p>}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-[14px] font-bold text-gray-800 mb-2">Nhận xét chi tiết</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3.5 text-[15px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-colors placeholder-gray-400"
                rows={4}
                spellCheck={false}
                placeholder="Chia sẻ thêm về phòng trọ và chủ nhà nhé..."
                {...register('comment', {
                  required: 'Vui lòng nhập nhận xét',
                  maxLength: { value: 500, message: 'Nhận xét không được vượt quá 500 ký tự' }
                })}
              ></textarea>
              {errors.comment && <p className="text-red-500 text-xs mt-1">{errors.comment.message}</p>}
            </div>
          </div>

          <div className="border-t border-gray-200 flex justify-end space-x-3 bg-white rounded-b-2xl" style={{ padding: '20px 24px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              style={{ minWidth: '100px' }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ minWidth: '140px' }}
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
