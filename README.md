# Spotify Clone

A pixel-matched Spotify web player clone built with **React 19 + Vite**, made to practise React and real-world API work.
One UI, three content sources: **Demo**, **General** and **Spotify**.

**Live demo:** https://spotify-clone-omega-ebon-62.vercel.app/

> **Disclaimer:** this is an educational, non-commercial project. It is not affiliated with, endorsed by or sponsored by Spotify AB or Apple Inc. "Spotify" is a trademark of Spotify AB.

<!-- Add screenshots to a docs/ folder and show them here, e.g.
![Demo mode](docs/demo.png)
![Spotify mode](docs/spotify.png)
-->

## Features

- **Mood themes:** the song you play themes the whole app, with a smooth colour fade and floating particles. Romantic = pink, Devotional = saffron, Phonk/BGM = violet-red-pink, Sad = midnight blue. The mood comes from the row a song is in, its genre, or keywords in its title (`src/utils/mood.js`). Mood chips next to All/Music/Podcasts list every song of a mood.
- **Three content modes**, switched from the avatar menu. The app opens in **General** by default (falls back to Demo if it cannot load).
- **Fallback chain:** Spotify → General → Demo. If a source fails, the next one takes over and a toast explains why.
- **Spotify mode:** PKCE login (no backend, no client secret), top tracks, recently played, liked songs, top artists and your playlists in the sidebar library. Full songs play through the Web Playback SDK (Spotify Premium required).
- **General mode:** real songs from the Apple iTunes Search API (30-second previews, no login, no API key).
- **Live search:** instant local matches plus debounced results from the active source.
- **Row-wise queue:** next / previous stay inside the row a song was played from. "Next in queue" is shown in the Now Playing panel.
- **Player:** play/pause, seek, volume, shuffle, repeat. Volume, shuffle and repeat are remembered.
- **Keyboard shortcuts:** `Space` play/pause, `N` next, `P` previous.
- **Polish:** loading skeletons, an error boundary, a collapsible library rail, "Show all" rows, Browse all, session cache for General content.
- **Tested:** unit tests for the queue logic, card helpers and the fallback chain.

## Content modes

| Mode | Data source | Playback | Who can use it |
|---|---|---|---|
| **Demo** | Local data (`src/data/songs.js`) | `<audio>` | Everyone, works offline |
| **General** | Apple iTunes Search API (JSONP) | `<audio>` (30 s previews) | Everyone, no login |
| **Spotify** | Spotify Web API + Web Playback SDK | Spotify SDK (full songs) | Allow-listed Spotify accounts with Premium |

## How it works

```
App.jsx  ──►  loadContent(mode)  ──►  sources/index.js
                                          ├─ spotify.js  (Web API, PKCE login in spotifyAuth.js)
                                          ├─ general.js  (iTunes Search API via JSONP)
                                          └─ demo.js     (local data)
                         │
                         ▼
        content = { songs, sections, library, source, notice }
                         │
        ┌────────────────┼─────────────────┬──────────────┐
        ▼                ▼                 ▼              ▼
   MainContent        Sidebar          NowPlaying       Player
 (rows of Cards)     (library)      (about + queue)   (<audio> or SDK)
```

Every source returns the same shapes (`song`, `card`, `section`, `content`), so the UI components never know where the data came from.

## Getting started

```bash
git clone <your-repo-url>
cd spotify_clone
npm install
npm run dev
```

Open **http://127.0.0.1:5173/** (use `127.0.0.1`, not `localhost`: Spotify only accepts a loopback IP as a redirect URI).

Demo and General modes work right away. Spotify mode needs the setup below.

### Spotify mode setup (optional)

1. Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and enable **Web API** and **Web Playback SDK**.
2. Add these **Redirect URIs** (exactly, with the trailing slash):
   - `http://127.0.0.1:5173/`
   - your deployed URL, e.g. `https://your-app.vercel.app/`
3. Under **User Management**, add the email of the Spotify account you will log in with.
4. Copy `.env.example` to `.env` and add your Client ID:
   ```
   VITE_SPOTIFY_CLIENT_ID=your_client_id
   ```
5. Restart `npm run dev`. The avatar menu now shows **Spotify**.

Without a Client ID the Spotify option is simply hidden. No client secret is ever needed or used.

### Deploying (Vercel)

Connect the GitHub repo, set `VITE_SPOTIFY_CLIENT_ID` in **Settings → Environment Variables**, and add the deployed URL to the Spotify Redirect URIs. Vite inlines the variable at build time, so redeploy after changing it.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |

## Showing the fallback live

Add `?fail=1` to the URL to force Spotify and General to fail on purpose. The app falls back to Demo and shows a toast. Demo itself never fails.

## Project structure

```
src/
├─ App.jsx                  state, mode switching, queue, keyboard shortcuts
├─ sources/                 data layer: index (fallback + cache + search), spotify, spotifyAuth, general, demo, cards
├─ hooks/                   useSpotifyPlayer (Web Playback SDK), useSearch, usePersistentState
├─ utils/queue.js           pure next / previous / up-next logic
├─ components/              TopBar, AccountMenu, Sidebar, MainContent, Card, NowPlaying, Player, Toast, ErrorBoundary
└─ data/songs.js            Demo data
```

## Limitations

- General mode plays 30-second previews only (an Apple limit).
- Spotify mode works only for allow-listed accounts (Spotify Development Mode) and needs Premium for playback.
- Playlists in the sidebar are display-only; clicking one does not play it.
- The layout is matched to a fixed 800 px-wide viewport and is not fully responsive yet.

## Roadmap

- [ ] Fully responsive layout for phones
- [ ] Play playlists from the sidebar library
- [ ] Podcasts tab
- [ ] Component tests with React Testing Library
- [ ] Route-based pages (React Router)

## Tech stack

React 19, Vite, react-icons, Vitest, Apple iTunes Search API, Spotify Web API and Web Playback SDK.