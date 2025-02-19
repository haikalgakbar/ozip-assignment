import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat("en-ID", {
    timeStyle: "short"
  }).format(new Date(timestamp))
}