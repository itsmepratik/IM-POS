import React from "react";

export function OpenBottleIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg" 
      id="Oil-Line--Streamline-Remix"
      className={className}
    >
      <desc>Oil Line Streamline Icon</desc>
      <path 
        d="M9.07037 7 6 11.6056V20h12V7H9.07037ZM8 5h11c0.5523 0 1 0.44772 1 1v15c0 0.5523 -0.4477 1 -1 1H5c-0.55228 0 -1 -0.4477 -1 -1V11l4 -6Zm5 -4h5c0.5523 0 1 0.44772 1 1v2h-7V2c0 -0.55228 0.4477 -1 1 -1ZM8 12h2v6H8v-6Z" 
        strokeWidth="1"
      />
    </svg>
  );
}

export function ClosedBottleIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg" 
      id="Oil-Fill--Streamline-Remix-Fill"
      className={className}
    >
      <desc>Oil Fill Streamline Icon</desc>
      <path 
        d="M8 5h11c0.5523 0 1 0.44772 1 1v15c0 0.5523 -0.4477 1 -1 1H5c-0.55228 0 -1 -0.4477 -1 -1V11l4 -6Zm5 -4h5c0.5523 0 1 0.44772 1 1v2h-7V2c0 -0.55228 0.4477 -1 1 -1ZM6 12v7h2v-7H6Z" 
        strokeWidth="1"
      />
    </svg>
  );
} 