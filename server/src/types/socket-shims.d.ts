// Intentionally empty.
//
// This file previously contained:
//   declare module 'fastify-socket.io';
//   declare module 'socket.io';
//
// Both are catch-all ambient module declarations: they tell TypeScript the
// module exists but type everything imported from it as `any`. That shadowed
// the real types both packages now ship via their dist/index.d.ts, which
// caused:
//   • `import { Server as SocketServer } from 'socket.io'` to resolve to
//     `any`, producing TS2709 ("cannot use namespace 'SocketServer' as a
//     type") whenever it was used as a type annotation.
//   • Callback parameters in `io.use(...)` / `io.on(...)` to be implicitly
//     typed `any` (TS7006 under `strict`).
//
// Both packages ship correct .d.ts files (socket.io: dist/index.d.ts exports
// Server, Socket, etc.; fastify-socket.io: dist/index.d.ts exports a typed
// FastifyPluginAsync). Removing the shims lets the real types flow through.
export {};
