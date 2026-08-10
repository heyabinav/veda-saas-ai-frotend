"use client";

import { useEffect, useState } from "react";

function readCookie(key: string) {
  const cookies = document.cookie.split("; ");
  const match = cookies.find((c) => c.startsWith(`${key}=`));
  if (!match) return "";
  try {
    return decodeURIComponent(match.slice(key.length + 1));
  } catch {
    return match.slice(key.length + 1);
  }
}

export default function UserBadge() {
  const [name, setName] = useState("User");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    const savedName = readCookie("user_name") || "User";
    const savedEmail = readCookie("user_email") || "";
    setName(savedName);
    setEmail(savedEmail);
  }, []);

  useEffect(() => {
    const readAvatar = () => {
      try {
        setAvatar(window.localStorage.getItem("vedaapex-avatar"));
      } catch {
        setAvatar(null);
      }
    };
    readAvatar();
    window.addEventListener("vedaapex-avatar-updated", readAvatar);
    window.addEventListener("storage", readAvatar);
    return () => {
      window.removeEventListener("vedaapex-avatar-updated", readAvatar);
      window.removeEventListener("storage", readAvatar);
    };
  }, []);

  const initial = (name.trim().charAt(0) || "U").toUpperCase();

  return (
    <div
      title={email || name}
      className="flex items-center gap-2 border border-black/10 bg-white dark:bg-[#1a1b18] rounded-full px-2.5 py-1.5 shadow-sm"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white overflow-hidden">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt={name} className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </span>
      <span className="flex flex-col items-start leading-tight min-w-0">
        <span className="max-w-[120px] truncate text-[12px] font-semibold text-foreground/85">
          {name}
        </span>
        {email && (
          <span className="max-w-[150px] truncate text-[10px] text-foreground/45">
            {email}
          </span>
        )}
      </span>
    </div>
  );
}
