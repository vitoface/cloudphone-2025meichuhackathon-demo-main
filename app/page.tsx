'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Keypad from './components/Keypad'; 

export default function Home() {
  const router = useRouter();
  const [cursorIndex, setCursorIndex] = useState(0);
  
  // 使用 useRef 記住最新的狀態，避免 useEffect 抓到舊的資料
  const cursorRef = useRef(0);
  cursorRef.current = cursorIndex;

  const menuItems = [
    { title: '1. 新竹天氣預報', path: '/weather' },
    { title: '2. 在地老店導覽', path: '/shops' },
    { title: '3. 防詐騙小幫手', path: '/anti-fraud' }
  ];

  const handleNavigate = (index: number) => {
    setCursorIndex(index);
    router.push(menuItems[index].path);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 測試用：觀察終端機或瀏覽器後台到底按了什麼
      console.log("偵測到按鍵:", e.key);

      // 同時支援方向鍵 與 W/S 鍵
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        setCursorIndex((prev) => (prev > 0 ? prev - 1 : menuItems.length - 1));
      } 
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        setCursorIndex((prev) => (prev < menuItems.length - 1 ? prev + 1 : 0));
      } 
      else if (e.key === 'Enter') {
        // 使用 cursorRef.current 確保換頁時抓到的是最新的選項
        router.push(menuItems[cursorRef.current].path);
      }
    };

    // 關鍵修改：在第三個參數加上 { capture: true }，這會讓我們的程式碼搶在模板之前優先處理按鍵！
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [router]); 

  return (
    <div className="max-w-xs mx-auto p-4 min-h-screen flex flex-col justify-center bg-gray-50">
      <h1 className="text-xl font-bold text-gray-800 mb-4 text-center border-b-2 pb-2 mt-4">
        生活資訊站
      </h1>
      
      <div className="flex flex-col space-y-3 flex-1 justify-center mb-6">
        {menuItems.map((item, index) => (
          <div
            key={index}
            onClick={() => handleNavigate(index)}
            className={`
              p-3 rounded-lg text-lg font-bold transition-all cursor-pointer text-center
              ${index === cursorIndex 
                ? 'bg-blue-600 text-white shadow-md scale-105 border-2 border-blue-800' 
                : 'bg-white text-gray-700 border border-gray-200'}
            `}
          >
            {item.title}
          </div>
        ))}
      </div>

      <div className="mt-auto border-t pt-2">
        <p className="text-center text-xs text-gray-400 mb-2">
          測試：方向鍵 或 W/S 選擇
        </p>
        <Keypad />
      </div>
    </div>
  );
}