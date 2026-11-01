# Architecture

How the pieces fit together. For why individual behaviours work the way they do, see
[decisions.md](decisions.md); for vocabulary, the audio graph and dev traps, see
[conventions.md](conventions.md).

## Shape

One container, one process, one group.

```
Browser (GM)                                    Server (Docker, single Node process)
React app ── TanStack Query ── HTTP ──────────▶ Fastify
   │                                              ├─ /auth/*       Discord OAuth, sessions
   │                                              ├─ /api/*        scenes, sounds, collections, me
   │                                              ├─ /audio/*      sound files (immutable, 1 year cache)
   │                                              ├─ /banners/*    scene banners
   │                                              └─ SPA fallback  apps/web/dist
Web Audio engine ── fetch /audio/* ────────────▶     │
   └─ MediaRecorder (WebM/Opus) ── WebSocket ───▶ /api/discord/stream → Discord voice
                                                  │
                                                  ├─ SQLite (better-sqlite3, WAL)  /data/app.db
                                                  ├─ Files                          /data/audio, /data/banners
                                                  └─ ffmpeg/ffprobe                 duration + loudness
```

Everything under `/api`, `/audio` and `/banners` requires a session. Login is Discord OAuth,
restricted to members of `ALLOWED_GUILD_IDS`, so "the group" is one Discord server. Admins come
from `ADMIN_DISCORD_IDS`.

## Workspace

| Package           | Role                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `packages/shared` | Zod schemas and types for scenes, sounds, collections, users; Bardic import format. The contract between web and server. |
| `apps/server`     | Fastify API, SQLite via Drizzle, Discord bot and voice relay, import scripts.                                            |
| `apps/web`        | React SPA, Web Audio engine, all mixing.                                                                                 |

Request bodies are validated with the shared Zod schemas on the server (`http/body.ts`), and the
web client uses the same types, so a shape change starts in `packages/shared`.

## Server

Code is grouped by feature, each with `routes.ts` and, where queries are non-trivial, `repo.ts`:
`auth`, `me` (favourites, pads, recent plays), `sounds`, `scenes`, `collections`, `discord`,
`library` (CSV parsing, ffmpeg helpers, import). `app.ts` builds the Fastify instance and is what the
tests use; `main.ts` adds config, the database and the Discord bot.

### Data

SQLite in WAL mode, opened once per process. Drizzle migrations in `apps/server/drizzle` run on
startup.

- **Relational:** users, sessions, sounds, favourites, pads, plays, collections and
  `collection_scenes` (ordered, FK cascade on scene delete).
- **Documents:** a scene's cards and settings live in one JSON column (`scenes.data`, typed as
  `SceneData`). Scenes are always read and written whole (autosave `PUT`), and cards are never
  queried across scenes except by `sounds/usage.ts`, which scans them. Cards reference sounds by id;
  a card whose sound is gone keeps a `missingRef` instead of breaking the scene.
- **Ownership:** sounds and scenes have an owner; `canEdit` allows the owner or an admin. Scenes are
  `private` or `group`. Sounds are a single shared library.

### Files

Uploads stream to `/data/audio` under a unique, never-reused name, then ffprobe checks they are
audio and ffmpeg measures loudness (`library/media.ts`). Because names are unique, `/audio/*` is
served as immutable. Deleting a sound removes the row and the file.

The audio stays on local disk on purpose. The library is a few GB and only reaches the group's
own browsers, which cache it for a year. Uploads and re-measuring need the file locally for ffmpeg,
and the files must stay behind the login (see "Credits and licensing" in the README). Object storage
(R2 or similar) becomes worth it with multi-tenancy or more than one app instance. Serve it through
signed URLs or a session-checking proxy then, never a public bucket.

### Discord

The bot (`discord/bot.ts`) only joins channels and relays audio. `VoiceSessions` keeps one voice
connection per Discord server, owned by the GM who connected. The browser's MediaRecorder stream
arrives over a WebSocket, gets demuxed, repacketised into 20 ms Opus frames (`opusSplit.ts`) and fed
through a bounded live buffer (`liveBuffer.ts`) that drops the oldest frames instead of building
latency. The server only sees the browser through that stream socket: a tab closed mid-stream
leaves the channel after 30 s, while a deliberate stop (code 1000) or a connection that never
streamed leaves after an hour of silence, even if the tab is closed in the meantime.

## Web

- **Routing:** `app/App.tsx`. Everything is behind login; `/table` sits outside the main layout.
- **Server state:** TanStack Query hooks in `src/api/`, keys in `api/keys.ts`.
- **Live audio state:** Zustand (`audio/store.ts`, `usePlayer`). Per-device settings in
  `localStorage`. The full table is in decisions.md, "Where state lives".
- **Features:** `src/features/<area>` holds pages and their components; `src/ui` holds shared
  primitives with no app knowledge.

### Audio engine

`audio/engine.ts` is a singleton and the only thing UI code calls. It owns:

- `Mixer`: the AudioContext, the music/ambience/effect buses, duck, master, monitor and the
  MediaStream tap for Discord (graph in conventions.md).
- `ScenePlayback`: the active scene. `MusicDeck` (`music.ts`) handles playlists and crossfades, `ambience.ts`
  (`AmbienceLayer`) handles loops and random interval one-shots, and `schedule.ts` holds the pure timing logic.
- `EffectBoard`: effect cards and quick pads.
- Voices (`voice.ts`): sounds shorter than 90 s are fetched and decoded into an `AudioBuffer`
  (`BufferVoice`, gapless and instant). Longer ones stream through a media element
  (`ElementVoice`). Decoded buffers sit in an LRU capped at about 400 MB of PCM (`buffers.ts`).
- Every voice applies the sound's stored loudness trim before its own volume.

## Deployment

The image is a two-stage Docker build with ffmpeg in the runtime stage, and it runs the server with
`tsx`. `/data` is the only state: `app.db`, `audio/`, `banners/`. It is a bind mount on Coolify
(`/srv/ogrecanterino/data`), or `./data` with `compose.yaml` and Caddy. Redeploys keep it. The
README covers setup.

## Limits and known gaps

- **Single tenant.** One Discord server gates login, and there is one shared sound library. Making
  it multi-group means a tenant id on sounds, scenes and collections, per-tenant file layout and
  quotas.
- **Single process.** Voice sessions and the live buffer are in memory, and SQLite is local, so the
  app can't run as more than one instance as it is.
- **One stream per Discord server.** A bot can be in one channel per server, so two GMs in the same
  server can't both stream.
- **Backups.** The README's cron covers `app.db` only. `audio/` and `banners/` need their own
  off-host copy. They're immutable, so incremental rsync or rclone is enough.
- **Orphans.** A crash between writing a file and inserting its row leaves an unreferenced file.
  Nothing cleans these up yet.
