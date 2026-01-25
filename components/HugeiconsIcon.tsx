
import React from 'react';

interface HugeiconsIconProps {
  icon: React.ElementType;
  className?: string;
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  variant?: 'stroke' | 'solid' | 'bulk' | 'duotone' | 'twotone';
}

const HugeiconsIcon: React.FC<HugeiconsIconProps> = ({ 
  icon: Icon, 
  className, 
  size = 20, // Increased default size
  color = "currentColor",
  strokeWidth = 2, // Default stroke width
  variant = "stroke",
  ...props 
}) => {
  if (!Icon) return null;
  
  return (
    <Icon 
      className={className} 
      size={size} 
      color={color}
      strokeWidth={strokeWidth}
      variant={variant}
      {...props} 
    />
  );
};

export default HugeiconsIcon;
