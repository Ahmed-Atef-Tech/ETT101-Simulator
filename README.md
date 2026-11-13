# ETT-101 Simulator

An interactive simulator of the **Emona ETT-101 (Telecoms-Trainer 101)** kit and a **UNI-T UTD2102CEL-style oscilloscope**, made for the first- and second-term communications labs.

> [!IMPORTANT]
> **Preliminary (beta) version.** This simulator is still being tested and may not match the real Emona ETT-101 kit 100%. When it differs, the real kit is the reference.
> It was made **only to help students**. It is **free and non-commercial**: it must not be sold, rented, put behind a paywall, bundled with paid courses or used to make money in any way. Not affiliated with Emona Instruments or UNI-T.

## ⬇️ Download

**[Download page](https://ahmed-atef-tech.github.io/ETT101-Simulator/)** · [GitHub release](https://github.com/Ahmed-Atef-Tech/ETT101-Simulator/releases/latest)

| Device | File |
|---|---|
| Windows 10 / 11 | `ETT101-Simulator-Setup-x.y.z.exe` |
| Mac | `ETT101-Simulator-x.y.z-mac.dmg` |
| Experiment files (OPEN SETUP) | `ETT101-Experiments-Setups.zip` |
| Model and equations reference | `ETT101-Model-Reference.md` |

Inside the app, the **Load experiment** button has all of these experiments ready, each with its page number in the lab book, and the **Reference** button shows the model reference.

Experiment files: unzip the file, then in the app press **OPEN SETUP** and choose the experiment. The folders are `Term1`, `Term2` and `Extra`.

## Installing

### Windows
1. Download the Setup file and open it.
2. If a blue **"Windows protected your PC"** message appears, press **More info**, then **Run anyway**. This is normal, because the app isn't signed with a paid certificate.
3. **Updates are automatic:** every time you open the app it checks by itself, downloads the new version in the background, and installs it when you close the app.

### Mac
1. Download the `dmg` file, open it, and drag the app into the **Applications** folder.
2. First time only: open the app. If a message says it's from an unidentified developer, go to **System Settings → Privacy & Security**, scroll down and press **Open Anyway**.
3. When a new version comes out, the app tells you and opens the download page.

## Expected results

**[Expected results for every experiment](docs/results/README.md)**: the block diagram, the wiring on the kit, the oscilloscope screen, and what the lab book expects next to what the simulator shows, for all 69 experiments.

**[Oscilloscope verification](docs/scope-check.md)**: every function of the simulated UTD2102CEL checked with known signals against the instrument's manual and specifications.

Reference: the course lab books Electrical Testing (6), ELC414 (Term 1) and Electrical Testing (7), ELC424 (Term 2) are adapted from Barry Duncan, *Experiments in Modern Analog and Digital Telecommunications* (Emona Telecoms-Trainer 101 Lab Manual, Volume 1) and *Further Experiments in Modern Analog and Digital Telecommunications* (Volume 2), Emona Instruments Pty Ltd. Term 1 Exp 1–7 = Emona Vol. 1 Exp 4–10; Term 2 = Emona Vol. 1 Exp 11–13 and 15–19, and Vol. 2 Exp 6, 8, 9, 16 and 17.

---

## For maintainers: releasing an update

1. Make the change, and write what changed in `.github/release-whatsnew.md`.
2. Raise `"version"` in `package.json` (for example `0.26.0` → `0.27.0`) and push to `main`.
   You can do this on github.com: open `package.json`, press the pencil icon, edit the number, and **Commit changes**.
3. The **Release** workflow starts by itself. In about 10–15 minutes the release is published: installed Windows apps update themselves and Mac apps show a notice.

Every release page starts with the beta / non-commercial notice from `.github/release-notice.md`, followed by `.github/release-whatsnew.md`.

Pushes that don't change the version don't make a release. You can also start one by hand: **Actions → Release → Run workflow**.

### Local development

```bash
npm install
npm start            # build the page and open the app
node build.mjs       # just build dist/index.html (open it in a browser)
npm test             # setup and book checks (the simulation against the lab books)
npm run test:e2e     # interface tests in Chromium (needs Playwright)
npm run test:monkey  # 3000 random actions looking for errors
npm run test:scope   # oscilloscope checks against the UTD2102CEL manual (writes docs/scope-check.md)
```

## Repository layout

- `src/`: simulator engine (`src/engine`) and UI (`src/ui`).
- `setups/`: ready-made OPEN SETUP files for every experiment in the lab books.
- `tools/`: setup generator and verification scripts.
- `electron/`: desktop app shell and auto-updater.
- `SPEC.md`: the model specification, with sources.
