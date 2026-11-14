# Cyberpunk 2077 // Night City HUD

**Author:** [RaveAgainstTheMachine](https://github.com/RaveAgainstTheMachine)

A high-contrast Cyberpunk 2077 Kiroshi Optics & Netrunner HUD theme for the Steam Desktop Client, built for [Millennium](https://steambrew.app/).

## Features

- **Full Client UI Skinning** (`libraryroot.custom.css`, `friends.custom.css`): Styled Library home, game pages, shelves, downloads, collections, top navigation bar, context menus, modal dialogs, notifications, and Friends/Chat windows.
- **Store & Community Webkit Skinning** (`webkit.css`): Styled Steam Store & Community pages with dark cyber HUD cards, unified `45x108px` carousel edge arrows adaptively anchored to carousel tracks, pagination indicators, and custom scrollbars.
- **Docked Friends Panel & Telemetry Script** (`libraryroot.custom.js`): Optional docked Friends Panel alongside the main client view plus Game Page play-bar telemetry & layout adjustments.
- **Configurable Layout Conditions** (`skin.json`, `options/`): Switch layout presets directly inside Millennium Settings:
  - **Games Panel Position:** `Left` / `Right`
  - **Friends Panel Position:** `Right` / `Left` / `Hidden`
  - **Gamepage Info & Friends Column:** `Right` / `Left`
- **Included Theme Customizer Studio (CPT)** (`cyberpunk_steam_studio.html`): Standalone browser tool for previewing presets/colors and generating updated theme files.

## Installation

1. Ensure [Millennium](https://steambrew.app/) is installed for Steam.
2. Download or clone this repository into your Steam Millennium themes directory so `skin.json` sits directly inside the theme folder:
   ```text
   <Steam Directory>\millennium\themes\Cyberpunk2077\
   ```
   For default Windows installs:
   ```powershell
   git clone https://github.com/RaveAgainstTheMachine/<YOUR-REPO-NAME>.git "C:\Program Files (x86)\Steam\millennium\themes\Cyberpunk2077"
   ```
3. Open **Steam Settings -> Millennium -> Themes**, select **Cyberpunk 2077 // Night City HUD**, and reload/restart Steam. (On an open Store tab, press `Ctrl + R` to refresh stylesheets.)

## Repository Structure

```text
Cyberpunk2077/
├── skin.json                     # Millennium theme manifest & settings
├── libraryroot.custom.css        # Main Steam client UI stylesheet
├── libraryroot.custom.js         # Friends dock, resizer & PlayBar helpers
├── friends.custom.css            # Friends list & chat window stylesheet
├── webkit.css                    # Steam Store & Community stylesheet
├── options/                      # Millennium conditional layout stylesheets
│   ├── friends-hidden.css
│   ├── friends-left.css
│   ├── friends-right.css
│   ├── gamepage-info-left.css
│   ├── gamepage-info-right.css
│   ├── games-left.css
│   └── games-right.css
├── cyberpunk_steam_studio.html   # Optional browser-based customizer & code exporter
├── LICENSE                       # MIT License
└── README.md
```

## Optional Customizer (`cyberpunk_steam_studio.html`)

Open `cyberpunk_steam_studio.html` in a modern browser (Firefox, Chrome, or Edge) to customize colors, faction presets, and panel defaults, then copy or export the generated `skin.json`, CSS, and JS files.

## License & Disclaimer

Released under the [MIT License](LICENSE).

This is an unofficial fan-made theme and is not affiliated with, endorsed by, or associated with Valve Corporation (Steam) or CD PROJEKT RED (Cyberpunk 2077).
