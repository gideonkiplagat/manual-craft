import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const BaseURL = 'http://68.183.216.215:5000' // Production server URL

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
