// src/lib/avatar-utils.js

const AVATAR_COLORS = [
  "bg-red-500",    "bg-orange-500", "bg-amber-500",
  "bg-green-500",  "bg-teal-500",   "bg-blue-500",
  "bg-indigo-500", "bg-violet-500", "bg-pink-500",
  "bg-rose-500",   "bg-cyan-500",   "bg-emerald-500",
];

const hashName = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

export const getAvatarColor = (name = "") => {
  return AVATAR_COLORS[hashName(name) % AVATAR_COLORS.length];
};