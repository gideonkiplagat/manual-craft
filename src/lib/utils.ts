// import { clsx, type ClassValue } from "clsx"
// import { twMerge } from "tailwind-merge"

// //export const BaseURL = 'http://68.183.216.215:5000' // Production server URL
// export const BaseURL = 'https://flow-api.alexandermuli.dev' // Local server URL

// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs))
// }
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Detect if app is running locally
const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "");

// Use local backend if frontend is on localhost
export const BaseURL = isLocalhost
  ? "http://localhost:5000"                     // Local Docker backend port
  : "https://flow-api.alexandermuli.dev";       // Production backend

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
