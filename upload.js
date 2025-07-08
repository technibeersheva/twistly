// Upload page logic

document.addEventListener('DOMContentLoaded', () => {
  const uploadForm = document.getElementById('upload-form');
  const previewContainer = document.getElementById('preview-container');
  const previewMedia = document.getElementById('preview-media');

  let selectedFile = null;
  let selectedType = null;

  // Load current user info to show who is uploading
  const user = getCurrentUser();
  if (!user) {
    alert('Please login first.');
    window.location.href = 'index.html';
    return;
  }

  // File input change
  document.getElementById('file-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) {
      clearPreview();
      return;
    }

    // Only accept images/videos
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('Only images and videos are allowed.');
      e.target.value = '';
      clearPreview();
      return;
    }

    selectedFile = file;
    selectedType = file.type.startsWith('image/') ? 'image' : 'video';

    // Create preview URL
    const url = URL.createObjectURL(file);

    if (selectedType === 'image') {
      previewMedia.innerHTML = `<img src="${url}" alt="Preview" style="max-width:100%; border-radius:15px;" />`;
    } else {
      previewMedia.innerHTML = `<video src="${url}" controls style="max-width:100%; border-radius:15px;"></video>`;
    }

    previewContainer.classList.remove('hidden');
  });

  // Clear preview
  function clearPreview() {
    previewMedia.innerHTML = '';
    previewContainer.classList.add('hidden');
    selectedFile = null;
    selectedType = null;
  }

  // Form submit = upload post
  uploadForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select an image or video to upload.');
      return;
    }

    // Create post object
    const post = {
      id: 'post_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      authorEmail: user.email,
      url: '',
      type: selectedType,
      createdAt: Date.now(),
      reactions: {},
      comments: []
    };

    // Since no backend, simulate upload by using FileReader and storing base64 in localStorage
    const reader = new FileReader();
    reader.onload = function (event) {
      post.url = event.target.result;
      savePost(post);
      alert('Uploaded successfully!');
      clearPreview();
      uploadForm.reset();
      window.location.href = 'feed.html';
    };

    reader.onerror = function () {
      alert('Error reading file.');
    };

    reader.readAsDataURL(selectedFile);
  });
});

// Save new post
function savePost(post) {
  let posts = JSON.parse(localStorage.getItem('twistly-posts') || '[]');
  posts.push(post);
  localStorage.setItem('twistly-posts', JSON.stringify(posts));
}

// Get current logged in user (from auth.js)
function getCurrentUser() {
  const session = localStorage.getItem('twistly-session');
  if (!session) return null;
  const users = JSON.parse(localStorage.getItem('twistly-users') || '[]');
  return users.find(u => u.email === session) || null;
}
