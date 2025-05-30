"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface ModelSelectorProps {
  showLabel?: boolean;
}

export function ModelSelector({ showLabel = true }: ModelSelectorProps) {
  return (
    <div className="space-y-2">
      {showLabel && <Label htmlFor="model-selector">AI Model</Label>}
      <RadioGroup defaultValue="gemini" id="model-selector" className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="gemini" id="gemini-model" checked={true} disabled={false} />
          <Label htmlFor="gemini-model" className="font-normal">Gemini</Label>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center space-x-2 opacity-50 cursor-not-allowed">
                <RadioGroupItem value="deepseek" id="deepseek-model" disabled />
                <Label htmlFor="deepseek-model" className="font-normal">DeepSeek</Label>
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
