# Los Purebreds Chat

A themeable group chat website for Los Purebreds, with a home screen, image gallery, polls, tier lists, games, media and more. It runs on Cloudflare Workers.

## Project structure

```
.github/workflows/    Automation (version bump workflow)
public/
  index.html          The whole front end (page, styles and scripts)
  assets/             Images, icons, sounds and wallpapers used by the site
    favicon.png         Browser tab icon
    mascot_logo.png     The gentleman mascot
    icons/              Home-screen tile icons and top bar tab icons
    jumpscare/          Jumpscare picture and sound
    wallpapers/         Desktop-style theme backgrounds
src/                  Worker code (server side): the chat relay and the cloud storage
wrangler.jsonc        Cloudflare Workers configuration
README.md             This file
```

## Changing images and icons

Every image the site uses is a normal file in `public/assets/`. To change one:

1. Open the file's folder on GitHub (for example `public/assets/icons`).
2. Click **Add file → Upload files** and drop in your new image.
3. Give it the **exact same name** as the file it replaces, keep the same format, and keep a similar size and shape.
4. Commit. Once the deploy finishes, the site uses the new image.

| File | Where it shows | Suggested size |
| --- | --- | --- |
| `favicon.png` | Browser tab icon | 128×128 |
| `mascot_logo.png` | Home screen mascot and logo | about 265×280 |
| `icons/home.png` | "Home" tab in the top bar | 96×96 or larger, square |
| `icons/games.png`, `chat.png`, `media.png`, `draw.png`, `shame.png`, `polls.png`, `gallery.png`, `tier.png` | Home-screen tiles and their top bar tabs | 192×192, square |
| `jumpscare/jumpscare.webp` | Jumpscare picture | any |
| `jumpscare/jumpscare.mp3` | Jumpscare sound | any |
| `wallpapers/*.svg` | macOS, ChromeOS and Windows 11 theme backgrounds | any |

**Image not updating?** Browsers cache images. Wait a few minutes after the deploy, then hard-refresh with `Ctrl+Shift+R` (`Cmd+Shift+R` on Mac). Favicons are cached the longest, so reopening the tab or clearing site data helps.

## Editing the homepage icons (owners)

Turn on owner mode (Ctrl + I, or tap the title 5 times on a phone), open the Home tab and press **✏️ Edit home**.

- Tap an icon to change its name, emoji or picture, and where it goes.
- **◀ ▶** move it, **✕** removes it, **+ Add icon** makes a new one, **↺ Reset** brings back the original icons.
- Each icon opens a tab, and can optionally jump straight to a sub-tab inside it (type the sub-tab's name, e.g. `Proxy` in Games or `Music` in Media).
- Changes are saved for everyone in the room, the same way the owner panel's tab names and icons are.

## Deploying

The site is served from the `public/` folder, as set in `wrangler.jsonc`.

- **Automatic:** if the repo is connected to Cloudflare, every push to `main` deploys by itself. Watch progress in the Cloudflare dashboard under **Workers & Pages → your project → Deployments**.
- **Manual:** from the repo folder, run:

  ```bash
  npx wrangler deploy
  ```

## Running locally

```bash
npx wrangler dev
```

Then open the address it prints (usually `http://localhost:8787`).

## Cloud storage (how tabs, games and chat history sync)

Custom tabs, the games list, media and the public chat history are stored by the Worker itself (the `Store` Durable Object in `src/worker.js`, address `/db/...`). There is no Firebase any more, so there is no separate service or quota to run out of, and school or phone networks that block Firebase are no longer a problem.

- Pages ask one tiny question ("anything new?") every few seconds and only download when something changed.
- **First deploy:** `wrangler.jsonc` now has a second migration (`v2`) that creates `Store`. A normal push to `main` or `npx wrangler deploy` applies it.
- After the first deploy the cloud starts empty. Mod/owner devices re-upload the tabs they have, and the device that hosts the room re-uploads the chat history, so most things come back on their own.
- **Optional: bring the old Firebase data over.** In the Firebase console, open Realtime Database, go to Data, click the three dots next to `lospurebro` (under `rooms`), choose Export JSON, then run:

  ```bash
  curl -X PUT https://YOUR-SITE.workers.dev/db/rooms/lospurebro.json --data @lospurebro.json
  ```
- Free-plan note: every open page makes a small request every ~8 seconds (about 30 seconds when nothing has changed for a while). A big group that keeps the site open all day can pass Cloudflare's free request limit; the Workers Paid plan removes that worry.

## Live editing of tabs and subtabs (like Google Docs)

- **Autosave:** while you edit a custom tab or subtab, your changes save by themselves about 1.5 seconds after you stop typing (and at least every ~4 seconds while you keep typing). The footer shows *Editing…* / *✓ Saved*. **Done** just closes the editor (Ctrl+Enter does the same, Ctrl+S saves right now). There is no Cancel any more, because everything is already saved.
- **Live view:** anyone looking at a page sees other people's changes appear within a few seconds, with a short highlight on the changed paragraphs, a green *✏️ Name is editing…* pill, and a green dot on the tab / subtab being changed.
- **Two people editing at once:** their changes are merged into your editor as they arrive, without moving your cursor. Edits in different paragraphs, or in different places of the same paragraph, are both kept. Only if you both change the exact same words at the same moment does the cloud version win (you'll see a short note).
- **How it works:** a page is still one record in the cloud. Each saved version now also stores which version it was built from (`pv`) and who changed it (`eb`), which is what makes the merge possible. The merge code is in the "LIVE EDITING" section of `public/index.html`; the faster polling is in the `mailbox` script (`liveOn`).
- **Request usage:** while a custom tab is on screen, the page checks for changes every ~2 seconds, slowing to every ~6 seconds after a minute or two of nothing changing. Pages that aren't a custom tab keep the old ~8 second rhythm. On the Workers free plan a big group sitting on custom tabs all day can use a lot of requests; the Workers Paid plan removes that worry.
- Pages full of pictures sync slower, because the whole page is re-sent when it changes.

## Polls where people type their answer

In **Create a poll**, tick **Let people type their own answer (no choices)**. The poll card then shows a text box instead of buttons, and lists everyone's answers underneath (identical answers are counted together, with who said what). In the Polls tab an answer is final once submitted; in chat polls people can edit their answer until the poll ends. Typed answers are stored with each person's vote, so they sync like normal votes. Older copies of the page that haven't refreshed can't show these polls.

## Notes

- Keep `index.html` and the `assets/` folder together inside `public/`.
- Emoji, the small inline UI icons (send, edit, delete) and the loading screen's spinning hat and cane are written in code, so they are not files in `assets/`.
- Never commit passwords, API keys or tokens to this repo.
