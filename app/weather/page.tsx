'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WeatherPage() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 模擬功能型手機的「返回鍵」
      // 設定按 Backspace, Escape 或數字鍵 0 都能回到首頁
      if (e.key === 'Backspace' || e.key === 'Escape' || e.key === '0') {
        router.push('/');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <div className="max-w-xs mx-auto p-4 min-h-screen flex flex-col justify-center bg-blue-50">
      <div className="bg-white rounded-xl shadow-sm p-6 text-center border-2 border-blue-200">
        <h1 className="text-xl font-bold text-gray-700 mb-2">新竹市</h1>
        <p className="text-5xl font-black text-blue-600 my-4">24°C</p>
        <p className="text-lg font-bold text-gray-600 mb-1">多雲時晴</p>
        <p className="text-sm text-gray-500">降雨機率：10%</p>
      </div>

      <div className="mt-8 flex justify-center">
        <button 
          onClick={() => router.push('/')}
          className="px-6 py-2 bg-gray-800 text-white rounded-full font-bold active:scale-95"
        >
          返回主選單 (按 0)
        </button>
      </div>
    </div>
  );
}