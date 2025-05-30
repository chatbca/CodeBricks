"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface ModelSelectorProps {
  id?: string; // For RHF FormControl integration
  value?: string;
  onValueChange?: (value: string) => void;
  showLabel?: boolean; // Kept for standalone use, but will be false with FormField
}

export function ModelSelector({ id, value, onValueChange, showLabel = true }: ModelSelectorProps) {
  return (
    <div className="space-y-2">
      {/* This label is for standalone use. When used with FormField, FormField's FormLabel will be used. */}
      {showLabel && <Label htmlFor={id}>AI Model</Label>}
      <RadioGroup
        id={id} // Apply the id passed from FormControl
        value={value}
        onValueChange={onValueChange}
        // RHF's defaultValues should be the source of truth.
        // If value is undefined initially, RadioGroup might not select anything,
        // which is fine as RHF will soon provide a value.
        className="flex items-center gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="gemini" id={id ? `${id}-gemini` : "gemini-model"} />
          <Label htmlFor={id ? `${id}-gemini` : "gemini-model"} className="font-normal">Gemini</Label>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center space-x-2 opacity-50 cursor-not-allowed">
                <RadioGroupItem value="deepseek" id={id ? `${id}-deepseek` : "deepseek-model"} disabled />
                <Label htmlFor={id ? `${id}-deepseek` : "deepseek-model"} className="font-normal">DeepSeek</Label>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>DeepSeek model integration is coming soon!</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </RadioGroup>
    </div>
  );
}
