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
  // 3. Supabase Client Integration & Session Manager
  // ==========================================
  const SUPABASE_URL = "https://fftfnikbulfayrrjktuo.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdGZuaWtidWxmYXlycmprdHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNjgxNzgsImV4cCI6MjA5Mjc0NDE3OH0.L8U8_f19ZeMSdqvMgk3h7MHqnm6a_X2wukEPoAgz7qA";
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Global Session State
  let currentSession = null;
  let currentUserProfile = null;
  let currentUserTicket = null;

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
    const session = currentSession;
    const profile = currentUserProfile;
    
    if (session && profile) {
      // User is Logged In
      if (rsvpPromoCard) rsvpPromoCard.style.display = 'none';
      if (userDashboardCard) userDashboardCard.style.display = 'block';
      if (headerLogoutBtn) headerLogoutBtn.style.display = 'inline-block';
      
      if (navRsvpBtn) {
        navRsvpBtn.textContent = 'Dashboard';
        navRsvpBtn.href = '#tickets';
      }

      // Update Dashboard contents
      if (dashWelcomeText) dashWelcomeText.textContent = `Welcome, ${profile.username}`;
      if (ticketUserId) ticketUserId.textContent = profile.thirstyclub_id || 'T999-XXXX';
      if (ticketUserName) ticketUserName.textContent = profile.username;
      if (ticketBarcodeId) ticketBarcodeId.textContent = profile.thirstyclub_id || 'T999-XXXX';
      if (userLeaderboardName) userLeaderboardName.textContent = profile.username;

      // Update Profile Inputs
      if (profileUsername) profileUsername.value = profile.username;
      if (profileInstagram) profileInstagram.value = profile.socials?.instagram || '';
      if (profileTwitter) profileTwitter.value = profile.socials?.twitter || '';
      if (profileDiscord) profileDiscord.value = profile.socials?.discord || '';
      if (profileAvatarPreview) {
        profileAvatarPreview.src = profile.avatar_url || defaultAvatar;
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

  const syncSessionAndProfile = async (session) => {
    currentSession = session;
    if (session) {
      try {
        // Fetch profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          console.error("Error fetching profile:", profileError);
        } else {
          currentUserProfile = profile;
        }

        // Fetch ticket
        const { data: tickets, error: ticketError } = await supabase
          .from('tickets')
          .select('*')
          .eq('user_id', session.user.id);

        if (ticketError) {
          console.error("Error fetching tickets:", ticketError);
        } else if (tickets && tickets.length > 0) {
          currentUserTicket = tickets[0];
        }
      } catch (err) {
        console.error("Error syncing profile:", err);
      }
    } else {
      currentUserProfile = null;
      currentUserTicket = null;
    }
    updateUI();
  };

  // Listen to auth changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    await syncSessionAndProfile(session);
  });

  // ==========================================
  // 4. RSVP Dialog & Auth Modal Management
  // ==========================================
  const modal = document.getElementById('ticket-modal');
  const openAuthBtn = document.getElementById('open-auth-btn');
  const navRsvpBtnClick = document.getElementById('nav-rsvp-btn');
  const heroCtaBtn = document.getElementById('hero-cta-btn');
  const closeModalBtn = document.querySelector('.close-modal');

  const openAuthModal = () => {
    if (currentSession) {
      // If logged in, navigate straight to tickets/dashboard section
      document.getElementById('tickets').scrollIntoView({ behavior: 'smooth' });
    } else if (modal) {
      modal.showModal();
    }
  };

  if (openAuthBtn) openAuthBtn.addEventListener('click', openAuthModal);
  if (navRsvpBtnClick) navRsvpBtnClick.addEventListener('click', (e) => {
    if (!currentSession) {
      e.preventDefault();
      openAuthModal();
    }
  });
  if (heroCtaBtn) heroCtaBtn.addEventListener('click', (e) => {
    if (!currentSession) {
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
  // 5. Supabase Auth Handlers (Signup / Login)
  // ==========================================
  
  // Sign Up Submit
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = signupForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Processing...";
      }
      
      const username = document.getElementById('signup-username').value.trim();
      const email = document.getElementById('signup-email').value.trim().toLowerCase();
      const password = document.getElementById('signup-password').value;

      try {
        // Validate username locally first
        const { data: existingProfiles, error: profileCheckError } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', username);

        if (profileCheckError) {
          throw new Error("Could not check username availability.");
        }

        if (existingProfiles && existingProfiles.length > 0) {
          alert("This username is already taken.");
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Get Thirsty999ID & RSVP";
          }
          return;
        }

        // Sign Up with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username
            }
          }
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          alert("Registration Successful!\n\nYour account is active, and your Thirsty999ID has been generated.");
          modal.close();
          signupForm.reset();
        } else {
          alert("Registration Successful!\n\nPlease check your email inbox to verify your account. Once verified, your unique Thirsty999ID will be generated and you can log in.");
          modal.close();
          signupForm.reset();
        }
      } catch (err) {
        alert("Sign Up Error: " + err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Get Thirsty999ID & RSVP";
        }
      }
    });
  }

  // Login Submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Logging in...";
      }

      const loginId = document.getElementById('login-id').value.trim();
      const password = document.getElementById('login-password').value;

      try {
        let email = loginId.toLowerCase();

        // Check if input is a ThirstyID (T999-XXXX)
        if (loginId.toUpperCase().startsWith("T999-")) {
          // Resolve ThirstyID to Email
          const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('email')
            .eq('thirstyclub_id', loginId.toUpperCase())
            .single();

          if (profileErr || !profile || !profile.email) {
            throw new Error("Invalid Thirsty999ID. Make sure it is spelled correctly.");
          }
          email = profile.email;
        }

        // Authenticate via Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          throw error;
        }

        modal.close();
        loginForm.reset();
      } catch (err) {
        alert("Login Error: " + err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Login";
        }
      }
    });
  }

  // Logout actions
  const handleLogout = async () => {
    await supabase.auth.signOut();
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
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!currentSession) return;

      const submitBtn = profileForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Saving...";
      }

      const newUsername = document.getElementById('profile-username').value.trim();
      const instagram = document.getElementById('profile-instagram').value.trim();
      const twitter = document.getElementById('profile-twitter').value.trim();
      const discord = document.getElementById('profile-discord').value.trim();
      const profilePic = profileAvatarPreview.src;

      try {
        // Check if username is taken by anyone else
        const { data: existingProfiles, error: profileCheckError } = await supabase
          .from('profiles')
          .select('id')
          .neq('id', currentSession.user.id)
          .ilike('username', newUsername);

        if (profileCheckError) {
          throw new Error("Could not check username availability.");
        }

        if (existingProfiles && existingProfiles.length > 0) {
          alert("This username is already taken by another user.");
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Save Profile";
          }
          return;
        }

        // Update profile in Supabase
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            username: newUsername,
            avatar_url: profilePic,
            socials: { instagram, twitter, discord }
          })
          .eq('id', currentSession.user.id);

        if (updateError) {
          throw updateError;
        }

        alert("Profile updated successfully!");
        
        // Refresh local profile state
        const { data: refreshedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .single();
        
        currentUserProfile = refreshedProfile;
        updateUI();
      } catch (err) {
        alert("Profile Update Error: " + err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Save Profile";
        }
      }
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
