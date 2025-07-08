// Feed management

const POSTS_KEY = 'twistly-posts';
const REACTIONS_EMOJIS = ['❤️', '🔥', '😂', '😍', '😮', '👏'];

// Load all posts from localStorage
function loadPosts() {
  const postsStr = localStorage.getItem(POSTS_KEY);
  if (!postsStr) return [];
  let posts = JSON.parse(postsStr);

  // Filter out expired posts (older than 24h)
  const now = Date.now();
  posts = posts.filter(p => now - p.createdAt < 24 * 60 * 60 * 1000);

  // Save filtered back (cleanup)
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  return posts.sort((a, b) => b.createdAt - a.createdAt);
}

// Save posts back
function savePosts(posts) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

// Render the entire feed
function renderFeed() {
  const feedSection = document.getElementById('feed-section');
  if (!feedSection) return;

  const posts = loadPosts();

  if (posts.length === 0) {
    feedSection.innerHTML = `<p style="text-align:center; color:#d996c6; margin-top:2rem;">
      No posts yet. Upload something to get started!
    </p>`;
    return;
  }

  feedSection.innerHTML = '';
  posts.forEach(post => {
    const postElem = createPostElement(post);
    feedSection.appendChild(postElem);
  });
}

// Create a post DOM element
function createPostElement(post) {
  const user = getUserByEmail(post.authorEmail);

  const div = document.createElement('div');
  div.classList.add('post');
  div.dataset.postId = post.id;

  // Header
  const header = document.createElement('div');
  header.classList.add('post-header');

  const pfpImg = document.createElement('img');
  pfpImg.src = user?.pfp || 'https://i.pravatar.cc/150?u=' + encodeURIComponent(post.authorEmail);
  pfpImg.alt = 'User PFP';

  const usernameSpan = document.createElement('span');
  usernameSpan.classList.add('username');
  usernameSpan.textContent = user?.username || 'Unknown';

  header.appendChild(pfpImg);
  header.appendChild(usernameSpan);

  div.appendChild(header);

  // Media (image or video)
  if (post.type === 'image') {
    const img = document.createElement('img');
    img.classList.add('post-image');
    img.src = post.url;
    img.alt = 'Post image';
    div.appendChild(img);
  } else if (post.type === 'video') {
    const video = document.createElement('video');
    video.classList.add('post-video');
    video.src = post.url;
    video.controls = true;
    div.appendChild(video);
  }

  // Expiration timer
  const timer = document.createElement('div');
  timer.style.fontSize = '0.9rem';
  timer.style.color = '#ff99dd';
  timer.style.marginTop = '0.3rem';
  updateExpirationTimer(timer, post.createdAt);
  div.appendChild(timer);

  // Update timer every minute
  const timerInterval = setInterval(() => {
    if (!updateExpirationTimer(timer, post.createdAt)) {
      clearInterval(timerInterval);
      // Post expired - re-render feed
      renderFeed();
    }
  }, 60000);

  // Reactions
  const reactionsDiv = document.createElement('div');
  reactionsDiv.classList.add('reactions');

  REACTIONS_EMOJIS.forEach(emoji => {
    const btn = document.createElement('button');
    btn.classList.add('reaction-btn');
    btn.textContent = emoji;

    const countSpan = document.createElement('span');
    countSpan.classList.add('reaction-count');
    countSpan.textContent = getReactionCount(post, emoji);
    btn.appendChild(countSpan);

    btn.onclick = () => {
      toggleReaction(post.id, emoji);
    };

    reactionsDiv.appendChild(btn);
  });

  div.appendChild(reactionsDiv);

  // Comments section
  const commentsDiv = document.createElement('div');
  commentsDiv.classList.add('comments');

  // Show existing comments
  post.comments.forEach(comment => {
    const c = document.createElement('div');
    c.classList.add('comment');
    c.innerHTML = `<strong>${escapeHtml(comment.username)}:</strong> <span class="comment-text">${escapeHtml(comment.text)}</span>`;
    commentsDiv.appendChild(c);
  });

  // Add comment form
  const commentForm = document.createElement('form');
  commentForm.classList.add('comment-form');

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Add a comment...';
  input.required = true;

  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.textContent = 'Post';

  commentForm.appendChild(input);
  commentForm.appendChild(btn);

  commentForm.onsubmit = e => {
    e.preventDefault();
    addComment(post.id, input.value);
    input.value = '';
    renderFeed();
  };

  commentsDiv.appendChild(commentForm);
  div.appendChild(commentsDiv);

  return div;
}

// Escape HTML to prevent injection
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, function (m) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m];
  });
}

// Update and display expiration timer; returns false if expired
function updateExpirationTimer(elem, createdAt) {
  const now = Date.now();
  const diff = 24 * 60 * 60 * 1000 - (now - createdAt);
  if (diff <= 0) {
    elem.textContent = 'Expired';
    return false;
  }
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  elem.textContent = `Expires in ${hours}h ${mins}m`;
  return true;
}

// Get user by email
function getUserByEmail(email) {
  const users = JSON.parse(localStorage.getItem('twistly-users') || '[]');
  return users.find(u => u.email === email) || null;
}

// Get reaction count for a post and emoji
function getReactionCount(post, emoji) {
  if (!post.reactions) return 0;
  return Object.values(post.reactions).filter(r => r === emoji).length;
}

// Toggle reaction for current user
function toggleReaction(postId, emoji) {
  const posts = loadPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  const user = getCurrentUser();
  if (!user) {
    alert('You must be logged in to react.');
    return;
  }

  post.reactions = post.reactions || {};
  if (post.reactions[user.email] === emoji) {
    delete post.reactions[user.email];
  } else {
    post.reactions[user.email] = emoji;
  }
  savePosts(posts);
  renderFeed();
}

// Add comment to post
function addComment(postId, text) {
  const posts = loadPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  const user = getCurrentUser();
  if (!user) {
    alert('You must be logged in to comment.');
    return;
  }

  post.comments = post.comments || [];
  post.comments.push({
    username: user.username,
    text: text.trim(),
    createdAt: Date.now()
  });

  savePosts(posts);
}

// Get current logged in user (from auth.js)
function getCurrentUser() {
  const session = localStorage.getItem('twistly-session');
  if (!session) return null;
  const users = JSON.parse(localStorage.getItem('twistly-users') || '[]');
  return users.find(u => u.email === session) || null;
}

// Initial render
document.addEventListener('DOMContentLoaded', () => {
  renderFeed();
});
