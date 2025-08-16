// Simple client-side demo logic (NO real auth). Data saved to localStorage.

const STORAGE = {
  USERS: 'campuslink_users',
  AUTH: 'campuslink_auth',
  POSTS: 'campuslink_posts'
};

// helpers
function $(sel){return document.querySelector(sel)}
function $all(sel){return Array.from(document.querySelectorAll(sel))}

// --- AUTH helpers ---
function getUsers(){ return JSON.parse(localStorage.getItem(STORAGE.USERS) || '[]') }
function saveUsers(u){ localStorage.setItem(STORAGE.USERS, JSON.stringify(u)) }
function setAuth(user){ localStorage.setItem(STORAGE.AUTH, JSON.stringify(user)) }
function getAuth(){ return JSON.parse(localStorage.getItem(STORAGE.AUTH) || 'null') }
function logout(){ localStorage.removeItem(STORAGE.AUTH); updateAuthButtons(); location.href = 'index.html' }

// initialize example user & posts if empty
(function seed(){
  if(!localStorage.getItem(STORAGE.USERS)){
    saveUsers([{name:'Jane Student', email:'jane@school.edu', bio:'Computer science | 100 level', avatar:''}])
  }
  if(!localStorage.getItem(STORAGE.POSTS)){
    const sample = [
      {id:1, author:'Hostel Market', text:'Selling mini-fridge. Good condition. ₦55,000', likes:12, ts:Date.now()-3600*1000},
      {id:2, author:'Physics 101', text:'Kinematics notes shared — DM for pdf', likes:8, ts:Date.now()-7200*1000}
    ]
    localStorage.setItem(STORAGE.POSTS, JSON.stringify(sample))
  }
})();

// update header auth link text
function updateAuthButtons(){
  const auth = getAuth();
  const authBtns = Array.from(document.querySelectorAll('#authBtn, #authBtnTop, #authBtnProfile, #navProfile, #authBtn'));
  authBtns.forEach(el => {
    if(!el) return;
    if(auth){ el.textContent = (el.id === 'navProfile') ? 'Profile' : 'Logout'; el.href = '#'; el.addEventListener('click', logout) }
    else { if(el.id === 'navProfile'){ el.href = 'login.html' } else { el.href = 'login.html' } el.removeEventListener('click', logout) }
  });
  const authBtnMain = $('#authBtn');
  if(authBtnMain) authBtnMain.textContent = auth ? 'Logout' : 'Login';
}
updateAuthButtons();

// --- SIGNUP ---
const signupForm = $('#signupForm');
if(signupForm){
  signupForm.addEventListener('submit', e=>{
    e.preventDefault();
    const name = $('#fullName').value.trim();
    const email = $('#signupEmail').value.trim().toLowerCase();
    const pw = $('#signupPassword').value;
    if(!name || !email || !pw) return alert('Fill all fields');
    const users = getUsers();
    if(users.find(u=>u.email === email)) return alert('An account with that email exists');
    users.push({name, email, bio:'', avatar:''});
    saveUsers(users);
    alert('Account created. You may login now.');
    location.href = 'login.html';
  })
}

// --- LOGIN ---
const loginForm = $('#loginForm');
if(loginForm){
  loginForm.addEventListener('submit', e=>{
    e.preventDefault();
    const email = $('#loginEmail').value.trim().toLowerCase();
    const pw = $('#loginPassword').value;
    // demo: accept any registered email (no password check)
    const users = getUsers();
    const u = users.find(x => x.email === email);
    if(!u) return alert('User not found. Sign up first.');
    setAuth(u);
    updateAuthButtons();
    location.href = 'index.html';
  })
}

// --- POSTS / FEED ---
function getPosts(){ return JSON.parse(localStorage.getItem(STORAGE.POSTS) || '[]') }
function savePosts(p){ localStorage.setItem(STORAGE.POSTS, JSON.stringify(p)) }

function renderPosts(targetSelector, opts={}){
  const container = document.getElementById(targetSelector);
  if(!container) return;
  const posts = getPosts().slice().sort((a,b)=>b.ts - a.ts);
  container.innerHTML = '';
  posts.forEach(p=>{
    const el = document.createElement('div');
    el.className = 'feed-item';
    el.innerHTML = `
      <strong>${escapeHtml(p.author)}</strong>
      <p>${escapeHtml(p.text)}</p>
      <div class="feed-meta">
        <button class="like-btn" data-id="${p.id}">❤️ <span class="like-count">${p.likes}</span></button>
        <span>${timeAgo(p.ts)}</span>
      </div>
    `;
    container.appendChild(el);
  });

  // attach like listeners
  container.querySelectorAll('.like-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = Number(btn.dataset.id);
      const posts = getPosts().map(x => {
        if(x.id === id) x.likes = (x.likes||0) + 1;
        return x;
      });
      savePosts(posts);
      renderPosts(targetSelector, opts);
    })
  })
}

// Post preview on home
if(document.getElementById('postsPreview')){
  renderPosts('postsPreview');
}

// Feed on community page
if(document.getElementById('feedList')){
  renderPosts('feedList');
}

// Compose new post (community)
const postForm = $('#postForm');
if(postForm){
  postForm.addEventListener('submit', e=>{
    e.preventDefault();
    const text = $('#postText').value.trim();
    if(!text) return;
    const auth = getAuth();
    const author = auth ? auth.name : 'Anonymous';
    const posts = getPosts();
    const id = posts.length ? Math.max(...posts.map(p=>p.id))+1 : 1;
    posts.push({id, author, text, likes:0, ts:Date.now()});
    savePosts(posts);
    $('#postText').value = '';
    renderPosts('feedList');
    alert('Posted to community');
  })
}

// Profile page rendering
function renderProfile(){
  const auth = getAuth();
  const card = $('#profileCard');
  if(!card) return;
  if(!auth){
    card.innerHTML = `<div class="form-card"><h3 class="muted">Not signed in</h3><p>Please <a href="login.html">login</a> to view your profile.</p></div>`;
    return;
  }
  card.innerHTML = `
    <div style="display:flex;gap:16px;align-items:center">
      <div class="profile-avatar">${(auth.name||'U').split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
      <div>
        <h2>${escapeHtml(auth.name)}</h2>
        <p class="bio">${escapeHtml(auth.bio || 'Student')}</p>
        <p class="muted">${escapeHtml(auth.email)}</p>
      </div>
    </div>
  `;

  // load user posts
  const posts = getPosts().filter(p => p.author === auth.name);
  const userPostsContainer = $('#userPosts');
  if(userPostsContainer){
    userPostsContainer.innerHTML = '';
    if(posts.length === 0) userPostsContainer.innerHTML = '<p class="muted">No posts yet.</p>';
    posts.forEach(p=>{
      const el = document.createElement('div');
      el.className = 'post-card';
      el.innerHTML = `<h4>${escapeHtml(p.text)}</h4><div class="muted">${timeAgo(p.ts)} • ${p.likes} likes</div>`;
      userPostsContainer.appendChild(el);
    })
  }
}

// utils
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) }
function timeAgo(ts){
  const s = Math.round((Date.now()-ts)/1000);
  if(s < 60) return s + 's';
  if(s < 3600) return Math.round(s/60)+'m';
  if(s < 86400) return Math.round(s/3600)+'h';
  return Math.round(s/86400)+'d';
}

// load profile on profile page
renderProfile();

// wire up nav auth text & logout
updateAuthButtons();

// smooth scroll for internal anchors (index hero links)
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const target = document.querySelector(a.getAttribute('href'));
    if(target) { e.preventDefault(); target.scrollIntoView({behavior:'smooth'})}
  })
});
