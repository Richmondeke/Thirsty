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

  // ==========================================
  // 8. Supabase Session State Binding Connector
  // ==========================================
  const SUPABASE_URL = "https://fftfnikbulfayrrjktuo.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdGZuaWtidWxmYXlycmprdHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNjgxNzgsImV4cCI6MjA5Mjc0NDE3OH0.L8U8_f19ZeMSdqvMgk3h7MHqnm6a_X2wukEPoAgz7qA";
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  let currentSession = null;
  let currentUserProfile = null;

  // DOM bindings
  const rsvpPromoCard = document.getElementById('rsvp-promo-card');
  const userDashboardCard = document.getElementById('user-dashboard-card');
  const navDashLink = document.getElementById('nav-dash-link');

  const defaultAvatar = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'><circle cx='50' cy='50' r='50' fill='%23222'/><path d='M50 30a15 15 0 100 30 15 15 0 000-30zM25 80c0-15 15-20 25-20s25 5 25 20' stroke='%23888' stroke-width='4'/></svg>";

  const updateUI = () => {
    const session = currentSession;
    const profile = currentUserProfile;

    if (session && profile) {
      // User is Logged In
      if (rsvpPromoCard) rsvpPromoCard.style.display = 'none';
      if (userDashboardCard) userDashboardCard.style.display = 'flex';
      
      if (navDashLink) {
        navDashLink.textContent = 'Dashboard';
        navDashLink.href = '#tickets';
      }

      // Bind dynamic session strings to layout placeholders
      const displayNames = document.querySelectorAll('.user-display-name');
      displayNames.forEach(el => { el.textContent = profile.username; });

      const avatars = document.querySelectorAll('.user-avatar-placeholder');
      avatars.forEach(el => { el.src = profile.avatar_url || defaultAvatar; });

      const ids = document.querySelectorAll('.user-id-placeholder');
      ids.forEach(el => { el.textContent = profile.thirstyclub_id || 'T999-XXXX'; });

      // Update Passport Generator fields
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
      if (rsvpPromoCard) rsvpPromoCard.style.display = 'block';
      if (userDashboardCard) userDashboardCard.style.display = 'none';
      
      if (navDashLink) {
        navDashLink.textContent = 'Sign In';
        navDashLink.href = '#tickets';
      }

      const passportInputName = document.getElementById('passport-input-name');
      const passportInputId = document.getElementById('passport-input-id');
      if (passportInputName) passportInputName.value = '';
      if (passportInputId) passportInputId.value = '';
      
      drawPassport();
    }
  };

  const syncSessionAndProfile = async (session) => {
    currentSession = session;
    if (session) {
      try {
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
      } catch (err) {
        console.error("Error syncing profile:", err);
      }
    } else {
      currentUserProfile = null;
    }
    updateUI();
  };

  // Auth event listeners
  supabase.auth.onAuthStateChange(async (event, session) => {
    await syncSessionAndProfile(session);
  });

  // ==========================================
  // 9. Auth Dialog & Modal Controls
  // ==========================================
  const modal = document.getElementById('ticket-modal');
  const openAuthBtn = document.getElementById('open-auth-btn');
  const closeModalBtn = document.querySelector('.close-modal');

  const openAuthModal = () => {
    if (currentSession) {
      const ticketsSection = document.getElementById('tickets');
      if (ticketsSection) ticketsSection.scrollIntoView({ behavior: 'smooth' });
    } else if (modal) {
      modal.showModal();
    }
  };

  if (openAuthBtn) openAuthBtn.addEventListener('click', openAuthModal);
  if (navDashLink) {
    navDashLink.addEventListener('click', (e) => {
      if (!currentSession) {
        e.preventDefault();
        openAuthModal();
      }
    });
  }

  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => modal.close());
  }

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

  // Auth Form Tabs switching
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
  // 10. Supabase Authentication Handlers
  // ==========================================

  // Signup Submit
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
          alert("Registration Successful!\n\nYour account is active.");
          modal.close();
          signupForm.reset();
        } else {
          alert("Registration Successful!\n\nPlease check your email inbox to verify your account.");
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

        if (loginId.toUpperCase().startsWith("T999-")) {
          const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('email')
            .eq('thirstyclub_id', loginId.toUpperCase())
            .single();

          if (profileErr || !profile || !profile.email) {
            throw new Error("Invalid ThirstyID.");
          }
          email = profile.email;
        }

        const { error } = await supabase.auth.signInWithPassword({
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
    const canvas = document.getElementById('passport-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, 600, 400);
    
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

    ctx.strokeStyle = '#ff3e3e';
    ctx.lineWidth = 2;
    ctx.strokeRect(15, 15, 570, 370);

    ctx.fillStyle = '#ff3e3e';
    ctx.fillRect(10, 10, 20, 4);
    ctx.fillRect(10, 10, 4, 20);
    ctx.fillRect(570, 10, 20, 4);
    ctx.fillRect(586, 10, 4, 20);
    ctx.fillRect(10, 386, 20, 4);
    ctx.fillRect(10, 370, 4, 20);
    ctx.fillRect(570, 386, 20, 4);
    ctx.fillRect(586, 370, 4, 20);

    ctx.fillStyle = 'rgba(255, 62, 62, 0.6)';
    ctx.font = '8px monospace';
    ctx.fillText("SECURE ACCESS TERMINAL // T999", 25, 28);
    ctx.fillText("SYS.STATUS: VALID", 495, 28);

    const targetX = 40;
    const targetY = 70;
    const targetWidth = 220;
    const targetHeight = 260;

    if (uploadedImage) {
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
      
      ctx.fillStyle = 'rgba(255, 62, 62, 0.12)';
      ctx.fillRect(targetX, targetY, targetWidth, targetHeight);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      for (let y = targetY; y < targetY + targetHeight; y += 4) {
        ctx.fillRect(targetX, y, targetWidth, 1.5);
      }
    } else {
      ctx.fillStyle = 'rgba(255, 62, 62, 0.03)';
      ctx.fillRect(targetX, targetY, targetWidth, targetHeight);
      ctx.strokeStyle = 'rgba(255, 62, 62, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(targetX, targetY, targetWidth, targetHeight);

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

    ctx.strokeStyle = '#ff3e3e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(targetX, targetY, targetWidth, targetHeight);

    ctx.fillStyle = '#ff3e3e';
    ctx.fillRect(targetX - 4, targetY - 4, 12, 3);
    ctx.fillRect(targetX - 4, targetY - 4, 3, 12);
    ctx.fillRect(targetX + targetWidth - 8, targetY - 4, 12, 3);
    ctx.fillRect(targetX + targetWidth + 1, targetY - 4, 3, 12);
    ctx.fillRect(targetX - 4, targetY + targetHeight + 1, 12, 3);
    ctx.fillRect(targetX - 4, targetY + targetHeight - 8, 3, 12);
    ctx.fillRect(targetX + targetWidth - 8, targetY + targetHeight + 1, 12, 3);
    ctx.fillRect(targetX + targetWidth + 1, targetY + targetHeight - 8, 3, 12);

    const holderName = (document.getElementById('passport-input-name')?.value || 'UNREGISTERED GUEST').toUpperCase();
    const holderId = (document.getElementById('passport-input-id')?.value || 'T999-XXXX').toUpperCase();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 20px Kyrilla, Inter, sans-serif';
    ctx.fillText("THIRSTYCLUB999 ACCESS PASS", 290, 95);

    ctx.fillStyle = '#ff3e3e';
    ctx.font = 'bold 10px monospace';
    ctx.fillText("LEVEL // GUEST AUTHENTICATED", 290, 115);

    ctx.fillStyle = '#888888';
    ctx.font = 'bold 10px monospace';
    ctx.fillText("HOLDER NAME", 290, 155);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 16px Kyrilla, Inter, sans-serif';
    ctx.fillText(holderName, 290, 175);

    ctx.fillStyle = '#888888';
    ctx.font = 'bold 10px monospace';
    ctx.fillText("HOLDER CODE", 290, 215);
    ctx.fillStyle = '#ff3e3e';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(holderId, 290, 235);

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
    
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

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

  // Upload handlers
  const passportDropzone = document.getElementById('passport-dropzone');
  const passportFileInput = document.getElementById('passport-file-input');
  const downloadPassportBtn = document.getElementById('download-passport-btn');
  const passportInputName = document.getElementById('passport-input-name');
  const passportInputId = document.getElementById('passport-input-id');

  const handlePassportFile = (file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit.");
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

  if (passportInputName) {
    passportInputName.addEventListener('input', () => drawPassport());
  }
  if (passportInputId) {
    passportInputId.addEventListener('input', () => drawPassport());
  }

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

  updateUI();
  drawPassport();
  
  animateCounter('hero-counter', 999);
  animateCounter('logo-counter', 999);
});

