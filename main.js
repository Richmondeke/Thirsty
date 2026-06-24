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
      if (userDashboardCard && userDashboardCard.style.display !== 'flex') {
        userDashboardCard.style.display = 'flex';
        // Reset view to homepage when first showing dashboard
        viewHistory = ['view-homepage'];
        switchView('view-homepage', false);
      }
      if (headerLogoutBtn) headerLogoutBtn.style.display = 'inline-block';
      
      // Hide entire landing page components
      const headerEl = document.querySelector('header');
      if (headerEl) headerEl.style.display = 'none';
      const mainEl = document.querySelector('main');
      if (mainEl) mainEl.style.display = 'none';
      const footerEl = document.querySelector('footer');
      if (footerEl) footerEl.style.display = 'none';
      
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      
      if (navDashLink) {
        navDashLink.textContent = 'Dashboard';
        navDashLink.href = '#tickets';
      }

      // Check if user is an admin
      const isAdmin = session.user.email && (
        session.user.email.startsWith('admin@') || 
        session.user.email.endsWith('@thirstyclub999.com') ||
        session.user.email === 'richmond@guava.earth' ||
        session.user.email === 'richmonde@guava.earth' ||
        session.user.email === 'guavanigeria@gmail.com' ||
        session.user.email === 'thirstynalia@gmail.com' ||
        session.user.email === 'straffitti@hotmail.com' ||
        session.user.email === 'bookthirsty234@gmail.com' ||
        session.user.email === 'godliverse@gmail.com' ||
        session.user.email === 'ogunwuyi.olumide@yahoo.com' ||
        profile?.role === 'admin' ||
        profile?.socials?.role === 'admin'
      );

      const adminSidebarBtn = document.getElementById('admin-sidebar-btn');
      const adminBottomBtn = document.getElementById('admin-bottom-btn');
      if (adminSidebarBtn) adminSidebarBtn.style.display = isAdmin ? 'flex' : 'none';
      if (adminBottomBtn) adminBottomBtn.style.display = isAdmin ? 'flex' : 'none';

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

      // Bind dynamic session strings to layout placeholders
      const displayNames = document.querySelectorAll('.user-display-name');
      displayNames.forEach(el => { el.textContent = profile.username; });

      const avatars = document.querySelectorAll('.user-avatar-placeholder');
      avatars.forEach(el => { el.src = profile.avatar_url || defaultAvatar; });

      const ids = document.querySelectorAll('.user-id-placeholder');
      ids.forEach(el => { el.textContent = profile.thirstyclub_id || 'T999-XXXX'; });

      // Update Passport Generator Inputs
      const passportInputName = document.getElementById('passport-input-name');
      const passportInputId = document.getElementById('passport-input-id');
      if (passportInputName) {
        passportInputName.value = profile.username;
      }
      if (passportInputId) {
        passportInputId.value = profile.thirstyclub_id || 'T999-XXXX';
      }
      drawPassport();
    } else {
      // User is Logged Out
      if (userDashboardCard) userDashboardCard.style.display = 'none';
      if (headerLogoutBtn) headerLogoutBtn.style.display = 'none';
      
      // Show landing page components
      const headerEl = document.querySelector('header');
      if (headerEl) headerEl.style.display = 'flex';
      const mainEl = document.querySelector('main');
      if (mainEl) mainEl.style.display = 'block';
      const footerEl = document.querySelector('footer');
      if (footerEl) footerEl.style.display = 'block';
      
      // Restore body scroll
      document.body.style.overflow = '';

      const adminSidebarBtn = document.getElementById('admin-sidebar-btn');
      const adminBottomBtn = document.getElementById('admin-bottom-btn');
      if (adminSidebarBtn) adminSidebarBtn.style.display = 'none';
      if (adminBottomBtn) adminBottomBtn.style.display = 'none';

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
  const heroLoginBtn = document.getElementById('hero-login-btn');
  if (heroLoginBtn) heroLoginBtn.addEventListener('click', openAuthModal);
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
  // 6. User Dashboard Mobile View Router
  // ==========================================
  let viewHistory = ['view-homepage'];

  const switchView = (targetViewId, pushToHistory = true) => {
    const views = document.querySelectorAll('.app-view');
    const backBtn = document.getElementById('app-header-back');
    const headerTitle = document.getElementById('app-header-title');

    // Remove active from all views
    views.forEach(v => v.classList.remove('active'));

    // Activate target view
    const targetView = document.getElementById(targetViewId);
    if (targetView) targetView.classList.add('active');

    // Update Header Title depending on view
    let title = "THIRSTYCLUB999";
    if (targetViewId === 'view-passport') title = "PASSPORT";
    else if (targetViewId === 'view-profile') title = "PROFILE";
    else if (targetViewId === 'view-wearthirsty') title = "WEARTHIRSTY";
    else if (targetViewId === 'view-drops') title = "DROPS";
    else if (targetViewId === 'view-signals') title = "SIGNALS";
    else if (targetViewId === 'view-badges') title = "BADGES";
    else if (targetViewId === 'view-wallet') title = "WALLET";
    else if (targetViewId === 'view-events') title = "EVENTS";
    else if (targetViewId === 'view-scan') title = "SCAN";
    else if (targetViewId === 'view-notifications') title = "NOTIFICATIONS";
    else if (targetViewId === 'view-settings') title = "SETTINGS";
    else if (targetViewId === 'view-admin') {
      title = "ADMIN PORTAL";
      loadAdminDashboard();
    }
    headerTitle.textContent = title;

    // Track history
    if (pushToHistory && viewHistory[viewHistory.length - 1] !== targetViewId) {
      viewHistory.push(targetViewId);
    }

    // Toggle back button visibility
    if (viewHistory.length > 1) {
      backBtn.style.visibility = 'visible';
    } else {
      backBtn.style.visibility = 'hidden';
    }

    // Highlight bottom nav tabs if they match the primary target
    const navItems = document.querySelectorAll('.nav-tab-item');
    navItems.forEach(item => {
      const target = item.getAttribute('data-target-view');
      if (target === targetViewId || 
          (targetViewId === 'view-settings' && target === 'view-profile') || 
          (targetViewId === 'view-wallet' && target === 'view-profile') ||
          (targetViewId === 'view-badges' && target === 'view-profile') ||
          (targetViewId === 'view-events' && target === 'view-profile')) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  };

  // Back button click handler
  const backBtn = document.getElementById('app-header-back');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (viewHistory.length > 1) {
        viewHistory.pop();
        const prevView = viewHistory[viewHistory.length - 1];
        switchView(prevView, false);
      }
    });
  }

  // Bind Bottom Nav Bar Taps
  const navTabs = document.querySelectorAll('.nav-tab-item');
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetView = tab.getAttribute('data-target-view');
      // Clear history when switching to primary nav tab to prevent infinitely nesting stacks
      viewHistory = [targetView];
      switchView(targetView, false);
    });
  });

  // Bind homepage buttons to swap views
  const homeViewDropBtn = document.getElementById('home-view-drop-btn');
  if (homeViewDropBtn) {
    homeViewDropBtn.addEventListener('click', () => switchView('view-drops'));
  }
  const homeSignalCard = document.getElementById('home-signal-card');
  if (homeSignalCard) {
    homeSignalCard.addEventListener('click', () => switchView('view-signals'));
  }
  const btnScanView = document.getElementById('btn-scan-view');
  if (btnScanView) {
    btnScanView.addEventListener('click', () => switchView('view-scan'));
  }
  const headerNotifBtn = document.getElementById('header-notif-btn');
  if (headerNotifBtn) {
    headerNotifBtn.addEventListener('click', () => switchView('view-notifications'));
  }

  // Bind Profile Sub-Menu buttons
  const menuBtnWallet = document.getElementById('menu-btn-wallet');
  if (menuBtnWallet) {
    menuBtnWallet.addEventListener('click', () => switchView('view-wallet'));
  }
  const menuBtnBadges = document.getElementById('menu-btn-badges');
  if (menuBtnBadges) {
    menuBtnBadges.addEventListener('click', () => switchView('view-badges'));
  }
  const menuBtnEvents = document.getElementById('menu-btn-events');
  if (menuBtnEvents) {
    menuBtnEvents.addEventListener('click', () => switchView('view-events'));
  }
  const menuBtnSettings = document.getElementById('menu-btn-settings');
  if (menuBtnSettings) {
    menuBtnSettings.addEventListener('click', () => switchView('view-settings'));
  }

  // Settings Log Out
  const appSettingsLogoutBtn = document.getElementById('app-settings-logout-btn');
  if (appSettingsLogoutBtn) {
    appSettingsLogoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.hash = ''; // Clear navigation hash
    });
  }

  // ==========================================
  // 7. Mock Databases & Renderer Functions
  // ==========================================

  // A. WearThirsty Shop Merchandise Data
  const shopProducts = [
    { id: 1, title: '999 Hoodie', category: 'apparel', price: '$129.99', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=300&q=80', desc: 'BLACK / RED' },
    { id: 2, title: 'Thirsty Tee', category: 'apparel', price: '$58.99', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80', desc: 'BLACK' },
    { id: 3, title: '999 Cap', category: 'accessories', price: '$43.99', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=300&q=80', desc: 'BLACK / RED' },
    { id: 4, title: 'Global Hoodie', category: 'limited', price: '$169.99', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=300&q=80', desc: 'BLACK' }
  ];

  const renderShop = (filter = 'all') => {
    const grid = document.getElementById('shop-products-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = filter === 'all' ? shopProducts : shopProducts.filter(p => p.category === filter);

    filtered.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="product-image-wrap">
          <img src="${p.image}" alt="${p.title}">
        </div>
        <div class="product-title">${p.title}</div>
        <div class="product-meta-desc">${p.desc}</div>
        <div class="product-price">${p.price}</div>
      `;
      grid.appendChild(card);
    });
  };

  // Bind Shop tab filters
  const shopTabs = document.querySelectorAll('.shop-tab');
  shopTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      shopTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.getAttribute('data-filter');
      renderShop(filter);
    });
  });

  // B. Signals Feed Data
  const mockSignals = [
    {
      id: 1,
      username: 'THIRSTYCLUB999',
      handle: '@tc999',
      avatar: 'data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="%23ff3e3e"/><text x="50" y="55" font-family="monospace" font-size="20" fill="white" font-weight="bold" text-anchor="middle">999</text></svg>',
      time: '2m ago',
      text: 'THE SYSTEM IS DRY. WE BRING THE THIRST.',
      media: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80',
      likes: 999,
      comments: 99
    },
    {
      id: 2,
      username: 'THIRSTYCLUB999',
      handle: '@tc999',
      avatar: 'data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="%23ff3e3e"/><text x="50" y="55" font-family="monospace" font-size="20" fill="white" font-weight="bold" text-anchor="middle">999</text></svg>',
      time: '1h ago',
      text: 'NO RULES. ONLY THE CLUB.',
      media: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80',
      likes: 854,
      comments: 67
    }
  ];

  const renderSignals = () => {
    const container = document.getElementById('signals-feed-container');
    if (!container) return;
    container.innerHTML = '';

    mockSignals.forEach(s => {
      const post = document.createElement('div');
      post.className = 'signal-post-card';
      post.innerHTML = `
        <div class="post-header">
          <img src="${s.avatar}" alt="${s.username}" class="post-user-avatar">
          <div class="post-meta-info">
            <div class="post-username">${s.username}</div>
            <div class="post-handle">${s.handle}</div>
          </div>
          <span class="post-time">${s.time}</span>
        </div>
        <p class="post-text">${s.text}</p>
        <div class="post-media-frame">
          <img src="${s.media}" alt="Post Media">
        </div>
        <div class="post-actions-row">
          <button class="post-action-btn" onclick="alert('Liked post!')">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span>${s.likes}</span>
          </button>
          <button class="post-action-btn" onclick="alert('Comments feature loading...')">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>${s.comments}</span>
          </button>
        </div>
      `;
      container.appendChild(post);
    });
  };

  // C. Badges Data
  const mockBadges = [
    { name: 'Founding Member', icon: '✦', earned: true },
    { name: 'Early Access', icon: '★', earned: true },
    { name: 'First Drop', icon: '⚿', earned: true },
    { name: 'Signal Receiver', icon: '📡', earned: true },
    { name: 'Community', icon: '👥', earned: true },
    { name: '999 Rep', icon: '🎖️', earned: true },
    { name: 'Level 10', icon: '🔒', earned: false },
    { name: 'Level 25', icon: '🔒', earned: false },
    { name: 'Legend', icon: '🔒', earned: false }
  ];

  const renderBadges = (filter = 'all') => {
    const container = document.getElementById('badges-grid-container');
    if (!container) return;
    container.innerHTML = '';

    const filtered = mockBadges.filter(b => {
      if (filter === 'earned') return b.earned;
      if (filter === 'locked') return !b.earned;
      return true;
    });

    filtered.forEach(b => {
      const card = document.createElement('div');
      card.className = `badge-item-card ${!b.earned ? 'locked' : ''}`;
      card.innerHTML = `
        <div class="badge-icon-box">${b.icon}</div>
        <div class="badge-name">${b.name}</div>
      `;
      container.appendChild(card);
    });
  };

  // Bind Badges subtabs
  const badgeTabs = document.querySelectorAll('.badges-view .subtab-btn, #view-badges .subtab-btn');
  badgeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      badgeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.textContent.toLowerCase();
      renderBadges(filter);
    });
  });

  // D. Events Data
  const mockEvents = [
    { month: 'Jun', day: '07', title: 'UNDERGROUND NYC', organizer: 'THIRSTYCLUB999 PRESENTS', location: 'BROOKLYN, NYC' },
    { month: 'Jul', day: '19', title: 'WORLDWIDE MEET', organizer: 'THIRSTYCLUB999', location: 'LONDON, UK' },
    { month: 'Aug', day: '31', title: '999 DAY', organizer: 'THIRSTYCLUB999', location: 'WORLDWIDE' }
  ];

  const renderEvents = () => {
    const container = document.getElementById('events-timeline-container');
    if (!container) return;
    container.innerHTML = '';

    mockEvents.forEach(e => {
      const card = document.createElement('div');
      card.className = 'event-card-item';
      card.innerHTML = `
        <div class="event-date-block">
          <span class="ev-month">${e.month}</span>
          <span class="ev-day">${e.day}</span>
        </div>
        <div class="event-details-block">
          <div class="ev-organizer">${e.organizer}</div>
          <div class="ev-title">${e.title}</div>
          <div class="ev-location">${e.location}</div>
        </div>
        <button class="ev-rsvp-btn" onclick="alert('RSVP confirmed!')">RSVP</button>
      `;
      container.appendChild(card);
    });
  };

  // E. Notifications History
  const mockNotifications = [
    { title: 'New Signal', body: 'THE SYSTEM IS DRY. WE BRING THE THIRST.', time: '2m ago' },
    { title: 'Drop Alert', body: '999 HOODIE DROP IN 24H.', time: '9m ago' },
    { title: 'Order Update', body: 'YOUR ORDER #TC999-001 IS ON THE WAY.', time: '1h ago' },
    { title: 'Badge Earned', body: 'EARLY ACCESS BADGE EARNED.', time: '1d ago' }
  ];

  const renderNotifications = () => {
    const container = document.getElementById('notif-history-container');
    if (!container) return;
    container.innerHTML = '';

    mockNotifications.forEach(n => {
      const row = document.createElement('div');
      row.className = 'notif-item-row';
      row.innerHTML = `
        <div class="notif-bullet"></div>
        <div class="notif-details">
          <div class="notif-top">
            <span class="notif-title">${n.title}</span>
            <span class="notif-time">${n.time}</span>
          </div>
          <p class="notif-body">${n.body}</p>
        </div>
      `;
      container.appendChild(row);
    });
  };

  // F. Scan View Modes
  const scanToggleQr = document.getElementById('scan-mode-qr');
  const scanToggleNfc = document.getElementById('scan-mode-nfc');
  const scanToggleCode = document.getElementById('scan-mode-code');

  const setupScanToggles = () => {
    const toggles = [scanToggleQr, scanToggleNfc, scanToggleCode];
    toggles.forEach(btn => {
      if (!btn) return;
      btn.addEventListener('click', () => {
        toggles.forEach(t => t?.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.id.split('-').pop();
        if (mode === 'qr') {
          alert('Camera overlay active. Align QR code.');
        } else if (mode === 'nfc') {
          alert('NFC reading active. Hold device close to ticket sensor.');
        } else {
          let code = prompt('Enter alphanumeric verification code:');
          if (code) alert(`Code ${code.toUpperCase()} successfully matched.`);
        }
      });
    });
  };

  // Initialize Scan modes
  setupScanToggles();

  // Populate data on render
  renderShop('all');
  renderSignals();
  renderBadges('all');
  renderEvents();
  renderNotifications();

  // [Section 8, 9, 10 duplicate handlers removed to resolve SyntaxError and prevent dual event listeners]

  // ==========================================
  // 11. Venue Map & Radar HUD Animation
  // ==========================================
  const heroScrollOverlay = document.getElementById('hero-scroll-overlay');
  window.addEventListener('scroll', () => {
    if (!heroScrollOverlay) return;
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const opacity = Math.min(scrollY / (windowHeight * 0.8), 0.85);
    heroScrollOverlay.style.opacity = opacity;
  });

  const heroCtaBtn = document.getElementById('hero-cta-btn');
  const heroContent = document.querySelector('.hero-content');
  if (heroCtaBtn && heroContent) {
    heroCtaBtn.addEventListener('mouseenter', () => {
      heroContent.classList.add('cta-hovered');
    });
    heroCtaBtn.addEventListener('mouseleave', () => {
      heroContent.classList.remove('cta-hovered');
    });
  }

  // ==========================================
  // 12. Thirsty Passport Generator Logic
  // ==========================================
  let uploadedImage = null;

  const drawPassport = () => {
    const canvases = [
      document.getElementById('passport-canvas'),
      document.getElementById('dash-passport-canvas')
    ];

    const w = 600;
    const h = 800;

    // Fetch inputs
    const nameInput = document.getElementById('passport-input-name') || document.getElementById('dash-passport-input-name');
    const pobInput = document.getElementById('passport-input-pob') || document.getElementById('dash-passport-input-pob');
    const genderInput = document.getElementById('passport-input-gender') || document.getElementById('dash-passport-input-gender');
    const sigInput = document.getElementById('passport-input-sig') || document.getElementById('dash-passport-input-sig');

    const holderName = (nameInput?.value || 'ADELINE PALMERSTON').toUpperCase();
    const pobVal = (pobInput?.value || 'MANCHESTER').toUpperCase();
    const genderVal = (genderInput?.value || 'F').toUpperCase();
    const sigText = sigInput?.value || 'A. Palmerston';

    canvases.forEach(canvas => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      // Clear canvas
      ctx.clearRect(0, 0, w, h);

      // 1. Burgundy Cover
      ctx.fillStyle = '#5A060C';
      ctx.beginPath();
      ctx.roundRect(0, 0, w, h, 24);
      ctx.fill();

      // Page dimensions
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

      // Security waves
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

      // Crease and shadows
      let gradTop = ctx.createLinearGradient(0, 350, 0, 385);
      gradTop.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradTop.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
      ctx.fillStyle = gradTop;
      ctx.fillRect(20, 350, pageW, 35);

      let gradBottom = ctx.createLinearGradient(0, 415, 0, 450);
      gradBottom.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
      gradBottom.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradBottom;
      ctx.fillRect(20, 415, pageW, 35);

      // Spine crease line
      let gradSpine = ctx.createLinearGradient(0, 385, 0, 415);
      gradSpine.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
      gradSpine.addColorStop(0.5, 'rgba(0, 0, 0, 0.85)');
      gradSpine.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
      ctx.fillStyle = gradSpine;
      ctx.fillRect(0, 385, w, 30);

      // 5. Draw Top Page Content
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

      // Biohazard Watermark
      const drawBiohazard = (x0, y0) => {
        ctx.strokeStyle = 'rgba(139, 131, 120, 0.16)';
        ctx.fillStyle = 'rgba(139, 131, 120, 0.16)';
        ctx.lineWidth = 9;
        const rOuter = 35;
        const offset = 26;

        ctx.beginPath();
        ctx.arc(x0, y0 - offset, rOuter, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x0 - offset * Math.cos(Math.PI/6), y0 + offset * Math.sin(Math.PI/6), rOuter, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x0 + offset * Math.cos(Math.PI/6), y0 + offset * Math.sin(Math.PI/6), rOuter, 0, Math.PI * 2);
        ctx.stroke();

        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x0, y0, 48, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x0, y0, 9, 0, Math.PI * 2);
        ctx.fill();
      };
      drawBiohazard(300, 202);

      // Right vertical title on Top Page
      ctx.save();
      ctx.translate(505, 202);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.font = '900 28px "Kyrilla", sans-serif';
      ctx.fillText("Thirstyclub999", 0, -8);
      ctx.font = '700 13px "Kyrilla", sans-serif';
      ctx.fillText("PASSPORT", 0, 18);
      ctx.restore();

      // 6. Draw Bottom Page Content
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'left';
      ctx.font = '900 22px "Kyrilla", sans-serif';
      ctx.fillText("ThirstyClub999", 45, 452);
      ctx.font = '700 11px "Kyrilla", sans-serif';
      ctx.fillText("PASSPORT", 45 + 5, 470);

      // Photo slot on bottom page
      const uPhotoX = 45;
      const uPhotoY = 492;
      const uPhotoW = 185;
      const uPhotoH = 245;

      if (uploadedImage) {
        ctx.save();
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

        // Avatar silhouette placeholder
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

      // Details Table
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

      const drawRowFull = (label, value, rx, ry, rw, isCursive = false) => {
        ctx.fillStyle = '#1b4d3e';
        ctx.textAlign = 'left';
        ctx.font = 'italic 10px sans-serif';
        ctx.fillText(label, rx + 8, ry + 16);

        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        if (isCursive) {
          ctx.font = 'italic 20px "Brush Script MT", "Apple Chancery", cursive, sans-serif';
          ctx.fillText(value, rx + rw / 2, ry + 42);
        } else {
          ctx.font = '900 13px "Kyrilla", sans-serif';
          ctx.fillText(value, rx + rw / 2, ry + 42);
        }
      };

      drawRowFull("Name:", holderName, tblX, tblY, tblW);
      drawRowFull("Place of Thirst:", pobVal, tblX, tblY + rowH, tblW);
      drawRowFull("Gender:", genderVal, tblX, tblY + 2 * rowH, tblW);
      drawRowFull("Signature:", sigText, tblX, tblY + 3 * rowH, tblW, true);
    });
  };

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

        const fileInfos = document.querySelectorAll('#passport-file-info');
        fileInfos.forEach(info => {
          info.textContent = `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
          info.style.color = 'var(--accent-color)';
        });

        const downloadPassportBtns = document.querySelectorAll('#download-passport-btn');
        downloadPassportBtns.forEach(btn => {
          btn.disabled = false;
        });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Bind file dropzones & inputs for both landing page and dashboard views
  const hookAllUploaders = () => {
    const dropzones = document.querySelectorAll('#passport-dropzone, .dropzone-area');
    dropzones.forEach(zone => {
      const input = zone.querySelector('input[type="file"]') || document.getElementById('passport-file-input');
      if (!zone || !input) return;

      zone.addEventListener('click', () => input.click());
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        handlePassportFile(file);
      });

      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
      });

      ['dragleave', 'dragend'].forEach(type => {
        zone.addEventListener(type, () => {
          zone.classList.remove('dragover');
        });
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
          handlePassportFile(file);
        }
      });
    });
  };
  hookAllUploaders();

  // Redraw whenever any passport builder inputs change values (desktop & mobile)
  const allPassportFields = document.querySelectorAll(
    '#passport-input-name, #passport-input-pob, #passport-input-gender, #passport-input-sig, ' +
    '#dash-passport-input-name, #dash-passport-input-pob, #dash-passport-input-gender, #dash-passport-input-sig'
  );
  allPassportFields.forEach(field => {
    if (field) field.addEventListener('input', () => drawPassport());
  });

  // Download listeners for both buttons
  const downloadBtns = document.querySelectorAll('#download-passport-btn');
  downloadBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const canvas = document.getElementById('dash-passport-canvas') || document.getElementById('passport-canvas');
      if (!canvas || !uploadedImage) return;

      const nameInput = document.getElementById('passport-input-name') || document.getElementById('dash-passport-input-name');
      const holderName = (nameInput?.value || 'guest').toLowerCase().replace(/\s+/g, '-');

      const link = document.createElement('a');
      link.download = `thirstyclub999-passport-${holderName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  });

  // ==========================================
  // 13. Initialization & Counter Animation
  // ==========================================
  const animateCounter = (elementId, targetVal) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    const duration = 1500;
    const startTime = performance.now();
    
    const updateCount = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress * (2 - progress);
      const currentVal = Math.floor(easeProgress * targetVal);
      
      el.textContent = String(currentVal).padStart(3, '0');
      
      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        el.textContent = targetVal;
      }
    };
    
    requestAnimationFrame(updateCount);
  };

  // Setup dynamic settings switch toggles
  const toggleDarkMode = document.getElementById('toggle-dark-mode');
  if (toggleDarkMode) {
    toggleDarkMode.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.documentElement.style.setProperty('--bg-color', '#000000');
        document.documentElement.style.setProperty('--text-color', '#ffffff');
      } else {
        // Light mode simulation
        document.documentElement.style.setProperty('--bg-color', '#ffffff');
        document.documentElement.style.setProperty('--text-color', '#111111');
      }
    });
  }

  // Setup Next Drop countdown timers (Homepage and Drops view)
  const targetDropTime = new Date('June 14, 2026 16:00:00').getTime();

  const updateCountdownTimers = () => {
    const now = new Date().getTime();
    const distance = targetDropTime - now;

    if (distance < 0) {
      const expiredText = "00 : 00 : 00 : 00";
      const homeTimer = document.getElementById('home-drop-timer');
      const crateTimer = document.getElementById('drops-crate-timer');
      if (homeTimer) homeTimer.textContent = expiredText;
      if (crateTimer) crateTimer.textContent = expiredText;
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const timeString = `${String(days).padStart(2, '0')} : ${String(hours).padStart(2, '0')} : ${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`;

    const homeTimer = document.getElementById('home-drop-timer');
    const crateTimer = document.getElementById('drops-crate-timer');
    if (homeTimer) homeTimer.textContent = timeString;
    if (crateTimer) crateTimer.textContent = timeString;
  };

  setInterval(updateCountdownTimers, 1000);
  updateCountdownTimers();

  // ==========================================
  // Admin Portal Functionalities
  // ==========================================
  let adminFetchedUsers = [];
  let currentAdminView = 'table';

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
      let users = [];

      const totalEl = document.getElementById('admin-stat-total');
      if (totalEl) totalEl.textContent = 'Loading...';

      let allData = [];
      let from = 0;
      const step = 1000;
      let fetchMore = true;

      while (fetchMore) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, email, thirstyclub_id, created_at, socials')
          .order('created_at', { ascending: false })
          .range(from, from + step - 1);

        if (error) throw error;
        
        if (data && data.length > 0) {
          allData = allData.concat(data);
          from += step;
          if (data.length < step) {
            fetchMore = false;
          }
        } else {
          fetchMore = false;
        }
      }

      users = allData;
      adminFetchedUsers = users;

      if (!window.adminRealtimeSubscription) {
        window.adminRealtimeSubscription = supabase
          .channel('public:profiles')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, payload => {
            const tbody = document.getElementById('admin-users-list');
            if (!tbody) return;

            if (payload.eventType === 'INSERT') {
              adminFetchedUsers.unshift(payload.new);
            } else if (payload.eventType === 'UPDATE') {
              const idx = adminFetchedUsers.findIndex(u => u.id === payload.new.id);
              if (idx !== -1) {
                adminFetchedUsers[idx] = payload.new;
              } else {
                adminFetchedUsers.push(payload.new);
              }
            } else if (payload.eventType === 'DELETE') {
              adminFetchedUsers = adminFetchedUsers.filter(u => u.id !== payload.old.id);
            }
            renderAdminData();
          })
          .subscribe();
      }

      renderAdminData();
      
      try {
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('socials')
          .eq('id', currentSession.user.id)
          .single();

        if (adminProfile && adminProfile.socials) {
          const subjectEl = document.getElementById('admin-email-subject');
          const messageEl = document.getElementById('admin-email-message');
          if (subjectEl) subjectEl.value = adminProfile.socials.welcome_email_subject || '';
          if (messageEl) messageEl.value = adminProfile.socials.welcome_email_message || '';
        }
      } catch (templateErr) {
        console.warn("Failed to load email template configuration:", templateErr);
      }

    } catch (err) {
      console.error("Error loading admin dashboard:", err);
      alert("Error loading admin dashboard: " + err.message);
    }
  };

  const renderAdminData = () => {
    if (!adminFetchedUsers) return;

    let filtered = [...adminFetchedUsers];

    const searchInput = document.getElementById('admin-table-search');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    if (query) {
      filtered = filtered.filter(user => {
        const searchableText = `${user.thirstyclub_id || ''} ${user.username || ''} ${user.email || ''}`.toLowerCase();
        return searchableText.includes(query);
      });
    }

    const filterSelect = document.getElementById('admin-filter-select');
    const filterVal = filterSelect ? filterSelect.value : 'all';
    
    const CURRENT_EVENT_ID = "THIRSTYNALIA_2026";

    if (filterVal !== 'all') {
      filtered = filtered.filter(user => {
        const gender = (user.socials?.gender || '').trim().toLowerCase();
        const accessLvl = (user.socials?.access_level || 'REGULAR').toLowerCase();
        const stamps = Array.isArray(user.socials?.stamps) ? user.socials.stamps : [];
        const isCheckedIn = stamps.some(s => s.event_id === CURRENT_EVENT_ID);

        switch (filterVal) {
          case 'checked-in': return isCheckedIn;
          case 'pending': return !isCheckedIn;
          case 'vip': return accessLvl === 'vip';
          case 'regular': return accessLvl === 'regular';
          case 'male': return gender === 'm' || gender === 'male';
          case 'female': return gender === 'f' || gender === 'female';
          default: return true;
        }
      });
    }

    const sortSelect = document.getElementById('admin-sort-select');
    const sortVal = sortSelect ? sortSelect.value : 'newest';

    filtered.sort((a, b) => {
      if (sortVal === 'newest') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortVal === 'oldest') {
        return new Date(a.created_at) - new Date(b.created_at);
      } else if (sortVal === 'name-asc') {
        return (a.username || '').localeCompare(b.username || '');
      } else if (sortVal === 'name-desc') {
        return (b.username || '').localeCompare(a.username || '');
      }
      return 0;
    });

    let maleCount = 0;
    let femaleCount = 0;
    let otherCount = 0;
    filtered.forEach(user => {
      const gender = (user.socials?.gender || '').trim().toUpperCase();
      if (gender === 'M' || gender === 'MALE') maleCount++;
      else if (gender === 'F' || gender === 'FEMALE') femaleCount++;
      else otherCount++;
    });

    const totalEl = document.getElementById('admin-stat-total');
    const maleEl = document.getElementById('admin-stat-male');
    const femaleEl = document.getElementById('admin-stat-female');
    const otherEl = document.getElementById('admin-stat-other');
    if (totalEl) totalEl.textContent = filtered.length;
    if (maleEl) maleEl.textContent = maleCount;
    if (femaleEl) femaleEl.textContent = femaleCount;
    if (otherEl) otherEl.textContent = otherCount;

    const tableView = document.getElementById('admin-table-view');
    const gridView = document.getElementById('admin-grid-view');

    if (currentAdminView === 'table') {
      if (tableView) tableView.style.display = 'block';
      if (gridView) gridView.style.display = 'none';
      renderAdminTable(filtered);
    } else {
      if (tableView) tableView.style.display = 'none';
      if (gridView) gridView.style.display = 'grid';
      renderAdminGrid(filtered);
    }
  };

  const renderAdminGrid = (users) => {
    const gridWrapper = document.getElementById('admin-grid-view');
    if (!gridWrapper) return;
    gridWrapper.innerHTML = '';
    const CURRENT_EVENT_ID = "THIRSTYNALIA_2026";
    let htmlContent = '';

    users.forEach(user => {
      const stamps = Array.isArray(user.socials?.stamps) ? user.socials.stamps : [];
      const isCheckedIn = stamps.some(s => s.event_id === CURRENT_EVENT_ID);
      const checkInBtnClass = isCheckedIn ? 'admin-checkout-btn table-action-btn checkin-active' : 'admin-checkin-btn table-action-btn';
      const checkInBtnText = isCheckedIn ? '✓ Checked In' : 'Check In';
      const accessLvl = user.socials?.access_level || 'REGULAR';
      const gender = (user.socials?.gender || 'N/A').toUpperCase();
      let badgeClass = 'na';
      if (gender === 'M' || gender === 'MALE') badgeClass = 'm';
      if (gender === 'F' || gender === 'FEMALE') badgeClass = 'f';

      htmlContent += `
      <div class="admin-grid-card" style="background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 62, 62, 0.15); border-radius: 8px; padding: 1.2rem; display: flex; flex-direction: column; gap: 1rem;">
        <div class="admin-grid-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div class="admin-grid-name" style="font-weight: 800; color: #fff; font-size: 1rem;">\${escapeHtml(user.username || 'UNKNOWN')}</div>
            <div class="admin-grid-email" style="font-size: 0.8rem; color: var(--admin-text-dim);">\${escapeHtml(user.email || '')}</div>
          </div>
          <span class="badge badge-\${badgeClass}">\${gender}</span>
        </div>
        <div class="admin-grid-details" style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.8rem;">
          <div class="admin-grid-detail-row" style="display: flex; justify-content: space-between;">
            <span style="color: var(--admin-text-dim);">ID</span>
            <span style="font-family: monospace; font-weight: 700;">\${escapeHtml(user.thirstyclub_id || 'T999-XXXX')}</span>
          </div>
          <div class="admin-grid-detail-row" style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: var(--admin-text-dim);">Access Level</span>
            <select class="admin-access-select \${accessLvl === 'VIP' ? 'access-vip' : 'access-regular'}" data-userid="\${escapeHtml(user.id || user.thirstyclub_id || user.email)}" style="background: #111111; color: var(--admin-text); border: 1px solid rgba(255, 62, 62, 0.25); border-radius: 4px; padding: 0.2rem 0.5rem;">
              <option value="REGULAR" \${accessLvl === 'REGULAR' ? 'selected' : ''}>REGULAR</option>
              <option value="VIP" \${accessLvl === 'VIP' ? 'selected' : ''}>VIP</option>
            </select>
          </div>
        </div>
        <div class="admin-grid-actions" style="display: flex; gap: 0.5rem; margin-top: auto;">
          <button class="\${checkInBtnClass}" data-userid="\${escapeHtml(user.id || user.thirstyclub_id || user.email)}" style="flex: 1;">\${checkInBtnText}</button>
          <button class="admin-view-passport-btn table-action-btn" data-email="\${escapeHtml(user.email)}" style="flex: 1;">View Passport</button>
        </div>
      </div>
      `;
    });
    gridWrapper.innerHTML = htmlContent;
  };

  const renderAdminTable = (users) => {
    const tbody = document.getElementById('admin-users-list');
    if (!tbody) return;
    tbody.innerHTML = '';
    const CURRENT_EVENT_ID = "THIRSTYNALIA_2026";
    let htmlContent = '';

    users.forEach(user => {
      const stamps = Array.isArray(user.socials?.stamps) ? user.socials.stamps : [];
      const isCheckedIn = stamps.some(s => s.event_id === CURRENT_EVENT_ID);
      const checkInBtnClass = isCheckedIn ? 'admin-checkout-btn table-action-btn checkin-active' : 'admin-checkin-btn table-action-btn';
      const checkInBtnText = isCheckedIn ? '✓ Checked In' : 'Check In';
      const accessLvl = user.socials?.access_level || 'REGULAR';
      const gender = (user.socials?.gender || 'N/A').toUpperCase();
      let badgeClass = 'na';
      if (gender === 'M' || gender === 'MALE') badgeClass = 'm';
      if (gender === 'F' || gender === 'FEMALE') badgeClass = 'f';

      const regDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A';

      htmlContent += `
      <tr>
        <td>\${escapeHtml(user.thirstyclub_id || 'T999-XXXX')}</td>
        <td style="font-weight: 700; color: #fff;">\${escapeHtml(user.username || 'UNKNOWN')}</td>
        <td>\${escapeHtml(user.email || '')}</td>
        <td><span class="badge badge-\${badgeClass}">\${gender}</span></td>
        <td>
          <select class="admin-access-select \${accessLvl === 'VIP' ? 'access-vip' : 'access-regular'}" data-userid="\${escapeHtml(user.id || user.thirstyclub_id || user.email)}" style="background: #111111; color: var(--admin-text); border: 1px solid rgba(255, 62, 62, 0.25); border-radius: 4px; padding: 0.2rem 0.5rem;">
            <option value="REGULAR" \${accessLvl === 'REGULAR' ? 'selected' : ''}>REGULAR</option>
            <option value="VIP" \${accessLvl === 'VIP' ? 'selected' : ''}>VIP</option>
          </select>
        </td>
        <td>\${regDate}</td>
        <td>
          <button class="\${checkInBtnClass}" data-userid="\${escapeHtml(user.id || user.thirstyclub_id || user.email)}" style="margin-right: 4px; padding: 0.4rem 0.8rem; border-radius: 6px;">\${checkInBtnText}</button>
          <button class="admin-view-passport-btn table-action-btn" data-email="\${escapeHtml(user.email)}" style="padding: 0.4rem 0.8rem; border-radius: 6px;">View Passport</button>
        </td>
      </tr>
      `;
    });
    tbody.innerHTML = htmlContent;
  };

  const drawAdminPassportOnCanvas = (canvasId, profile, userImage) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const w = 600;
    const h = 800;
    
    ctx.clearRect(0, 0, w, h);
    
    // 1. Burgundy Cover
    ctx.fillStyle = '#5A060C';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 24);
    ctx.fill();
    
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
    
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(20, 20, pageW, pageH, [16, 16, 0, 0]);
    ctx.clip();
    drawWaves(20, 385);
    ctx.restore();
    
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(20, 415, pageW, pageH, [0, 0, 16, 16]);
    ctx.clip();
    drawWaves(415, 780);
    ctx.restore();
    
    // 4. Crease and shadows
    let gradTop = ctx.createLinearGradient(0, 350, 0, 385);
    gradTop.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradTop.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    ctx.fillStyle = gradTop;
    ctx.fillRect(20, 350, pageW, 35);

    let gradBottom = ctx.createLinearGradient(0, 415, 0, 450);
    gradBottom.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
    gradBottom.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradBottom;
    ctx.fillRect(20, 415, pageW, 35);

    let gradSpine = ctx.createLinearGradient(0, 385, 0, 415);
    gradSpine.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
    gradSpine.addColorStop(0.5, 'rgba(0, 0, 0, 0.85)');
    gradSpine.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
    ctx.fillStyle = gradSpine;
    ctx.fillRect(0, 385, w, 30);
    
    // 5. Draw Top Page Content
    const sigText = profile.socials?.signature || 'Thirstyzoid';
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

    // Biohazard Watermark
    const drawBiohazard = (x0, y0) => {
      ctx.strokeStyle = 'rgba(139, 131, 120, 0.16)';
      ctx.fillStyle = 'rgba(139, 131, 120, 0.16)';
      ctx.lineWidth = 9;
      const rOuter = 35;
      const offset = 26;

      ctx.beginPath();
      ctx.arc(x0, y0 - offset, rOuter, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x0 - offset * Math.cos(Math.PI/6), y0 + offset * Math.sin(Math.PI/6), rOuter, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x0 + offset * Math.cos(Math.PI/6), y0 + offset * Math.sin(Math.PI/6), rOuter, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x0, y0, 48, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x0, y0, 9, 0, Math.PI * 2);
      ctx.fill();
    };
    drawBiohazard(300, 202);

    ctx.save();
    ctx.translate(505, 202);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.font = '900 28px "Kyrilla", sans-serif';
    ctx.fillText("Thirstyclub999", 0, -8);
    ctx.font = '700 13px "Kyrilla", sans-serif';
    ctx.fillText("PASSPORT", 0, 18);
    ctx.restore();

    // 6. Draw Bottom Page Content
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.font = '900 22px "Kyrilla", sans-serif';
    ctx.fillText("ThirstyClub999", 45, 452);
    ctx.font = '700 11px "Kyrilla", sans-serif';
    ctx.fillText("PASSPORT", 45 + 5, 470);

    const uPhotoX = 45;
    const uPhotoY = 492;
    const uPhotoW = 185;
    const uPhotoH = 245;

    if (userImage) {
      ctx.save();
      ctx.filter = 'grayscale(100%)';
      const imgW = userImage.width;
      const imgH = userImage.height;
      const aspect = uPhotoW / uPhotoH;
      let srcW, srcH, srcX, srcY;
      
      if (imgW / imgH > aspect) {
        srcH = imgH;
        srcW = imgH * aspect;
        srcX = (imgW - srcW) / 2;
        srcY = 0;
      } else {
        srcW = userImage.width;
        srcH = userImage.width / aspect;
        srcX = 0;
        srcY = (imgH - srcH) / 2;
      }
      ctx.drawImage(userImage, srcX, srcY, srcW, srcH, uPhotoX, uPhotoY, uPhotoW, uPhotoH);
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.fillRect(uPhotoX, uPhotoY, uPhotoW, uPhotoH);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.lineWidth = 1;
      ctx.strokeRect(uPhotoX, uPhotoY, uPhotoW, uPhotoH);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.beginPath();
      ctx.arc(uPhotoX + uPhotoW/2, uPhotoY + uPhotoH/3, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(uPhotoX + uPhotoW/2, uPhotoY + uPhotoH * 0.72, 52, 36, 0, Math.PI, 0);
      ctx.fill();
    }
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(uPhotoX, uPhotoY, uPhotoW, uPhotoH);

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

    const nameVal = (profile.username || 'THIRSTYZOID').toUpperCase();
    const pobVal = (profile.socials?.place_of_thirst || 'LAGOS').toUpperCase();
    const genderVal = (profile.socials?.gender || 'F').toUpperCase();
    const finalSigVal = profile.socials?.signature || sigText;

    const drawRowFull = (label, value, rx, ry, rw, isCursive = false) => {
      ctx.fillStyle = '#1b4d3e';
      ctx.textAlign = 'left';
      ctx.font = 'italic 10px sans-serif';
      ctx.fillText(label, rx + 8, ry + 16);

      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      if (isCursive) {
        ctx.font = 'italic 20px "Brush Script MT", "Apple Chancery", cursive, sans-serif';
        ctx.fillText(value, rx + rw / 2, ry + 42);
      } else {
        ctx.font = '900 13px "Kyrilla", sans-serif';
        ctx.fillText(value, rx + rw / 2, ry + 42);
      }
    };

    drawRowFull("Name:", nameVal, tblX, tblY, tblW);
    drawRowFull("Place of Thirst:", pobVal, tblX, tblY + rowH, tblW);
    drawRowFull("Gender:", genderVal, tblX, tblY + 2 * rowH, tblW);
    drawRowFull("Signature:", finalSigVal, tblX, tblY + 3 * rowH, tblW, true);
  };

  // Bind Admin dashboard actions via event delegation
  document.addEventListener('change', async (e) => {
    if (e.target && e.target.classList.contains('admin-access-select')) {
      const select = e.target;
      const userId = select.getAttribute('data-userid');
      const newAccess = select.value;

      const userProfile = adminFetchedUsers.find(u => String(u.id) === String(userId) || String(u.thirstyclub_id) === String(userId) || String(u.email) === String(userId));
      if (!userProfile) return;

      select.disabled = true;

      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            socials: {
              ...userProfile.socials,
              access_level: newAccess
            }
          })
          .eq('id', userProfile.id);

        if (error) throw error;

        userProfile.socials = userProfile.socials || {};
        userProfile.socials.access_level = newAccess;

        select.className = `admin-access-select \${newAccess === 'VIP' ? 'access-vip' : 'access-regular'}`;
      } catch (err) {
        alert("Failed to update access level: " + err.message);
        const prevAccess = adminFetchedUsers.find(u => String(u.id) === String(userId) || String(u.thirstyclub_id) === String(userId) || String(u.email) === String(userId))?.socials?.access_level || 'REGULAR';
        select.value = prevAccess;
      } finally {
        select.disabled = false;
      }
    }
  });

  document.addEventListener('click', async (e) => {
    if (e.target && e.target.classList.contains('admin-checkin-btn')) {
      const btn = e.target;
      const userId = btn.getAttribute('data-userid');
      const user = adminFetchedUsers.find(u => String(u.id) === String(userId) || String(u.thirstyclub_id) === String(userId) || String(u.email) === String(userId));
      if (!user) return;

      btn.disabled = true;
      btn.textContent = '...';

      const CURRENT_EVENT_ID = "THIRSTYNALIA_2026";
      const newStamps = Array.isArray(user.socials?.stamps) ? [...user.socials.stamps] : [];
      newStamps.push({
        event_id: CURRENT_EVENT_ID,
        timestamp: new Date().toISOString()
      });

      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            socials: {
              ...user.socials,
              stamps: newStamps
            }
          })
          .eq('id', user.id);

        if (error) throw error;

        user.socials = user.socials || {};
        user.socials.stamps = newStamps;

        btn.textContent = '✓ Checked In';
        btn.classList.remove('admin-checkin-btn');
        btn.classList.add('admin-checkout-btn', 'checkin-active');
      } catch (err) {
        alert("Failed to check in: " + err.message);
        btn.textContent = 'Check In';
      } finally {
        btn.disabled = false;
      }
    }

    if (e.target && e.target.classList.contains('admin-checkout-btn')) {
      const btn = e.target;
      const userId = btn.getAttribute('data-userid');
      const user = adminFetchedUsers.find(u => String(u.id) === String(userId) || String(u.thirstyclub_id) === String(userId) || String(u.email) === String(userId));
      if (!user) return;

      if (!confirm(`Are you sure you want to Check Out \${user.username}?`)) return;

      btn.disabled = true;
      btn.textContent = '...';

      const CURRENT_EVENT_ID = "THIRSTYNALIA_2026";
      const stamps = Array.isArray(user.socials?.stamps) ? user.socials.stamps : [];
      const newStamps = stamps.filter(s => s.event_id !== CURRENT_EVENT_ID);

      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            socials: {
              ...user.socials,
              stamps: newStamps
            }
          })
          .eq('id', user.id);

        if (error) throw error;

        user.socials = user.socials || {};
        user.socials.stamps = newStamps;

        btn.textContent = 'Check In';
        btn.classList.remove('admin-checkout-btn', 'checkin-active');
        btn.classList.add('admin-checkin-btn');
      } catch (err) {
        alert("Failed to check out: " + err.message);
        btn.textContent = '✓ Checked In';
      } finally {
        btn.disabled = false;
      }
    }

    if (e.target && e.target.classList.contains('admin-view-passport-btn')) {
      const btn = e.target;
      const email = btn.getAttribute('data-email');
      const user = adminFetchedUsers.find(u => u.email === email);
      if (!user) return;

      const modal = document.getElementById('admin-passport-modal');
      if (modal) {
        modal.showModal();
        const canvas = document.getElementById('admin-passport-canvas');
        if (canvas) {
          const userImg = new Image();
          userImg.crossOrigin = 'anonymous';
          userImg.onload = () => {
            drawAdminPassportOnCanvas('admin-passport-canvas', user, userImg);
          };
          userImg.onerror = () => {
            drawAdminPassportOnCanvas('admin-passport-canvas', user, null);
          };
          userImg.src = user.avatar_url || defaultAvatar;
        }

        const dlBtn = document.getElementById('admin-download-passport-btn');
        if (dlBtn) {
          dlBtn.onclick = () => {
            const canvas = document.getElementById('admin-passport-canvas');
            if (!canvas) return;
            const link = document.createElement('a');
            link.download = `thirstyclub999-passport-\${(user.username || 'guest').toLowerCase().replace(/\\s+/g, '-')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
          };
        }

        const modalCheckinBtn = document.getElementById('admin-modal-checkin-btn');
        if (modalCheckinBtn) {
          const CURRENT_EVENT_ID = "THIRSTYNALIA_2026";
          const stamps = Array.isArray(user.socials?.stamps) ? user.socials.stamps : [];
          const isCheckedIn = stamps.some(s => s.event_id === CURRENT_EVENT_ID);

          modalCheckinBtn.textContent = isCheckedIn ? 'CHECK OUT' : 'CHECK IN';
          modalCheckinBtn.style.background = isCheckedIn ? 'rgba(255, 62, 62, 0.12)' : '#fff';
          modalCheckinBtn.style.color = 'var(--accent-color)';

          modalCheckinBtn.onclick = async () => {
            modalCheckinBtn.disabled = true;
            modalCheckinBtn.textContent = '...';

            if (isCheckedIn) {
              const newStamps = stamps.filter(s => s.event_id !== CURRENT_EVENT_ID);
              try {
                const { error } = await supabase
                  .from('profiles')
                  .update({ socials: { ...user.socials, stamps: newStamps } })
                  .eq('id', user.id);

                if (error) throw error;
                user.socials.stamps = newStamps;
                modalCheckinBtn.textContent = 'CHECK IN';
                modalCheckinBtn.style.background = '#fff';

                const listBtn = document.querySelector(`.admin-checkout-btn[data-userid="\${user.id}"]`);
                if (listBtn) {
                  listBtn.classList.remove('admin-checkout-btn', 'checkin-active');
                  listBtn.classList.add('admin-checkin-btn');
                  listBtn.textContent = 'Check In';
                }
                modal.close();
              } catch (err) {
                alert("Failed to checkout: " + err.message);
              } finally {
                modalCheckinBtn.disabled = false;
              }
            } else {
              const newStamps = [...stamps];
              newStamps.push({ event_id: CURRENT_EVENT_ID, timestamp: new Date().toISOString() });
              try {
                const { error } = await supabase
                  .from('profiles')
                  .update({ socials: { ...user.socials, stamps: newStamps } })
                  .eq('id', user.id);

                if (error) throw error;
                user.socials.stamps = newStamps;
                modalCheckinBtn.textContent = 'CHECK OUT';
                modalCheckinBtn.style.background = 'rgba(255, 62, 62, 0.12)';

                const listBtn = document.querySelector(`.admin-checkin-btn[data-userid="\${user.id}"]`);
                if (listBtn) {
                  listBtn.classList.remove('admin-checkin-btn');
                  listBtn.classList.add('admin-checkout-btn', 'checkin-active');
                  listBtn.textContent = '✓ Checked In';
                }
                modal.close();
              } catch (err) {
                alert("Failed to checkin: " + err.message);
              } finally {
                modalCheckinBtn.disabled = false;
              }
            }
          };
        }
      }
    }
  });

  const adminPassportModal = document.getElementById('admin-passport-modal');
  const closeAdminPassportModalBtn = document.getElementById('close-admin-passport-modal');
  if (closeAdminPassportModalBtn && adminPassportModal) {
    closeAdminPassportModalBtn.addEventListener('click', () => {
      adminPassportModal.close();
    });
  }

  if (adminPassportModal) {
    adminPassportModal.addEventListener('click', (e) => {
      const rect = adminPassportModal.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        adminPassportModal.close();
      }
    });
  }

  // Email Template Save handler
  const saveWelcomeBtn = document.getElementById('admin-save-email-template-btn');
  if (saveWelcomeBtn) {
    saveWelcomeBtn.addEventListener('click', async () => {
      const subject = document.getElementById('admin-email-subject')?.value.trim();
      const message = document.getElementById('admin-email-message')?.value.trim();

      if (!subject || !message) {
        alert("Please provide both subject and message body template.");
        return;
      }

      saveWelcomeBtn.disabled = true;
      saveWelcomeBtn.textContent = "Saving...";

      try {
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('socials')
          .eq('id', currentSession.user.id)
          .single();

        const updatedSocials = {
          ...(adminProfile?.socials || {}),
          welcome_email_subject: subject,
          welcome_email_message: message
        };

        const { error } = await supabase
          .from('profiles')
          .update({ socials: updatedSocials })
          .eq('id', currentSession.user.id);

        if (error) throw error;
        alert("Email template saved successfully! Newly registered users will receive this template automatically.");
      } catch (err) {
        alert("Failed to save template: " + err.message);
      } finally {
        saveWelcomeBtn.disabled = false;
        saveWelcomeBtn.textContent = "SAVE TEMPLATE";
      }
    });
  }

  // Broadcast Email Blast handler
  const broadcastBtn = document.getElementById('admin-broadcast-email-btn');
  const broadcastSubject = document.getElementById('admin-broadcast-subject');
  const broadcastMessage = document.getElementById('admin-broadcast-message');
  const broadcastStatusContainer = document.getElementById('broadcast-status-container');
  const broadcastProgressBar = document.getElementById('broadcast-progress-bar');
  const broadcastStatusText = document.getElementById('broadcast-status-text');

  if (broadcastBtn) {
    broadcastBtn.addEventListener('click', async () => {
      const subject = broadcastSubject?.value.trim();
      const message = broadcastMessage?.value.trim();

      if (!subject || !message) {
        alert("Please provide both email subject and message body for broadcast blast.");
        return;
      }

      if (!adminFetchedUsers || adminFetchedUsers.length === 0) {
        alert("No registered users fetched to blast.");
        return;
      }

      if (!confirm(`Are you sure you want to send this broadcast email to all \${adminFetchedUsers.length} users?`)) {
        return;
      }

      broadcastBtn.disabled = true;
      if (broadcastStatusContainer) broadcastStatusContainer.style.display = 'block';
      if (broadcastProgressBar) broadcastProgressBar.style.width = '0%';

      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < adminFetchedUsers.length; i++) {
        const user = adminFetchedUsers[i];
        const pct = Math.round(((i + 1) / adminFetchedUsers.length) * 100);
        if (broadcastProgressBar) broadcastProgressBar.style.width = `\${pct}%`;
        if (broadcastStatusText) {
          broadcastStatusText.textContent = `Sending to \${user.email} (\${i + 1}/\${adminFetchedUsers.length})...`;
        }

        try {
          const response = await fetch('/api/admin-broadcast-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              admin_email: currentSession?.user?.email,
              target_user_id: user.id,
              subject: subject,
              message_body: message
            })
          });

          if (!response.ok) {
            const errRes = await response.json();
            throw new Error(errRes.error || 'Server error');
          }
          successCount++;
        } catch (sendErr) {
          console.error(`Failed to send broadcast to \${user.email}:`, sendErr);
          failureCount++;
        }
      }

      if (broadcastStatusText) {
        broadcastStatusText.textContent = `Blast finished. Sent: \${successCount}. Failed: \${failureCount}`;
      }
      alert(`Broadcast Email Blast complete!\n\nSuccessfully Sent: \${successCount}\nFailed: \${failureCount}`);
      broadcastBtn.disabled = false;
    });
  }

  // Admin Controls (Search/Filter/Sort/Toggles)
  const adminTableSearch = document.getElementById('admin-table-search');
  const adminFilterSelect = document.getElementById('admin-filter-select');
  const adminSortSelect = document.getElementById('admin-sort-select');
  const adminViewTableBtn = document.getElementById('admin-view-table-btn');
  const adminViewGridBtn = document.getElementById('admin-view-grid-btn');

  if (adminTableSearch) {
    let searchDebounce = null;
    adminTableSearch.addEventListener('input', () => {
      if (searchDebounce) clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        renderAdminData();
      }, 250);
    });
  }
  if (adminFilterSelect) {
    adminFilterSelect.addEventListener('change', () => {
      renderAdminData();
    });
  }
  if (adminSortSelect) {
    adminSortSelect.addEventListener('change', () => {
      renderAdminData();
    });
  }
  if (adminViewTableBtn && adminViewGridBtn) {
    adminViewTableBtn.addEventListener('click', () => {
      currentAdminView = 'table';
      adminViewTableBtn.classList.add('active');
      adminViewTableBtn.style.background = 'var(--accent-color)';
      adminViewTableBtn.style.color = '#fff';
      adminViewTableBtn.style.borderColor = 'var(--accent-color)';

      adminViewGridBtn.classList.remove('active');
      adminViewGridBtn.style.background = 'rgba(15, 15, 15, 0.6)';
      adminViewGridBtn.style.color = 'var(--admin-text-dim)';
      adminViewGridBtn.style.borderColor = 'rgba(255, 62, 62, 0.2)';
      renderAdminData();
    });

    adminViewGridBtn.addEventListener('click', () => {
      currentAdminView = 'grid';
      adminViewGridBtn.classList.add('active');
      adminViewGridBtn.style.background = 'var(--accent-color)';
      adminViewGridBtn.style.color = '#fff';
      adminViewGridBtn.style.borderColor = 'var(--accent-color)';

      adminViewTableBtn.classList.remove('active');
      adminViewTableBtn.style.background = 'rgba(15, 15, 15, 0.6)';
      adminViewTableBtn.style.color = 'var(--admin-text-dim)';
      adminViewTableBtn.style.borderColor = 'rgba(255, 62, 62, 0.2)';
      renderAdminData();
    });
  }

  const adminRefreshBtn = document.getElementById('admin-refresh-btn');
  if (adminRefreshBtn) {
    adminRefreshBtn.addEventListener('click', async () => {
      adminRefreshBtn.textContent = '↻ Refreshing...';
      adminRefreshBtn.disabled = true;
      try {
        await loadAdminDashboard();
      } catch (err) {
        console.error(err);
      } finally {
        adminRefreshBtn.textContent = '↻ Refresh';
        adminRefreshBtn.disabled = false;
      }
    });
  }

  const adminSyncMailchimpBtn = document.getElementById('admin-sync-mailchimp-btn');
  if (adminSyncMailchimpBtn) {
    adminSyncMailchimpBtn.addEventListener('click', async () => {
      if (!confirm("Are you sure you want to sync all verified guestlist users to Mailchimp?")) {
        return;
      }
      adminSyncMailchimpBtn.textContent = '🐒 Syncing...';
      adminSyncMailchimpBtn.disabled = true;
      try {
        const response = await fetch('/api/admin-sync-mailchimp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ admin_email: currentSession?.user?.email })
        });
        if (!response.ok) {
          const errRes = await response.json();
          throw new Error(errRes.error || 'Server error');
        }
        const resData = await response.json();
        alert(`Mailchimp sync complete!\n\nAdded: \${resData.added || 0}\nUpdated: \${resData.updated || 0}\nErrors: \${resData.errors || 0}`);
      } catch (err) {
        alert("Failed to sync Mailchimp: " + err.message);
      } finally {
        adminSyncMailchimpBtn.textContent = '🐒 Sync Mailchimp';
        adminSyncMailchimpBtn.disabled = false;
      }
    });
  }

  updateUI();
  drawPassport();
  
  animateCounter('hero-counter', 999);
  animateCounter('logo-counter', 999);
});

