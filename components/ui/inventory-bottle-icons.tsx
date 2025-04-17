import React from "react";
import { OpenBottleIcon, ClosedBottleIcon } from "./bottle-icons";
import { Badge } from "./badge";

export function OpenBottleBadge({ count }: { count: number }) {
  return (
    <Badge
      variant="outline"
      className="bg-red-100 text-red-800 border-red-300 inline-flex items-center gap-1"
    >
      <OpenBottleIcon className="h-3 w-3" />
      <span>
        {count} Open {count === 1 ? "Bottle" : "Bottles"}
      </span>
    </Badge>
  );
}

export function ClosedBottleBadge({ count }: { count: number }) {
  return (
    <Badge
      variant="outline"
      className="bg-green-100 text-green-800 border-green-300 font-medium inline-flex items-center gap-1"
    >
      <ClosedBottleIcon className="h-3 w-3" />
      <span>
        {count} Closed {count === 1 ? "Bottle" : "Bottles"}
      </span>
    </Badge>
  );
}
