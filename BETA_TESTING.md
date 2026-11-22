# Open Chair: first personal beta

> Status: source-code candidate validated in GitHub CI, NOT yet distributed to TestFlight.
> Branch: `feature/open-chair-today-redesign`
> Existing installed Open Chair data should not be deleted or cleared.

## What is ready in the candidate

- Dusty Blue theme and compact accessible header.
- Today screen: next saved meeting/support, rotating original prompt, reflection entry saved to My Days, six navigation tiles.
- Supports: add, edit, favorite, deactivate or delete recurring meeting/support, weekly days, 12-hour time with AM/PM, online URL, meeting ID/passcode, in-person location, phone and notes.
- My Library: save/edit/delete podcasts, reflections, articles, videos and links; original source and personal notes; cover artwork with image fallback.
- Podcast metadata: Apple Podcasts show URL or show-name search; Spotify show/episode link via oEmbed. Other providers can use manual details.
- All new saved library items stay on the device in an additive SQLite v2 database table. No account/cloud sync is enabled.

## After the new version appears in TestFlight

1. Open TestFlight and update Open Chair. **Do not delete the existing app to refresh it.**
2. Open Today. Check the header, next meeting card, today's reflection and navigation grid.
3. Tap **Supports → Add a support**. Select **Meeting**, choose **Online** or **In person**, pick days, enter time and AM/PM, fill details, and save.
4. Return to Today. Check your meeting displays at the correct local time. Open and edit it. Verify Zoom join link or location.
5. Tap **My Library** from Today or Supports. Choose **Podcast**, paste an Apple Podcasts or Spotify show URL into the artwork lookup, and tap **Find artwork & details**. Verify title and cover. Save a personal note.
6. Add a podcast by typing its show name as an alternate path. Tap a search result to choose a correct match. Paste your preferred source URL.
7. Add a personal reflection, save it, edit it, favorite it, and verify it remains after force-closing and reopening the app.
8. Enter a journal response on Today and check it appears in My Days.
9. Turn off networking and confirm saved items remain visible; artwork itself may need connectivity if it has never been cached.
10. Capture problems with screenshots and note the screen, iPhone model, iOS version, and reproduction steps.

## Limitations / precautions

- There is no cloud backup or export for the new library yet. Do not rely on this beta for irreplaceable writing.
- On-device saved data can be lost if the app is uninstalled; updating the same bundle ID normally preserves app data, but test the migration first.
- Metadata depends on provider availability, correct links, and network access.
- Spotify oEmbed supplies image and title, but may not provide creator or synopsis.
- The first beta does not yet include food, sleep or advanced health tracking, nor paid subscriptions.
- This branch and its PR are not yet merged into `main`, which still has a starter app.

## Release route

- Existing EAS project is configured with owner `capyqueue-systems-for-humans`, EAS project ID in app.json, and App Store Connect app ID in eas.json.
- Validate `npm ci`, `npm run typecheck`, `npm run lint`, `npm test -- --passWithNoTests --testTimeout=15000` (GitHub Actions workflow runs these).
- On a computer authenticated as the app's Expo/EAS owner, build from this candidate branch:

```bash
npm ci
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios --latest
```

- Confirm signing, App Store Connect team, TestFlight group and build number. Production profile builds must target the existing bundle ID `com.undergrowth.openchair`.
- Only distribute after migration/purchase-free smoke tests pass. TestFlight processing, permissions, signing and Apple review are outside GitHub CI.
