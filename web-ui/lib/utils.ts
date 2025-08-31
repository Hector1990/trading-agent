import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(typeof date === 'string' ? new Date(date) : date)
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '***'
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`
}
