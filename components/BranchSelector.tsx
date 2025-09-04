"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, AlertCircle } from "lucide-react";
import { useBranch } from "@/lib/contexts/DataProvider";

interface BranchSelectorProps {
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

export function BranchSelector({
  className = "",
  showLabel = true,
  compact = false,
}: BranchSelectorProps) {
  const {
    branches,
    currentBranch,
    isLoadingBranches,
    selectBranch,
    branchLoadError,
  } = useBranch();

  if (isLoadingBranches) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showLabel && !compact && (
          <span className="text-sm font-medium text-gray-600">Branch:</span>
        )}
        <div className="h-10 w-32 bg-gray-200 animate-pulse rounded-md"></div>
      </div>
    );
  }

  if (branchLoadError) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showLabel && !compact && (
          <span className="text-sm font-medium text-gray-600">Branch:</span>
        )}
        <Badge variant="outline" className="text-orange-600 border-orange-600">
          <AlertCircle className="w-3 h-3 mr-1" />
          Offline Mode
        </Badge>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && !compact && (
        <span className="text-sm font-medium text-gray-600">Branch:</span>
      )}

      <Select
        value={currentBranch?.id || ""}
        onValueChange={selectBranch}
        disabled={branches.length === 0}
      >
        <SelectTrigger
          className={compact ? "w-auto min-w-[120px]" : "w-[200px]"}
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-500" />
            <SelectValue placeholder="Select branch..." />
          </div>
        </SelectTrigger>

        <SelectContent>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              <div className="flex flex-col">
                <span className="font-medium">{branch.name}</span>
                {!compact && branch.address && (
                  <span className="text-xs text-gray-500">
                    {branch.address}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {currentBranch && (
        <Badge variant="secondary" className="ml-1">
          Active
        </Badge>
      )}
    </div>
  );
}
