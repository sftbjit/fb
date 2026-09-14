# Collection Tracker

A simple static dashboard showing contribution progress and the payment schedule. Built with plain HTML/CSS/JS — no build step required.

## Editing the data

Open [script.js](script.js) and update the values at the top of the file:

- `TOTAL_TARGET` — overall fundraising target
- `users` — each contributor's name and amount collected so far
- `paymentSchedule` — payment milestones (dates and labels)

## Daily Sales

The "Daily Sales" tab reads plain-text files from the [sales/](sales) folder, named `DDMMYYYY.txt` (e.g. `14092026.txt` for 14 Sept 2026). Each file should contain:

```
total_sales:4000
net_sales:3000
foodpanda:100
foodi:50
```

- **Single Date** — pick a date and click Load to view that day's figures.
- **Date Range** — pick a from/to date (or click "Last 6 Months") to view a table of all available days in range, with totals.
- Every row also shows a computed **Commission (7%)** column: `(net_sales + foodi + foodpanda) * 7%`.
- Dates with no matching file are skipped in range view and show "No data available" in single-date view.

To add a new day, just drop a new `DDMMYYYY.txt` file into the `sales/` folder and commit/push it.

## Publish with GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`.
4. Choose the branch (e.g. `main`) and folder `/ (root)`, then save.
5. Your site will be published at `https://<username>.github.io/<repo-name>/`.

## Preview locally

The Daily Sales tab uses `fetch()` to load files, which requires an HTTP server (opening `index.html` directly via `file://` will not work for that tab). Serve the folder with:

```bash
npx serve .
```
