# Focus Tracker

A short-goal tracker that lives entirely in your browser. Set a goal, log daily progress, earn your reward.

## Features

- Set a goal with a start date, end date, and a reward
- Binary daily progress logging — click a day to mark it done
- 2-month calendar view: green for logged on the day, red for backdated entries
- All state in the browser — no account, no server
- Share link encodes your full goal state into the URL

## Hosting

Serve the project root from any static host:

- **GitHub Pages** — push to a `gh-pages` branch or configure Pages from `main`
- **Netlify** — drag and drop the project folder at netlify.com/drop
- **Local** — `npx serve .` or `python3 -m http.server 8080`

## Development

No build step required. Edit files and refresh the browser.

```bash
npx serve .
# Open http://localhost:3000
```

## File structure

```
index.html          Entry point
style.css           Mint/pastel dark theme
app.js              Bootstrap: loads state, mounts app
modules/
  goal.js           Pure data model and calendar helpers
  state.js          localStorage and URL hash persistence
  ui.js             DOM rendering (no framework)
```

## Future features to implement:
- [ ] Sub-goals for a goal: A TODO-list where you can add things during creation and after the fact. Should be checked/unchecked. Tracking should show how much progress you've made (50% if 1/2 subgoals are reached).
- [ ] Immediately go to success screen and go with normal archive flow once all goals have been reached

