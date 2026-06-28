import React, { useState } from 'react';
import { ReviewModal } from '../components/ReviewModal';

export const TestReview: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);


  const testRevieweeId = '22222222-2222-2222-2222-222222222222'; // The landlord

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-lg w-full text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Trang Test Đánh Giá</h1>
        
        <p className="text-gray-600 mb-8">
          Nhấn nút bên dưới để mở Modal Đánh giá chủ trọ.
          Lưu ý: Bạn chỉ được đánh giá mỗi chủ trọ một lần.
        </p>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-full transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          Đánh giá chủ trọ
        </button>
      </div>

      <ReviewModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 

        revieweeId={testRevieweeId}
      />
    </div>
  );
};
