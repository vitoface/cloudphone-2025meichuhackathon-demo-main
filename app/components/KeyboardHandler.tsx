'use client';

import { useEffect } from 'react';
import { useNavigation } from './NavigationContext';

export default function KeyboardHandler() {
  const { 
    highlightLeft, 
    highlightRight, 
    highlightCenter,
    highlightUp,
    highlightDown,
    highlightLeftKey,
    highlightRightKey
  } = useNavigation();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const targetKeys = ['Escape', 'F12', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      
      if (targetKeys.includes(event.key)) {
        event.preventDefault();
        event.stopPropagation();
        
        switch (event.key) {
          case 'Escape':
            highlightLeft();
            break;
          case 'F12':
            highlightRight();
            break;
          case 'Enter':
            highlightCenter();
            break;
          case 'ArrowUp':
            highlightUp();
            break;
          case 'ArrowDown':
            highlightDown();
            break;
          case 'ArrowLeft':
            highlightLeftKey();
            break;
          case 'ArrowRight':
            highlightRightKey();
            break;
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const targetKeys = ['Escape', 'F12', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      
      if (targetKeys.includes(event.key)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [highlightLeft, highlightRight, highlightCenter, highlightUp, highlightDown, highlightLeftKey, highlightRightKey]);

  return null;
}