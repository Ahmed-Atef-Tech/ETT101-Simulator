# ETT-101 Simulator

An interactive simulator of the **Emona ETT-101 (Telecoms-Trainer 101)** kit and a **UNI-T UTD2102CEL-style oscilloscope**, made for the first- and second-term communications labs.

## ⬇️ التحميل / Download

**[آخر نسخة / Latest release](https://github.com/Ahmed-Atef-Tech/ETT101-Simulator/releases/latest)**

| الجهاز | الملف |
|---|---|
| Windows 10 / 11 | `ETT101-Simulator-Setup-x.y.z.exe` |
| Mac | `ETT101-Simulator-x.y.z-mac.dmg` |
| ملفات التجارب (OPEN SETUP) | `ETT101-Experiments-Setups.zip` |
| مرجع الموديل والمعادلات | `ETT101-Model-Reference.md` |

ملفات التجارب: فك الـ zip، وجوه البرنامج دوس **OPEN SETUP** واختار التجربة. الفولدرات: `Term1` و `Term2` و `Extra`.

### Windows
1. نزّل ملف الـ Setup وافتحه.
2. لو ظهرت رسالة زرقاء **"Windows protected your PC"**: دوس **More info** ثم **Run anyway**. ده عادي لأن البرنامج مش موقّع بشهادة مدفوعة.
3. **التحديثات أوتوماتيك:** كل ما تفتح البرنامج بيشيّك لوحده، وينزّل النسخة الجديدة في الخلفية، ويتركب أول ما تقفله.

### Mac
1. نزّل ملف الـ `dmg`، افتحه، واسحب البرنامج لفولدر **Applications**.
2. أول مرة بس: افتح البرنامج، ولو ظهرت رسالة إنه من مطوّر مش معروف، روح **System Settings ← Privacy & Security** وانزل لتحت ودوس **Open Anyway**.
3. لما تنزل نسخة جديدة، البرنامج هيقولك ويفتحلك صفحة التحميل.

---

## For maintainers: releasing an update

1. Make the change.
2. Raise `"version"` in `package.json` (for example `0.26.0` → `0.27.0`) and push to `main`.
   You can do this on github.com: open `package.json`, press the pencil icon, edit the number, and **Commit changes**.
3. The **Release** workflow starts by itself. In about 10–15 minutes the release is published: installed Windows apps update themselves and Mac apps show a notice.

Pushes that don't change the version don't make a release. You can also start one by hand: **Actions → Release → Run workflow**.

### Local development

```bash
npm install
npm start            # build the page and open the app
node build.mjs       # just build dist/index.html (open it in a browser)
npm test             # setup and book checks
```

## Repository layout

- `src/`: simulator engine (`src/engine`) and UI (`src/ui`).
- `setups/`: ready-made OPEN SETUP files for every experiment in the lab books.
- `tools/`: setup generator and verification scripts.
- `electron/`: desktop app shell and auto-updater.
- `SPEC.md`: the model specification, with sources.
