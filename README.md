# 🦖🐾 For Panther — Between Two Skies

## Setup: 3 steps, ~10 minutes total

---

### STEP 1 — Create Firebase (5 min)

1. Go to **https://console.firebase.google.com**
2. Click **"Add project"** → name it `for-panther` → Continue → Create project
3. Click **Firestore Database** in the left menu → **Create database** → **Start in test mode** → pick any location → Enable
4. Click the **gear icon ⚙️** top left → **Project settings**
5. Scroll to **"Your apps"** → click the **web icon `</>`**
6. Name it `for-panther` → Register app
7. You'll see a config block like this:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "for-panther.firebaseapp.com",
  projectId: "for-panther",
  storageBucket: "for-panther.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

8. Open `src/utils/firebase.ts` and replace the 6 `PASTE_YOUR_..._HERE` values with your real values

---

### STEP 2 — Upload to GitHub (2 min)

1. Go to **github.com** → sign in → click **+** → **New repository**
2. Name: `for-panther` · Visibility: **Private** · Click **Create repository**
3. On the new repo page, click **"uploading an existing file"**
4. Extract this ZIP → open the `forpanther` folder → select ALL contents inside → drag to GitHub
5. Click **Commit changes**

---

### STEP 3 — Deploy on Netlify (3 min)

1. Go to **https://netlify.com** → sign up with GitHub
2. **Add new site** → **Import an existing project** → **Deploy with GitHub**
3. Select your `for-panther` repository
4. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **Deploy site**
6. Wait ~2 minutes → your site is live!

---

## Your credentials

- **Your PIN (to enter the studio):** `5425`
- **Panther's link:** `https://YOUR-NETLIFY-URL.netlify.app/?gift=main`
- **WhatsApp message:** already pre-written with the link + PIN inside the app

## How sharing works

When Panther opens his link → the app reads `?gift=main` from the URL → fetches from your Firebase → shows your letters. Works on any phone, any browser, logged in or not.
