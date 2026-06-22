import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ImageIcon, Video, Link as LinkIcon } from "lucide-react";

interface EditorToolbarProps {
  activeTab: "visual" | "html";
  onCommand: (command: string, value?: string) => void;
}

export function EditorToolbar({ activeTab, onCommand }: EditorToolbarProps) {
  const tools = [
    { icon: Bold, label: "Negrita", command: "bold" },
    { icon: Italic, label: "Cursiva", command: "italic" },
    { icon: List, label: "Lista", command: "insertUnorderedList" },
    { icon: LinkIcon, label: "Enlace", command: "link" },
    { icon: ImageIcon, label: "Imagen", command: "image" },
    { icon: Video, label: "Video", command: "video" },
  ];

  return (
    <div className="flex gap-1">
      {tools.map((tool, i) => (
        <Button
          key={i}
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-500 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title={tool.label}
          disabled={activeTab === "html"}
          onClick={() => {
            if (tool.command === "image") {
              const url = prompt("Introduce la URL de la imagen:");
              if (url) onCommand("insertImage", url);
            } else if (tool.command === "link") {
              const url = prompt("Introduce la URL del enlace:");
              if (url) onCommand("createLink", url);
            } else if (tool.command === "video") {
              const url = prompt("Introduce la URL del video (o código embebido):");
              if (url) {
                if (url.trim().startsWith("<iframe")) {
                  onCommand("insertHTML", url);
                } else {
                  const iframe = `<iframe src="${url}" width="100%" height="315" frameborder="0" allowfullscreen className="rounded-xl mt-2"></iframe>`;
                  onCommand("insertHTML", iframe);
                }
              }
            } else {
              onCommand(tool.command);
            }
          }}
        >
          <tool.icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}
