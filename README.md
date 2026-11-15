# DataDrop — Mobile Data Cleaner & Quick Chart Studio

Pocket data-wrangling utility: inspect CSV/JSON/Excel files, clean missing values, run summary stats, and generate charts — in the browser (Vercel) or as an offline Android APK.

**Live web app:** https://datadrop-web-sigma.vercel.app

## What this repo contains

| Folder | Purpose |
|--------|---------|
| `apps/web` | Next.js app (parser, cleaner, chart studio, summary cards). Deployed to Vercel. Shows a "Download the app" modal that links to the `.apk`. |
| `apps/mobile` | Capacitor Android project. Wraps the web app into a native `.apk`. Build it locally with Android Studio, or via GitHub Actions. |
| `.github/workflows/build-android.yml` | CI workflow that compiles the `.apk` and publishes it as a GitHub Release artifact. |

## Features

- **Instant file parser** — CSV, JSON, Excel (.xlsx/.xls); shows row/column counts, types, nulls, outliers
- **One-tap cleaning** — deduplicate, trim whitespace, fill missing values, drop empty rows, pick columns
- **Quick visuals** — bar, line, scatter, distribution charts with color picker + PNG export
- **Summary cards** — mean, median, std dev, min/max, null % per numeric column; correlation check
- **Sample dataset** — built-in messy CSV to try everything without uploading
- **Export** — cleaned data as CSV or JSON

## Important: I cannot compile the `.apk` in this sandbox

This environment has Node.js but **no Java / Android SDK**, so a compiled `.apk` binary cannot be produced here. What I *can* deliver is the complete source code plus everything you need to generate the `.apk` yourself:

1. **Locally:** install Android Studio, run the mobile build commands below, generate `app-release.apk`.
2. **Automatically:** push this repo to GitHub — the workflow in `.github/workflows/build-android.yml` builds the `.apk` and attaches it to a GitHub Release for you to download.

## Important: I cannot compile the `.apk` in this sandbox

This environment has Node.js but **no Java / Android SDK**, so a compiled `.apk` binary cannot be produced here. What I *can* deliver is the complete source code plus everything you need to generate the `.apk` yourself:

1. **Locally:** install Android Studio, run the mobile build commands below, generate `app-release.apk`.
2. **Automatically:** push this repo to GitHub — the workflow in `.github/workflows/build-android.yml` builds the `.apk` and attaches it to a GitHub Release for you to download.

## Prerequisites

- Node.js 18+ and npm
- (For the APK) Android Studio with the Android SDK, or a GitHub repository to run the CI workflow

## 1) Web app (Vercel)

```bash
cd apps/web
npm install
npm run build        # Next.js build into .next/
```

Deploy to Vercel:

The web app is already deployed and live at:

**https://datadrop-web-sigma.vercel.app**

This is a Vercel project (`datadrop-web`) connected to the `kennedy-blip/apptrial` GitHub repo, root directory `apps/web`, building the `arena/6be6e2e8-apptrial` branch. Pushes to that branch trigger a new deployment automatically.

The `.apk` file goes in `apps/web/public/` (e.g. `AppTrial.apk`) and is linked from the download modal. `vercel.json` serves it with the correct MIME type (`application/vnd.android.package-archive`). Until you build the real APK, there's a placeholder.

## 2) Mobile app (.apk)

```bash
cd apps/mobile
npm install
npx cap sync           # copies the web build into the native project
npx cap open android   # opens Android Studio
```

In Android Studio: **Build → Bundle(s) / APK(s) → Build APK(s)**.  
The output appears at `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk` (or `release` if you configure signing).

### Automatic APK via GitHub Actions

Push this repo to GitHub. The workflow `.github/workflows/build-android.yml` runs on pushes to `main` and on the `build-apk` workflow_dispatch event. It produces `AppTrial.apk` as a workflow artifact and (optionally) attaches it to a GitHub Release.

Then in your web app's download modal, point the button at:
- the GitHub Release asset URL, or
- `https://your-vercel-domain.vercel.app/AppTrial.apk` (after you place the built APK in `apps/web/public/`)

## 3) Download flow (browser → APK suggestion)

1. User opens your Vercel link in a mobile browser.
2. A modal pops up suggesting they download and install `AppTrial.apk`.
3. User taps "Download", the APK downloads, and they install it (Android will ask to "Install unknown apps" — that's normal for sideloaded APKs).

## License

MIT