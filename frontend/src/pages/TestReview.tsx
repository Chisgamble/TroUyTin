import React, { useState } from 'react';
import { ReviewModal } from '../components/ReviewModal';
import '../components/ui/Button.css';

export const TestReview: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);


  const testListingId = 9999;
  const testRevieweeId = '22222222-2222-2222-2222-222222222222'; // The landlord

  return (
    <div className="py-20 bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-10 rounded-xl shadow-md max-w-lg w-full text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Trang Test Đánh Giá</h1>

        <p className="text-gray-600 mb-8">
          Nhấn nút bên dưới để mở Modal Đánh giá chủ trọ.
          Lưu ý: Bạn chỉ được đánh giá mỗi chủ trọ trên 1 bài đăng một lần duy nhất.
        </p>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary inline-block mt-4"
          style={{ padding: '14px 32px', fontSize: '16px' }}
        >
          Đánh giá chủ trọ
        </button>
      </div>

      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        listingId={testListingId}
        revieweeId={testRevieweeId}
      />
    </div>
  );
};
