const API_URL = '/api';
let state = { posts: [], filterTag: null };

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initRouter();
  initForm();
  
  if (typeof feather !== 'undefined') feather.replace();
});

// Router
function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

function handleRoute() {
  const hash = window.location.hash || '#home';
  switchTab('write');

  if (hash === '#home' || hash === '') {
    showView('view-home');
    loadHome();
  } else if (hash === '#new') {
    showView('view-editor');
    setupEditor();
  } else if (hash.startsWith('#post/')) {
    showView('view-read');
    loadPost(hash.split('/')[1]);
  } else if (hash.startsWith('#edit/')) {
    showView('view-editor');
    setupEditor(hash.split('/')[1]);
  }
}

function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  window.scrollTo(0, 0);
}

// APIs & Loaders
async function api(path, options = {}) {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (!res.ok) throw new Error((await res.json()).error || 'API Error');
    return await res.json();
  } catch (err) {
    showToast(err.message);
    throw err;
  }
}

async function loadHome() {
  const container = document.getElementById('posts-list');
  container.innerHTML = '<div class="loading">Loading notes...</div>';
  
  try {
    state.posts = await api('/posts');
    renderTags();
    renderFeed();
  } catch (err) {
    container.innerHTML = '<div class="loading">Failed to load notes.</div>';
  }
}

function renderTags() {
  const tagsContainer = document.getElementById('tags-filter');
  const tags = new Set();
  state.posts.forEach(p => p.tags?.forEach(t => tags.add(t.trim())));
  
  if (tags.size === 0) {
    tagsContainer.innerHTML = '';
    return;
  }

  let html = `<button class="tag ${!state.filterTag ? 'active' : ''}" onclick="filterTag(null)">All</button>`;
  tags.forEach(t => {
    html += `<button class="tag ${state.filterTag === t ? 'active' : ''}" onclick="filterTag('${t}')">${t}</button>`;
  });
  tagsContainer.innerHTML = html;
}

window.filterTag = function(t) {
  state.filterTag = t;
  renderTags();
  renderFeed();
};

function renderFeed() {
  const container = document.getElementById('posts-list');
  const list = state.filterTag ? state.posts.filter(p => p.tags?.includes(state.filterTag)) : state.posts;

  if (list.length === 0) {
    container.innerHTML = '<div class="loading">No notes yet.</div>';
    return;
  }

  container.innerHTML = list.map(p => {
    const date = new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const tags = p.tags?.map(t => `<span class="post-card-tag">${t}</span>`).join('') || '';
    
    // Auto teaser from content
    const teaser = p.content.replace(/[#*`]/g, '').substring(0, 120) + '...';
    
    return `
      <article class="post-card" onclick="window.location.hash = '#post/${p.id}'">
        <div class="post-card-meta">${date}<span class="dot">•</span>${p.readingTime}</div>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(teaser)}</p>
        <div class="post-card-tags">${tags}</div>
      </article>
    `;
  }).join('');
}

async function loadPost(id) {
  const body = document.getElementById('read-body');
  body.innerHTML = 'Loading...';
  
  try {
    const post = await api(`/posts/${id}`);
    document.getElementById('read-title').textContent = post.title;
    document.getElementById('read-date').textContent = new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    document.getElementById('read-time').textContent = post.readingTime;
    document.getElementById('read-tags').innerHTML = post.tags?.map(t => `<span class="post-tag">${escapeHtml(t)}</span>`).join('') || '';
    
    body.innerHTML = typeof marked !== 'undefined' ? marked.parse(post.content) : escapeHtml(post.content);
    
    document.getElementById('btn-edit').onclick = () => window.location.hash = `#edit/${post.id}`;
    document.getElementById('btn-delete').onclick = () => deletePost(post.id);
    
    if (typeof feather !== 'undefined') feather.replace();
  } catch (err) {
    body.innerHTML = 'Error loading post.';
  }
}

async function deletePost(id) {
  if (confirm('Delete this note?')) {
    await api(`/posts/${id}`, { method: 'DELETE' });
    showToast('Note deleted');
    window.location.hash = '#home';
  }
}

// Editor Form
function initForm() {
  document.getElementById('editor-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value;
    const tags = document.getElementById('post-tags').value.split(',').map(t => t.trim()).filter(Boolean);

    const payload = { title, content, tags };
    
    if (id) {
      await api(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Note updated');
    } else {
      const created = await api('/posts', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Note saved');
      window.location.hash = `#post/${created.id}`;
      return;
    }
    window.location.hash = `#post/${id}`;
  });

  document.getElementById('tab-write').onclick = () => switchTab('write');
  document.getElementById('tab-preview').onclick = () => switchTab('preview');
}

function switchTab(tab) {
  const writeBtn = document.getElementById('tab-write');
  const prevBtn = document.getElementById('tab-preview');
  const txt = document.getElementById('post-content');
  const prev = document.getElementById('editor-preview');

  if (tab === 'write') {
    writeBtn.classList.add('active');
    prevBtn.classList.remove('active');
    txt.classList.remove('hidden');
    prev.classList.add('hidden');
  } else {
    writeBtn.classList.remove('active');
    prevBtn.classList.add('active');
    txt.classList.add('hidden');
    prev.classList.remove('hidden');
    
    const content = txt.value.trim();
    prev.innerHTML = content ? (typeof marked !== 'undefined' ? marked.parse(content) : escapeHtml(content)) : 'Nothing to preview.';
  }
}

async function setupEditor(id = '') {
  document.getElementById('editor-title').textContent = id ? 'Edit Note' : 'New Note';
  document.getElementById('btn-save').textContent = id ? 'Save Changes' : 'Save Note';
  document.getElementById('edit-id').value = id;
  document.getElementById('editor-form').reset();
  document.getElementById('editor-preview').innerHTML = '';

  if (id) {
    const post = await api(`/posts/${id}`);
    document.getElementById('post-title').value = post.title;
    document.getElementById('post-tags').value = post.tags ? post.tags.join(', ') : '';
    document.getElementById('post-content').value = post.content;
  }
}

// Utilities
function initTheme() {
  const toggle = document.getElementById('theme-toggle');
  if (localStorage.getItem('theme') === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  
  toggle.addEventListener('click', () => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (dark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    }
  });
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2000);
}

function escapeHtml(str) {
  return str ? str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m])) : '';
}
