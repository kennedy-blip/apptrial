# AppTrial mobile (Capacitor + Android)

This wraps the Next.js web app (`apps/web`) into a native Android app that can be built into an `.apk`.

## Build the APK locally

```bash
cd apps/mobile
npm install

# 1. Build the web app and copy it into the native project
npm run build:web

# 2. Add the Android platform (first time only)
npx cap add android

# 3. Sync web assets into the native project
npx cap sync

# 4. Open Android Studio and build: Build → Bundle(s) / APK(s) → Build APK(s)
npx cap open android
```

The debug APK appears at:

```
apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

Rename it to `AppTrial.apk`, copy it into `apps/web/public/AppTrial.apk`, redeploy the web app, and the download button will serve the real binary.

## Automatic APK via GitHub Actions

Push this repo to GitHub. `.github/workflows/build-android.yml` builds a release APK on every push to `main` and attaches it to a GitHub Release as `AppTrial.apk`.

## Notes

- `webDir: '../web/out'` — the Capacitor config points at the Next.js static export from `apps/web`.
- First build requires Android Studio installed with an Android SDK.
- This sandbox cannot compile APKs (no Java/Android SDK). Use the steps above on your machine, or let GitHub Actions do it.