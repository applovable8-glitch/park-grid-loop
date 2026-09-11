# AndiPark — Android app (APK)

The AndiPark Android app is a Capacitor shell around the hosted AndiPark web app.
Everything that needs a server (map search, reservations, notifications, admin)
keeps working because the shell loads the published site.

## What is already in the project

- `capacitor.config.ts` — app name **AndiPark**, application ID `app.andipark.mobile`,
  splash/background colour, and the allow-list for Google sign-in and Maps.
- `@capacitor/core`, `@capacitor/android`, `@capacitor/cli` are installed.

## Building the APK (on your computer — not possible inside Lovable)

Lovable's build environment has no Android SDK, no Java toolchain and no Gradle,
so an APK cannot be produced here. On a machine with **Android Studio** (or the
command-line SDK + JDK 21) installed:

```bash
bun install
bunx cap add android          # creates the android/ project (first time only)
bunx cap sync android
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

### App icon and splash

Put the logo at `resources/icon.png` (1024×1024) and `resources/splash.png`
(2732×2732), then:

```bash
bunx @capacitor/assets generate --android
```

The source logo is `public/andipark-logo.png`.

### Permissions

Add to `android/app/src/main/AndroidManifest.xml` inside `<manifest>`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### Referral / deep links

Inside the main `<activity>`:

```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="https" android:host="park-grid-loop.lovable.app" android:pathPrefix="/auth" />
</intent-filter>
```

That makes `https://park-grid-loop.lovable.app/auth?ref=CODE` open in the app and
keeps referral attribution working.

### Release APK / Play Store

```bash
cd android && ./gradlew assembleRelease
```

You need your own upload keystore. Never commit it:

```bash
keytool -genkey -v -keystore andipark-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias andipark
```

Store the keystore path and passwords in `android/keystore.properties` (git-ignored)
or in your CI secret store.
