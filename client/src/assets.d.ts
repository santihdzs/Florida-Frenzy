// Vite static asset imports — tells TypeScript that image/audio/video
// imports resolve to a string URL at runtime.
declare module '*.webp'  { const src: string; export default src; }
declare module '*.jpg'  { const src: string; export default src; }
declare module '*.jpeg' { const src: string; export default src; }
declare module '*.gif'  { const src: string; export default src; }
declare module '*.svg'  { const src: string; export default src; }
declare module '*.webp' { const src: string; export default src; }
declare module '*.mp3'  { const src: string; export default src; }
declare module '*.ogg'  { const src: string; export default src; }
declare module '*.wav'  { const src: string; export default src; }
