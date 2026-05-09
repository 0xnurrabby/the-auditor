<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=2,8,15&height=180&section=header&text=The+Auditor&fontSize=52&fontColor=000000&fontAlignY=38&desc=Farcaster+social+analytics+with+terminal+hacker+aesthetic&descAlignY=58&descSize=14&animation=fadeIn" width="100%"/>

<div align="center">

[![License](https://img.shields.io/badge/MIT-bbf7d0?style=for-the-badge&logoColor=000)](LICENSE)
[![Platform](https://img.shields.io/badge/Farcaster%20Mini%20App-bfdbfe?style=for-the-badge&logoColor=000)]()
[![Tech](https://img.shields.io/badge/JavaScript-fde68a?style=for-the-badge&logoColor=000)]()

</div>

<div align="center">
<i>An earlier standalone version of the Auditor .... Farcaster analytics in a terminal-style interface, served with a Node.js backend.</i>
</div>

---

```
$ The_auditor.exe  [V1.0/ONLINE]
user@auditor:~$ nurrabby
> FETCHING CAST LOGS...
> ANALYZING ENGAGEMENT VECTORS...
> DONE
```

---

## ✦ Features

<div align="center">

| | Feature | What it does |
|:---:|---|---|
| 📊 | Farcaster analytics | Analyzes cast engagement, followers, and activity for any FID or handle |
| 🖥️ | Terminal UI | Hacker/terminal aesthetic with typewriter intro and monospace font |
| 🚀 | Node.js backend | Runs on a local Express server for API proxying |
| 📱 | Farcaster mini app | Configured as a Farcaster mini app with embed meta |

</div>

---

## ✦ Download & Run

**Step 1** .... Clone the repo

```bash
git clone https://github.com/0xnurrabby/the-auditor
cd the-auditor
```

**Step 2** .... Install dependencies and configure

```bash
npm install
# Create a .env file with your Neynar API key
```

**Step 3** .... Start the server

```bash
node server.js
# Open http://localhost:3000
```

---

## ✦ Setup

```
1. Clone the repo
2. Run npm install
3. Create a .env file with:
   NEYNAR_API_KEY=your_neynar_api_key
4. Run node server.js
5. Open http://localhost:3000 in your browser
6. Enter a Farcaster username or FID and click EXECUTE
   (use short username if the full ENS handle is over 20 chars)
```

---

## ✦ Project Structure

```
the-auditor/
  index.html    ->  full app UI with terminal-style layout
  script.js     ->  analytics logic and Neynar API calls
  style.css     ->  terminal theme styles
  server.js     ->  Express server for API proxy
  package.json
  assets/       ->  icons and images
```

---

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=2,8,15&height=100&section=footer&animation=fadeIn" width="100%"/>

<div align="center">MIT License .... built by <a href="https://github.com/0xnurrabby">0xnurrabby</a></div>
