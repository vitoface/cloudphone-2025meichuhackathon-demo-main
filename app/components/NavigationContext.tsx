'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationContextType {
  leftHighlighted: boolean;
  rightHighlighted: boolean;
  centerHighlighted: boolean;
  upHighlighted: boolean;
  downHighlighted: boolean;
  leftKeyHighlighted: boolean;
  rightKeyHighlighted: boolean;
  highlightLeft: () => void;
  highlightRight: () => void;
  highlightCenter: () => void;
  highlightUp: () => void;
  highlightDown: () => void;
  highlightLeftKey: () => void;
  highlightRightKey: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [leftHighlighted, setLeftHighlighted] = useState(false);
  const [rightHighlighted, setRightHighlighted] = useState(false);
  const [centerHighlighted, setCenterHighlighted] = useState(false);
  const [upHighlighted, setUpHighlighted] = useState(false);
  const [downHighlighted, setDownHighlighted] = useState(false);
  const [leftKeyHighlighted, setLeftKeyHighlighted] = useState(false);
  const [rightKeyHighlighted, setRightKeyHighlighted] = useState(false);

  const highlightLeft = () => {
    setLeftHighlighted(true);
    setTimeout(() => setLeftHighlighted(false), 200);
  };

  const highlightRight = () => {
    setRightHighlighted(true);
    setTimeout(() => setRightHighlighted(false), 200);
  };

  const highlightCenter = () => {
    setCenterHighlighted(true);
    setTimeout(() => setCenterHighlighted(false), 200);
  };

  const highlightUp = () => {
    setUpHighlighted(true);
    setTimeout(() => setUpHighlighted(false), 200);
  };

  const highlightDown = () => {
    setDownHighlighted(true);
    setTimeout(() => setDownHighlighted(false), 200);
  };

  const highlightLeftKey = () => {
    setLeftKeyHighlighted(true);
    setTimeout(() => setLeftKeyHighlighted(false), 200);
  };

  const highlightRightKey = () => {
    setRightKeyHighlighted(true);
    setTimeout(() => setRightKeyHighlighted(false), 200);
  };

  return (
    <NavigationContext.Provider value={{
      leftHighlighted,
      rightHighlighted,
      centerHighlighted,
      upHighlighted,
      downHighlighted,
      leftKeyHighlighted,
      rightKeyHighlighted,
      highlightLeft,
      highlightRight,
      highlightCenter,
      highlightUp,
      highlightDown,
      highlightLeftKey,
      highlightRightKey
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}