import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ImageIcon, Video } from "lucide-react";

export function EditorToolbar() {
  const tools = [
    { icon: Bold, label: "Negrita" },
    { icon: Italic, label: "Cursiva" },
    { icon: List, label: "Lista" },
    { icon: ImageIcon, label: "Imagen" },
    { icon: Video, label: "Video" },
  ];

  return (
    <div className="flex gap-1">
      {tools.map((tool, i) => (
        <Button
          key={i}
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-500 hover:text-primary transition-colors"
          title={tool.label}
        >
          <tool.icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}
