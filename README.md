# the journal.

A lightweight, distraction-free minimalist blog site featuring an Express backend API and a premium responsive frontend.

## Features

- **Editorial Minimalist Design**: High-contrast, clean typography pairing Serif headings (Playfair Display) with a modern Sans-serif body (Inter).
- **Responsive & Premium UI**: Muted organic colors, responsive grid layouts, card hover micro-animations, glassmorphic visual headers, and smooth transitions.
- **Light & Dark Theme**: Toggle dark and light modes, defaulting to light mode and persisting user theme preferences.
- **Markdown Support**: Read and write posts using Markdown syntax (headers, lists, blockquotes, bold text, code formatting).
- **Full CRUD Backend API**: A Node.js and Express backend that persists data locally using a lightweight JSON database file (`data/posts.json`).
- **Single Page Application (SPA)**: Ultra-fast navigation using an event-driven client-side Hash Router.
- **Tag Filtering**: Dynamically generated tag filters based on active posts.

## Getting Started

Follow these steps to run the application locally on your machine.

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed (version 14 or higher).

### Installation

1. Open your terminal in the project directory.
2. Install the necessary dependencies:
   ```bash
   npm install
   ```

### Running the Application

Start the Express backend server:
```bash
npm start
```

Once started, the application will output:
```
Server is running at http://localhost:3000
```

Open **[http://localhost:3000](http://localhost:3000)** in your web browser to view the blog.

## API Architecture

The backend implements the following REST endpoints:

- `GET /api/posts` - Returns list of all posts (sorted by date descending).
- `GET /api/posts/:id` - Returns a single post object matching the ID.
- `POST /api/posts` - Creates a new blog post.
- `PUT /api/posts/:id` - Updates an existing blog post.
- `DELETE /api/posts/:id` - Deletes a post.

Data is stored in `data/posts.json` which is created automatically if missing.

## Customization

- **Styling**: Make stylesheet edits inside `public/css/style.css` (custom properties are configured at the `:root` level).
- **Interactive Logic**: Update routing, API triggers, and DOM renders in `public/js/app.js`.
