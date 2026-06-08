/**
 * src/shared/presentation/hooks/useRovingTabs.ts
 */

import { KeyboardEvent, useRef, useCallback } from 'react';

interface RovingTabsOptions<T, K extends string> {
  items: T[];
  activeId: K;
  onSelect: (id: K) => void;
  getId: (item: T) => K;
}

export function useRovingTabs<T, K extends string>({ 
  items, 
  activeId, 
  onSelect, 
  getId 
}: RovingTabsOptions<T, K>) {
  const itemRefs = useRef<Map<K, HTMLButtonElement | null>>(new Map());

  const setItemRef = useCallback((id: K, el: HTMLButtonElement | null) => {
    if (el) {
      itemRefs.current.set(id, el);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => {
    const currentIndex = items.findIndex(item => getId(item) === activeId);
    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = (currentIndex - 1 + items.length) % items.length;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }

    const nextId = getId(items[nextIndex]);
    onSelect(nextId);
    
    // Mover el foco (Focus Management Premium)
    setTimeout(() => {
      const nextEl = itemRefs.current.get(nextId);
      nextEl?.focus();
    }, 0);
  };

  return {
    handleKeyDown,
    setItemRef,
  };
}
