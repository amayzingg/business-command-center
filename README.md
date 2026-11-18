# Business Command Center

A private dashboard for your business, showing revenue, cash, tasks and leads at a
glance, on your phone or computer. **Only you can open it**: it asks for a code sent to
your email.

You don't need to know how to code. You build and change it by chatting with an AI
assistant (**Claude Code** or **OpenAI Codex**) in plain English, e.g. *"Add a widget
showing invoices that are overdue."*

You're reading the **finished starter version** (the `starter` branch). It's ready to use
with sample data, and you swap in your real data later.

## What it costs
- **Cloudflare** (where your dashboard lives online): **free**. To set up the login
  screen, Cloudflare asks for a card to confirm who you are. Pick the **Free** plan and
  you won't be charged.
- **An AI assistant:** Claude Code needs a paid Claude plan (Pro or above), and Codex
  needs a paid ChatGPT plan (Plus or above). You only need one of them.
- **GitHub** (optional, for a backup copy of your project): free.

## Step 0: Install the tools (once, about 15 minutes)
Install these four things. Accept the default options in each installer.

| Tool | What it is | Get it |
|---|---|---|
| **An AI assistant** | Does the work for you | **Claude desktop app** (easiest; use its **Code** tab): https://claude.ai/download · or **Codex**: https://developers.openai.com/codex |
| **Node.js** (the "LTS" version) | Runs the dashboard on your computer | https://nodejs.org |
| **Git** | Downloads and keeps track of the project files | Windows: https://git-scm.com/downloads · Mac: open **Terminal** and type `git --version`, then click **Install** when asked |
| **A Cloudflare account** | Puts your dashboard online | https://dash.cloudflare.com/sign-up (then confirm your email) |

**Restart your computer** after installing Node.js and Git, so everything picks them up.

## Step 1: Let your AI assistant set it up (recommended)
1. Make an empty folder for the project, e.g. **Documents → My dashboard**.
2. Open your AI assistant in that folder:
   - **Claude desktop app:** open the **Code** tab → choose that folder.
   - **Codex:** open it and point it at that folder.
3. Paste this message and press Enter:

> I'm not technical. Please set up the Business Command Center dashboard for me in this
> folder:
> 1. Check that Node.js (version 22.12 or newer) and Git are installed. If not, tell me
>    exactly how to install them, then wait.
> 2. Download the project with
>    `git clone https://github.com/amayzingg/business-command-center.git`, go into that
>    folder, and switch to the `starter` branch. From then on, follow its README.md,
>    DEPLOY.md and CLAUDE.md.
> 3. Install it, start it in the background, and open it so I can see the sample dashboard.
> 4. Ask me my business name and colors (or my website, so you can pick them up), and
>    whether I have a logo. Then set them.
> 5. Put it online with Cloudflare and lock it so only my email can open it.
> Before each step, tell me in one sentence what it does. After it, tell me what I should
> see. Whenever I need to click something (signing in, the Cloudflare website), tell me
> exactly what to click and wait for me. Never ask me to paste a password or API key into
> this chat. At the end, tell me my dashboard's web address and how to make changes later.

**What happens next:** the assistant runs the steps and checks in with you. It will ask
permission before running commands. That's normal: approve them (in Claude, click
**Allow**; in Codex, approve the request). You'll need to do three things yourself, and
it will tell you when:
- sign in to Cloudflare in your browser, by clicking **Allow** on the page that opens;
- turn on the login screen in the Cloudflare website (`DEPLOY.md`, step 2);
- later, if you connect real data, enter your API keys (never in the chat).

If something on a website looks different from what it says, take a screenshot, paste it
into the chat and ask what to click.

## Step 2: Make it yours
Just ask, in your own words. For example:
- *"Show me the dashboard."*
- *"Add a widget showing tasks due this week."* More ideas: [`PROMPTS.md`](PROMPTS.md).
- *"Change the colors to match my website, example.com."*
- *"Connect my Google Sheet of leads."* Guides: [`REAL-DATA.md`](REAL-DATA.md),
  [`GOOGLE-SHEETS.md`](GOOGLE-SHEETS.md).
- *"Put my changes online."* (the assistant runs `npm run deploy`)

Changes show up on your computer first. They appear on your online dashboard only after
you ask the assistant to put them online.

**Saving your work:** if you use GitHub, ask *"Save my changes to GitHub."* Otherwise your
project lives only in that folder, so don't delete it.

## Words you'll see
| Word | What it means |
|---|---|
| **Terminal** | A window where you (or your assistant) type commands. Your assistant has one built in. |
| **Clone** | Download a copy of the project from GitHub. |
| **Branch** | A version of the project. `starter` is the finished one you want. |
| **localhost** | A web address that only works on your computer, for previewing, e.g. http://localhost:5173. |
| **Build / deploy** | Package the dashboard / put it online. |
| **Cloudflare Worker** | Your dashboard's home online. It also fetches your real data and sends your weekly email. |
| **workers.dev address** | Your dashboard's web address, e.g. `https://my-dashboard.yourname.workers.dev`. |
| **Cloudflare Access / Zero Trust** | The login screen in front of your dashboard. It emails you a code. |
| **Wrangler** | Cloudflare's tool your assistant uses to put the dashboard online. |
| **API key** | A password that lets your dashboard read data from another service (e.g. Stripe). Keep it secret. |
| **Secret** | An API key stored safely in Cloudflare, where nobody (including your AI) can read it back. |
| **`.dev.vars`** | A file on your computer for test keys. It's never uploaded to GitHub. |

## Doing it yourself (without the assistant running commands)
Prefer to type the commands? Open a terminal: on Windows, **Git Bash** (installed with Git);
on Mac, **Terminal**. Type each command, then press Enter.

1. Download the project (into your home folder) and go into it:
   ```bash
   git clone https://github.com/amayzingg/business-command-center.git
   ```
   ```bash
   cd business-command-center
   ```
   (`cd` means "go into this folder".)
2. Switch to the finished version and install it (takes a minute):
   ```bash
   git switch starter
   ```
   ```bash
   npm install
   ```
3. Start it:
   ```bash
   npm run dev
   ```
   You should see `Local: http://localhost:5173`. Open that address in your browser to
   see the dashboard with sample data. **The terminal stays busy while it runs.** That's
   normal: leave it open, and press **Ctrl+C** in it to stop.
4. To put it online, follow [`DEPLOY.md`](DEPLOY.md).

**Want your own copy on GitHub** (a backup you can sync)? On this repo's GitHub page,
click **Use this template → Create a new repository**, tick **Include all branches**,
choose **Private**, then clone *your* repo's address instead of the one above.

## If something goes wrong
- **"node" or "git" is not recognized / command not found:** it isn't installed, or you
  need to restart your computer after installing it.
- **Windows: "running scripts is disabled on this system":** run the command in **Git Bash**
  instead of PowerShell, or ask your assistant to fix it.
- **Port already in use:** it opens on the next port (5174…). Use the address it prints.
- **A file called `.dev.vars` was saved as `.dev.vars.txt`** (Windows Notepad does this): ask
  your assistant to rename it, or save with "Save as type: All files".
- **Anything else:** copy the error message into the chat and ask your assistant.
  `CHEATSHEET.md` has more fixes.

## For the curious: what's in the folder
```
README.md            this guide
DEPLOY.md            put it online and lock it to your email
REAL-DATA.md         connect real data (bank CSV, Stripe, Google Sheets, weekly email)
GOOGLE-SHEETS.md     connect a private Google Sheet
GOOGLE-ANALYTICS.md  connect Google Search Console and GA4
PROMPTS.md           things to ask your assistant
CHEATSHEET.md        commands and fixes on one page
CLAUDE.md, AGENTS.md instructions your AI assistant reads automatically
src/widgets/         one file per dashboard card
src/brand.json       your business name, colors and logo
src/data/sample.json sample data
worker/              the code that runs online (real data, weekly email)
wrangler.toml        Cloudflare settings
```
Want to watch your assistant build the dashboard from scratch instead? Switch to `main`
and follow its README.
