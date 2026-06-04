const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'posts.json');

// Ensure data folder and posts.json file exist with default mock data if not
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_POSTS = [
  {
    id: "1",
    title: "Semester 1 Reflection: Transitioning to Web Development",
    excerpt: "Reflections on learning JavaScript, CSS structures, and building my first backend using Node.js and Express.",
    content: "# Semester 1 Reflection: Transitioning to Web Development\n\nStarting my journey as a computer science student, I found the web development landscape incredibly vast and a bit overwhelming at first. There are hundreds of libraries, frameworks, and deployment platforms to choose from.\n\n## What I Learned\n\n1. **Foundations First**: Before reaching for React or Vue, mastering vanilla HTML, CSS, and JavaScript was the best decision. Understanding how the DOM behaves directly helps demystify frontend workflows.\n2. **Backends Aren't Magic**: Setting up a basic server with Node.js and Express made me realize how HTTP requests, routing, and simple file databases interact.\n3. **Simplicity is Key**: The best code is readable, modular, and does only what it needs to do.\n\n## Next Steps\n\nIn Semester 2, I plan to dive deeper into databases (specifically SQLite) and explore responsive mobile-first UI styling. Building small projects like this student blog has been the best way to practice.",
    date: new Date().toISOString(),
    readingTime: "3 min read",
    tags: ["Study", "WebDev", "Reflection"]
  },
  {
    id: "2",
    title: "My Go-To Study Setup for Coding Sessions",
    excerpt: "A summary of the minimalist physical and digital tools I use to stay focused and write code efficiently.",
    content: "# My Go-To Study Setup for Coding Sessions\n\nStaying focused during long coding labs requires an environment with minimal distractions. Here is the simple setup I have curated over the past semester.\n\n## The Physical Setup\n\n- **Clutter-Free Desk**: Only a laptop, a notebook for sketching algorithms, and a bottle of water.\n- **Good Lighting**: Warm natural light during the day, and a soft desk lamp for late-night sessions.\n\n## The Digital Workspace\n\n- **VS Code**: Equipped with extensions like Prettier for formatting and GitLens for version tracking.\n- **Minimalist Browser**: Standard Chrome or Firefox with extension blockers for social media distractions.\n- **Distraction-Free Audio**: Ambient lofi beats or classical instrumental music.\n\n*Keeping my workspace clean keeps my mind clear to solve problems.*",
    date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    readingTime: "2 min read",
    tags: ["Setup", "Productivity", "StudentLife"]
  }
];

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_POSTS, null, 2), 'utf-8');
}

// Helper to read posts
function readPosts() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading posts:", error);
    return [];
  }
}

// Helper to write posts
function writePosts(posts) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error("Error writing posts:", error);
    return false;
  }
}

// --- API ROUTES ---

// GET all posts (sorted by date desc)
app.get('/api/posts', (req, res) => {
  const posts = readPosts();
  // Sort by date descending
  const sorted = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(sorted);
});

// GET single post by ID
app.get('/api/posts/:id', (req, res) => {
  const posts = readPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (post) {
    res.json(post);
  } else {
    res.status(404).json({ error: "Post not found" });
  }
});

// POST create new post
app.post('/api/posts', (req, res) => {
  const { title, excerpt, content, tags } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }

  const posts = readPosts();
  
  // Calculate simple reading time: ~200 words per minute
  const wordCount = content.split(/\s+/).length;
  const minutes = Math.max(1, Math.round(wordCount / 200));
  const readingTime = `${minutes} min read`;

  const newPost = {
    id: Date.now().toString(),
    title,
    excerpt: excerpt || content.substring(0, 150) + "...",
    content,
    date: new Date().toISOString(),
    readingTime,
    tags: Array.isArray(tags) ? tags : []
  };

  posts.push(newPost);
  if (writePosts(posts)) {
    res.status(201).json(newPost);
  } else {
    res.status(500).json({ error: "Failed to save post" });
  }
});

// PUT update existing post
app.put('/api/posts/:id', (req, res) => {
  const { title, excerpt, content, tags } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }

  const posts = readPosts();
  const index = posts.findIndex(p => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: "Post not found" });
  }

  // Calculate reading time
  const wordCount = content.split(/\s+/).length;
  const minutes = Math.max(1, Math.round(wordCount / 200));
  const readingTime = `${minutes} min read`;

  posts[index] = {
    ...posts[index],
    title,
    excerpt: excerpt || content.substring(0, 150) + "...",
    content,
    readingTime,
    tags: Array.isArray(tags) ? tags : posts[index].tags,
    updatedAt: new Date().toISOString()
  };

  if (writePosts(posts)) {
    res.json(posts[index]);
  } else {
    res.status(500).json({ error: "Failed to update post" });
  }
});

// DELETE post by ID
app.delete('/api/posts/:id', (req, res) => {
  const posts = readPosts();
  const index = posts.findIndex(p => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: "Post not found" });
  }

  posts.splice(index, 1);
  if (writePosts(posts)) {
    res.json({ message: "Post deleted successfully" });
  } else {
    res.status(500).json({ error: "Failed to delete post" });
  }
});

// Catch-all route to serve SPA for routing support (if needed, but simple hash router doesn't need this, keeping it for fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
