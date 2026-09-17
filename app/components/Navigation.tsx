'use client';

import { useNavigation } from './NavigationContext';

export default function Navigation() {
  const { leftHighlighted, rightHighlighted, centerHighlighted } = useNavigation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white text-xs py-1 px-2 flex justify-between items-center z-50">
      <div className={`flex items-center px-1 rounded transition-colors duration-200 ${leftHighlighted ? 'bg-yellow-500 text-black' : 'bg-transparent'}`}>
        <span className="font-bold">L:</span>
        <span className="ml-1">SL</span>
      </div>
      <div className={`flex items-center px-1 rounded transition-colors duration-200 ${centerHighlighted ? 'bg-yellow-500 text-black' : 'bg-transparent'}`}>
        <span className="font-bold">Enter</span>
      </div>
      <div className={`flex items-center px-1 rounded transition-colors duration-200 ${rightHighlighted ? 'bg-yellow-500 text-black' : 'bg-transparent'}`}>
        <span className="font-bold">R:</span>
        <span className="ml-1">SR</span>
      </div>
    </div>
  );
}