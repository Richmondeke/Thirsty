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
  // Mobile Navigation Menu Toggle (Hamburger)
  // ==========================================
  const mobileNavToggle = document.getElementById('mobile-nav-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (mobileNavToggle && navMenu) {
    const toggleMenu = () => {
      const isExpanded = mobileNavToggle.getAttribute('aria-expanded') === 'true';
      mobileNavToggle.setAttribute('aria-expanded', !isExpanded);
      mobileNavToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
      document.body.classList.toggle('no-scroll', !isExpanded);
    };

    mobileNavToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    // Close menu when a link/button is clicked
    const navLinks = navMenu.querySelectorAll('a, button');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (navMenu.classList.contains('active')) {
          toggleMenu();
        }
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (navMenu.classList.contains('active') && !navMenu.contains(e.target) && e.target !== mobileNavToggle) {
        toggleMenu();
      }
    });
  }

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
    
    const userDashboardCard = document.getElementById('user-dashboard-card');
    const headerLogoutBtn = document.getElementById('header-logout-btn');
    const ticketsSection = document.getElementById('tickets');
    
    const heroLoggedOut = document.getElementById('hero-logged-out-content');
    const heroLoggedIn = document.getElementById('hero-logged-in');
    const passportViewerSection = document.getElementById('passport-viewer');

    if (session && profile) {
      // User is Logged In
      document.body.classList.add('logged-in-user');
      
      if (heroLoggedOut) heroLoggedOut.style.display = 'none';
      if (heroLoggedIn) heroLoggedIn.style.display = 'block';
      if (passportViewerSection) passportViewerSection.style.display = 'block';

      // Generate QR Code
      const qrContainer = document.getElementById('hero-qr-code');
      if (qrContainer) {
        const checkinUrl = window.location.origin + '/checkin.html?id=' + (profile.thirstyclub_id || 'T999-XXXX');
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=255-62-62&bgcolor=ffffff&data=${encodeURIComponent(checkinUrl)}`;
        qrContainer.innerHTML = `<img src="${qrApiUrl}" alt="Entry Pass QR" />`;
      }

      if (ticketsSection) ticketsSection.style.display = 'block';
      if (userDashboardCard) userDashboardCard.style.display = 'block';
      if (headerLogoutBtn) headerLogoutBtn.style.display = 'inline-block';

      // Hide header RSVP button to save navbar space when logged in
      const navRsvpBtn = document.getElementById('nav-rsvp-btn');
      if (navRsvpBtn) navRsvpBtn.style.display = 'none';
      
      // Check if user is an admin
      const isAdmin = session.user.email && (
        session.user.email.startsWith('admin@') || 
        session.user.email.endsWith('@thirstyclub999.com') ||
        session.user.email === 'richmond@guava.earth' ||
        profile.role === 'admin' ||
        profile.socials?.role === 'admin'
      );
      
      const adminTabBtn = document.getElementById('admin-tab-btn');
      if (adminTabBtn) {
        if (isAdmin) {
          adminTabBtn.style.display = 'inline-block';
        } else {
          adminTabBtn.style.display = 'none';
        }
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

      // Update Passport Generator Inputs & State
      const passportInputName = document.getElementById('passport-input-name');
      const passportInputPob = document.getElementById('passport-input-pob');
      const passportInputGender = document.getElementById('passport-input-gender');
      const passportInputSig = document.getElementById('passport-input-sig');
      const passportAuthFields = document.getElementById('passport-auth-fields');
      const passportLoggedInStatus = document.getElementById('passport-logged-in-status');
      const passportMemberId = document.getElementById('passport-member-id');
      const downloadPassportBtn = document.getElementById('download-passport-btn');
      const navMembersBtn = document.getElementById('nav-members-btn');

      if (navMembersBtn) {
        navMembersBtn.textContent = 'My Passport';
        navMembersBtn.href = '#home'; // scroll to top/hero since passport is there
      }

      if (passportAuthFields) passportAuthFields.style.display = 'none';
      if (passportLoggedInStatus) passportLoggedInStatus.style.display = 'block';
      if (passportMemberId) {
        passportMemberId.textContent = 'ThirstyID: ' + (profile.thirstyclub_id || 'T999-XXXX');
      }
      if (downloadPassportBtn) {
        downloadPassportBtn.textContent = 'DOWNLOAD PASSPORT';
      }

      if (passportInputName) passportInputName.value = profile.username || '';
      if (passportInputPob) passportInputPob.value = profile.socials?.place_of_thirst || 'MANCHESTER';
      if (passportInputGender) passportInputGender.value = profile.socials?.gender || 'F';
      if (passportInputSig) passportInputSig.value = profile.socials?.signature || 'A. Palmerston';

      // Load avatar image into the canvas representation
      if (profile.avatar_url && (!uploadedImage || uploadedImage.src !== profile.avatar_url)) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          uploadedImage = img;
          drawPassport();
          const fileInfo = document.getElementById('passport-file-info');
          if (fileInfo) {
            fileInfo.textContent = "Stored Passport Photo loaded";
            fileInfo.style.color = 'var(--accent-color)';
          }
        };
        img.src = profile.avatar_url;
      } else {
        drawPassport();
      }
    } else {
      // User is Logged Out
      document.body.classList.remove('logged-in-user');

      if (heroLoggedOut) heroLoggedOut.style.display = 'flex';
      if (heroLoggedIn) heroLoggedIn.style.display = 'none';
      if (passportViewerSection) passportViewerSection.style.display = 'none';

      const ticketsSection = document.getElementById('tickets');
      if (ticketsSection) ticketsSection.style.display = 'none';
      if (userDashboardCard) userDashboardCard.style.display = 'none';
      if (headerLogoutBtn) headerLogoutBtn.style.display = 'none';

      const adminTabBtn = document.getElementById('admin-tab-btn');
      if (adminTabBtn) adminTabBtn.style.display = 'none';

      // Show header RSVP button
      const navRsvpBtn = document.getElementById('nav-rsvp-btn');
      if (navRsvpBtn) navRsvpBtn.style.display = 'inline-block';

      // Reset tabs active state
      const tabButtons = document.querySelectorAll('.tab-btn');
      const tabContents = document.querySelectorAll('.tab-content');
      tabButtons.forEach(b => {
        if (b.getAttribute('data-tab') === 'tickets-tab') {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
      tabContents.forEach(c => {
        if (c.id === 'tickets-tab') {
          c.classList.add('active');
        } else {
          c.classList.remove('active');
        }
      });

      // Default or clear Passport Generator Inputs & State
      const passportInputName = document.getElementById('passport-input-name');
      const passportInputPob = document.getElementById('passport-input-pob');
      const passportInputGender = document.getElementById('passport-input-gender');
      const passportInputSig = document.getElementById('passport-input-sig');
      const passportAuthFields = document.getElementById('passport-auth-fields');
      const passportLoggedInStatus = document.getElementById('passport-logged-in-status');
      const downloadPassportBtn = document.getElementById('download-passport-btn');
      const navMembersBtn = document.getElementById('nav-members-btn');

      if (navMembersBtn) {
        navMembersBtn.textContent = 'Members Only';
        navMembersBtn.href = '#';
      }

      if (passportAuthFields) passportAuthFields.style.display = 'flex';
      if (passportLoggedInStatus) passportLoggedInStatus.style.display = 'none';
      if (downloadPassportBtn) {
        downloadPassportBtn.textContent = 'DOWNLOAD PASSPORT (RSVP)';
      }

      if (passportInputName) passportInputName.value = 'ADELINE PALMERSTON';
      if (passportInputPob) passportInputPob.value = 'MANCHESTER';
      if (passportInputGender) passportInputGender.value = 'F';
      if (passportInputSig) passportInputSig.value = 'A. Palmerston';

      const passportInputEmail = document.getElementById('passport-input-email');
      const passportInputPassword = document.getElementById('passport-input-password');
      if (passportInputEmail) passportInputEmail.value = '';
      if (passportInputPassword) passportInputPassword.value = '';

      uploadedImage = null;
      const fileInfo = document.getElementById('passport-file-info');
      if (fileInfo) {
        fileInfo.textContent = "JPG or PNG (Max 5MB)";
        fileInfo.style.color = 'var(--text-dim)';
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
  const navMembersBtn = document.getElementById('nav-members-btn');
  const closeModalBtn = document.querySelector('#ticket-modal .close-modal');
  const loginForm = document.getElementById('login-form');

  const openAuthModal = () => {
    if (currentSession) {
      // If logged in, navigate straight to home section
      const homeSection = document.getElementById('home');
      if (homeSection) homeSection.scrollIntoView({ behavior: 'smooth' });
    } else if (modal) {
      if (loginForm) loginForm.reset();
      modal.showModal();
    }
  };

  if (openAuthBtn) openAuthBtn.addEventListener('click', openAuthModal);
  if (navMembersBtn) {
    navMembersBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openAuthModal();
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

  // Success Modal Dialog management
  const successModal = document.getElementById('success-modal');
  const closeSuccessModalBtn = document.getElementById('close-success-modal');
  const successModalCloseBtn = document.getElementById('success-modal-close-btn');

  const closeSuccessModal = () => {
    if (successModal) {
      successModal.close();
    }
  };

  if (closeSuccessModalBtn) {
    closeSuccessModalBtn.addEventListener('click', closeSuccessModal);
  }
  if (successModalCloseBtn) {
    successModalCloseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeSuccessModal();
      // Navigate to home to show the logged-in dashboard
      setTimeout(() => {
        const homeSection = document.getElementById('home');
        if (homeSection) {
          homeSection.scrollIntoView({ behavior: 'smooth' });
        } else {
          const ticketsSection = document.getElementById('tickets');
          if (ticketsSection) ticketsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200);
    });
  }

  // Close success modal on backdrop click
  if (successModal) {
    successModal.addEventListener('click', (e) => {
      const rect = successModal.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        successModal.close();
      }
    });
  }

  // ==========================================
  // 5. Supabase Auth Handlers (Login)
  // ==========================================

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
        
        // Scroll directly to passport section on login
        setTimeout(() => {
          const homeSection = document.getElementById('home');
          if (homeSection) homeSection.scrollIntoView({ behavior: 'smooth' });
        }, 300);
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

  // Use event delegation for dynamically shown passport logout button
  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'passport-logout-btn') {
      handleLogout();
    }
  });

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

      if (targetTab === 'admin-tab') {
        loadAdminDashboard();
      }
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
  // 9. 3D Curved Gallery Scroll Calculations
  // ==========================================
  const galleryScroller = document.getElementById('gallery-scroller');
  const galleryItems = document.querySelectorAll('.gallery-item');

  const updateGallery3DEffect = () => {
    if (!galleryScroller || galleryItems.length === 0) return;

    const scrollerCenter = galleryScroller.scrollLeft + galleryScroller.offsetWidth / 2;
    const scrollerWidth = galleryScroller.offsetWidth;

    galleryItems.forEach(item => {
      const itemCenter = item.offsetLeft + item.offsetWidth / 2;
      const distance = itemCenter - scrollerCenter;
      const normalizedOffset = distance / scrollerWidth;

      // 3D Y-axis rotation (tilt facing the center)
      const maxAngle = 35;
      let angle = -normalizedOffset * 55;
      angle = Math.max(-maxAngle, Math.min(maxAngle, angle));

      // Z-depth pushing outer cards into the background
      const maxZ = -150;
      let z = -Math.abs(normalizedOffset) * 200;
      z = Math.max(maxZ, z);

      // Scale down outer cards slightly
      const scale = Math.max(0.85, 1 - Math.abs(normalizedOffset) * 0.15);

      item.style.transform = `rotateY(${angle}deg) translateZ(${z}px) scale(${scale})`;
    });
  };

  if (galleryScroller) {
    galleryScroller.addEventListener('scroll', updateGallery3DEffect);
    window.addEventListener('resize', updateGallery3DEffect);
    setTimeout(updateGallery3DEffect, 100);
    setTimeout(updateGallery3DEffect, 500);

    // Update 3D calculations when hovering to adapt neighboring cards' tilts as they shift
    galleryItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        setTimeout(updateGallery3DEffect, 50);
      });
      item.addEventListener('mouseleave', () => {
        setTimeout(updateGallery3DEffect, 50);
      });
    });
  }

  // ==========================================
  // 10. Past Editions Gallery Lightbox Interactivity
  // ==========================================
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
  const pantherImage = new Image();
  pantherImage.src = 'images/Heroimage.png';
  pantherImage.onload = () => {
    drawPassport();
  };

  const passportBlendImage = new Image();
  passportBlendImage.src = 'images/Passportblend.JPG';
  passportBlendImage.onload = () => {
    drawPassport();
  };

  const logoImage = new Image();
  logoImage.src = 'images/ThirstyLOGO 2026.png';
  logoImage.onload = () => {
    drawPassport();
  };

  if (document.fonts) {
    document.fonts.ready.then(() => {
      drawPassport();
    });
  }

  const drawStamp = (ctx, x, y) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-15 * Math.PI / 180);
    
    ctx.strokeStyle = 'rgba(255, 62, 62, 0.85)';
    ctx.fillStyle = 'rgba(255, 62, 62, 0.85)';
    ctx.lineWidth = 4;
    
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.font = '900 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillText("THIRSTYCLUB", 0, -15);
    ctx.font = '900 14px sans-serif';
    ctx.fillText("999", 0, 2);
    ctx.font = '700 8px sans-serif';
    ctx.fillText("CHECKED IN", 0, 18);
    ctx.fillText("ACCESS GRANTED", 0, 28);
    
    ctx.restore();
  };

  const drawPassportOnCanvas = (canvasId) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const w = 600;
    const h = 800;
    
    // Clear canvas
    ctx.clearRect(0, 0, w, h);
    
    // 1. Draw Burgundy Cover
    ctx.fillStyle = '#5A060C';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 24);
    ctx.fill();
    
    // Page Dimensions
    const pageW = 560;
    const pageH = 365;
    const pageBgColor = '#EDE8DC';
    
    // 2. Draw Top Page
    ctx.fillStyle = pageBgColor;
    ctx.beginPath();
    ctx.roundRect(20, 20, pageW, pageH, [16, 16, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // 3. Draw Bottom Page
    ctx.fillStyle = pageBgColor;
    ctx.beginPath();
    ctx.roundRect(20, 415, pageW, pageH, [0, 0, 16, 16]);
    ctx.fill();
    ctx.stroke();
    
    // Helper to draw security waves
    const drawWaves = (topY, bottomY) => {
      ctx.strokeStyle = 'rgba(139, 131, 120, 0.11)';
      ctx.lineWidth = 1.0;
      for (let y = topY - 15; y < bottomY + 15; y += 12) {
        ctx.beginPath();
        for (let x = 20; x <= 580; x += 10) {
          const waveY = y + Math.sin((x - 20) * 0.03) * 6 + Math.cos((x - 20) * 0.015) * 3;
          if (x === 20) ctx.moveTo(x, waveY);
          else ctx.lineTo(x, waveY);
        }
        ctx.stroke();
      }
    };
    
    // Clip security waves to Top Page
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(20, 20, pageW, pageH, [16, 16, 0, 0]);
    ctx.clip();
    drawWaves(20, 385);
    ctx.restore();
    
    // Clip security waves to Bottom Page
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(20, 415, pageW, pageH, [0, 0, 16, 16]);
    ctx.clip();
    drawWaves(415, 780);
    ctx.restore();
    
    // 4. Draw Crease and Shadows
    // Top page crease shadow
    let gradTop = ctx.createLinearGradient(0, 350, 0, 385);
    gradTop.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradTop.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    ctx.fillStyle = gradTop;
    ctx.fillRect(20, 350, pageW, 35);

    // Bottom page crease shadow
    let gradBottom = ctx.createLinearGradient(0, 415, 0, 450);
    gradBottom.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
    gradBottom.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradBottom;
    ctx.fillRect(20, 415, pageW, 35);

    // The dark spine line itself
    let gradSpine = ctx.createLinearGradient(0, 385, 0, 415);
    gradSpine.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
    gradSpine.addColorStop(0.5, 'rgba(0, 0, 0, 0.85)');
    gradSpine.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
    ctx.fillStyle = gradSpine;
    ctx.fillRect(0, 385, w, 30);
    
    // 5. Draw Top Page Content
    // Left vertical signature
    const sigText = document.getElementById('passport-input-sig')?.value || currentUserProfile?.socials?.signature || 'A. Palmerston';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(85, 60);
    ctx.lineTo(85, 345);
    ctx.stroke();

    ctx.save();
    ctx.translate(65, 202);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#000000';
    ctx.font = 'italic 24px "Brush Script MT", "Apple Chancery", cursive, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(sigText, 0, 0);
    ctx.restore();

    // Middle Watermark: Preloaded Passportblend.JPG (reduced opacity)
    if (passportBlendImage.complete && passportBlendImage.naturalWidth > 0) {
      ctx.save();
      // Clip to top page
      ctx.beginPath();
      ctx.roundRect(20, 20, pageW, pageH, [16, 16, 0, 0]);
      ctx.clip();
      
      ctx.globalAlpha = 0.16; // reduced opacity (watermark)
      
      const imgW = 450;
      const imgH = 300;
      ctx.drawImage(passportBlendImage, 300 - imgW / 2, 202 - imgH / 2, imgW, imgH);
      ctx.restore();
    }

    // Right vertical title
    ctx.save();
    ctx.translate(505, 202);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.font = '900 28px "Kyrilla", sans-serif';
    ctx.fillText("THIRSTYCLUB999", 0, -8);
    ctx.font = '700 13px "Kyrilla", sans-serif';
    ctx.fillText("PASSPORT", 0, 18);
    ctx.restore();

    // Check if user is checked in, and draw stamp on top portion
    const isCheckedIn = (currentUserProfile && (currentUserProfile.socials?.checked_in === true || currentUserProfile.checked_in === true));
    if (isCheckedIn) {
      drawStamp(ctx, 300, 202);
    }

    // 6. Draw Bottom Page Content
    // Left header
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.font = '900 22px "Kyrilla", sans-serif';
    ctx.fillText("THIRSTYCLUB999", 45, 452);
    ctx.font = '700 11px "Kyrilla", sans-serif';
    ctx.fillText("PASSPORT", 45 + 5, 470);

    // Left photo (user uploaded profile - COLORED!)
    const uPhotoX = 45;
    const uPhotoY = 492;
    const uPhotoW = 185;
    const uPhotoH = 245;

    if (uploadedImage) {
      ctx.save();
      // Apply grayscale filter to make the passport photo black and white
      ctx.filter = 'grayscale(100%)';
      const imgW = uploadedImage.width;
      const imgH = uploadedImage.height;
      const aspect = uPhotoW / uPhotoH;
      let srcW, srcH, srcX, srcY;
      
      if (imgW / imgH > aspect) {
        srcH = imgH;
        srcW = imgH * aspect;
        srcX = (imgW - srcW) / 2;
        srcY = 0;
      } else {
        srcW = imgW;
        srcH = imgW / aspect;
        srcX = 0;
        srcY = (imgH - srcH) / 2;
      }
      ctx.drawImage(uploadedImage, srcX, srcY, srcW, srcH, uPhotoX, uPhotoY, uPhotoW, uPhotoH);
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.fillRect(uPhotoX, uPhotoY, uPhotoW, uPhotoH);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.lineWidth = 1;
      ctx.strokeRect(uPhotoX, uPhotoY, uPhotoW, uPhotoH);

      // Simple silhouette avatar representation
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.beginPath();
      ctx.arc(uPhotoX + uPhotoW/2, uPhotoY + uPhotoH/3, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(uPhotoX + uPhotoW/2, uPhotoY + uPhotoH * 0.72, 52, 36, 0, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.font = '900 9px "Kyrilla", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("UPLOAD PHOTO", uPhotoX + uPhotoW/2, uPhotoY + uPhotoH - 22);
    }
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(uPhotoX, uPhotoY, uPhotoW, uPhotoH);

    // Right details table (only 4 fields, vertically aligned with photo)
    const tblX = 250;
    const tblY = 495;
    const tblW = 295;
    const tblH = 240;
    const rowH = 60;

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(tblX, tblY, tblW, tblH);

    for (let r = 1; r < 4; r++) {
      ctx.beginPath();
      ctx.moveTo(tblX, tblY + r * rowH);
      ctx.lineTo(tblX + tblW, tblY + r * rowH);
      ctx.stroke();
    }

    // Fetch form values
    const nameVal = (document.getElementById('passport-input-name')?.value || currentUserProfile?.username || 'ADELINE PALMERSTON').toUpperCase();
    const pobVal = (document.getElementById('passport-input-pob')?.value || currentUserProfile?.socials?.place_of_thirst || 'MANCHESTER').toUpperCase();
    const genderVal = (document.getElementById('passport-input-gender')?.value || currentUserProfile?.socials?.gender || 'F').toUpperCase();
    const finalSigVal = document.getElementById('passport-input-sig')?.value || currentUserProfile?.socials?.signature || sigText;

    // Helpers to draw cell rows
    const drawRowFull = (label, value, rx, ry, rw, isCursive = false) => {
      ctx.fillStyle = '#1b4d3e';
      ctx.textAlign = 'left';
      ctx.font = 'italic 10px sans-serif';
      ctx.fillText(label, rx + 8, ry + 16);

      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      if (isCursive) {
        ctx.font = 'italic 20px "Brush Script MT", "Apple Chancery", cursive, sans-serif';
        ctx.fillText(value, rx + rw / 2, ry + 42); // centered
      } else {
        ctx.font = '900 13px "Kyrilla", sans-serif';
        ctx.fillText(value, rx + rw / 2, ry + 42); // centered
      }
    };

    drawRowFull("Name:", nameVal, tblX, tblY, tblW);
    drawRowFull("Place of Thirst:", pobVal, tblX, tblY + rowH, tblW);
    drawRowFull("Gender:", genderVal, tblX, tblY + 2 * rowH, tblW);
    drawRowFull("Signature:", finalSigVal, tblX, tblY + 3 * rowH, tblW, true);

    if (logoImage.complete && logoImage.naturalWidth > 0) {
      ctx.save();
      ctx.filter = 'grayscale(100%)';
      const logoSize = 36;
      ctx.drawImage(logoImage, 505, 440, logoSize, logoSize);
      ctx.restore();
    }
  };

  const drawPassport = () => {
    drawPassportOnCanvas('passport-canvas');
    drawPassportOnCanvas('hero-passport-canvas');
  };

  // File Upload Handlers
  const passportDropzone = document.getElementById('passport-dropzone');
  const passportFileInput = document.getElementById('passport-file-input');
  const downloadPassportBtn = document.getElementById('download-passport-btn');
  
  // Inputs
  const passportInputName = document.getElementById('passport-input-name');
  const passportInputPob = document.getElementById('passport-input-pob');
  const passportInputGender = document.getElementById('passport-input-gender');
  const passportInputSig = document.getElementById('passport-input-sig');
  const passportExportFormat = document.getElementById('passport-export-format');

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
  const inputsToListen = [
    passportInputName, passportInputPob,
    passportInputGender, passportInputSig
  ];
  
  inputsToListen.forEach(inputEl => {
    if (inputEl) {
      inputEl.addEventListener('input', () => drawPassport());
    }
  });

  // Download action
  if (downloadPassportBtn) {
    downloadPassportBtn.addEventListener('click', async () => {
      const canvas = currentSession
        ? document.getElementById('hero-passport-canvas')
        : document.getElementById('passport-canvas');
      if (!canvas) return;

      const nameVal = (passportInputName?.value || '').trim();
      const pobVal = (passportInputPob?.value || '').trim();
      const genderVal = (passportInputGender?.value || '').trim();
      const sigVal = (passportInputSig?.value || '').trim();

      // Basic fields validation
      if (!nameVal || !pobVal || !genderVal || !sigVal) {
        alert("Please fill in all passport details: Name, Place of Thirst, Gender, and Signature Text.");
        return;
      }

      if (!uploadedImage) {
        alert("Please upload a portrait picture first.");
        return;
      }

      // Capture canvas state immediately to prevent race conditions during async delays
      const formatVal = passportExportFormat?.value || 'png';
      const filename = nameVal.toLowerCase().replace(/\s+/g, '-');
      const dataUrl = formatVal === 'jpeg'
        ? canvas.toDataURL('image/jpeg', 0.95)
        : canvas.toDataURL('image/png');

      const performDownload = () => {
        const link = document.createElement('a');
        if (formatVal === 'jpeg') {
          link.download = `thirstyclub999-passport-${filename}.jpg`;
        } else {
          link.download = `thirstyclub999-passport-${filename}.png`;
        }
        link.href = dataUrl;
        link.click();
      };

      const performDownloadAndShare = async () => {
        // Standard download first
        performDownload();

        // Share via Web Share API if supported
        if (navigator.share) {
          try {
            const fileExt = formatVal === 'jpeg' ? 'jpg' : 'png';
            const fileMime = formatVal === 'jpeg' ? 'image/jpeg' : 'image/png';
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], `thirstyclub999-passport-${filename}.${fileExt}`, {
              type: fileMime
            });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: 'ThirstyClub999 Passport',
                text: 'Hi Join the ThirstyClub999 Club'
              });
            } else {
              // Fallback to text sharing if file sharing not supported
              await navigator.share({
                title: 'ThirstyClub999 Passport',
                text: 'Hi Join the ThirstyClub999 Club',
                url: window.location.origin
              });
            }
          } catch (err) {
            console.warn('Web Share failed or cancelled:', err);
          }
        }
      };

      const processingModal = document.getElementById('processing-modal');

      // 1. User is Logged In: Update their profile and download
      if (currentSession) {
        downloadPassportBtn.disabled = true;
        const originalText = downloadPassportBtn.textContent;
        downloadPassportBtn.textContent = "Updating Profile...";
        
        const startTime = Date.now();
        if (processingModal) {
          document.getElementById('processing-status-text').textContent = 'UPDATING PROFILE...';
          processingModal.showModal();
        }
        
        try {
          const profilePic = uploadedImage ? uploadedImage.src : (currentUserProfile?.avatar_url || "");
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              username: nameVal,
              avatar_url: profilePic,
              socials: {
                instagram: currentUserProfile?.socials?.instagram || "",
                twitter: currentUserProfile?.socials?.twitter || "",
                discord: currentUserProfile?.socials?.discord || "",
                place_of_thirst: pobVal,
                gender: genderVal,
                signature: sigVal
              }
            })
            .eq('id', currentSession.user.id);

          if (updateError) throw updateError;

          // Re-fetch profile to keep local state synced
          const { data: refreshedProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();
          
          currentUserProfile = refreshedProfile;
          updateUI();
          
          // Trigger download and share asynchronously after a tiny timeout
          // so it does not block the UI thread or dialog closing sequence
          setTimeout(() => {
            performDownloadAndShare()
              .then(() => {
                alert("Passport updated and downloaded successfully!");
              })
              .catch(err => {
                console.error("Download/Share failed:", err);
                alert("Profile saved. Passport download completed.");
              });
          }, 100);
        } catch (err) {
          alert("Error updating passport: " + err.message);
        } finally {
          const elapsed = Date.now() - startTime;
          const remainingDelay = Math.max(0, 3000 - elapsed);
          if (remainingDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingDelay));
          }
          if (processingModal) processingModal.close();
          downloadPassportBtn.disabled = false;
          downloadPassportBtn.textContent = originalText;
        }
        return;
      }

      // 2. User is Logged Out: Sign up, store details, download, show success modal
      const emailVal = document.getElementById('passport-input-email')?.value.trim();
      const passwordVal = document.getElementById('passport-input-password')?.value;

      if (!emailVal || !passwordVal) {
        alert("Please enter both Email Address and Password to RSVP and download your passport.");
        return;
      }

      if (passwordVal.length < 6) {
        alert("Password must be at least 6 characters long.");
        return;
      }

      downloadPassportBtn.disabled = true;
      downloadPassportBtn.textContent = "Processing RSVP...";
      
      const startTime = Date.now();
      if (processingModal) {
        document.getElementById('processing-status-text').textContent = 'VERIFYING CREDENTIALS & SIGNING...';
        processingModal.showModal();
      }

      try {
        const profilePic = uploadedImage ? uploadedImage.src : ""; // base64 string

        // Call Supabase SignUp. We omit avatar_url in auth metadata to keep payload tiny (<1KB) and lightning-fast!
        let signUpData = null;
        let signUpError = null;

        try {
          const { data, error } = await supabase.auth.signUp({
            email: emailVal,
            password: passwordVal,
            options: {
              data: {
                username: nameVal,
                place_of_thirst: pobVal,
                gender: genderVal,
                signature: sigVal
              }
            }
          });
          signUpData = data;
          signUpError = error;
        } catch (signUpErr) {
          signUpError = signUpErr;
        }

        if (signUpError) {
          const errMsg = signUpError.message ? signUpError.message.toLowerCase() : "";
          if (errMsg.includes("user already registered") || errMsg.includes("already exists") || errMsg.includes("email_exists")) {
            if (processingModal) {
              document.getElementById('processing-status-text').textContent = 'ALREADY RSVP\'D. LOGGING IN...';
            }
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: emailVal,
              password: passwordVal
            });
            if (signInError) {
              // If wrong password, give a helpful message
              if (signInError.message.toLowerCase().includes('invalid') || signInError.message.toLowerCase().includes('password')) {
                throw new Error("This email is already registered. Please use your original password to log in.");
              }
              throw signInError;
            }
            signUpData = signInData;
          } else {
            throw signUpError;
          }
        }

        // Download passport immediately
        performDownload();

        // Check if user session was active
        if (signUpData && signUpData.session) {
          if (processingModal) {
            document.getElementById('processing-status-text').textContent = 'SYNCING PROFILE...';
          }
          // Update profile in DB immediately with the details
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              username: nameVal,
              avatar_url: profilePic,
              socials: {
                instagram: currentUserProfile?.socials?.instagram || "",
                twitter: currentUserProfile?.socials?.twitter || "",
                discord: currentUserProfile?.socials?.discord || "",
                place_of_thirst: pobVal,
                gender: genderVal,
                signature: sigVal
              }
            })
            .eq('id', signUpData.session.user.id);

          if (updateError) {
            console.error("Profile update error:", updateError);
          }

          // Fetch the full updated profile and sync state
          const { data: refreshedProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', signUpData.session.user.id)
            .single();

          currentUserProfile = refreshedProfile;
          currentSession = signUpData.session;
          updateUI();

          // Show success modal
          const successModal = document.getElementById('success-modal');
          const successMemberId = document.getElementById('success-member-id');
          if (successMemberId) {
            successMemberId.textContent = refreshedProfile?.thirstyclub_id || 'T999-XXXX';
          }
          if (successModal) {
            successModal.showModal();
          }
        } else {
          // Session is not active yet (requires email confirmation)
          alert("RSVP Pending!\n\nPlease check your email inbox to confirm your account and activate your ThirstyID.");
          
          // Even if email verification is enabled, show success modal with access details
          const successModal = document.getElementById('success-modal');
          const successMemberId = document.getElementById('success-member-id');
          if (successMemberId) {
            successMemberId.textContent = 'PENDING VERIFICATION';
          }
          if (successModal) {
            successModal.showModal();
          }
        }
      } catch (err) {
        alert("RSVP Error: " + err.message);
      } finally {
        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, 3000 - elapsed);
        if (remainingDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingDelay));
        }
        if (processingModal) processingModal.close();
        downloadPassportBtn.disabled = false;
        downloadPassportBtn.textContent = "DOWNLOAD PASSPORT (RSVP)";
      }
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

  const escapeHtml = (str) => {
    if (typeof str !== 'string') return str || '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  };

  const loadAdminDashboard = async () => {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      let maleCount = 0;
      let femaleCount = 0;
      let otherCount = 0;

      const tbody = document.getElementById('admin-users-list');
      if (tbody) {
        tbody.innerHTML = '';
        users.forEach(user => {
          const gender = (user.socials?.gender || '').trim().toUpperCase();
          if (gender === 'M' || gender === 'MALE') {
            maleCount++;
          } else if (gender === 'F' || gender === 'FEMALE') {
            femaleCount++;
          } else {
            otherCount++;
          }

          const date = new Date(user.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><span class="glow-id">${escapeHtml(user.thirstyclub_id || 'N/A')}</span></td>
            <td>${escapeHtml(user.username || '')}</td>
            <td>${escapeHtml(user.email || '')}</td>
            <td><span class="badge badge-${gender.toLowerCase() || 'na'}">${escapeHtml(gender || 'N/A')}</span></td>
            <td>${escapeHtml(user.socials?.place_of_thirst || 'N/A')}</td>
            <td style="color: var(--text-dim); font-size: 0.8rem;">${date}</td>
          `;
          tbody.appendChild(tr);
        });
      }

      // Update stats UI
      const totalEl = document.getElementById('admin-stat-total');
      const maleEl = document.getElementById('admin-stat-male');
      const femaleEl = document.getElementById('admin-stat-female');
      const otherEl = document.getElementById('admin-stat-other');

      if (totalEl) totalEl.textContent = users.length;
      if (maleEl) maleEl.textContent = maleCount;
      if (femaleEl) femaleEl.textContent = femaleCount;
      if (otherEl) otherEl.textContent = otherCount;

    } catch (err) {
      console.error("Error loading admin dashboard:", err);
      alert("Error loading admin dashboard: " + err.message);
    }
  };

  // Wire up hero download button click
  const heroDownloadBtn = document.getElementById('hero-download-passport-btn');
  if (heroDownloadBtn && downloadPassportBtn) {
    heroDownloadBtn.addEventListener('click', () => {
      downloadPassportBtn.click();
    });
  }

  // Expose internals for testing / debugging
  window.__internals = {
    setCurrentSession: (session) => { currentSession = session; },
    setCurrentUserProfile: (profile) => { currentUserProfile = profile; },
    updateUI,
    loadAdminDashboard
  };
});
