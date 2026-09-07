"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { SmilePlus } from "lucide-react";

const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
  {
    name: "Faces",
    emojis: [
      "😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😌",
      "😍", "🥰", "😘", "😗", "😙", "😚", "🥲", "😋", "😛", "😜", "🤪", "😝",
      "🤑", "🤗", "🤭", "🫢", "🫣", "🤫", "🤔", "🫡", "🤐", "🤨", "😐", "😑",
      "😶", "🫥", "😏", "😒", "🙄", "😬", "😮", "😯", "😲", "😳", "🥺", "😢",
      "😭", "😤", "😠", "😡", "🤬", "🥴", "😵", "🤯", "🥳", "🥸", "😎", "🤓",
      "🧐", "😕", "🫤", "😟", "🙁", "☹️", "😮", "😱", "😨", "😰", "😥", "😓",
      "🤩", "😤", "😖", "😣", "😞", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕",
    ],
  },
  {
    name: "Gestures",
    emojis: [
      "👍", "👎", "👊", "✊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏",
      "✌️", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "🖐️", "✋", "🤚",
      "🖖", "👋", "🤌", "🫱", "🫲", "🫳", "🫴", "🫵", "🫶", "💪", "🦵", "🦶",
    ],
  },
  {
    name: "Hearts",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💕", "💞", "💗",
      "💖", "💘", "💝", "❣️", "💟", "🩷", "🩵", "🩶", "💔", "❤️‍🔥", "❤️‍🩹",
    ],
  },
  {
    name: "Social",
    emojis: [
      "🔥", "💯", "✨", "🌟", "⭐", "💫", "🎯", "🎉", "🎊", "🎈", "🏆", "🥇",
      "💎", "👑", "📢", "🔔", "💡", "🚀", "📈", "💸", "💰", "📊", "📉", "📋",
      "✅", "❌", "⭕", "🔄", "🔁", "🔂", "▶️", "⏩", "⏪", "🔼", "🔽", "📌",
    ],
  },
  {
    name: "Objects",
    emojis: [
      "📱", "💻", "🖥️", "⌨️", "🖱️", "📷", "📸", "🎥", "📹", "📺", "🔊", "📻",
      "🎵", "🎶", "🎤", "🎧", "📝", "✏️", "📖", "📚", "📅", "📆", "📁", "📂",
      "🔗", "📎", "✂️", "📍", "📌", "🗂️", "🏷️", "📦", "🎁", "🎀", "🖼️", "🪄",
    ],
  },
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  children?: React.ReactNode;
}

export default function EmojiPicker({ onEmojiSelect, children }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [search, setSearch] = useState("");

  const allEmojis = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
  const filteredEmojis = search
    ? allEmojis.filter((e) => e.includes(search))
    : EMOJI_CATEGORIES[activeCategory].emojis;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children || (
          <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0">
            <SmilePlus className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <div className="mb-2">
          <input
            type="text"
            placeholder="Search emojis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {!search && (
          <div className="mb-2 flex gap-1 overflow-x-auto">
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(i)}
                className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                  i === activeCategory
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        <div className="grid max-h-48 grid-cols-8 gap-0.5 overflow-y-auto pr-0.5">
          {filteredEmojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onEmojiSelect(emoji)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-base hover:bg-slate-100 transition-colors"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
