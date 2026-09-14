# Collection Tracker

A simple static dashboard showing contribution progress and the payment schedule. Built with plain HTML/CSS/JS — no build step required.

## Editing the data

Open [script.js](script.js) and update the values at the top of the file:

- `TOTAL_TARGET` — overall fundraising target
- `users` — each contributor's name and amount collected so far
- `paymentSchedule` — payment milestones (dates and labels)

## Publish with GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`.
4. Choose the branch (e.g. `main`) and folder `/ (root)`, then save.
5. Your site will be published at `https://<username>.github.io/<repo-name>/`.

## Preview locally

Just open [index.html](index.html) in a browser, or serve it with:

```bash
npx serve .
```
