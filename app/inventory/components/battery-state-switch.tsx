"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Battery, RefreshCw, Trash2, Shield } from "lucide-react";

interface BatteryStateSwitchProps {
  value: "new" | "scrap" | "resellable" | "warranty";
  onChange: (value: "new" | "scrap" | "resellable" | "warranty") => void;
  className?: string;
}

export function BatteryStateSwitch({
  value,
  onChange,
  className,
}: BatteryStateSwitchProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleStateChange = (
    newValue: "new" | "scrap" | "resellable" | "warranty"
  ) => {
    if (newValue === value) return;

    setIsAnimating(true);
    setTimeout(() => {
      onChange(newValue);
      setIsAnimating(false);
    }, 150);
  };

  const getStateConfig = (
    state: "new" | "scrap" | "resellable" | "warranty"
  ) => {
    switch (state) {
      case "new":
        return {
          label: "New",
          icon: Battery,
          color: "bg-green-100 text-green-800 border-green-300",
          hoverColor: "hover:bg-green-200",
          iconColor: "text-green-600",
        };
      case "scrap":
        return {
          label: "Scrap",
          icon: Trash2,
          color: "bg-red-100 text-red-800 border-red-300",
          hoverColor: "hover:bg-red-200",
          iconColor: "text-red-600",
        };
      case "resellable":
        return {
          label: "Resellable",
          icon: RefreshCw,
          color: "bg-orange-100 text-orange-800 border-orange-300",
          hoverColor: "hover:bg-orange-200",
          iconColor: "text-orange-600",
        };
      case "warranty":
        return {
          label: "Warranty",
          icon: Shield,
          color: "bg-blue-100 text-blue-800 border-blue-300",
          hoverColor: "hover:bg-blue-200",
          iconColor: "text-blue-600",
        };
    }
  };

  const states: ("new" | "scrap" | "resellable" | "warranty")[] = [
    "new",
    "scrap",
    "resellable",
    "warranty",
  ];

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {states.map((state) => {
        const config = getStateConfig(state);
        const Icon = config.icon;
        const isActive = value === state;

        return (
          <Button
            key={state}
            variant="ghost"
            size="sm"
            onClick={() => handleStateChange(state)}
            className={cn(
              "relative h-8 px-3 rounded-full transition-all duration-200",
              "border border-transparent",
              isActive
                ? config.color
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              isAnimating && "scale-95",
              config.hoverColor
            )}
          >
            <div className="flex items-center gap-1.5">
              <Icon
                className={cn(
                  "h-3.5 w-3.5 transition-colors",
                  isActive ? config.iconColor : "text-gray-500"
                )}
              />
              <span className="text-xs font-medium">{config.label}</span>
            </div>

            {/* Active indicator */}
            {isActive && (
              <div className="absolute inset-0 rounded-full bg-current opacity-10" />
            )}
          </Button>
        );
      })}
    </div>
  );
}
