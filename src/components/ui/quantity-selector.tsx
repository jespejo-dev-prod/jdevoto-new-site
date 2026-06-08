'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface QuantitySelectorProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
}

/**
 * Reusable B2B Quantity Selector
 * - Respects minimum order quantity (step)
 * - Respects stock limits (max)
 * - Calculates valid multiples automatically
 * - Allows manual editing with validation on blur/enter
 */
export function QuantitySelector({ 
  value, 
  min = 1, 
  max = Infinity, 
  step = 1, 
  onChange,
  className
}: QuantitySelectorProps) {
  const [localValue, setLocalValue] = useState<string>(value.toString());

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const maxMultiple = Math.floor(max / step) * step;

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    if (newValue !== value) onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(maxMultiple, value + step);
    if (newValue !== value) onChange(newValue);
  };

  const commitValue = (valStr: string) => {
    let parsed = parseInt(valStr.replace(/\D/g, ''), 10);
    if (isNaN(parsed)) {
      parsed = min;
    }
    
    // Round to nearest multiple of step
    let rounded = Math.round(parsed / step) * step;
    
    // Enforce limits
    if (rounded < min) rounded = min;
    if (rounded > maxMultiple) rounded = maxMultiple;
    
    setLocalValue(rounded.toString());
    if (rounded !== value) {
      onChange(rounded);
    } else {
      setLocalValue(value.toString());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    commitValue(localValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitValue(localValue);
    }
  };

  return (
    <div className={cn("flex items-center border border-zinc-200 rounded-md h-12 bg-white shrink-0 overflow-hidden", className)}>
      <button 
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        className="px-3 h-full hover:bg-zinc-50 transition-colors text-zinc-400 text-lg font-medium disabled:opacity-20 disabled:cursor-not-allowed select-none"
      >
        -
      </button>
      <input 
        type="text"
        inputMode="numeric"
        value={localValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-12 bg-transparent text-center font-bold text-zinc-900 text-sm focus:outline-none focus:ring-0 select-all border-none focus:border-none ring-0 focus:ring-0 p-0"
      />
      <button 
        type="button"
        onClick={handleIncrement}
        disabled={value >= maxMultiple}
        className="px-3 h-full hover:bg-zinc-50 transition-colors text-zinc-400 text-lg font-medium disabled:opacity-20 disabled:cursor-not-allowed select-none"
      >
        +
      </button>
    </div>
  );
}
