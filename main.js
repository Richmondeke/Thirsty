document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // 1. Dynamic Cursor Glow Tracker
  // ==========================================
  const cursorGlow = document.getElementById('cursor-glow');
  window.addEventListener('mousemove', (e) => {
    document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
    document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
  });

  // ==========================================
  // 2. Intersection Observer for Scroll Reveals
  // ==========================================
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  const revealOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, revealOptions);

  revealElements.forEach(element => {
    observer.observe(element);
  });

  // ==========================================
  // 3. User Session State Manager
  // ==========================================
  // Helper to fetch data from LocalStorage
  const getUsers = () => JSON.parse(localStorage.getItem('t999_users')) || [];
  const saveUsers = (users) => localStorage.setItem('t999_users', JSON.stringify(users));
  const getSession = () => JSON.parse(localStorage.getItem('t999_session')) || null;
  const saveSession = (session) => localStorage.setItem('t999_session', JSON.stringify(session));
  const clearSession = () => localStorage.removeItem('t999_session');

  // DOM elements to toggle based on auth
  const rsvpPromoCard = document.getElementById('rsvp-promo-card');
  const userDashboardCard = document.getElementById('user-dashboard-card');
  const navRsvpBtn = document.getElementById('nav-rsvp-btn');
  const headerLogoutBtn = document.getElementById('header-logout-btn');

  // Dashboard specific fields
  const dashWelcomeText = document.getElementById('dash-welcome-text');
  const ticketUserId = document.getElementById('ticket-user-id');
  const ticketUserName = document.getElementById('ticket-user-name');
  const ticketBarcodeId = document.getElementById('ticket-barcode-id');
  const userLeaderboardName = document.getElementById('user-leaderboard-name');
  const profileUsername = document.getElementById('profile-username');
  const profileInstagram = document.getElementById('profile-instagram');
  const profileTwitter = document.getElementById('profile-twitter');
  const profileDiscord = document.getElementById('profile-discord');
  const profileAvatarPreview = document.getElementById('profile-avatar-preview');

  const defaultAvatar = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'><circle cx='50' cy='50' r='50' fill='%23222'/><path d='M50 30a15 15 0 100 30 15 15 0 000-30zM25 80c0-15 15-20 25-20s25 5 25 20' stroke='%23888' stroke-width='4'/></svg>";

  const updateUI = () => {
    const user = getSession();
    
    if (user) {
      // User is Logged In
      if (rsvpPromoCard) rsvpPromoCard.style.display = 'none';
      if (userDashboardCard) userDashboardCard.style.display = 'block';
      if (headerLogoutBtn) headerLogoutBtn.style.display = 'inline-block';
      
      if (navRsvpBtn) {
        navRsvpBtn.textContent = 'Dashboard';
        navRsvpBtn.href = '#tickets';
      }

      // Update Dashboard contents
      if (dashWelcomeText) dashWelcomeText.textContent = `Welcome, ${user.username}`;
      if (ticketUserId) ticketUserId.textContent = user.thirstyclub_id;
      if (ticketUserName) ticketUserName.textContent = user.username;
      if (ticketBarcodeId) ticketBarcodeId.textContent = user.thirstyclub_id;
      if (userLeaderboardName) userLeaderboardName.textContent = user.username;

      // Update Profile Inputs
      if (profileUsername) profileUsername.value = user.username;
      if (profileInstagram) profileInstagram.value = user.socials?.instagram || '';
      if (profileTwitter) profileTwitter.value = user.socials?.twitter || '';
      if (profileDiscord) profileDiscord.value = user.socials?.discord || '';
      if (profileAvatarPreview) {
        profileAvatarPreview.src = user.profilePic || defaultAvatar;
      }
    } else {
      // User is Logged Out
      if (rsvpPromoCard) rsvpPromoCard.style.display = 'block';
      if (userDashboardCard) userDashboardCard.style.display = 'none';
      if (headerLogoutBtn) headerLogoutBtn.style.display = 'none';
      
      if (navRsvpBtn) {
        navRsvpBtn.textContent = 'RSVP';
        navRsvpBtn.href = '#tickets';
      }
    }
  };

  // ==========================================
  // 4. RSVP Dialog & Auth Modal Management
  // ==========================================
  const modal = document.getElementById('ticket-modal');
  const openAuthBtn = document.getElementById('open-auth-btn');
  const navRsvpBtnClick = document.getElementById('nav-rsvp-btn');
  const heroCtaBtn = document.getElementById('hero-cta-btn');
  const closeModalBtn = document.querySelector('.close-modal');

  const openAuthModal = () => {
    const session = getSession();
    if (session) {
      // If logged in, navigate straight to tickets/dashboard section
      document.getElementById('tickets').scrollIntoView({ behavior: 'smooth' });
    } else if (modal) {
      modal.showModal();
    }
  };

  if (openAuthBtn) openAuthBtn.addEventListener('click', openAuthModal);
  if (navRsvpBtnClick) navRsvpBtnClick.addEventListener('click', (e) => {
    const session = getSession();
    if (!session) {
      e.preventDefault();
      openAuthModal();
    }
  });
  if (heroCtaBtn) heroCtaBtn.addEventListener('click', (e) => {
    const session = getSession();
    if (!session) {
      e.preventDefault();
      openAuthModal();
    }
  });

  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => modal.close());
  }

  // Close modal on backdrop click
  if (modal) {
    modal.addEventListener('click', (e) => {
      const rect = modal.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        modal.close();
      }
    });
  }

  // Modal Auth Tabs switching
  const tabLoginBtn = document.getElementById('auth-login-tab-btn');
  const tabSignupBtn = document.getElementById('auth-signup-tab-btn');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const switchToSignup = document.getElementById('switch-to-signup');
  const switchToLogin = document.getElementById('switch-to-login');

  const showLoginForm = () => {
    if (tabLoginBtn) tabLoginBtn.classList.add('active');
    if (tabSignupBtn) tabSignupBtn.classList.remove('active');
    if (loginForm) loginForm.style.display = 'block';
    if (signupForm) signupForm.style.display = 'none';
  };

  const showSignupForm = () => {
    if (tabSignupBtn) tabSignupBtn.classList.add('active');
    if (tabLoginBtn) tabLoginBtn.classList.remove('active');
    if (signupForm) signupForm.style.display = 'block';
    if (loginForm) loginForm.style.display = 'none';
  };

  if (tabLoginBtn) tabLoginBtn.addEventListener('click', showLoginForm);
  if (tabSignupBtn) tabSignupBtn.addEventListener('click', showSignupForm);
  if (switchToSignup) switchToSignup.addEventListener('click', showSignupForm);
  if (switchToLogin) switchToLogin.addEventListener('click', showLoginForm);

  // ==========================================
  // 5. Auth Handlers (Signup / Login)
  // ==========================================
  
  // Helper to generate a unique 4-digit Thirsty999ID
  const generateThirstyID = () => {
    const users = getUsers();
    let uniqueId = '';
    let isUnique = false;
    
    while (!isUnique) {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      uniqueId = `T999-${randNum}`;
      isUnique = !users.some(u => u.thirstyclub_id === uniqueId);
    }
    return uniqueId;
  };

  // Sign Up Submit
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const username = document.getElementById('signup-username').value.trim();
      const email = document.getElementById('signup-email').value.trim().toLowerCase();
      const password = document.getElementById('signup-password').value;

      const users = getUsers();

      // Validate email format and check existing accounts
      if (users.some(u => u.email === email)) {
        alert("An account with this email address already exists.");
        return;
      }

      if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        alert("This username is already taken.");
        return;
      }

      // Generate ID & Create User
      const thirstyclub_id = generateThirstyID();
      const newUser = {
        username,
        email,
        password,
        thirstyclub_id,
        profilePic: '',
        socials: { instagram: '', twitter: '', discord: '' }
      };

      users.push(newUser);
      saveUsers(users);
      saveSession(newUser);

      alert(`Registration Successful!\n\nYour unique ID is: ${thirstyclub_id}\n\nPlease save this ID. You can use it to login along with your password.`);
      
      modal.close();
      signupForm.reset();
      updateUI();
      document.getElementById('tickets').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Login Submit
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const loginId = document.getElementById('login-id').value.trim().toLowerCase();
      const password = document.getElementById('login-password').value;

      const users = getUsers();
      
      // Match ID or Email
      const matchedUser = users.find(u => 
        (u.thirstyclub_id.toLowerCase() === loginId || u.email === loginId) && 
        u.password === password
      );

      if (!matchedUser) {
        alert("Invalid Thirsty999ID/Email or Password.");
        return;
      }

      saveSession(matchedUser);
      modal.close();
      loginForm.reset();
      updateUI();
      document.getElementById('tickets').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Logout actions
  const handleLogout = () => {
    clearSession();
    updateUI();
    window.location.hash = ''; // Clear hash navigation
  };

  if (headerLogoutBtn) headerLogoutBtn.addEventListener('click', handleLogout);
  const dashLogoutBtn = document.getElementById('dash-logout-btn');
  if (dashLogoutBtn) dashLogoutBtn.addEventListener('click', handleLogout);

  // ==========================================
  // 6. User Dashboard Tab Switching
  // ==========================================
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
  });

  // ==========================================
  // 7. Profile Edits & Avatar Storage
  // ==========================================
  const profileForm = document.getElementById('profile-form');
  const avatarFileInput = document.getElementById('avatar-file-input');

  // Handle avatar upload converting to Base64
  if (avatarFileInput && profileAvatarPreview) {
    avatarFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate size < 2MB
      if (file.size > 2 * 1024 * 1024) {
        alert("File size exceeds 2MB limit. Please upload a smaller image.");
        avatarFileInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        profileAvatarPreview.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Handle Profile Form Submit
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const user = getSession();
      if (!user) return;

      const newUsername = document.getElementById('profile-username').value.trim();
      const instagram = document.getElementById('profile-instagram').value.trim();
      const twitter = document.getElementById('profile-twitter').value.trim();
      const discord = document.getElementById('profile-discord').value.trim();
      const profilePic = profileAvatarPreview.src;

      const users = getUsers();

      // Check if username is taken by anyone else
      const usernameTaken = users.some(u => 
        u.thirstyclub_id !== user.thirstyclub_id && 
        u.username.toLowerCase() === newUsername.toLowerCase()
      );

      if (usernameTaken) {
        alert("This username is already taken by another user.");
        return;
      }

      // Update user details in storage
      const userIndex = users.findIndex(u => u.thirstyclub_id === user.thirstyclub_id);
      
      const updatedUser = {
        ...user,
        username: newUsername,
        profilePic: profilePic,
        socials: { instagram, twitter, discord }
      };

      if (userIndex !== -1) {
        users[userIndex] = updatedUser;
        saveUsers(users);
      }
      
      saveSession(updatedUser);
      alert("Profile updated successfully!");
      updateUI();
    });
  }

  // ==========================================
  // 8. Lineup View Toggle
  // ==========================================
  const lineupToggleBtn = document.getElementById('lineup-toggle-btn');
  const marqueeWrapper = document.getElementById('marquee-wrapper');
  const staticLineupContainer = document.getElementById('static-lineup-container');

  if (lineupToggleBtn && marqueeWrapper && staticLineupContainer) {
    lineupToggleBtn.addEventListener('click', () => {
      const isStatic = staticLineupContainer.style.display === 'block';
      if (isStatic) {
        // Switch back to scrolling
        staticLineupContainer.style.display = 'none';
        marqueeWrapper.style.display = 'block';
        lineupToggleBtn.textContent = 'View Full Lineup';
      } else {
        // Switch to static lineup grid
        staticLineupContainer.style.display = 'block';
        marqueeWrapper.style.display = 'none';
        lineupToggleBtn.textContent = 'Scroll Lineup';
      }
    });
  }

  // ==========================================
  // 9. Past Editions Gallery Lightbox Interactivity
  // ==========================================
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCloseBtn = document.querySelector('.lightbox-close');
  const lightboxPrevBtn = document.querySelector('.lightbox-nav.prev');
  const lightboxNextBtn = document.querySelector('.lightbox-nav.next');
  const lightboxCurrentSpan = document.getElementById('lightbox-current');

  let currentGalleryIndex = 0;
  const totalGalleryItems = galleryItems.length;

  const updateLightboxImage = (index) => {
    if (index < 0 || index >= totalGalleryItems) return;
    currentGalleryIndex = index;
    const targetItem = galleryItems[index];
    const imgSrc = targetItem.getAttribute('data-src');
    
    if (lightboxImg) {
      lightboxImg.src = imgSrc;
    }
    if (lightboxCurrentSpan) {
      lightboxCurrentSpan.textContent = currentGalleryIndex + 1;
    }
  };

  const openLightbox = (index) => {
    if (lightbox) {
      updateLightboxImage(index);
      lightbox.showModal();
    }
  };

  const closeLightbox = () => {
    if (lightbox) {
      lightbox.close();
      if (lightboxImg) lightboxImg.src = ''; // Clear source to stop load
    }
  };

  const showNextImage = () => {
    let nextIndex = currentGalleryIndex + 1;
    if (nextIndex >= totalGalleryItems) {
      nextIndex = 0; // Loop back to start
    }
    updateLightboxImage(nextIndex);
  };

  const showPrevImage = () => {
    let prevIndex = currentGalleryIndex - 1;
    if (prevIndex < 0) {
      prevIndex = totalGalleryItems - 1; // Loop to end
    }
    updateLightboxImage(prevIndex);
  };

  // Add click listeners to gallery items
  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      openLightbox(index);
    });
  });

  // Controls listeners
  if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
  if (lightboxPrevBtn) lightboxPrevBtn.addEventListener('click', showPrevImage);
  if (lightboxNextBtn) lightboxNextBtn.addEventListener('click', showNextImage);

  // Close lightbox on backdrop click
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      // If click target is the dialog itself (backdrop), close it
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
  }

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (lightbox && lightbox.open) {
      if (e.key === 'ArrowRight') {
        showNextImage();
      } else if (e.key === 'ArrowLeft') {
        showPrevImage();
      } else if (e.key === 'Escape') {
        closeLightbox();
      }
    }
  });

  // ==========================================
  // 10. Initialization
  // ==========================================
  updateUI();
});
