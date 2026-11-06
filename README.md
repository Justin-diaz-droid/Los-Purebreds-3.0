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
src/                  Worker code (server side)
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

## Notes

- Keep `index.html` and the `assets/` folder together inside `public/`.
- Emoji, the small inline UI icons (send, edit, delete) and the loading screen's spinning hat and cane are written in code, so they are not files in `assets/`.
- Never commit passwords, API keys or tokens to this repo.
