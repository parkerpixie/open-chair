# Open Chair

Open Chair is a private, local-first self-awareness app from Undergrowth, its parent brand, built with Expo SDK 57, React Native 0.86.3, React 19.2.3, and Expo Router. Feelings are information, not scores or diagnoses. The repository, package name, and Expo slug are `open-chair`; the URL scheme is `openchair`.

## V1

Five tabs: **Today**, **Check In**, **Patterns**, **Tools**, and **Supports**. Settings lives in the header.

- Multi-select/search 96 feelings in eight families, optional intensity and context.
- Today snapshot and multiple “Something worth keeping” reflections, with confirmed deletion.
- Deterministic weekly/monthly observations and grouped history in 30-day pages.
- Seventeen original plain-language tool summaries, fourteen three-prompt guided flows, and optional 4/2/6 breathing for three cycles.
- Generic supports with editing, favorites, deactivation, deletion, weekly schedules, online/phone actions, and dated takeaways. Scheduled supports never imply attendance.
- Development-only synthetic history and confirmed clear actions.

## Structure

- `src/app/`: thin Expo Router screens and navigation.
- `src/components/app/`: shared native UI primitives and layout.
- `src/constants/palette.ts`: light-mode color tokens.
- `src/db/`: initialization, schema migration, types, and parameterized repositories.
- `src/features/`: feelings, tools/suggestions, patterns, and support scheduling/editor.
- `src/lib/`: local dates, validation, focus-aware loading and mutation hooks.
- `tests/`: pure domain tests plus actual SQLite repository tests through a Node bridge adapter.

SQLite is opened once by the root provider. `PRAGMA user_version` controls migrations; V1 creates six tables: check-ins, check-in feelings (with word/family snapshots and selection order), reflections, tool sessions, supports, and support takeaways. Local-date and foreign-key indexes support bounded reads. Foreign keys are enabled, check-in children cascade, and deleting a support preserves its takeaways with a null association. Related writes and schema initialization use isolated `BEGIN IMMEDIATE` transactions with foreign keys enabled on each connection. All user values are bound parameters.

Every dated history record has both its authoritative local `YYYY-MM-DD` key and an ISO timestamp. Calendar arithmetic uses local noon, including across DST. Weekly supports use device-local wall time; changing time zones changes upcoming wall-clock occurrences, not historical local dates.

Patterns use the current seven/thirty local dates. Repeated feelings count distinct days; family dominance counts recorded words per day and includes ties. Weekly observations need four active days and either four occurrences or three with five active days. Monthly observations need six active days and four occurrences. Family observations suppress redundant exact words. Reflection themes need three entries over two dates; a tool needs three completed uses. At most five observations appear, with room reserved for a qualifying theme/tool. These describe frequency, never causes or tool effectiveness.

## Run and validate

Use Node 22.19+ (repository tests use Node’s built-in SQLite), npm, and an SDK-57-compatible Expo Go client or development build.

```sh
npm ci
npx expo start
npx expo lint
npx tsc --noEmit
npm test
npx expo-doctor
```

Starting Expo refreshes ignored `.expo/types/router.d.ts` after route changes. No native directories are committed or manually maintained. To check native JavaScript/Hermes bundles without a simulator:

```sh
npx expo export --platform ios --platform android --output-dir /tmp/open-chair-native-export
```

Tests run in `America/Chicago` for DST boundaries. The repository suite exercises SQL, rollback, CRUD, referential integrity, migrations, demo isolation, and production guards. It adapts Node SQLite to the small database API surface; it does **not** test the Expo native bridge or the mobile UI. Node may print an experimental SQLite warning.

In a development session, open Settings → **Seed demo history**, then Patterns. Eighteen synthetic days trigger weekly exact/family, monthly, reflection-theme, and repeated-tool observations. Re-seeding replaces only marked demo rows. **Clear demo data** preserves personal entries; **Clear all local data** requires confirmation. No production auto-seeding.

## Privacy and boundaries

No accounts, network persistence, analytics, advertising, tracking, sync, or remote AI. SQLite is not configured for encryption; do not claim encrypted storage. OS-managed backups may include app data. Uninstalling may remove history. Tool text is original and does not promise treatment effects. No reference application files, credentials, personal content, or artwork were imported.

This pass targets native iOS/Android. Browser SQLite requires a separate WASM/headers and transaction-compatibility pass; `npm run web` is not a verified product target. The app uses a deliberate light palette. Launcher artwork remains the original placeholder pending branding.

## Deferred / next validation

1. Device smoke test in Expo Go: save/relaunch, all tabs, keyboard/safe areas, large text, screen reader, links/calls, background breathing, and destructive confirmations.
2. Dedicated web SQLite support and dark tokens if those targets are needed.
3. One-time supports, advanced recurrence, notification scheduling (the schema reserves a reminder offset, but no reminders are sent), and a full calendar.
4. Export/import, encrypted backups, accounts/sync, resource library, annual comparisons, onboarding, and production branding.

Health integrations, AI analysis, subscriptions, Understory/workplace edition, and store submission are outside this foundation.
