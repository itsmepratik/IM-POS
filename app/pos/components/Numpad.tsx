"use client";

import { useRef } from "react";

interface NumpadProps {
  value: string;
  onChange: (val: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function Numpad({
  value,
  onChange,
  onBackspace,
  onSubmit,
  disabled,
}: NumpadProps) {
  const touchHandled = useRef(false);

  const handleClick = (num: string) => {
    if (value.length < 6) onChange(value + num);
  };

  const handleTouchStart = (num: string) => {
    touchHandled.current = true;
    handleClick(num);
    setTimeout(() => {
      touchHandled.current = false;
    }, 100);
  };

  return (
    <div className="grid grid-cols-3 gap-2 w-48 mx-auto my-4">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
        <button
          key={n}
          className="bg-muted rounded-lg p-4 text-xl font-bold hover:bg-accent"
          onClick={() => {
            if (!touchHandled.current) handleClick(n.toString());
          }}
          onTouchStart={() => handleTouchStart(n.toString())}
          disabled={disabled}
        >
          {n}
        </button>
      ))}
      <button
        className="bg-muted rounded-lg p-4 text-xl font-bold hover:bg-accent"
        onClick={() => {
          if (!touchHandled.current) onBackspace();
        }}
        onTouchStart={() => {
          touchHandled.current = true;
          onBackspace();
          setTimeout(() => {
            touchHandled.current = false;
          }, 100);
        }}
        disabled={disabled}
      >
        ⌫
      </button>
      <button
        className="bg-muted rounded-lg p-4 text-xl font-bold hover:bg-accent"
        onClick={() => {
          if (!touchHandled.current) handleClick("0");
        }}
        onTouchStart={() => handleTouchStart("0")}
        disabled={disabled}
      >
        0
      </button>
      <button
        className="bg-primary text-primary-foreground rounded-lg p-4 text-xl font-bold hover:bg-primary/90"
        onClick={() => {
          if (!touchHandled.current) onSubmit();
        }}
        onTouchStart={() => {
          touchHandled.current = true;
          onSubmit();
          setTimeout(() => {
            touchHandled.current = false;
          }, 100);
        }}
        disabled={disabled || value.length === 0}
      >
        OK
      </button>
    </div>
  );
}
