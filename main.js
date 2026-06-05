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
  const navDashLink = document.getElementById('nav-dash-link');
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
      
      if (navDashLink) {
        navDashLink.textContent = 'Dashboard';
        navDashLink.href = '#tickets';
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

      // Update Passport Generator Inputs
      const passportInputName = document.getElementById('passport-input-name');
      const passportInputId = document.getElementById('passport-input-id');
      if (passportInputName && !passportInputName.value) {
        passportInputName.value = profile.username;
      }
      if (passportInputId && !passportInputId.value) {
        passportInputId.value = profile.thirstyclub_id || 'T999-XXXX';
      }
      drawPassport();
    } else {
      // User is Logged Out
      if (rsvpPromoCard) rsvpPromoCard.style.display = 'block';
      if (userDashboardCard) userDashboardCard.style.display = 'none';
      if (headerLogoutBtn) headerLogoutBtn.style.display = 'none';
      
      if (navDashLink) {
        navDashLink.textContent = 'Sign In';
        navDashLink.href = '#tickets';
      }

      // Default or clear Passport Generator Inputs
      const passportInputName = document.getElementById('passport-input-name');
      const passportInputId = document.getElementById('passport-input-id');
      if (passportInputName) {
        passportInputName.value = '';
      }
      if (passportInputId) {
        passportInputId.value = '';
      }
      drawPassport();
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
  const navDashLinkClick = document.getElementById('nav-dash-link');
  const closeModalBtn = document.querySelector('.close-modal');

  const openAuthModal = () => {
    if (currentSession) {
      // If logged in, navigate straight to tickets/dashboard section
      const ticketsSection = document.getElementById('tickets');
      if (ticketsSection) ticketsSection.scrollIntoView({ behavior: 'smooth' });
    } else if (modal) {
      modal.showModal();
    }
  };

  if (openAuthBtn) openAuthBtn.addEventListener('click', openAuthModal);
  if (navDashLinkClick) {
    navDashLinkClick.addEventListener('click', (e) => {
      if (!currentSession) {
        e.preventDefault();
        openAuthModal();
      }
    });
  }

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
            submitBtn.textContent = "Get ThirstyID & Passport";
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
          alert("Registration Successful!\n\nYour account is active, and your ThirstyID has been generated.");
          modal.close();
          signupForm.reset();
        } else {
          alert("Registration Successful!\n\nPlease check your email inbox to verify your account. Once verified, your unique ThirstyID will be generated and you can log in.");
          modal.close();
          signupForm.reset();
        }
      } catch (err) {
        alert("Sign Up Error: " + err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Get ThirstyID & Passport";
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
            throw new Error("Invalid ThirstyID. Make sure it is spelled correctly.");
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
  // 10. Hero Scroll Dimming Handler & Hover Fade
  // ==========================================
  const heroScrollOverlay = document.getElementById('hero-scroll-overlay');
  window.addEventListener('scroll', () => {
    if (!heroScrollOverlay) return;
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    // Opacity dims background image up to 0.85 when scrolled past 80% height of viewport
    const opacity = Math.min(scrollY / (windowHeight * 0.8), 0.85);
    heroScrollOverlay.style.opacity = opacity;
  });

  const heroCtaBtn = document.getElementById('hero-cta-btn');
  const heroContent = document.querySelector('.hero-content');
  const heroVideo = document.getElementById('hero-bg-video');
  const heroSection = document.querySelector('.hero');
  
  if (heroCtaBtn && heroContent && heroVideo && heroSection) {
    let pauseTimeout = null;
    let isHovered = false;
    
    heroVideo.muted = true;
    
    heroVideo.addEventListener('timeupdate', () => {
      if (heroVideo.duration && !isNaN(heroVideo.duration)) {
        const progress = heroVideo.currentTime / heroVideo.duration;
        heroSection.style.setProperty('--video-progress', progress);
      }
    });

    heroVideo.addEventListener('playing', () => {
      if (isHovered) {
        heroSection.classList.add('video-active');
      }
    });

    heroCtaBtn.addEventListener('mouseenter', () => {
      isHovered = true;
      if (pauseTimeout) {
        clearTimeout(pauseTimeout);
        pauseTimeout = null;
      }
      heroContent.classList.add('cta-hovered');
      heroVideo.play().catch(err => {
        console.log("Video play error:", err);
      });
    });
    
    heroCtaBtn.addEventListener('mouseleave', () => {
      isHovered = false;
      heroContent.classList.remove('cta-hovered');
      heroSection.classList.remove('video-active');
      pauseTimeout = setTimeout(() => {
        heroVideo.pause();
        heroVideo.currentTime = 0;
        heroSection.style.setProperty('--video-progress', 0);
      }, 500);
    });
  }

  // ==========================================
  // 11. Thirsty Passport Generator Logic
  // ==========================================
  let uploadedImage = null;

  const drawPassport = () => {
    const canvas = document.getElementById('passport-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, 600, 400);
    
    // Draw technical grid background
    ctx.strokeStyle = 'rgba(255, 62, 62, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 600; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 400);
      ctx.stroke();
    }
    for (let i = 0; i < 400; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(600, i);
      ctx.stroke();
    }

    // Draw red outer border
    ctx.strokeStyle = '#ff3e3e';
    ctx.lineWidth = 2;
    ctx.strokeRect(15, 15, 570, 370);

    // Draw HUD corner bracket accents
    ctx.fillStyle = '#ff3e3e';
    // Top-left
    ctx.fillRect(10, 10, 20, 4);
    ctx.fillRect(10, 10, 4, 20);
    // Top-right
    ctx.fillRect(570, 10, 20, 4);
    ctx.fillRect(586, 10, 4, 20);
    // Bottom-left
    ctx.fillRect(10, 386, 20, 4);
    ctx.fillRect(10, 370, 4, 20);
    // Bottom-right
    ctx.fillRect(570, 386, 20, 4);
    ctx.fillRect(586, 370, 4, 20);

    // Technical metadata text
    ctx.fillStyle = 'rgba(255, 62, 62, 0.6)';
    ctx.font = '8px monospace';
    ctx.fillText("SECURE ACCESS TERMINAL // T999", 25, 28);
    ctx.fillText("SYS.STATUS: VALID", 495, 28);

    // Photo slot coordinates
    const targetX = 40;
    const targetY = 70;
    const targetWidth = 220;
    const targetHeight = 260;

    if (uploadedImage) {
      // Draw uploaded image scaled & cropped (cover style)
      const imgWidth = uploadedImage.width;
      const imgHeight = uploadedImage.height;
      const aspect = targetWidth / targetHeight;
      let srcWidth, srcHeight, srcX, srcY;
      
      if (imgWidth / imgHeight > aspect) {
        srcHeight = imgHeight;
        srcWidth = imgHeight * aspect;
        srcX = (imgWidth - srcWidth) / 2;
        srcY = 0;
      } else {
        srcWidth = imgWidth;
        srcHeight = imgWidth / aspect;
        srcX = 0;
        srcY = (imgHeight - srcHeight) / 2;
      }

      ctx.drawImage(uploadedImage, srcX, srcY, srcWidth, srcHeight, targetX, targetY, targetWidth, targetHeight);
      
      // Cyber red overlay filter
      ctx.fillStyle = 'rgba(255, 62, 62, 0.12)';
      ctx.fillRect(targetX, targetY, targetWidth, targetHeight);

      // Faint horizontal scanlines
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      for (let y = targetY; y < targetY + targetHeight; y += 4) {
        ctx.fillRect(targetX, y, targetWidth, 1.5);
      }
    } else {
      // Draw placeholder
      ctx.fillStyle = 'rgba(255, 62, 62, 0.03)';
      ctx.fillRect(targetX, targetY, targetWidth, targetHeight);
      ctx.strokeStyle = 'rgba(255, 62, 62, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(targetX, targetY, targetWidth, targetHeight);

      // Placeholder HUD crosshair
      ctx.strokeStyle = 'rgba(255, 62, 62, 0.15)';
      ctx.beginPath();
      ctx.moveTo(targetX + targetWidth/2 - 15, targetY + targetHeight/2);
      ctx.lineTo(targetX + targetWidth/2 + 15, targetY + targetHeight/2);
      ctx.moveTo(targetX + targetWidth/2, targetY + targetHeight/2 - 15);
      ctx.lineTo(targetX + targetWidth/2, targetY + targetHeight/2 + 15);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 62, 62, 0.5)';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText("NO PHOTO UPLOADED", targetX + targetWidth/2, targetY + targetHeight/2 - 25);
      ctx.fillText("DRAG & DROP PICTURE", targetX + targetWidth/2, targetY + targetHeight/2 + 25);
      ctx.textAlign = 'left';
    }

    // Photo slot border and corners
    ctx.strokeStyle = '#ff3e3e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(targetX, targetY, targetWidth, targetHeight);

    ctx.fillStyle = '#ff3e3e';
    // Photo corners
    ctx.fillRect(targetX - 4, targetY - 4, 12, 3);
    ctx.fillRect(targetX - 4, targetY - 4, 3, 12);
    ctx.fillRect(targetX + targetWidth - 8, targetY - 4, 12, 3);
    ctx.fillRect(targetX + targetWidth + 1, targetY - 4, 3, 12);
    ctx.fillRect(targetX - 4, targetY + targetHeight + 1, 12, 3);
    ctx.fillRect(targetX - 4, targetY + targetHeight - 8, 3, 12);
    ctx.fillRect(targetX + targetWidth - 8, targetY + targetHeight + 1, 12, 3);
    ctx.fillRect(targetX + targetWidth + 1, targetY + targetHeight - 8, 3, 12);

    // Get input values
    const holderName = (document.getElementById('passport-input-name')?.value || 'UNREGISTERED GUEST').toUpperCase();
    const holderId = (document.getElementById('passport-input-id')?.value || 'T999-XXXX').toUpperCase();

    // Draw Info on Right
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 20px Kyrilla, Inter, sans-serif';
    ctx.fillText("THIRSTYCLUB999 ACCESS PASS", 290, 95);

    ctx.fillStyle = '#ff3e3e';
    ctx.font = 'bold 10px monospace';
    ctx.fillText("LEVEL // GUEST AUTHENTICATED", 290, 115);

    // Name row
    ctx.fillStyle = '#888888';
    ctx.font = 'bold 10px monospace';
    ctx.fillText("HOLDER NAME", 290, 155);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 16px Kyrilla, Inter, sans-serif';
    ctx.fillText(holderName, 290, 175);

    // Holder Code row
    ctx.fillStyle = '#888888';
    ctx.font = 'bold 10px monospace';
    ctx.fillText("HOLDER CODE", 290, 215);
    ctx.fillStyle = '#ff3e3e';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(holderId, 290, 235);

    // Expiry and Role row
    ctx.fillStyle = '#888888';
    ctx.font = 'bold 9px monospace';
    ctx.fillText("EXPIRY DATE", 290, 275);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText("14.06.2026", 290, 290);

    ctx.fillStyle = '#888888';
    ctx.font = 'bold 9px monospace';
    ctx.fillText("ACCESS LEVEL", 420, 275);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText("CLUB GUEST", 420, 290);

    // Access Approved Badge
    const badgeX = 485;
    const badgeY = 78;
    const badgeW = 75;
    const badgeH = 18;

    ctx.strokeStyle = '#ff3e3e';
    ctx.lineWidth = 1;
    ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);
    ctx.fillStyle = 'rgba(255, 62, 62, 0.1)';
    ctx.fillRect(badgeX, badgeY, badgeW, badgeH);

    ctx.fillStyle = '#ff3e3e';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("ACCESS GRANTED", badgeX + badgeW/2, badgeY + badgeH/2);
    
    // Reset defaults
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Faux Barcode Generator
    const barcodeX = 290;
    const barcodeY = 315;
    const barcodeWidth = 270;
    const barcodeHeight = 35;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(barcodeX, barcodeY, barcodeWidth, barcodeHeight);

    ctx.fillStyle = '#000000';
    let seed = 0;
    for (let i = 0; i < holderId.length; i++) {
      seed += holderId.charCodeAt(i);
    }

    let currentBarX = barcodeX + 10;
    const endBarX = barcodeX + barcodeWidth - 10;

    function random() {
      let x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    }

    while (currentBarX < endBarX) {
      const barWidth = Math.floor(random() * 4) + 1;
      ctx.fillRect(currentBarX, barcodeY, barWidth, barcodeHeight);
      const space = Math.floor(random() * 4) + 1;
      currentBarX += barWidth + space;
    }
  };

  // File Upload Handlers
  const passportDropzone = document.getElementById('passport-dropzone');
  const passportFileInput = document.getElementById('passport-file-input');
  const downloadPassportBtn = document.getElementById('download-passport-btn');
  const passportInputName = document.getElementById('passport-input-name');
  const passportInputId = document.getElementById('passport-input-id');

  const handlePassportFile = (file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit. Please upload a smaller image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        uploadedImage = img;
        drawPassport();
        if (downloadPassportBtn) {
          downloadPassportBtn.disabled = false;
        }
        const fileInfo = document.getElementById('passport-file-info');
        if (fileInfo) {
          fileInfo.textContent = `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
          fileInfo.style.color = 'var(--accent-color)';
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  if (passportDropzone && passportFileInput) {
    passportDropzone.addEventListener('click', () => passportFileInput.click());
    
    passportFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      handlePassportFile(file);
    });

    passportDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      passportDropzone.classList.add('dragover');
    });

    ['dragleave', 'dragend'].forEach(type => {
      passportDropzone.addEventListener(type, () => {
        passportDropzone.classList.remove('dragover');
      });
    });

    passportDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      passportDropzone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handlePassportFile(file);
      }
    });
  }

  // Redraw when input details change
  if (passportInputName) {
    passportInputName.addEventListener('input', () => drawPassport());
  }
  if (passportInputId) {
    passportInputId.addEventListener('input', () => drawPassport());
  }

  // Download action
  if (downloadPassportBtn) {
    downloadPassportBtn.addEventListener('click', () => {
      const canvas = document.getElementById('passport-canvas');
      if (!canvas || !uploadedImage) return;

      const link = document.createElement('a');
      link.download = `thirstyclub999-passport-${(passportInputName?.value || 'guest').toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  }

  // ==========================================
  // 12. Initialization & Counter Animation
  // ==========================================
  const animateCounter = (elementId, targetVal) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    el.dataset.animating = 'true';
    const duration = 1500; // 1.5 seconds
    const startTime = performance.now();
    
    const updateCount = (currentTime) => {
      if (el.dataset.animating !== 'true') return;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing outQuad
      const easeProgress = progress * (2 - progress);
      const currentVal = Math.floor(easeProgress * targetVal);
      
      el.textContent = String(currentVal).padStart(3, '0');
      
      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        el.textContent = targetVal;
        delete el.dataset.animating;
      }
    };
    
    requestAnimationFrame(updateCount);
  };

  updateUI();
  // Draw placeholder passport template
  drawPassport();
  
  // Trigger money counter animations on load
  animateCounter('hero-counter', 999);
  animateCounter('logo-counter', 999);

  // Set up infinite money counter on hover
  const setupInfiniteCounterHover = (triggerSelector, counterId) => {
    const trigger = document.querySelector(triggerSelector);
    const counter = document.getElementById(counterId);
    if (!trigger || !counter) return;

    let intervalId = null;

    trigger.addEventListener('mouseenter', () => {
      // Cancel onload animation if active
      delete counter.dataset.animating;
      
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        const randomVal = Math.floor(Math.random() * 1000);
        counter.textContent = String(randomVal).padStart(3, '0');
      }, 50); // Fast cycle every 50ms
    });

    trigger.addEventListener('mouseleave', () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      counter.textContent = '999';
    });
  };

  setupInfiniteCounterHover('.logo', 'logo-counter');
  setupInfiniteCounterHover('.glitch-text', 'hero-counter');
});
