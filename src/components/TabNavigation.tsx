import type { ToolType } from "../types/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Scaling,
  Minimize2,
  ArrowRightLeft,
  SlidersHorizontal,
  Wand2,
} from "lucide-react";

interface TabNavigationProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

const tools: { value: ToolType; icon: React.ElementType; label: string }[] = [
  { value: "resize", icon: Scaling, label: "Resize" },
  { value: "compress", icon: Minimize2, label: "Compress" },
  { value: "convert", icon: ArrowRightLeft, label: "Convert" },
  { value: "transform", icon: SlidersHorizontal, label: "Transform" },
  { value: "filter", icon: Wand2, label: "Filter" },
];

export default function TabNavigation({
  activeTool,
  onToolChange,
}: TabNavigationProps) {
  return (
    <div className="w-full mb-6">
      <Tabs
        value={activeTool}
        onValueChange={(val) => onToolChange(val as ToolType)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-transparent rounded-xl gap-1">
          {tools.map(({ value, icon: Icon, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex flex-col gap-1 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all min-w-0"
            >
              <Icon className="size-4 shrink-0" />
              <span className="text-[10px] font-medium truncate">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
