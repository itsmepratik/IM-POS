"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Layout } from "@/components/layout";

export default function DatePickerTest() {
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  const getDateRangeText = () => {
    if (!date?.from) {
      return "Select days";
    }
    if (date.to) {
      return `${format(date.from, "MMM d")} - ${format(
        date.to,
        "MMM d, yyyy"
      )}`;
    }
    return format(date.from, "MMM d, yyyy");
  };

  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-2xl font-semibold mb-6">Date Picker Test</h1>

        <div className="space-y-6">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                size="default"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {getDateRangeText()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={1}
              />
            </PopoverContent>
          </Popover>

          <div className="p-4 border rounded-md bg-gray-50">
            <h2 className="font-medium mb-2">Selected Range:</h2>
            <pre className="text-sm">
              {date ? JSON.stringify(date, null, 2) : "No date selected"}
            </pre>
          </div>
        </div>
      </div>
    </Layout>
  );
}
