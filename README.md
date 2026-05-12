# Brainly Ban Checker

A lightweight React + Vite app for scanning text content against Brainly banned words.

## Features

- Detects banned words for Brainly Philippines (`PH`) and Brainly United States (`US`)
- Uses a JSON data source for banned word lists and symbol mappings
- Supports light/dark mode theme toggle
- Shows flagged words and quick results

## Project structure

- `src/Pages/BanChecker.jsx` — main page and app logic
- `src/components/ban-checker/` — UI components
- `src/lib/banChecker.js` — content analysis helper
- `src/lib/bannedWords.json` — banned words and symbol data

## Requirements

- Node.js 18+ recommended
- npm

## Setup

```bash
npm install
```

## Run locally

```bash
npm run dev
```

Then open the local URL shown by Vite, for example:

```
http://localhost:5174/Ban-Checker/
```

## Build for production

```bash
npm run build
```

## Preview production build

```bash
npm run preview
```

## Notes

- Vite may choose an alternate port if `5173` is already in use.
- The app currently loads banned word data from `src/lib/bannedWords.json`.
- If you need to add or update banned words, edit the JSON arrays directly.
