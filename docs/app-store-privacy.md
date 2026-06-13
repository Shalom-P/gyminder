# App Store privacy — submission runbook

Everything you need to clear Apple's privacy requirements for **Gyminder**
(`com.blacklemon.gymcoach`). The app collects no data, so every answer is the
"nothing" answer — but Apple still requires you to *declare* that in three places.

## What's already done (in this repo)

| Item | File | Status |
| --- | --- | --- |
| App privacy manifest | [`ios/App/App/PrivacyInfo.xcprivacy`](../ios/App/App/PrivacyInfo.xcprivacy) | ✅ created |
| Widget privacy manifest | [`ios/App/RestWidget/PrivacyInfo.xcprivacy`](../ios/App/RestWidget/PrivacyInfo.xcprivacy) | ✅ created |
| Privacy policy page | [`docs/privacy-policy.html`](./privacy-policy.html) | ✅ created (needs hosting — step 2) |
| Encryption declaration | `Info.plist` → `ITSAppUsesNonExemptEncryption = false` | ✅ already set |

Three manual steps remain: **(1)** add the manifests to their Xcode targets,
**(2)** host the privacy policy and get its URL, **(3)** fill in App Store Connect.

---

## Step 1 — Add the privacy manifests to the Xcode targets

The `.xcprivacy` files exist on disk, but Apple only reads them if they're part of
the app bundle. They must be members of the right target's **Copy Bundle Resources**.

1. Run `npm run ios:open` to open the project in Xcode.
2. In the Project navigator, find the App group. **Right-click → Add Files to "App"…**
   and select `ios/App/App/PrivacyInfo.xcprivacy`.
   - In the dialog, **check the "App" target** under "Add to targets", and leave
     "Copy items if needed" unchecked (it's already in place).
3. Do the same for `ios/App/RestWidget/PrivacyInfo.xcprivacy`, checking the
   **"RestWidget"** (widget extension) target instead.
4. Verify: select the **App** target → **Build Phases → Copy Bundle Resources** and
   confirm `PrivacyInfo.xcprivacy` is listed. Repeat for the RestWidget target.
5. Confirm the whole thing with Apple's report: **Product → Archive**, then in the
   Organizer right-click the archive → **Generate Privacy Report**. It should show
   "UserDefaults — CA92.1" and no data collection.

> If you instead create the file via **File → New File → App Privacy File**, Xcode
> sets target membership for you — but since the files already exist, the "Add Files"
> route above is simpler. Don't end up with two copies.

---

## Step 2 — Host the privacy policy and get its URL

App Store Connect requires a **publicly reachable** privacy policy URL — mandatory
even though the app collects nothing. The page is already written; it just needs a home.

**Recommended: GitHub Pages (free, zero infra, matches the "no backend" ethos).**

1. On GitHub: **`Shalom-P/gyminder` → Settings → Pages**.
2. Under "Build and deployment", Source = **Deploy from a branch**.
3. Branch = **`main`**, folder = **`/docs`**. Save.
4. After it builds (~1 min), your policy is live at:

   ```
   https://shalom-p.github.io/gyminder/privacy-policy.html
   ```

   That is the URL you paste into App Store Connect.

Alternatives if you'd rather not use Pages: any static host works — Netlify, Cloudflare
Pages, Vercel, or even a Gist rendered through htmlpreview. The only requirement is that
the URL loads the policy publicly without a login.

**Before publishing, confirm the contact email** in `privacy-policy.html`
(currently `rahulnalluru007@gmail.com`) is the one you want shown publicly.

---

## Step 3 — Fill in App Store Connect

### 3a. Privacy Policy URL
**App Store Connect → your app → App Privacy → Privacy Policy → Edit** → paste the
URL from step 2. (Also appears under the app's version "App Information".)

### 3b. App Privacy questionnaire ("nutrition label")
**App Store Connect → App Privacy → Get Started.**

- First question: *"Do you or your third-party partners collect data from this app?"*
  → **No, we do not collect data from this app.** → **Save.**
- That's the entire questionnaire. With "No", there are no follow-up data-type
  questions, and your label will read **"Data Not Collected."**

> ⚠️ This declaration must stay true. If you ever add analytics, crash reporting, an
> account, or any networked feature, you must come back and update both this label and
> the `PrivacyInfo.xcprivacy` manifests — Apple cross-checks them and rejects mismatches.

### 3c. Export compliance (encryption)
Already handled: `Info.plist` has `ITSAppUsesNonExemptEncryption = false`, so Apple
won't prompt you about encryption at each upload. (Gyminder uses only standard HTTPS/OS
encryption, which is exempt — and in fact makes no network calls at all.)

---

## Quick reference — why each declaration is what it is

- **`NSPrivacyTracking = false`** — the app never tracks users across apps/sites, so no
  App Tracking Transparency prompt is needed.
- **`NSPrivacyCollectedDataTypes = []`** — no data is collected, matching the
  "Data Not Collected" label.
- **`NSPrivacyAccessedAPICategoryUserDefaults` → `CA92.1`** — the one required-reason
  API reached, and only by Capacitor core to persist app config on-device. `CA92.1` =
  "access information from the app itself." None of the app's own Swift
  (`LiveRestPlugin`, the `RestWidget`) uses any required-reason API.
- **No `NSCameraUsageDescription`, location, HealthKit, etc.** — the app requests none
  of those permissions, so no usage-description strings are required.
