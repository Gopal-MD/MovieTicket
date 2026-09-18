# CinePass

CinePass is an offline-first movie ticket management system built with plain HTML, CSS, and JavaScript. It lets cinema staff create QR-based tickets, verify entry, and manage ticket records without a backend.

## Features

- Book movie tickets with customer, show, screen, seat, and pricing details.
- Generate a unique ticket ID and QR code.
- Download or print generated tickets.
- Scan QR codes using a camera or verify tickets by ID.
- Prevent duplicate ticket entry by marking tickets as used.
- View, search, filter, export, and manage ticket records from the dashboard.
- Store ticket data locally in the browser using `localStorage`.

## Run Locally

Because this is a static project, no build step is required.

1. Open the project folder in VS Code.
2. Start a local web server, such as the VS Code Live Server extension, or run:

   ```powershell
   python -m http.server 8000
   ```

3. Open `http://localhost:8000` in a browser.

Opening `index.html` directly also works for most features, but a local server is recommended for camera access and consistent browser behavior.

## Project Structure

| File | Purpose |
| --- | --- |
| `index.html` | Home page and navigation |
| `booking.html` | Ticket booking form and QR ticket generation |
| `scanner.html` | Camera scanner and manual ticket verification |
| `dashboard.html` | Ticket records, filtering, statistics, and export |
| `script.js` | Shared storage helpers, navigation, formatting, and UI utilities |
| `dashboard_logic.js` | Dashboard rendering and ticket management logic |
| `style.css` | Shared CinePass styling and responsive layout |

## Data and Privacy

Ticket records are stored only in the current browser's `localStorage` under the key `cinepass_tickets`. Clearing browser storage or using a different browser/device removes access to those local records.

The QR scanner library and QR generator are loaded from CDN URLs, so an internet connection may be required for those specific features unless the libraries are hosted locally.

## GitHub

Repository: <https://github.com/Gopal-MD/MovieTicket>
