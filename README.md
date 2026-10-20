# narristotle.com

The editorial home of Narristotle — the storytelling persona and methodology behind RoughDraft Maker, developed by AI Global Entertainment (co-founders Matt Allen and Steve Smythe).

Static site on Firebase Hosting (site `narristotle`, project `myroughdrafter`), with a Firestore-backed editorial studio at `/studio`.

## Structure

- `public/` — everything served
  - `index.html` — home: Meet Narristotle → Gadfly Gazette → The Method → Bookshelf preview → CTA
  - `gazette/` — Gazette index + one crawlable page per article
  - `method/` — the four pillars, with a labeled demonstration
  - `bookshelf/` — recommended reading (real books, labeled as recommendations)
  - `about/` — the character vs. the facts vs. the company
  - `studio.html` — editors-only workflow (not in public navigation, `noindex`, robots-disallowed)
  - `firebase-config.js` — Studio connection settings (see below)
  - `sitemap.xml`, `robots.txt`, `llms.txt`, `404.html`
- `content/` — `articles.json` (published registry), `editorial-calendar.md` (Tue/Fri cadence, first four weeks)
- `firestore.rules` — Studio data is editors-only (Steve + Matt allowlist)
- `firebase.json`, `.firebaserc` — hosting config

## Deploy

Deploys use the established AGE pattern: the `firebase-deployer@myroughdrafter`
service account (roles/firebasehosting.admin; key at `~/firebase-deployer-key.json`
on Steve's Mac, supplied transiently per deploy, never stored) exchanged for an
OAuth token — or a normal `firebase login` session. Create the site once, then:

```bash
firebase hosting:sites:create narristotle --project myroughdrafter   # once
firebase deploy --only hosting:narristotle,firestore:rules --project myroughdrafter
```

Verify after every deploy (do not trust "deploy succeeded" alone):

```bash
curl -s https://narristotle.web.app/ | grep -o "<title>[^<]*</title>"
curl -s -o /dev/null -w "%{http_code}\n" https://narristotle.web.app/gazette/waiting-for-the-muse
```

## Connect the custom domain (one-time, Steve)

1. Firebase Console → project `myroughdrafter` → Hosting → site `narristotle` → Add custom domain → `narristotle.com`.
2. Firebase shows a TXT record for ownership and two A records — add all of them at GoDaddy (DNS → narristotle.com), replacing the default parking A record.
3. Wait for the certificate to issue (Firebase shows "Connected"). Repeat for `www.narristotle.com` as a redirect if offered.
4. Add the email forwarding while in GoDaddy: `hello@narristotle.com` → `hello+narristotle@aiglobalentertainment.com`.

## Connect the Studio (one-time)

1. Firebase Console → project `myroughdrafter` → Build → Authentication → enable Google sign-in.
2. Project settings → Your apps → Web app → register `narristotle` → copy the config values into `public/firebase-config.js`.
3. Build → Firestore Database → make sure the database exists in the project; deploy `firestore.rules` (included in the deploy command above).
4. Redeploy hosting. `/studio` then signs editors in with Google and stores drafts, scheduled posts, and publication history in `narristotle_posts` / `narristotle_history`.
   Until this is done, `/studio` runs in a clearly labeled local preview mode (data stays in the browser).

## Search Console

1. search.google.com/search-console → Add property → Domain → `narristotle.com`.
2. Add the TXT verification record it gives you at GoDaddy DNS (can sit alongside the Firebase records).
3. Submit `https://narristotle.com/sitemap.xml` under Sitemaps.

## Editorial workflow

- Cadence: Tuesday = Story Clinic (practical problem + worked example), Friday = Contrarian Craft / breakdown / Bookshelf feature. Topics: `content/editorial-calendar.md`.
- A scheduled job drafts each piece ahead of its day; Steve or Matt reviews, edits, and publishes in `/studio`. Publishing is single-editor — no second approval — and every action is logged to publication history.
- Launch rules enforced by the Studio scan and the calendar checklist: no consumer prices, no internal drafting-speed benchmarks, no invented quotations/credentials/claims, demonstrations labeled as demonstrations.

## Assets

- `public/assets/narristotle-bust.jpg` — launch bust, cropped from the approved design mockup (October 2026). NOTE: this one binary file is NOT in git — the agent's GitHub tooling moves text only, so the file travels with the launch build folder; drop it in `public/assets/` after cloning, before deploying (the home page degrades gracefully to a monogram if it is missing). Replace with a Matt-inspired bust when an approved Matt reference is available; do not block launches on it.
- Book covers on the Bookshelf are clean text treatments by design (no third-party cover art), with free full texts linked at Project Gutenberg.
