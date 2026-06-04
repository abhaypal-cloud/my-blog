// --- THE JOURNAL FRONTEND APPLICATION LOGIC ---

// Configuration
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '/api'
  : 'https://YOUR-RENDER-BACKEND-URL.onrender.com/api';

// State Management
let state = {
  posts: [],
  currentFilterTag: null,
  activeTab: 'write' // 'write' or 'preview'
};

// DOM Elements Cache
const el = {
  viewHome: document.getElementById('view-home'),
  viewRead: document.getElementById('view-read'),
  viewEditor: document.getElementById('view-editor'),
  postsContainer: document.getElementById('posts-list-container'),
  tagsFilterContainer: document.getElementById('home-tags-filter'),
  themeToggleBtn: document.getElementById('theme-toggle'),
  toast: document.getElementById('toast'),
  
  // Read View Elements
  readDate: document.getElementById('read-post-date'),
  readTime: document.getElementById('read-post-time'),
  readTitle: document.getElementById('read-post-title'),
  readTags: document.getElementById('read-post-tags'),
  readBody: document.getElementById('read-post-body'),
  btnEdit: document.getElementById('btn-edit-post'),
  btnDelete: document.getElementById('btn-delete-post'),
  
  // Editor View Elements
  editorTitle: document.getElementById('editor-view-title'),
  editorForm: document.getElementById('editor-form'),
  postIdInput: document.getElementById('edit-post-id'),
  postTitleInput: document.getElementById('post-title'),
  postExcerptInput: document.getElementById('post-excerpt'),
  postTagsInput: document.getElementById('post-tags-input'),
  postContentInput: document.getElementById('post-content'),
  editorPreview: document.getElementById('editor-preview'),
  btnTabWrite: document.getElementById('btn-tab-write'),
  btnTabPreview: document.getElementById('btn-tab-preview'),
  btnSavePost: document.getElementById('btn-save-post')
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initRouter();
  initFormListeners();
  initEditorTabs();
  
  // Initialize Feather Icons for static templates
  if (typeof feather !== 'undefined') {
    feather.replace();
  }
});

// --- CLIENT-SIDE ROUTER ---
function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  // Run router on first load
  handleRoute();
}

function handleRoute() {
  const hash = window.location.hash || '#home';
  
  // Reset tabs when changing routes
  switchEditorTab('write');

  if (hash === '#home' || hash === '') {
    navigateToView('home');
    loadAndRenderHome();
  } else if (hash === '#new') {
    navigateToView('editor');
    setupNewPostForm();
  } else if (hash.startsWith('#post/')) {
    const id = hash.split('/')[1];
    navigateToView('read');
    loadAndRenderPost(id);
  } else if (hash.startsWith('#edit/')) {
    const id = hash.split('/')[1];
    navigateToView('editor');
    setupEditPostForm(id);
  }
}

function navigateToView(viewName) {
  // Hide all views
  el.viewHome.classList.add('hidden');
  el.viewRead.classList.add('hidden');
  el.viewEditor.classList.add('hidden');
  
  // Show target view
  if (viewName === 'home') el.viewHome.classList.remove('hidden');
  if (viewName === 'read') el.viewRead.classList.remove('hidden');
  if (viewName === 'editor') el.viewEditor.classList.remove('hidden');
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// --- API ACTIONS ---

async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Something went wrong');
    }
    
    return await response.json();
  } catch (error) {
    showToast(error.message, 'danger');
    throw error;
  }
}

// --- VIEW CONTROLLERS ---

// Home View
async function loadAndRenderHome() {
  el.postsContainer.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Gathering notes...</p>
    </div>
  `;
  
  try {
    const posts = await apiRequest('/posts');
    state.posts = posts;
    renderTagsFilter();
    renderPostsList();
  } catch (error) {
    el.postsContainer.innerHTML = `
      <div class="loading-state">
        <p class="error-message">Could not load notes. Please try again later.</p>
      </div>
    `;
  }
}

function renderTagsFilter() {
  // Extract all unique tags
  const tagsSet = new Set();
  state.posts.forEach(post => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => tagsSet.add(tag.trim()));
    }
  });
  
  const tags = Array.from(tagsSet);
  
  if (tags.length === 0) {
    el.tagsFilterContainer.innerHTML = `<span class="text-muted">No tags found.</span>`;
    return;
  }
  
  let html = `<button class="tag-badge ${!state.currentFilterTag ? 'active' : ''}" onclick="filterByTag(null)">All</button>`;
  
  tags.forEach(tag => {
    const activeClass = state.currentFilterTag === tag ? 'active' : '';
    html += `<button class="tag-badge ${activeClass}" onclick="filterByTag('${tag}')">${tag}</button>`;
  });
  
  el.tagsFilterContainer.innerHTML = html;
}

window.filterByTag = function(tag) {
  state.currentFilterTag = tag;
  
  // Re-render tags selection and lists
  renderTagsFilter();
  renderPostsList();
};

function renderPostsList() {
  const filteredPosts = state.currentFilterTag 
    ? state.posts.filter(p => p.tags && p.tags.includes(state.currentFilterTag))
    : state.posts;
    
  if (filteredPosts.length === 0) {
    el.postsContainer.innerHTML = `
      <div class="loading-state">
        <p>No notes found here yet.</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  filteredPosts.forEach(post => {
    const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    
    const tagsHtml = post.tags && post.tags.length > 0
      ? `<div class="post-card-tags">` + post.tags.map(t => `<span class="post-card-tag">${t}</span>`).join('') + `</div>`
      : '';

    html += `
      <article class="post-card" onclick="window.location.hash = '#post/${post.id}'">
        <div class="post-card-meta">
          <span>${formattedDate}</span>
          <span class="meta-dot">•</span>
          <span>${post.readingTime}</span>
        </div>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.excerpt)}</p>
        ${tagsHtml}
      </article>
    `;
  });
  
  el.postsContainer.innerHTML = html;
}

// Read View
async function loadAndRenderPost(id) {
  try {
    const post = await apiRequest(`/posts/${id}`);
    
    // Set text contents
    const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    el.readDate.textContent = formattedDate;
    el.readTime.textContent = post.readingTime;
    el.readTitle.textContent = post.title;
    
    // Set tags
    el.readTags.innerHTML = post.tags && post.tags.length > 0
      ? post.tags.map(t => `<span class="post-tag">${escapeHtml(t)}</span>`).join('')
      : '';
      
    // Parse Markdown safely
    if (typeof marked !== 'undefined') {
      el.readBody.innerHTML = marked.parse(post.content);
    } else {
      el.readBody.innerHTML = `<p>${escapeHtml(post.content).replace(/\n/g, '<br>')}</p>`;
    }
    
    // Setup Action Buttons
    el.btnEdit.onclick = () => window.location.hash = `#edit/${post.id}`;
    el.btnDelete.onclick = () => confirmDeletePost(post.id);
    
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  } catch (error) {
    el.readBody.innerHTML = `<p class="error-message">Could not load post content.</p>`;
  }
}

async function confirmDeletePost(id) {
  if (confirm("Are you sure you want to delete this note forever?")) {
    try {
      await apiRequest(`/posts/${id}`, { method: 'DELETE' });
      showToast("Note deleted successfully.");
      window.location.hash = '#home';
    } catch (error) {
      // API error handler toasts automatically
    }
  }
}

// Editor View
function setupNewPostForm() {
  el.editorTitle.textContent = "New Note";
  el.btnSavePost.textContent = "Save Note";
  el.postIdInput.value = "";
  el.editorForm.reset();
  el.editorPreview.innerHTML = `<p class="preview-placeholder">Nothing to preview yet.</p>`;
}

async function setupEditPostForm(id) {
  el.editorTitle.textContent = "Edit Note";
  el.btnSavePost.textContent = "Save Note";
  
  try {
    const post = await apiRequest(`/posts/${id}`);
    el.postIdInput.value = post.id;
    el.postTitleInput.value = post.title;
    el.postExcerptInput.value = post.excerpt || '';
    el.postTagsInput.value = post.tags ? post.tags.join(', ') : '';
    el.postContentInput.value = post.content;
    
    // Update preview if switching to preview tab
    if (typeof marked !== 'undefined') {
      el.editorPreview.innerHTML = marked.parse(post.content || '');
    }
  } catch (error) {
    window.location.hash = '#home';
  }
}

function initFormListeners() {
  el.editorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = el.postIdInput.value;
    const title = el.postTitleInput.value.trim();
    const excerpt = el.postExcerptInput.value.trim();
    const content = el.postContentInput.value;
    
    // Parse tags: split by comma, trim whitespace, filter empty tags
    const tags = el.postTagsInput.value
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
      
    const payload = { title, excerpt, content, tags };
    
    try {
      if (id) {
        // Edit Mode
        const updated = await apiRequest(`/posts/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast("Note saved successfully.");
        window.location.hash = `#post/${updated.id}`;
      } else {
        // Create Mode
        const created = await apiRequest('/posts', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast("Note saved successfully!");
        window.location.hash = `#post/${created.id}`;
      }
    } catch (error) {
      // Handled in apiRequest
    }
  });
}

// Write/Preview Tabs
function initEditorTabs() {
  el.btnTabWrite.addEventListener('click', () => switchEditorTab('write'));
  el.btnTabPreview.addEventListener('click', () => switchEditorTab('preview'));
}

function switchEditorTab(tab) {
  state.activeTab = tab;
  
  if (tab === 'write') {
    el.btnTabWrite.classList.add('active');
    el.btnTabPreview.classList.remove('active');
    el.postContentInput.classList.remove('hidden');
    el.editorPreview.classList.add('hidden');
  } else {
    el.btnTabWrite.classList.remove('active');
    el.btnTabPreview.classList.add('active');
    el.postContentInput.classList.add('hidden');
    el.editorPreview.classList.remove('hidden');
    
    // Parse content
    const content = el.postContentInput.value.trim();
    if (content) {
      if (typeof marked !== 'undefined') {
        el.editorPreview.innerHTML = marked.parse(content);
      } else {
        el.editorPreview.innerHTML = `<p>${escapeHtml(content).replace(/\n/g, '<br>')}</p>`;
      }
    } else {
      el.editorPreview.innerHTML = `<p class="preview-placeholder">Nothing to preview yet.</p>`;
    }
  }
}

// --- THEME MANAGEMENT (LIGHT/DARK) ---
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  
  el.themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    }
  });
}

// --- UI HELPERS ---

function showToast(message, type = 'success') {
  el.toast.textContent = message;
  
  // Style according to type
  if (type === 'danger') {
    el.toast.style.borderLeftColor = 'var(--danger-color)';
  } else {
    el.toast.style.borderLeftColor = 'var(--primary-color)';
  }
  
  el.toast.classList.remove('hidden');
  
  // Slide out after 3 seconds
  setTimeout(() => {
    el.toast.classList.add('hidden');
  }, 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return str.replace(/[&<>"']/g, function(m) { return map[m]; });
}
