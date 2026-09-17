'use client';

import { useNavigation } from './NavigationContext';

export default function Keypad() {
  const { upHighlighted, downHighlighted, leftKeyHighlighted, rightKeyHighlighted } = useNavigation();

  return (
    <div className="flex flex-col items-center space-y-1 mt-4">
      <div className="flex justify-center">
        <div className={`w-8 h-8 flex items-center justify-center border border-gray-400 rounded transition-colors duration-150 ${upHighlighted ? 'bg-yellow-400 border-yellow-400' : 'bg-gray-100 border-gray-400'}`}>
          <span className="text-xs font-bold">↑</span>
        </div>
      </div>
      
      <div className="flex space-x-1">
        <div className={`w-8 h-8 flex items-center justify-center border border-gray-400 rounded transition-colors duration-150 ${leftKeyHighlighted ? 'bg-yellow-400 border-yellow-400' : 'bg-gray-100 border-gray-400'}`}>
          <span className="text-xs font-bold">←</span>
        </div>
        <div className="w-8 h-8"></div>
        <div className={`w-8 h-8 flex items-center justify-center border border-gray-400 rounded transition-colors duration-150 ${rightKeyHighlighted ? 'bg-yellow-400 border-yellow-400' : 'bg-gray-100 border-gray-400'}`}>
          <span className="text-xs font-bold">→</span>
        </div>
      </div>
      
      <div className="flex justify-center">
        <div className={`w-8 h-8 flex items-center justify-center border border-gray-400 rounded transition-colors duration-150 ${downHighlighted ? 'bg-yellow-400 border-yellow-400' : 'bg-gray-100 border-gray-400'}`}>
          <span className="text-xs font-bold">↓</span>
        </div>
      </div>
    </div>
  );
}