# Los Purebreds – site + assets

```
index.html
assets/
  favicon.png            browser tab icon (hat + cane)
  mascot_logo.png        gentleman mascot (home screen + logo)
  icons/
    home.png             "Home" tab icon in the top bar
    games.png chat.png media.png draw.png
    shame.png polls.png gallery.png tier.png     home-screen tiles + their top bar tab icons
  jumpscare/
    jumpscare.webp       jumpscare picture
    jumpscare.mp3        jumpscare sound
  wallpapers/
    macos.svg chromeos.svg windows11_dark.svg windows11_light.svg   desktop-style theme backgrounds
```

## Change an image
Upload a new file into the same folder with the **exact same name** (e.g. `assets/icons/home.png`)
and commit. The site uses it automatically. Keep the same format and roughly the same shape/size
(icons are square, about 192x192 px; the favicon is 128x128 px).

## Put it on GitHub Pages
1. Create a repo and upload `index.html` and the whole `assets` folder (keep them side by side).
2. Repo Settings > Pages > Source: "Deploy from a branch", branch `main`, folder `/ (root)`.
3. Open the link GitHub gives you (it can take a minute or two the first time).

## Image not changing?
Browsers and GitHub Pages cache images. Wait a few minutes and hard-refresh (Ctrl+Shift+R).
Favicons are cached the longest; reopening the tab or clearing site data helps.

## Notes
- Keep `index.html` and `assets/` together. Opening `index.html` straight from your computer
  works for most things, but use GitHub Pages (or any web host) for the full experience.
- Emoji and the small inline UI icons (send, edit, delete, the loading hat + cane) are code,
  not image files, so they are not in `assets/`.
