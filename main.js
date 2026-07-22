document.addEventListener('DOMContentLoaded', () => {
  
  // Register PWA Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registered successfully:', reg.scope))
      .catch(err => console.error('Service Worker registration failed:', err));
  }
  // --- Global Web Haptic Touch Simulator ---
  const triggerHaptic = (duration = 12) => {
    if (navigator.vibrate) {
      try {
        navigator.vibrate(duration);
      } catch (e) {}
    }
  };

  // Bind to any tap/click on interactive elements immediately on pointerdown
  document.addEventListener('pointerdown', (e) => {
    const target = e.target.closest('button, a, .nav-tab-item, .subtab-btn, .carousel-dot, .clickable, input[type="submit"], input[type="button"], .profile-menu-item, .socials a, .lobby-streak-item, .game-select-card');
    if (target) {
      triggerHaptic(12);
    }
  });
  // --- Ad Banner Alternating Colors Controller ---
  let currentAdIndex = 0;
  const updateAdColors = (index) => {
    const card = document.getElementById('community-ad-card');
    if (!card) return;

    const isLightMode = document.documentElement.classList.contains('light-mode');
    let bg, border, overlay, text, sub, dot, shadow;

    if (isLightMode) {
      // Light Mode: Alternates Black and Dark Red
      if (index === 1) {
        bg = '#9e0c0c'; // Red
        border = 'rgba(255, 255, 255, 0.15)';
        overlay = 'linear-gradient(180deg, rgba(158, 12, 12, 0.2) 0%, rgba(158, 12, 12, 0.85) 100%)';
      } else {
        bg = '#000000'; // Black
        border = 'rgba(255, 62, 62, 0.25)';
        overlay = 'linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.85) 100%)';
      }
      text = '#ffffff';
      sub = '#eeeeee';
      dot = 'rgba(255, 255, 255, 0.3)';
      shadow = '0 2px 4px rgba(0,0,0,0.8)';
    } else {
      // Dark Mode: Alternates White and Off-white
      if (index === 1) {
        bg = '#f4f4f5'; // Off-white
        border = 'rgba(0, 0, 0, 0.08)';
        overlay = 'linear-gradient(180deg, rgba(244, 244, 245, 0.15) 0%, rgba(244, 244, 245, 0.85) 100%)';
      } else {
        bg = '#ffffff'; // White
        border = 'rgba(0, 0, 0, 0.08)';
        overlay = 'linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.85) 100%)';
      }
      text = '#000000';
      sub = '#333333';
      dot = 'rgba(0, 0, 0, 0.2)';
      shadow = 'none';
    }

    card.style.setProperty('--ad-bg', bg);
    card.style.setProperty('--ad-border', border);
    card.style.setProperty('--ad-overlay', overlay);
    card.style.setProperty('--ad-text', text);
    card.style.setProperty('--ad-sub', sub);
    card.style.setProperty('--ad-dot', dot);
    card.style.setProperty('--ad-shadow', shadow);
  };

  // Auto-redirect if already logged in when visiting login.html
  if (window.location.pathname.endsWith('login.html') && localStorage.getItem('thirsty_logged_in') === 'true') {
    window.location.href = 'index.html';
    return;
  }

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
  const SUPABASE_URL = "https://qnzszxukvugigprimlwi.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_syk64tdKksD56BZDt7FmZA_0KgZ581e";
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'thirstyclub-auth',
      storage: window.localStorage
    }
  });

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

  let updateUI = () => {
    const session = currentSession;
    const profile = currentUserProfile;
    console.log("updateUI called. Session email:", session ? session.user.email : "null", "Profile username:", profile ? profile.username : "null");
    
    if (session && profile) {
      localStorage.setItem('thirsty_logged_in', 'true');
      document.documentElement.classList.add('user-logged-in');
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

      // Admin post creator visibility
      const creatorContainer = document.getElementById('signals-post-creator-container');
      if (creatorContainer) {
        creatorContainer.style.display = isUserAdmin() ? 'block' : 'none';
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
      localStorage.removeItem('thirsty_logged_in');
      document.documentElement.classList.remove('user-logged-in');
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

      // Admin post creator visibility
      const creatorContainer = document.getElementById('signals-post-creator-container');
      if (creatorContainer) {
        creatorContainer.style.display = 'none';
      }

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
    console.log("syncSessionAndProfile called. Session user ID:", session ? session.user.id : "null");
    currentSession = session;
    if (session) {
      try {
        let profile = null;
        let profileError = null;
        
        // Retry profile fetch up to 5 times (total ~3 seconds)
        for (let i = 0; i < 5; i++) {
          console.log(`Fetching profile attempt ${i+1}...`);
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (data) {
            profile = data;
            profileError = null;
            break;
          }
          profileError = error;
          await new Promise(r => setTimeout(r, 600)); // wait 600ms before retrying
        }
        
        if (profileError) {
          console.error("Error fetching profile after retries:", profileError);
          // Fallback profile object so the user is never locked out of the dashboard
          currentUserProfile = {
            id: session.user.id,
            email: session.user.email,
            username: session.user.user_metadata?.username || session.user.email.split('@')[0],
            thirstyclub_id: session.user.user_metadata?.thirstyclub_id || 'T999-XXXX',
            socials: {
              instagram: '',
              twitter: '',
              discord: '',
              place_of_thirst: 'LAGOS',
              gender: 'F',
              signature: 'Thirstyzoid'
            }
          };
          console.log("Using fallback profile:", currentUserProfile);
        } else {
          currentUserProfile = profile;
          console.log("Successfully fetched profile:", currentUserProfile);
          
          // Track and update daily login streak
          try {
            const todayStr = new Date().toISOString().split('T')[0];
            let socialsObj = currentUserProfile.socials || {};
            let lastActiveDate = socialsObj.last_active_date;
            let streakCount = socialsObj.streak_count || 0;

            if (!lastActiveDate) {
              streakCount = 1;
              socialsObj.streak_count = streakCount;
              socialsObj.last_active_date = todayStr;
              await supabase.from('profiles').update({ socials: socialsObj }).eq('id', currentUserProfile.id);
              console.log("First daily login streak started!");
            } else if (lastActiveDate !== todayStr) {
              const lastActive = new Date(lastActiveDate);
              const today = new Date(todayStr);
              const timeDiff = today.getTime() - lastActive.getTime();
              const dayDiff = Math.round(timeDiff / (1000 * 3600 * 24));
              
              if (dayDiff === 1) {
                streakCount += 1;
                console.log(`Daily streak continued! Current streak: ${streakCount}`);
              } else {
                streakCount = 1;
                console.log("Streak broken. New streak started.");
              }
              socialsObj.streak_count = streakCount;
              socialsObj.last_active_date = todayStr;
              await supabase.from('profiles').update({ socials: socialsObj }).eq('id', currentUserProfile.id);
            }
            currentUserProfile.socials = socialsObj;
          } catch (streakErr) {
            console.error("Error updating daily login streak:", streakErr);
          }
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
          console.log("Fetched ticket:", currentUserTicket);
        }
      } catch (err) {
        console.error("Error syncing profile:", err);
      }
    } else {
      currentUserProfile = null;
      currentUserTicket = null;
      
      const isDirectPWA = window.matchMedia('(display-mode: standalone)').matches || window.location.hostname.includes('club999');
      if (isDirectPWA && typeof showOnboardingScreen === 'function') {
        showOnboardingScreen();
      }
    }
    updateUI();
  };

  // Track whether logout was intentional (user clicked logout button)
  let isIntentionalLogout = false;

  // Listen to auth changes
  supabase.auth.onAuthStateChange((event, session) => {
    console.log(`onAuthStateChange event: ${event}. Session email:`, session ? session.user.email : "null");
    
    if (event === 'SIGNED_OUT') {
      // Only process sign-out if user explicitly clicked logout
      if (isIntentionalLogout) {
        isIntentionalLogout = false;
        setTimeout(async () => {
          await syncSessionAndProfile(null);
        }, 0);
      } else {
        // Token refresh failed or session expired - try to recover silently
        console.log('Session ended unexpectedly. Attempting recovery...');
        setTimeout(async () => {
          try {
            const { data: { session: recoveredSession } } = await supabase.auth.getSession();
            if (recoveredSession) {
              console.log('Session recovered successfully.');
              await syncSessionAndProfile(recoveredSession);
            } else if (localStorage.getItem('thirsty_logged_in') === 'true') {
              // Session truly gone but user expects to be logged in
              // Keep the UI in logged-in state with cached profile if available
              console.log('Could not recover session but keeping logged-in UI state.');
            } else {
              await syncSessionAndProfile(null);
            }
          } catch (err) {
            console.warn('Session recovery failed:', err);
            // Don't force logout - keep existing UI state
          }
        }, 500);
      }
      return;
    }
    
    if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
      setTimeout(async () => {
        if (session) {
          await syncSessionAndProfile(session);
        } else if (event === 'INITIAL_SESSION') {
          // No session on initial load - try getSession() as fallback
          try {
            const { data: { session: storedSession } } = await supabase.auth.getSession();
            if (storedSession) {
              console.log('Recovered session from storage on initial load.');
              await syncSessionAndProfile(storedSession);
            } else {
              await syncSessionAndProfile(null);
            }
          } catch (err) {
            console.warn('Failed to recover session on initial load:', err);
            await syncSessionAndProfile(null);
          }
        }
      }, 0);
    }
  });

  // ==========================================
  // 4. RSVP Dialog & Auth Modal Management
  // ==========================================
  const modal = document.getElementById('ticket-modal');
  const openAuthBtn = document.getElementById('open-auth-btn');
  const navDashLinkClick = document.getElementById('nav-dash-link');
  const closeModalBtn = document.querySelector('.close-modal');

  const openAuthModal = () => {
    if (modal) {
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

  // Forgot Password Action
  const forgotPasswordBtn = document.getElementById('btn-forgot-password');
  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', async () => {
      const email = prompt("Enter your email address to receive a password reset link:");
      if (!email) return;
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail.includes("@")) {
        alert("Please enter a valid email address.");
        return;
      }
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: window.location.origin + '/index.html'
        });
        if (error) throw error;
        alert("Password reset email sent! Please check your inbox (and spam folder) for instructions.");
      } catch (err) {
        alert("Error sending password reset email: " + err.message);
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
      
      const errorMsg = document.getElementById('signup-error-msg');
      if (errorMsg) errorMsg.style.display = 'none';

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
          if (errorMsg) {
            errorMsg.textContent = "This username is already taken.";
            errorMsg.style.display = 'block';
          } else {
            alert("This username is already taken.");
          }
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
          await syncSessionAndProfile(data.session);
          await requestDevicePermissions();
          alert("Registration Successful!\n\nYour account is active, and your ThirstyID has been generated.");
          if (modal) modal.close();
          signupForm.reset();
        } else {
          alert("Registration Successful!\n\nPlease check your email inbox to verify your account. Once verified, your unique ThirstyID will be generated and you can log in.");
          if (modal) modal.close();
          signupForm.reset();
        }
      } catch (err) {
        if (errorMsg) {
          errorMsg.textContent = err.message;
          errorMsg.style.display = 'block';
        } else {
          alert("Sign Up Error: " + err.message);
        }
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
      
      const errorMsg = document.getElementById('login-error-msg');
      if (errorMsg) errorMsg.style.display = 'none';

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Logging in...";
      }

      const loginId = document.getElementById('login-id').value.trim();
      const password = document.getElementById('login-password').value;

      try {
        let email = loginId.toLowerCase();

        // Resolve identifier if it's not a direct email address
        if (!loginId.includes("@")) {
          let profile = null;
          let profileErr = null;

          const cleanedInput = loginId.replace(/\s+/g, '');
          const thirstIdMatch = cleanedInput.match(/^t(?:-)?999(?:-)?(\d{4})$/i);

          if (thirstIdMatch) {
            const resolvedThirstyId = `T999-${thirstIdMatch[1]}`;
            // Resolve ThirstyID to Email
            const { data, error } = await supabase
              .from('profiles')
              .select('email')
              .eq('thirstyclub_id', resolvedThirstyId)
              .single();
            profile = data;
            profileErr = error;
            if (profileErr || !profile || !profile.email) {
              throw new Error("Invalid ThirstyID. Make sure it is spelled correctly.");
            }
          } else if (cleanedInput.toUpperCase().startsWith("T999")) {
            // Entered prefix but format was wrong
            throw new Error("Invalid ThirstyID format. It must be in the format T999-XXXX (with 4 numbers).");
          } else {
            // Resolve Username to Email
            const { data, error } = await supabase
              .from('profiles')
              .select('email')
              .ilike('username', loginId)
              .single();
            profile = data;
            profileErr = error;
            if (profileErr || !profile || !profile.email) {
              throw new Error("Username or ThirstyID not found. Make sure it is spelled correctly.");
            }
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

        if (data.session) {
          await syncSessionAndProfile(data.session);
          await requestDevicePermissions();
        }

        if (modal) {
          modal.close();
        } else {
          window.location.href = 'index.html';
        }
        loginForm.reset();
      } catch (err) {
        let displayMsg = "Login Error: " + err.message;
        if (err.code === 'email_not_confirmed' || err.message?.includes('Email not confirmed')) {
          displayMsg = "Your email has not been confirmed yet. Please check your inbox (and spam folder) for a confirmation email from ThirstyClub999.";
        } else if (err.code === 'invalid_credentials' || err.message?.includes('Invalid login credentials')) {
          displayMsg = "Invalid login credentials. Please check your email/username and password are correct.";
        }
        
        if (errorMsg) {
          errorMsg.textContent = displayMsg;
          errorMsg.style.display = 'block';
        } else {
          alert(displayMsg);
        }
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
    isIntentionalLogout = true;
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

  // Community View Sub-Tabs Switcher
  const switchCommunityTab = (tab) => {
    const signalsTab = document.getElementById('community-tab-signals');
    const eventsTab = document.getElementById('community-tab-events');
    const leaderboardTab = document.getElementById('community-tab-leaderboard');
    const gamesTab = document.getElementById('community-tab-games');

    const signalsSection = document.getElementById('community-signals-section');
    const eventsSection = document.getElementById('community-events-section');
    const leaderboardSection = document.getElementById('community-leaderboard-section');
    const gamesSection = document.getElementById('community-games-section');

    const updateTabState = (tabEl, active) => {
      if (!tabEl) return;
      if (active) {
        tabEl.classList.add('active');
      } else {
        tabEl.classList.remove('active');
      }
    };

    updateTabState(signalsTab, tab === 'signals');
    updateTabState(eventsTab, tab === 'events');
    updateTabState(leaderboardTab, tab === 'leaderboard');
    updateTabState(gamesTab, tab === 'games');

    if (signalsSection) signalsSection.style.display = tab === 'signals' ? 'block' : 'none';
    if (eventsSection) eventsSection.style.display = tab === 'events' ? 'block' : 'none';
    if (leaderboardSection) leaderboardSection.style.display = tab === 'leaderboard' ? 'block' : 'none';
    if (gamesSection) gamesSection.style.display = tab === 'games' ? 'block' : 'none';

    if (tab === 'signals') {
      renderSignals();
    } else if (tab === 'events') {
      renderEvents();
    } else if (tab === 'leaderboard') {
      renderLeaderboard();
    } else if (tab === 'games') {
      renderGames();
    }

    // Trigger transition on the newly opened subtab section container
    const activeSection = document.getElementById(`community-${tab}-section`);
    if (activeSection) {
      triggerPageTransition(activeSection);
    }
  };

  const bindCommunitySubTabs = () => {
    const signalsTab = document.getElementById('community-tab-signals');
    const eventsTab = document.getElementById('community-tab-events');
    const leaderboardTab = document.getElementById('community-tab-leaderboard');
    const gamesTab = document.getElementById('community-tab-games');
    if (signalsTab) {
      signalsTab.onclick = () => switchCommunityTab('signals');
    }
    if (eventsTab) {
      eventsTab.onclick = () => switchCommunityTab('events');
    }
    if (leaderboardTab) {
      leaderboardTab.onclick = () => switchCommunityTab('leaderboard');
    }
    if (gamesTab) {
      gamesTab.onclick = () => switchCommunityTab('games');
    }
  };

  // Call sub-tabs binding initially
  bindCommunitySubTabs();

  const switchView = (targetViewId, pushToHistory = true) => {
    const views = document.querySelectorAll('.app-view');
    const backBtn = document.getElementById('app-header-back');
    const headerTitle = document.getElementById('app-header-title');

    // Remove active from all views
    views.forEach(v => v.classList.remove('active'));

    // Activate target view
    const targetView = document.getElementById(targetViewId);
    if (targetView) {
      targetView.classList.add('active');
      triggerPageTransition(targetView);
    }

    // Update Header Title depending on view
    let title = "THIRSTYCLUB999";
    if (targetViewId === 'view-passport') title = "PASSPORT";
    else if (targetViewId === 'view-profile') {
      title = "PROFILE";
      loadInbox();
    }
    else if (targetViewId === 'view-wearthirsty') title = "WEARTHIRSTY";
    else if (targetViewId === 'view-product-details') title = "PRODUCT DETAILS";
    else if (targetViewId === 'view-drops') title = "DROPS";
    else if (targetViewId === 'view-community') {
      title = "COMMUNITY";
      const eventsSection = document.getElementById('community-events-section');
      const leaderboardSection = document.getElementById('community-leaderboard-section');
      const gamesSection = document.getElementById('community-games-section');
      if (eventsSection && eventsSection.style.display === 'block') {
        renderEvents();
      } else if (leaderboardSection && leaderboardSection.style.display === 'block') {
        renderLeaderboard();
      } else if (gamesSection && gamesSection.style.display === 'block') {
        renderGames();
      } else {
        switchCommunityTab('signals');
      }
    }
    else if (targetViewId === 'view-wallet') title = "WALLET";
    else if (targetViewId === 'view-scan') title = "SCAN";
    else if (targetViewId === 'view-notifications') title = "NOTIFICATIONS";
    else if (targetViewId === 'view-settings') title = "SETTINGS";
    else if (targetViewId === 'view-admin') {
      title = "ADMIN PORTAL";
      loadAdminDashboard();
    }
    else if (targetViewId === 'view-news-details') title = "NEWS DETAILS";
    else if (targetViewId === 'view-event-details') title = "EVENT DETAILS";
    headerTitle.textContent = title;

    // Track history
    if (pushToHistory && viewHistory[viewHistory.length - 1] !== targetViewId) {
      viewHistory.push(targetViewId);
    }

    // Toggle back button and logo visibility
    const headerLogo = document.getElementById('app-header-logo');
    if (viewHistory.length > 1) {
      backBtn.style.visibility = 'visible';
      backBtn.style.display = 'block';
      if (headerLogo) headerLogo.style.display = 'none';
    } else {
      backBtn.style.visibility = 'hidden';
      backBtn.style.display = 'none';
      if (headerLogo) headerLogo.style.display = 'block';
    }

    // Highlight bottom nav tabs if they match the primary target
    const navItems = document.querySelectorAll('.nav-tab-item');
    navItems.forEach(item => {
      const target = item.getAttribute('data-target-view');
      if (target === targetViewId || 
          (targetViewId === 'view-settings' && target === 'view-profile') || 
          (targetViewId === 'view-wallet' && target === 'view-profile') ||
          (targetViewId === 'view-passport' && target === 'view-profile') ||
          (targetViewId === 'view-product-details' && target === 'view-wearthirsty')) {
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
    homeSignalCard.addEventListener('click', () => {
      switchView('view-community');
      switchCommunityTab('signals');
    });
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
  const menuBtnPassport = document.getElementById('menu-btn-passport');
  if (menuBtnPassport) {
    menuBtnPassport.addEventListener('click', () => switchView('view-passport'));
  }
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
    menuBtnEvents.addEventListener('click', () => {
      switchView('view-community');
      switchCommunityTab('events');
    });
  }
  const menuBtnSettings = document.getElementById('menu-btn-settings');
  if (menuBtnSettings) {
    menuBtnSettings.addEventListener('click', () => switchView('view-settings'));
  }

  // Settings Log Out
  const appSettingsLogoutBtn = document.getElementById('app-settings-logout-btn');
  if (appSettingsLogoutBtn) {
    appSettingsLogoutBtn.addEventListener('click', async () => {
      isIntentionalLogout = true;
      await supabase.auth.signOut();
      window.location.hash = ''; // Clear navigation hash
    });
  }

  // ==========================================
  // 7. Mock Databases & Renderer Functions
  // ==========================================

  // A. WearThirsty Shop Merchandise Data
  // A. WearThirsty Shop Merchandise Data
  const shopProducts = [
    {
      id: 1,
      title: "ARABIAN JERSEY",
      category: "men",
      price: "$199.99",
      image: "https://cdn.shopify.com/s/files/1/0877/8668/4699/files/jerseysep9.webp?v=1729298996",
      url: "https://wearthirsty.com/products/thirsty-arabian-jersey-religion-summer-24",
      desc: "Stay Thirsty Till Eternity and Beyond. Premium custom knit jersey.",
      sizes: ["S", "M", "L", "XL", "2XL", "3XL"]
    },
    {
      id: 2,
      title: "BABY BUM SHORT RED",
      category: "ladies",
      price: "$49.99",
      image: "https://cdn.shopify.com/s/files/1/0877/8668/4699/files/prod3.webp?v=1726874351",
      url: "https://wearthirsty.com/products/thir-ty-ladie-24-bottom-red-1",
      desc: "Streetwear shorts built for ultimate comfort and attitude.",
      sizes: ["S", "M", "L", "XL", "2XL"]
    },
    {
      id: 3,
      title: "BABY BUM SHORTS",
      category: "accessories",
      price: "$49.99",
      image: "https://cdn.shopify.com/s/files/1/0877/8668/4699/files/prod7.webp?v=1726874176",
      url: "https://wearthirsty.com/products/thir-ty-ladie-24-bottom-red",
      desc: "Elevated checkerboard casual bum shorts.",
      sizes: ["S", "M", "L", "XL", "2XL"]
    },
    {
      id: 4,
      title: "THIRSTY X HF CANVAS DENIM PANTS",
      category: "thirsty-x-hf",
      price: "$499.99",
      image: "https://cdn.shopify.com/s/files/1/0877/8668/4699/files/HFCOLLAB3.png?v=1763902723",
      url: "https://wearthirsty.com/products/thirsty-x-hf-canvas-denim-pants",
      desc: "High Fashion collaborative custom canvas denim pants.",
      sizes: ["30", "32", "34", "36", "38"]
    },
    {
      id: 5,
      title: "THIRSTY X HF CANVAS DENIM TOP",
      category: "thirsty-x-hf",
      price: "$499.99",
      image: "https://cdn.shopify.com/s/files/1/0877/8668/4699/files/HFCOLLAB1.png?v=1763902722",
      url: "https://wearthirsty.com/products/thirsty-x-hf-canvas-denim-top",
      desc: "High Fashion collaborative denim top jacket.",
      sizes: ["S", "M", "L", "XL", "2XL", "3XL"]
    },
    {
      id: 6,
      title: "THIRSTY WILDBEAST TEE",
      category: "men",
      price: "$199.99",
      image: "https://cdn.shopify.com/s/files/1/0877/8668/4699/files/beigebeast1.png?v=1760219301",
      url: "https://wearthirsty.com/products/thirsty-wildbeast-tee-biege",
      desc: "Beige graphic tee featuring custom wildbeast design.",
      sizes: ["S", "M", "L", "XL", "2XL"]
    },
    {
      id: 7,
      title: "HOCKEY SLEEVE",
      category: "men",
      price: "$199.99",
      image: "https://cdn.shopify.com/s/files/1/0877/8668/4699/files/hockey_res-1.webp?v=1749012210",
      url: "https://wearthirsty.com/products/hockey-sleeve",
      desc: "Bold, breathable streetwear hockey long sleeve jersey.",
      sizes: ["S", "M", "L", "XL", "XXL", "XXXL"]
    },
    {
      id: 8,
      title: "LOGO TEE",
      category: "999",
      price: "$199.99",
      image: "https://cdn.shopify.com/s/files/1/0877/8668/4699/files/stay_thirtsy_forever_1.webp?v=1722343674",
      url: "https://wearthirsty.com/products/stay-thirsty-forever-logo-tee",
      desc: "Original Thirsty forever logo tee.",
      sizes: ["S", "M", "L", "XL", "2XL"]
    }
  ];


  const renderShop = (filter = 'all') => {
    const grid = document.getElementById('shop-products-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Show 4 skeleton placeholders first
    for (let i = 0; i < 4; i++) {
      const skel = document.createElement('div');
      skel.className = 'product-card skeleton-card';
      skel.innerHTML = `
        <div class="product-image-wrap skeleton" style="height: 180px;"></div>
        <div class="skeleton" style="height: 1.2rem; width: 80%; margin-bottom: 0.5rem;"></div>
        <div class="skeleton" style="height: 0.85rem; width: 95%; margin-bottom: 0.4rem;"></div>
        <div class="skeleton" style="height: 0.85rem; width: 60%; margin-bottom: 0.8rem;"></div>
        <div class="skeleton" style="height: 1.1rem; width: 30%;"></div>
      `;
      grid.appendChild(skel);
    }

    setTimeout(() => {
      grid.innerHTML = '';
      const filtered = filter === 'all' ? shopProducts : shopProducts.filter(p => p.category === filter);

      filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.cursor = 'pointer';
        card.innerHTML = `
          <div class="product-image-wrap">
            <img src="${p.image}" alt="${p.title}">
            <span class="buy-product-badge">DETAILS</span>
          </div>
          <div class="product-title">${p.title}</div>
          <div class="product-meta-desc">${p.desc}</div>
          <div class="product-sizes-row">
            ${p.sizes.map(s => `<span class="size-chip">${s}</span>`).join('')}
          </div>
          <div class="product-price">${p.price}</div>
        `;
        card.addEventListener('click', () => showProductDetails(p.id));
        grid.appendChild(card);
      });
    }, 450);
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
  // B. Signals Feed Data & News Model
  const isUserAdmin = () => {
    const session = currentSession;
    const profile = currentUserProfile;
    if (!session || !profile) return false;
    return !!(session.user.email && (
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
      profile.role === 'admin' ||
      profile.socials?.role === 'admin'
    ));
  };

  const newsData = [
    {
      id: 'gbeds',
      title: 'GBED$$$ OUT NOW',
      label: 'NEW RELEASE',
      time: 'RECENT DROP',
      snippet: "Straffitti drops his highly anticipated 12-track project GBED$$$ under Thirsty Sonics, featuring ODUMODUBLVCK, PsychoYP, and Zlatan.",
      image: 'images/GBEDS.jpeg',
      date: 'JUNE 19, 2026',
      location: 'THIRSTY SONICS IMPRINT',
      body: `
        <p>Thirsty Sonics is proud to announce the release of <strong>GBED$$$</strong>, the brand new 12-track project from alternative rap trailblazer <strong>$TRAFFITTI</strong>. Released on June 19, 2026, this mixtape is a high-octane sonic fusion of alté afrobeats, street-hop, and cyber-trap, positioning it as the definitive soundtrack of the underground scene.</p>
        <p>The project highlights Straffitti's deep connections within the Nigerian alternative and street-hop community, featuring massive collaborations with industry heavyweights. Key tracks include the lead focus track 'OFE NSALA' featuring ODUMODUBLVCK, the trap anthem 'WOE$KII' with PsychoYP and SSSoundGawd, and the street-hop anthem 'TE WO II' alongside Zlatan and scottyolorin.</p>
        <h4 style="color:#fff; font-size:0.9rem; margin: 1rem 0 0.5rem 0; font-family:'Satoshi', sans-serif;">TRACKLIST:</h4>
        <ol style="padding-left:1.2rem; color:var(--text-dim); line-height:1.6; font-size:0.85rem;">
          <li><strong>OFE NSALA</strong> (feat. ODUMODUBLVCK)</li>
          <li><strong>GIMME DAT</strong></li>
          <li><strong>WOE$KII</strong> (feat. PsychoYP & SSSoundGawd)</li>
          <li><strong>GBONA LOWO</strong></li>
          <li><strong>CHOO</strong></li>
          <li><strong>PAAK AM</strong> (feat. BabyDaiz & Egertton)</li>
          <li><strong>PAPASUPE</strong> (feat. Highonfi)</li>
          <li><strong>PAA MII</strong></li>
          <li><strong>JEALOUS</strong></li>
          <li><strong>TE WO II</strong> (feat. Zlatan & scottyolorin)</li>
          <li><strong>AVAILABLE</strong></li>
          <li><strong>LOKE</strong></li>
        </ol>
      `,
      hasGallery: false
    },
    {
      id: 'launch',
      title: 'ThirstyClub999 Launch',
      label: 'PAST EVENT RECAP',
      time: 'RECENT EVENT',
      snippet: 'Our last private VIP meetup in Lagos was a massive success. Relive the cyber-lounge experience.',
      image: 'images/THIRSTY_77.JPG',
      date: 'LAGOS, NIGERIA • JUNE 07, 2026',
      location: 'LAGOS, NIGERIA',
      body: `
        <p>The ThirstyClub999 Private Launch Event was an absolute masterclass in style, digital identity, and community connection. Set in a premium cyber-lounge in Lagos, founding members gathered to showcase their digital passports and check in seamlessly at the door.</p>
        <p>The night was filled with energetic alté afrobeats sets, premium merch drops, and preview showcases of upcoming collection items. Thank you to everyone who made this launch party memorable. Keep your passports active for the next physical drop announcements.</p>
      `,
      hasGallery: true,
      gallery: [
        'images/THIRSTY_1.JPG',
        'images/THIRSTY_31.JPG',
        'images/THIRSTY_37.JPG',
        'images/THIRSTY_63.JPG',
        'images/THIRSTY_69.JPG',
        'images/THIRSTY_75.JPG',
        'images/THIRSTY_76.JPG',
        'images/THIRSTY_77.JPG',
        'images/THIRSTY_79.JPG',
        'images/THIRSTY_94.JPG'
      ]
    }
  ];

  const renderNews = () => {
    const container = document.getElementById('home-news-container');
    if (!container) return;
    container.innerHTML = '';

    newsData.forEach(article => {
      const card = document.createElement('div');
      card.className = 'latest-signal-preview-card';
      card.style.cssText = 'display: flex; gap: 12px; align-items: center; padding: 1.25rem; cursor: pointer;';
      card.innerHTML = `
        <div class="news-thumbnail-frame" style="width: 80px; height: 80px; border-radius: 8px; overflow: hidden; flex-shrink: 0; border: 1px solid rgba(255, 255, 255, 0.1);">
          <img src="${article.image}" alt="${article.title}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <div class="news-content-block" style="flex: 1; text-align: left;">
          <div class="signal-header" style="margin-bottom: 0.3rem; display: flex; justify-content: space-between; align-items: center;">
            <span class="signal-label" style="color: var(--accent-color); font-weight: 800; font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase;">${article.label}</span>
            <span class="signal-time" style="text-transform: uppercase;">${article.time}</span>
          </div>
          <div class="news-title" style="font-weight: 800; font-size: 0.95rem; color: #fff; margin-bottom: 0.2rem; line-height: 1.2;">${article.title}</div>
          <p class="news-snippet" style="font-size: 0.75rem; color: var(--text-dim); margin: 0 0 0.5rem 0; line-height: 1.3;">${article.snippet}</p>
          <div class="news-link-btn" style="font-size: 0.75rem; font-weight: 700; color: var(--accent-color); display: flex; align-items: center; gap: 4px;">
            <span>${article.hasGallery ? 'VIEW GALLERY' : 'READ MORE'}</span>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </div>
      `;
      card.onclick = () => {
        openNewsDetails(article.id);
        switchView('view-news-details');
      };
      container.appendChild(card);
    });
  };

  const openNewsDetails = (newsId) => {
    const article = newsData.find(a => a.id === newsId);
    if (!article) return;

    const contentEl = document.getElementById('news-details-content');
    if (!contentEl) return;

    let galleryHtml = '';
    if (article.hasGallery && article.gallery) {
      galleryHtml = `
        <div class="gallery-title" style="font-size: 0.8rem; font-weight: 800; color: #fff; letter-spacing: 0.05em; margin-bottom: 0.8rem; text-transform: uppercase;">EVENT GALLERY</div>
        <div class="event-photos-gallery-wrap">
          <div class="event-photos-gallery">
            ${article.gallery.map((img, i) => `<div class="gallery-photo-item"><img src="${img}" alt="Gallery image ${i+1}"></div>`).join('')}
          </div>
        </div>
      `;
    }

    contentEl.innerHTML = `
      <div class="event-details-hero" style="position: relative; width: 100%; height: 200px; border-radius: 12px; overflow: hidden; margin-bottom: 1.5rem; border: 1px solid rgba(255, 62, 62, 0.15);">
        <img src="${article.image}" alt="${article.title}" style="width: 100%; height: 100%; object-fit: cover;">
        <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%); padding: 1rem;">
          <span style="font-size: 0.65rem; background: var(--accent-color); color: #fff; padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">${article.label}</span>
        </div>
      </div>
      
      <h2 style="font-family: 'Satoshi', sans-serif; text-transform: uppercase; font-size: 1.4rem; font-weight: 900; color: #fff; margin: 0 0 0.5rem 0; letter-spacing: 0.05em; line-height: 1.2;">${article.title}</h2>
      <div style="font-size: 0.8rem; color: var(--accent-color); font-weight: 700; margin-bottom: 1rem;">${article.date}</div>
      
      <div class="news-body-text" style="font-size: 0.85rem; color: var(--text-dim); line-height: 1.6; margin-bottom: 1.5rem;">
        ${article.body}
      </div>

      ${galleryHtml}
    `;

    if (article.hasGallery) {
      setTimeout(() => {
        initLightbox();
      }, 50);
    }
  };

  const defaultSignals = [
    {
      id: 3,
      username: 'THIRSTYCLUB999',
      handle: '@tc999',
      avatar: "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'><circle cx='50' cy='50' r='50' fill='%23ff3e3e'/><text x='50' y='55' font-family='monospace' font-size='20' fill='white' font-weight='bold' text-anchor='middle'>999</text></svg>",
      time: 'Just now',
      text: 'GBED$$$ out now! Alternative trailblazer $TRAFFITTI drops his highly anticipated 12-track project under Thirsty Sonics, featuring ODUMODUBLVCK, PsychoYP, Zlatan and more. Stream it everywhere!',
      media: 'images/GBEDS.jpeg',
      likes: 1240,
      comments: 0,
      liked: false,
      commentsList: [],
      poll: {
        question: "What is your favorite track on GBED$$$?",
        options: [
          { text: "OFE NSALA (feat. ODUMODUBLVCK)", votes: 512 },
          { text: "WOE$KII (feat. PsychoYP)", votes: 342 },
          { text: "PAPASUPE", votes: 120 },
          { text: "TE WO II (feat. Zlatan)", votes: 284 }
        ]
      }
    },
    {
      id: 1,
      username: 'THIRSTYCLUB999',
      handle: '@tc999',
      avatar: "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'><circle cx='50' cy='50' r='50' fill='%23ff3e3e'/><text x='50' y='55' font-family='monospace' font-size='20' fill='white' font-weight='bold' text-anchor='middle'>999</text></svg>",
      time: '2h ago',
      text: 'THE SYSTEM IS DRY. WE BRING THE THIRST.',
      media: 'images/THIRSTY_1.JPG',
      likes: 999,
      comments: 2,
      liked: false,
      commentsList: [
        { username: 'composer_test', text: 'THE CLUB IS REAL.' },
        { username: 'radiimediang', text: 'This looks premium 🔥' }
      ]
    },
    {
      id: 2,
      username: 'THIRSTYCLUB999',
      handle: '@tc999',
      avatar: "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'><circle cx='50' cy='50' r='50' fill='%23ff3e3e'/><text x='50' y='55' font-family='monospace' font-size='20' fill='white' font-weight='bold' text-anchor='middle'>999</text></svg>",
      time: '1d ago',
      text: 'NO RULES. ONLY THE CLUB.',
      media: 'images/THIRSTY_69.JPG',
      likes: 854,
      comments: 1,
      liked: false,
      commentsList: [
        { username: 'straffitti', text: 'Where is the secret location?' }
      ]
    }
  ];

  let mockSignals = [];
  try {
    const saved = localStorage.getItem('thirsty_club_signals');
    if (saved) {
      mockSignals = JSON.parse(saved);
    }
  } catch(e) {
    console.error("Failed to parse signals", e);
  }
  if (!mockSignals || mockSignals.length === 0) {
    mockSignals = defaultSignals;
  }

  const triggerLike = (s, post) => {
    if (!s.liked) {
      s.liked = true;
      s.likes += 1;
      const likeBtn = post.querySelector(`.like-btn-${s.id}`);
      likeBtn.querySelector('.like-count').textContent = s.likes;
      likeBtn.classList.add('liked');
      localStorage.setItem('thirsty_club_signals', JSON.stringify(mockSignals));
    }

    const frame = post.querySelector(`#media-frame-${s.id}`);
    if (frame) {
      const heart = document.createElement('div');
      heart.className = 'double-tap-heart';
      heart.innerHTML = '❤️';
      frame.appendChild(heart);

      setTimeout(() => {
        heart.remove();
      }, 800);
    }
  };

  const toggleLike = (s, post) => {
    const likeBtn = post.querySelector(`.like-btn-${s.id}`);
    if (s.liked) {
      s.liked = false;
      s.likes -= 1;
      likeBtn.classList.remove('liked');
      likeBtn.querySelector('.like-count').textContent = s.likes;
      localStorage.setItem('thirsty_club_signals', JSON.stringify(mockSignals));
    } else {
      triggerLike(s, post);
    }
  };

  const renderPoll = (s, post) => {
    const pollContainer = post.querySelector(`#poll-container-${s.id}`);
    if (!pollContainer || !s.poll) return;

    pollContainer.innerHTML = '';

    const votedIdxKey = `poll_voted_${s.id}`;
    const savedVotedIdx = localStorage.getItem(votedIdxKey);
    const hasVoted = savedVotedIdx !== null;

    const questionDiv = document.createElement('div');
    questionDiv.className = 'poll-question';
    questionDiv.textContent = s.poll.question;
    pollContainer.appendChild(questionDiv);

    const optionsList = document.createElement('div');
    optionsList.className = 'poll-options-list';

    const totalVotes = s.poll.options.reduce((sum, opt) => sum + opt.votes, 0);

    s.poll.options.forEach((opt, idx) => {
      if (hasVoted) {
        const votedIdx = parseInt(savedVotedIdx, 10);
        const isSelected = votedIdx === idx;
        const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;

        const resultEl = document.createElement('div');
        resultEl.className = `poll-option-result ${isSelected ? 'voted-option' : ''}`;
        resultEl.innerHTML = `
          <div class="poll-option-fill" style="width: 0%;"></div>
          <div class="poll-option-label">${opt.text}</div>
          <div class="poll-option-meta">
            ${isSelected ? '<span>✓</span>' : ''}
            <span>${pct}%</span>
            <span style="font-size: 0.6rem; color: var(--text-dim);">(${opt.votes})</span>
          </div>
        `;
        optionsList.appendChild(resultEl);

        setTimeout(() => {
          const fill = resultEl.querySelector('.poll-option-fill');
          if (fill) fill.style.width = `${pct}%`;
        }, 50);

      } else {
        const btn = document.createElement('button');
        btn.className = 'poll-option-btn';
        btn.textContent = opt.text;
        btn.onclick = () => {
          opt.votes = (opt.votes || 0) + 1;
          localStorage.setItem(votedIdxKey, idx);
          localStorage.setItem('thirsty_club_signals', JSON.stringify(mockSignals));
          renderPoll(s, post);
        };
        optionsList.appendChild(btn);
      }
    });

    pollContainer.appendChild(optionsList);

    if (hasVoted) {
      const totalEl = document.createElement('div');
      totalEl.className = 'poll-total-votes';
      totalEl.textContent = `${totalVotes} vote${totalVotes !== 1 ? 's' : ''}`;
      pollContainer.appendChild(totalEl);
    }
  };

  const renderSignals = () => {
    const container = document.getElementById('signals-feed-container');
    if (!container) return;
    container.innerHTML = '';

    // Render 2 skeleton post cards first
    for (let i = 0; i < 2; i++) {
      const skelPost = document.createElement('div');
      skelPost.className = 'signal-post-card skeleton-card';
      skelPost.innerHTML = `
        <div class="post-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 1rem;">
          <div class="skeleton" style="width: 40px; height: 40px; border-radius: 50%;"></div>
          <div class="post-meta-info" style="flex: 1; display: flex; flex-direction: column; gap: 0.3rem;">
            <div class="skeleton" style="width: 40%; height: 0.85rem; margin: 0;"></div>
            <div class="skeleton" style="width: 25%; height: 0.7rem; margin: 0;"></div>
          </div>
        </div>
        <div class="skeleton" style="height: 0.95rem; margin-bottom: 0.8rem; width: 100%;"></div>
        <div class="skeleton" style="height: 0.95rem; margin-bottom: 1.2rem; width: 60%;"></div>
        <div class="skeleton" style="height: 180px; border-radius: 8px; margin-bottom: 1rem; width: 100%;"></div>
      `;
      container.appendChild(skelPost);
    }

    setTimeout(() => {
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
          ${s.media ? `
          <div class="post-media-frame" id="media-frame-${s.id}">
            <img src="${s.media}" alt="Post Media">
          </div>` : ''}
          <div class="post-poll-container" id="poll-container-${s.id}"></div>
          <div class="post-actions-row">
            <button class="post-action-btn like-btn-${s.id} ${s.liked ? 'liked' : ''}">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span class="like-count">${s.likes}</span>
            </button>
            <button class="post-action-btn comment-btn-${s.id}">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span class="comment-count">${s.comments}</span>
            </button>
          </div>
          
          <div class="post-comments-section" id="comments-section-${s.id}">
            <div class="comments-list" id="comments-list-${s.id}">
              ${s.commentsList.map(c => `
                <div class="comment-item">
                  <span class="comment-username">${c.username}</span>
                  <span class="comment-text">${c.text}</span>
                </div>
              `).join('')}
            </div>
            <form class="comment-form" id="comment-form-${s.id}">
              <input type="text" class="comment-input" id="comment-input-${s.id}" placeholder="Write a comment..." required>
              <button type="submit" class="comment-submit-btn">Send</button>
            </form>
          </div>
        `;
        container.appendChild(post);

        if (s.poll) {
          renderPoll(s, post);
        }

        // Bind Double Tap Like
        const mediaFrame = post.querySelector(`#media-frame-${s.id}`);
        if (mediaFrame) {
          let lastTap = 0;
          let lastTouchTap = 0;
          mediaFrame.addEventListener('click', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 300 && tapLength > 0) {
              triggerLike(s, post);
              e.preventDefault();
            }
            lastTap = currentTime;
          });

          mediaFrame.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTouchTap;
            if (tapLength < 300 && tapLength > 0) {
              e.preventDefault();
              triggerLike(s, post);
            }
            lastTouchTap = currentTime;
          });

          mediaFrame.addEventListener('dblclick', () => {
            triggerLike(s, post);
          });
        }

        // Bind Like Button
        const likeBtn = post.querySelector(`.like-btn-${s.id}`);
        likeBtn.addEventListener('click', () => {
          toggleLike(s, post);
        });

        // Bind Comment Drawer Toggle
        const commentBtn = post.querySelector(`.comment-btn-${s.id}`);
        const commentsSec = post.querySelector(`#comments-section-${s.id}`);
        commentBtn.addEventListener('click', () => {
          const isVisible = window.getComputedStyle(commentsSec).display !== 'none';
          commentsSec.style.display = isVisible ? 'none' : 'block';
          if (!isVisible) {
            const list = commentsSec.querySelector(`.comments-list`);
            list.scrollTop = list.scrollHeight;
          }
        });

        // Bind Comment Submission
        const commentForm = post.querySelector(`#comment-form-${s.id}`);
        commentForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const input = post.querySelector(`#comment-input-${s.id}`);
          const text = input.value.trim();
          if (!text) return;

          const activeUsername = (currentUserProfile && currentUserProfile.username) || 'tc_member';
          
          const newComment = { username: activeUsername, text: text };
          s.commentsList.push(newComment);
          s.comments = s.commentsList.length;

          post.querySelector(`.comment-count`).textContent = s.comments;

          const list = post.querySelector(`#comments-list-${s.id}`);
          const item = document.createElement('div');
          item.className = 'comment-item';
          item.innerHTML = `
            <span class="comment-username">${activeUsername}</span>
            <span class="comment-text">${text}</span>
          `;
          list.appendChild(item);
          list.scrollTop = list.scrollHeight;

          input.value = '';
        });
      });
    }, 450);
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
    {
      id: 'event-nyc',
      month: 'Jun',
      day: '07',
      title: 'UNDERGROUND NYC',
      organizer: 'THIRSTYCLUB999 PRESENTS',
      location: 'BROOKLYN, NYC',
      time: '10:00 PM EST',
      image: 'images/THIRSTY_1.JPG',
      description: 'An exclusive warehouse showcase in the heart of Brooklyn. Experience the raw street aesthetic of our summer collection release combined with industrial alt-beats.',
      lineup: 'DJ TOBI • SANTI (SPECIAL SET) • DRUMMERBOY',
      instructions: 'RSVP required. Presentation of verified ThirstyClub999 Digital Passport at the entrance is mandatory for priority access.'
    },
    {
      id: 'event-london',
      month: 'Jul',
      day: '19',
      title: 'WORLDWIDE MEET',
      organizer: 'THIRSTYCLUB999',
      location: 'LONDON, UK',
      time: '08:00 PM GMT',
      image: 'images/THIRSTY_63.JPG',
      description: 'Connecting our UK members in an intimate cyber-lounge setting. A curated evening of music, panel talks, and early product design showcases.',
      lineup: 'MINA • DJ KRYSTAL • ALÉ GUEST TALKS',
      instructions: 'RSVP via passport portal. Admission is strictly based on active membership tier. QR check-in opens at 7:30 PM.'
    },
    {
      id: 'event-day',
      month: 'Aug',
      day: '31',
      title: '999 DAY',
      organizer: 'THIRSTYCLUB999',
      location: 'WORLDWIDE',
      time: 'ALL DAY',
      image: 'images/THIRSTY_75.JPG',
      description: 'The annual global celebration of ThirstyClub999. Parallel offline pop-ups in major hubs, global digital passport updates, and limited-edition product drops.',
      lineup: 'GLOBAL COLLABORATORS • COMMUNITY HIGHLIGHTS',
      instructions: 'Check your app dashboard throughout the day for local pop-up locations, drop coordinates, and active bounty multipliers.'
    }
  ];

  const renderEvents = () => {
    const container = document.getElementById('events-timeline-container');
    if (!container) return;
    container.innerHTML = '';

    // Render 2 skeleton event cards first
    for (let i = 0; i < 2; i++) {
      const skel = document.createElement('div');
      skel.className = 'event-card-item skeleton-card';
      skel.innerHTML = `
        <div class="event-date-block skeleton" style="width: 50px; height: 50px; border-radius: 8px;"></div>
        <div class="event-details-block" style="flex: 1; display: flex; flex-direction: column; gap: 0.4rem; padding-left: 10px;">
          <div class="skeleton" style="width: 30%; height: 0.75rem;"></div>
          <div class="skeleton" style="width: 70%; height: 1.1rem;"></div>
          <div class="skeleton" style="width: 50%; height: 0.75rem;"></div>
        </div>
        <div class="skeleton" style="width: 70px; height: 32px; border-radius: 4px; margin-left: auto;"></div>
      `;
      container.appendChild(skel);
    }

    setTimeout(() => {
      container.innerHTML = '';
      mockEvents.forEach(e => {
        const card = document.createElement('div');
        card.className = 'event-card-item';
        card.style.cursor = 'pointer';
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
          <button class="ev-rsvp-btn">RSVP</button>
        `;
        card.querySelector('.ev-rsvp-btn').onclick = (evt) => {
          evt.stopPropagation();
          alert('RSVP confirmed!');
        };
        card.addEventListener('click', () => showEventDetails(e.id));
        container.appendChild(card);
      });
    }, 400);
  };

  const showEventDetails = (eventId) => {
    const ev = mockEvents.find(item => item.id === eventId);
    if (!ev) return;

    const detailsContainer = document.getElementById('event-details-content');
    if (!detailsContainer) return;
    
    detailsContainer.innerHTML = `
      <div class="event-details-hero" style="position: relative; width: 100%; height: 200px; border-radius: 12px; overflow: hidden; margin-bottom: 1.5rem; border: 1px solid rgba(255, 62, 62, 0.15);">
        <img src="${ev.image}" alt="${ev.title}" style="width: 100%; height: 100%; object-fit: cover;">
        <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%); padding: 1rem;">
          <span style="font-size: 0.65rem; background: var(--accent-color); color: #fff; padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">${ev.organizer}</span>
        </div>
      </div>
      
      <h2 style="font-family: 'Satoshi', sans-serif; text-transform: uppercase; font-size: 1.4rem; font-weight: 900; color: #fff; margin: 0 0 0.5rem 0; letter-spacing: 0.05em; line-height: 1.2;">${ev.title}</h2>
      <div style="font-size: 0.8rem; color: var(--accent-color); font-weight: 700; margin-bottom: 1.25rem; text-transform: uppercase;">
        📍 ${ev.location} • 📅 ${ev.month} ${ev.day}, 2026 • ⏰ ${ev.time}
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <div style="font-size: 0.75rem; font-weight: 800; color: #fff; margin-bottom: 0.4rem; letter-spacing: 0.05em; text-transform: uppercase;">DESCRIPTION</div>
        <p style="font-size: 0.85rem; color: var(--text-dim); line-height: 1.5; margin: 0;">${ev.description}</p>
      </div>

      <div style="margin-bottom: 1.5rem; background: rgba(255, 62, 62, 0.03); border: 1px solid rgba(255, 62, 62, 0.15); border-radius: 8px; padding: 1rem;">
        <div style="font-size: 0.75rem; font-weight: 800; color: var(--accent-color); margin-bottom: 0.4rem; letter-spacing: 0.05em; text-transform: uppercase;">🎵 LINEUP</div>
        <div style="font-size: 0.85rem; color: #fff; font-weight: 700; line-height: 1.4;">${ev.lineup}</div>
      </div>

      <div style="margin-bottom: 2rem;">
        <div style="font-size: 0.75rem; font-weight: 800; color: #fff; margin-bottom: 0.4rem; letter-spacing: 0.05em; text-transform: uppercase;">ENTRY INSTRUCTIONS</div>
        <p style="font-size: 0.8rem; color: var(--text-dim); line-height: 1.5; margin: 0;">${ev.instructions}</p>
      </div>

      <button class="cta-button fill-btn" style="margin-bottom: 2rem;" onclick="alert('RSVP confirmed!')">RSVP FOR THIS EVENT</button>
    `;
    switchView('view-event-details');
  };
  const triviaData = {
    thirstynalia: [
      {
        question: "What is the total membership supply of ThirstyClub?",
        options: ["99", "999", "9999", "Unlimited"],
        answer: 1,
        explanation: "ThirstyClub999 is strictly limited to 999 founding memberships."
      },
      {
        question: "Which of the following is our primary slogan?",
        options: [
          "THE SYSTEM IS DRY. WE BRING THE THIRST.",
          "DRINK RESPONSIBLY. STAY THIRSTY.",
          "NO THIRST NO ENTRY.",
          "WATER IS THE ENEMY."
        ],
        answer: 0,
        explanation: "Our manifesto is: 'THE SYSTEM IS DRY. WE BRING THE THIRST.'"
      },
      {
        question: "Where are ThirstyClub digital passports stored initially?",
        options: ["Directly on the Ethereum Blockchain", "In local browser storage", "In the Supabase database", "In Discord roles"],
        answer: 2,
        explanation: "Verified member profiles and passports are synced and stored in our secure Supabase database."
      },
      {
        question: "What badge is automatically earned by all early access users?",
        options: ["Legend Badge", "Founding Member Badge", "Early Access Badge", "999 Rep Badge"],
        answer: 2,
        explanation: "Early Access Badge is granted to users who created their passports before the official drop."
      },
      {
        question: "What access credential do you show at the physical clubhouse gate?",
        options: ["Your Instagram profile", "Your generated Digital Passport", "A printed paper ticket", "A password phrase"],
        answer: 1,
        explanation: "Your generated Digital Passport contains your unique ThirstyID and QR code for scanning at the gate."
      },
      {
        question: "What is the color theme of ThirstyClub?",
        options: ["Neon Red & Black", "Neon Green & Cyber Green", "Gold & Silver", "Blue & Purple"],
        answer: 0,
        explanation: "The iconic design theme of ThirstyClub is Neon Red and Black."
      },
      {
        question: "How many private slots are in ThirstyClub founder tier?",
        options: ["99", "999", "9", "9999"],
        answer: 0,
        explanation: "ThirstyClub has exactly 99 private founding slots."
      },
      {
        question: "Who is the core team behind ThirstyClub?",
        options: ["Thirstyzoids", "Dry System Corp", "Ethereum Foundation", "Alté Sound Crew"],
        answer: 0,
        explanation: "The community and founders are affectionately called Thirstyzoids."
      },
      {
        question: "What cryptocurrency is used for passport check-ins?",
        options: ["Ether", "ClubCoins", "None, check-in is gasless", "Solana"],
        answer: 2,
        explanation: "Member passport check-ins are fully gasless and handled on our backend."
      },
      {
        question: "Which city did ThirstyClub host its launch event in?",
        options: ["Lagos", "London", "Abuja", "New York"],
        answer: 0,
        explanation: "ThirstyClub's inaugural physical meetup and launch was held in Lagos."
      }
    ],
    songs: [
      {
        question: "Which artist sang 'Stay Thirsty' in the Club Anthem?",
        options: ["Santi", "Odunsi", "Lady Donli", "Straffitti"],
        answer: 3,
        explanation: "Straffitti composed the official ThirstyNalia soundtrack anthem."
      },
      {
        question: "What is the track length of the original ThirstyClub 999 theme?",
        options: ["2 minutes 45 seconds", "3 minutes 9 seconds", "4 minutes 20 seconds", "1 minute 59 seconds"],
        answer: 1,
        explanation: "The official theme song is exactly 3:09 long."
      },
      {
        question: "Complete the lyric: 'They talk about the club, they talk about the...'?",
        options: ["Money", "Vibe", "Thirst", "Music"],
        answer: 2,
        explanation: "The line goes: 'They talk about the club, they talk about the Thirst.'"
      },
      {
        question: "Which genre best describes the ThirstyClub soundscape?",
        options: ["Strictly Hip Hop", "Alté / Cyber-Afrobeats", "Classical Jazz", "Deep House Techno"],
        answer: 1,
        explanation: "Our soundtrack mixes cyber alté vibes with energetic Afrobeats."
      },
      {
        question: "What sound triggers when a user successfully checks in at an event?",
        options: ["A cash register ring", "A bottle pop & fizz sound", "A loud siren", "A laser beam blast"],
        answer: 1,
        explanation: "Checking in plays an animated bottle popping and fizzing sound effect."
      },
      {
        question: "Which artist is known as the Thirsty Beats selector?",
        options: ["DJ Zoid", "DJ Spinall", "DJ Obi", "DJ Neptune"],
        answer: 0,
        explanation: "The selector of our cyber music is DJ Zoid."
      },
      {
        question: "What song plays during the landing video background?",
        options: ["Thirsty Rhythm", "Alté Cyber Anthem", "Wet Vibe Track", "Dry System Beat"],
        answer: 0,
        explanation: "Thirsty Rhythm is the official background music of our landing site."
      },
      {
        question: "Who produced the 'Dry System' synth line?",
        options: ["VibeLord", "Kidxmini", "ZoidMaster", "Straffitti"],
        answer: 0,
        explanation: "VibeLord designed the industrial synths for the Dry System album."
      }
    ]
  };

  const treasureHunts = [
    {
      id: 1,
      title: "Lagos Terminal Mystery",
      clue: "Look beneath the concrete bridge where the streetlights form a triangle. The mystery box is hidden behind the green electrical panel.",
      hint: "Code format: TC-BOX-XXXX (hint: check the city terminal name)",
      code: "TC-BOX-LAGOS",
      points: 150
    },
    {
      id: 2,
      title: "Ikeja Secret Vault",
      clue: "Near the cyber café where alt-rock music plays all day. Look inside the hollow metallic pipe next to the red vending machine.",
      hint: "Code format: TC-BOX-XXXX (hint: what is the name of this suburb?)",
      code: "TC-BOX-IKEJA",
      points: 250
    },
    {
      id: 3,
      title: "Abuja Oasis",
      clue: "Follow the path of the artificial stream until you reach the rock sculpture. The box is tucked under the second ledge from the top.",
      hint: "Code format: TC-BOX-XXXX (hint: it's the capital city oasis)",
      code: "TC-BOX-ABUJA",
      points: 300
    }
  ];

  const raidsData = [
    { id: 1, title: "DRY SYSTEM ENDS", link: "https://x.com/ThirstyClub999/status/1782256247823", body: "Like, retweet & comment: 'The system is dry. We bring the thirst.'", points: 100 },
    { id: 2, title: "WET VIBES VOL 1 OUT NOW", link: "https://x.com/ThirstyClub999/status/1782256375743", body: "Raid this post on X. Share the alté afrobeats vibes.", points: 150 },
    { id: 3, title: "PASSPORT MINT NOTICE", link: "https://x.com/ThirstyClub999/status/1782267093731", body: "Help amplify our gasless passport announcement on X.", points: 200 }
  ];

  const bountiesData = [
    { id: 'follow_twitter', title: "Follow ThirstyClub on X", desc: "Keep updated with digital passport releases and live event slots.", points: 150 },
    { id: 'join_discord', title: "Join Club Discord Server", desc: "Connect with verified members in cyber-lounge voice rooms.", points: 200 },
    { id: 'post_instagram', title: "Share Passport on Instagram Story", desc: "Share your passport design & tag @ThirstyClub999.", points: 300 },
    { id: 'add_wallet', title: "Add Pass to Google/Apple Wallet", desc: "Download the pkpass check-in file to your phone wallet.", points: 100 }
  ];

  // Game States
  let activeCategory = null;
  let currentQuestionIdx = 0;
  let triviaScore = 0;
  let triviaQuestionsPool = [];
  let triviaTimeLeft = 60;
  let triviaTimerInterval = null;

  // Generic Game Switcher
  const switchGameView = (viewId) => {
    const views = [
      'games-hub-select',
      'trivia-game-view',
      'treasure-hunt-view',
      'raids-game-view',
      'bounties-game-view'
    ];
    views.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = id === viewId ? 'block' : 'none';
    });
    if (viewId === 'games-hub-select') {
      const el = document.getElementById(viewId);
      if (el) el.style.display = 'grid';
    }
  };

  // Sync Score helper
  const updateUserGameScore = async (gameKey, score, operation = 'max') => {
    const localKey = `thirsty_game_${gameKey}`;
    const prevLocal = parseFloat(localStorage.getItem(localKey) || (gameKey === 'reaction_time' ? '9999' : '0'));
    
    let newScore = score;
    if (operation === 'max') {
      newScore = Math.max(prevLocal, score);
    } else if (operation === 'min') {
      newScore = Math.min(prevLocal, score);
    } else if (operation === 'add') {
      newScore = prevLocal + score;
    }
    
    localStorage.setItem(localKey, newScore.toString());

    if (currentUserProfile) {
      try {
        const currentSocials = currentUserProfile.socials || {};
        const currentGameScores = currentSocials.game_scores || {};
        const prevDB = parseFloat(currentGameScores[gameKey] || (gameKey === 'reaction_time' ? '9999' : '0'));

        let finalDBScore = score;
        if (operation === 'max') {
          finalDBScore = Math.max(prevDB, score);
        } else if (operation === 'min') {
          finalDBScore = Math.min(prevDB, score);
        } else if (operation === 'add') {
          finalDBScore = prevDB + score;
        }

        const updatedGameScores = {
          ...currentGameScores,
          [gameKey]: finalDBScore
        };

        const updatedSocials = {
          ...currentSocials,
          game_scores: updatedGameScores
        };

        const { error } = await supabase
          .from('profiles')
          .update({ socials: updatedSocials })
          .eq('id', currentUserProfile.id);

        if (!error) {
          currentUserProfile.socials = updatedSocials;
          console.log(`Synced game score for ${gameKey}: ${finalDBScore}`);
        } else {
          console.warn("Failed to sync game score to database:", error);
        }
      } catch (err) {
        console.warn("Error updating game score in Supabase:", err);
      }
    }
  };

  // Build Leaderboard
  const fetchGameLeaderboard = async (gameKey, containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const mockLeaderboards = {
      trivia_blitz: [
        { username: 'THIRSTYZOID', score: 12, thirstyclub_id: 'T999-1337' },
        { username: 'Adeline Palmerston', score: 10, thirstyclub_id: 'T999-2468' },
        { username: 'Lekan Thirsty', score: 8, thirstyclub_id: 'T999-1122' },
        { username: 'Tunde Gold', score: 7, thirstyclub_id: 'T999-9081' },
        { username: 'Evelyn Drinker', score: 5, thirstyclub_id: 'T999-5566' }
      ],
      treasure_hunt: [
        { username: 'THIRSTYZOID', score: 3, thirstyclub_id: 'T999-1337' },
        { username: 'Adeline Palmerston', score: 2, thirstyclub_id: 'T999-2468' },
        { username: 'Lekan Thirsty', score: 2, thirstyclub_id: 'T999-1122' },
        { username: 'Tunde Gold', score: 1, thirstyclub_id: 'T999-9081' },
        { username: 'Evelyn Drinker', score: 1, thirstyclub_id: 'T999-5566' }
      ],
      speed_tap: [
        { username: 'THIRSTYZOID', score: 87, thirstyclub_id: 'T999-1337' },
        { username: 'Adeline Palmerston', score: 78, thirstyclub_id: 'T999-2468' },
        { username: 'Lekan Thirsty', score: 72, thirstyclub_id: 'T999-1122' },
        { username: 'Tunde Gold', score: 65, thirstyclub_id: 'T999-9081' },
        { username: 'Evelyn Drinker', score: 58, thirstyclub_id: 'T999-5566' }
      ],
      reaction_time: [
        { username: 'THIRSTYZOID', score: 180, thirstyclub_id: 'T999-1337' },
        { username: 'Adeline Palmerston', score: 210, thirstyclub_id: 'T999-2468' },
        { username: 'Lekan Thirsty', score: 245, thirstyclub_id: 'T999-1122' },
        { username: 'Tunde Gold', score: 280, thirstyclub_id: 'T999-9081' },
        { username: 'Evelyn Drinker', score: 320, thirstyclub_id: 'T999-5566' }
      ],
      social_raids: [
        { username: 'THIRSTYZOID', score: 3, thirstyclub_id: 'T999-1337' },
        { username: 'Adeline Palmerston', score: 2, thirstyclub_id: 'T999-2468' },
        { username: 'Lekan Thirsty', score: 2, thirstyclub_id: 'T999-1122' },
        { username: 'Tunde Gold', score: 1, thirstyclub_id: 'T999-9081' },
        { username: 'Evelyn Drinker', score: 0, thirstyclub_id: 'T999-5566' }
      ],
      bounties_completed: [
        { username: 'THIRSTYZOID', score: 4, thirstyclub_id: 'T999-1337' },
        { username: 'Adeline Palmerston', score: 3, thirstyclub_id: 'T999-2468' },
        { username: 'Lekan Thirsty', score: 2, thirstyclub_id: 'T999-1122' },
        { username: 'Tunde Gold', score: 2, thirstyclub_id: 'T999-9081' },
        { username: 'Evelyn Drinker', score: 1, thirstyclub_id: 'T999-5566' }
      ]
    };

    let entries = [...mockLeaderboards[gameKey]];

    // Render skeleton loading state
    const gameTitle = gameKey.toUpperCase().replace('_', ' ');
    container.innerHTML = `
      <div class="game-leaderboard-header">
        <div class="game-leaderboard-title">🏆 ${gameTitle} LEADERBOARD</div>
        <div class="game-leaderboard-subtitle">SYNCING RANKS...</div>
      </div>
      <ul class="game-leaderboard-list">
        ${[1, 2, 3, 4, 5].map(() => `
          <li class="game-leaderboard-item skeleton-card" style="height: 38px; display: flex; align-items: center; padding: 0.75rem 1rem; border-radius: 8px;">
            <div class="skeleton" style="width: 20px; height: 14px; margin-right: 1.5rem;"></div>
            <div class="skeleton" style="width: 120px; height: 14px;"></div>
            <div class="skeleton" style="width: 50px; height: 14px; margin-left: auto;"></div>
          </li>
        `).join('')}
      </ul>
    `;

    // Brief delay to allow skeleton shimmer to resolve gracefully
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('username, thirstyclub_id, socials');
      
      if (profiles && !error) {
        profiles.forEach(p => {
          const gameScores = p.socials?.game_scores || {};
          const score = gameScores[gameKey];
          if (score !== undefined && score !== null) {
            const idx = entries.findIndex(e => e.thirstyclub_id === p.thirstyclub_id || e.username === p.username);
            if (idx !== -1) {
              if (gameKey === 'reaction_time') {
                entries[idx].score = Math.min(entries[idx].score, score);
              } else {
                entries[idx].score = Math.max(entries[idx].score, score);
              }
            } else {
              entries.push({
                username: p.username || 'Anonymous',
                thirstyclub_id: p.thirstyclub_id || 'T999-XXXX',
                score: score
              });
            }
          }
        });
      }
    } catch (e) {
      console.warn("Failed to fetch game leaderboard, using mock:", e);
    }

    if (gameKey === 'reaction_time') {
      entries.sort((a, b) => a.score - b.score);
    } else {
      entries.sort((a, b) => b.score - a.score);
    }

    const top5 = entries.slice(0, 5);

    let metricSuffix = ' correct';
    if (gameKey === 'treasure_hunt') metricSuffix = ' codes';
    else if (gameKey === 'speed_tap') metricSuffix = ' taps';
    else if (gameKey === 'reaction_time') metricSuffix = ' ms';
    else if (gameKey === 'social_raids') metricSuffix = ' raids';
    else if (gameKey === 'bounties_completed') metricSuffix = ' bounties';

    container.innerHTML = `
      <div class="game-leaderboard-header">
        <div class="game-leaderboard-title">🏆 ${gameTitle} LEADERBOARD</div>
        <div class="game-leaderboard-subtitle">TOP MEMBERS</div>
      </div>
      <ul class="game-leaderboard-list">
        ${top5.map((item, idx) => {
          const isCurrentUser = currentUserProfile && 
            (item.thirstyclub_id === currentUserProfile.thirstyclub_id || item.username === currentUserProfile.username);
          return `
            <li class="game-leaderboard-item rank-${idx+1} ${isCurrentUser ? 'user-row' : ''}">
              <span class="rank">#${idx+1}</span>
              <span class="name">${item.username}</span>
              <span class="score">${item.score}${metricSuffix}</span>
            </li>
          `;
        }).join('')}
      </ul>
    `;
  };

  // Helper to shuffle list of questions
  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // --- Real Streaks & Activity from Supabase ---

  const renderGames = async () => {
    switchGameView('games-hub-select');

    const savedTriviaPoints = parseInt(localStorage.getItem('thirsty_trivia_points') || '0', 10);
    const triviaPointsDisplay = document.getElementById('trivia-current-points');
    if (triviaPointsDisplay) triviaPointsDisplay.textContent = savedTriviaPoints;

    // Render horizontal streaks list from real DB data
    const streaksList = document.getElementById('lobby-streaks-list');
    if (streaksList) {
      streaksList.innerHTML = '';
      
      // Get current user details
      const activeUsername = (currentUserProfile && currentUserProfile.username) || 'Guest Member';
      const activeAvatar = (currentUserProfile && currentUserProfile.avatar_url) || defaultAvatar;
      const userStreakCount = currentUserProfile?.socials?.streak_count || 1;

      // Inject current user streak first
      const userStreakItem = document.createElement('div');
      userStreakItem.className = 'lobby-streak-item';
      userStreakItem.innerHTML = `
        <div class="lobby-streak-avatar-frame" style="background: linear-gradient(135deg, #2ed573, transparent); border-color: rgba(46, 213, 115, 0.3);">
          <img src="${activeAvatar}" class="lobby-streak-avatar" alt="You">
        </div>
        <div class="lobby-streak-name" style="color: #2ed573;">You</div>
        <div class="lobby-streak-val" style="color: #2ed573;">🔥 ${userStreakCount}</div>
      `;
      streaksList.appendChild(userStreakItem);

      // Fetch top streaks from Supabase
      try {
        const { data: allProfiles, error } = await supabase
          .from('profiles')
          .select('username, avatar_url, socials, thirstyclub_id')
          .limit(1000);
        
        if (allProfiles && !error) {
          const streakProfiles = allProfiles
            .filter(p => p.socials?.streak_count && p.socials.streak_count > 0)
            .filter(p => !currentUserProfile || p.thirstyclub_id !== currentUserProfile.thirstyclub_id)
            .sort((a, b) => (b.socials.streak_count || 0) - (a.socials.streak_count || 0))
            .slice(0, 10);

          streakProfiles.forEach(s => {
            const item = document.createElement('div');
            item.className = 'lobby-streak-item';
            item.innerHTML = `
              <div class="lobby-streak-avatar-frame">
                <img src="${s.avatar_url || defaultAvatar}" class="lobby-streak-avatar" alt="${s.username}">
              </div>
              <div class="lobby-streak-name">${s.username || 'Anonymous'}</div>
              <div class="lobby-streak-val">🔥 ${s.socials.streak_count}</div>
            `;
            streaksList.appendChild(item);
          });

          // If no one else has streaks, show a placeholder
          if (streakProfiles.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'lobby-streak-item';
            placeholder.innerHTML = `<div class="lobby-streak-name" style="font-size: 0.6rem; color: var(--text-dim);">Check in daily to build your streak!</div>`;
            streaksList.appendChild(placeholder);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch streaks:", e);
      }
    }

    // Render recent achievements timeline feed
    const recentsList = document.getElementById('lobby-recents-list');
    if (recentsList) {
      recentsList.innerHTML = '';
      mockRecentActivities.forEach(act => {
        const item = document.createElement('div');
        item.className = 'lobby-recent-item';
        item.innerHTML = `
          <img src="${act.avatar}" class="lobby-recent-avatar" alt="${act.name}">
          <div class="lobby-recent-content">
            <div class="lobby-recent-msg">
              <strong>${act.name}</strong> ${act.message}
              ${act.reward ? `<span style="color:#2ed573; font-weight:800; margin-left:4px;">(${act.reward})</span>` : ''}
            </div>
            <div class="lobby-recent-meta">
              <button class="lobby-recent-action-btn clap-btn-${act.id} ${act.clapped ? 'clapped' : ''}" style="${act.clapped ? 'color: var(--accent-color);' : ''}">
                👏 <span class="clap-count">${act.claps}</span>
              </button>
              <button class="lobby-recent-action-btn comment-btn-${act.id}">
                💬 <span>${act.comments}</span>
              </button>
            </div>
          </div>
        `;

        // Bind simple in-memory clap toggle
        const clapBtn = item.querySelector(`.clap-btn-${act.id}`);
        clapBtn.onclick = () => {
          if (act.clapped) {
            act.clapped = false;
            act.claps -= 1;
            clapBtn.style.color = '';
          } else {
            act.clapped = true;
            act.claps += 1;
            clapBtn.style.color = 'var(--accent-color)';
          }
          item.querySelector('.clap-count').textContent = act.claps;
        };

        recentsList.appendChild(item);
      });
    }

    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
      card.onclick = () => {
        const cat = card.getAttribute('data-category');
        startQuiz(cat);
      };
    });

    renderTreasureHunts();
    renderSocialRaids();
    renderBounties();
  };

  // --- TRIVIA BLITZ ---
  const startQuiz = (category) => {
    activeCategory = category;
    currentQuestionIdx = 0;
    triviaScore = 0;
    triviaQuestionsPool = shuffleArray(triviaData[category]);
    triviaTimeLeft = 60;

    document.getElementById('trivia-category-select').style.display = 'none';
    document.getElementById('trivia-question-screen').style.display = 'block';
    document.getElementById('trivia-results-screen').style.display = 'none';
    
    const timerDisplay = document.getElementById('trivia-timer-display');
    if (timerDisplay) timerDisplay.style.display = 'block';
    
    document.getElementById('trivia-timer-count').textContent = triviaTimeLeft;

    // Start 60s countdown
    if (triviaTimerInterval) clearInterval(triviaTimerInterval);
    triviaTimerInterval = setInterval(() => {
      triviaTimeLeft -= 1;
      document.getElementById('trivia-timer-count').textContent = triviaTimeLeft;
      if (triviaTimeLeft <= 0) {
        clearInterval(triviaTimerInterval);
        showQuizResults();
      }
    }, 1000);

    renderTriviaQuestion();
  };

  const renderTriviaQuestion = () => {
    if (triviaTimeLeft <= 0) return;
    
    // Load question (modulo handles wrapping around if player answers all questions within 60s)
    const qIdx = currentQuestionIdx % triviaQuestionsPool.length;
    const q = triviaQuestionsPool[qIdx];
    
    document.getElementById('trivia-progress-text').textContent = `Question ${currentQuestionIdx + 1}`;
    document.getElementById('trivia-category-label').textContent = activeCategory === 'thirstynalia' ? 'ThirstyNalia' : 'Songs';
    document.getElementById('trivia-progress-bar').style.width = `${((qIdx + 1) / triviaQuestionsPool.length) * 100}%`;
    document.getElementById('trivia-question-text').textContent = q.question;

    const optionsContainer = document.getElementById('trivia-options-container');
    optionsContainer.innerHTML = '';

    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-btn';
      btn.innerHTML = opt;
      btn.onclick = () => selectQuizAnswer(idx);
      optionsContainer.appendChild(btn);
    });

    document.getElementById('trivia-feedback-container').style.display = 'none';
  };

  const selectQuizAnswer = (selectedIndex) => {
    if (triviaTimeLeft <= 0) return;

    const qIdx = currentQuestionIdx % triviaQuestionsPool.length;
    const q = triviaQuestionsPool[qIdx];
    const optionsContainer = document.getElementById('trivia-options-container');
    const buttons = optionsContainer.querySelectorAll('.quiz-option-btn');

    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === q.answer) {
        btn.classList.add('correct');
      } else if (idx === selectedIndex) {
        btn.classList.add('incorrect');
      }
    });

    const isCorrect = selectedIndex === q.answer;
    if (isCorrect) {
      triviaScore += 1;
    }

    // Auto-advance after 300ms delay for visual feedback
    setTimeout(() => {
      currentQuestionIdx += 1;
      renderTriviaQuestion();
    }, 350);
  };

  const showQuizResults = () => {
    if (triviaTimerInterval) clearInterval(triviaTimerInterval);
    
    document.getElementById('trivia-timer-display').style.display = 'none';
    document.getElementById('trivia-question-screen').style.display = 'none';
    document.getElementById('trivia-results-screen').style.display = 'block';

    document.getElementById('trivia-score-text').textContent = `Correct Answers: ${triviaScore}`;

    const earnedPoints = triviaScore * 50;
    document.getElementById('trivia-xp-awarded').textContent = `+${earnedPoints} PTS added to your wallet balance`;

    const currentPoints = parseInt(localStorage.getItem('thirsty_trivia_points') || '0', 10);
    const newPointsTotal = currentPoints + earnedPoints;
    localStorage.setItem('thirsty_trivia_points', newPointsTotal);
    
    const triviaPointsDisplay = document.getElementById('trivia-current-points');
    if (triviaPointsDisplay) triviaPointsDisplay.textContent = newPointsTotal;

    // Sync high score to Supabase
    updateUserGameScore('trivia_blitz', triviaScore, 'max');
    fetchGameLeaderboard('trivia_blitz', 'leaderboard-trivia-container');
  };

  // --- TREASURE HUNT ---
  const renderTreasureHunts = () => {
    const container = document.getElementById('treasure-hunts-container');
    if (!container) return;
    container.innerHTML = '';

    const unlockedIds = JSON.parse(localStorage.getItem('thirsty_unlocked_hunts') || '[]');
    let completedCount = 0;

    treasureHunts.forEach(hunt => {
      const isUnlocked = unlockedIds.includes(hunt.id);
      if (isUnlocked) completedCount += 1;

      const card = document.createElement('div');
      card.className = `hunt-card ${isUnlocked ? 'unlocked' : ''}`;
      card.innerHTML = `
        <div class="hunt-header">
          <span class="hunt-title">${hunt.title}</span>
          <span class="hunt-badge ${isUnlocked ? 'unlocked' : 'locked'}">${isUnlocked ? '✓ Unlocked' : 'Locked'}</span>
        </div>
        <div class="hunt-clue-box">
          <div class="hunt-clue-title">Clue & Instruction</div>
          <div class="hunt-clue-text">${hunt.clue}</div>
        </div>
        <form class="hunt-form" id="hunt-form-${hunt.id}" style="${isUnlocked ? 'display:none;' : ''}">
          <div class="hunt-clue-title" style="margin-bottom: 0.35rem;">Enter Secret Code</div>
          <div class="hunt-input-row">
            <input type="text" class="hunt-input" id="hunt-input-${hunt.id}" placeholder="e.g. TC-BOX-XXXX" required>
            <button type="submit" class="hunt-submit-btn">Claim</button>
          </div>
        </form>
        <div style="font-size: 0.75rem; color: #2ed573; font-weight: 700; ${isUnlocked ? '' : 'display:none;'}">+${hunt.points} PTS Awarded</div>
      `;

      container.appendChild(card);

      if (!isUnlocked) {
        const form = card.querySelector(`#hunt-form-${hunt.id}`);
        form.onsubmit = (e) => {
          e.preventDefault();
          const input = card.querySelector(`#hunt-input-${hunt.id}`);
          const code = input.value.trim().toUpperCase();

          if (code === hunt.code) {
            unlockedIds.push(hunt.id);
            localStorage.setItem('thirsty_unlocked_hunts', JSON.stringify(unlockedIds));
            
            const currentPoints = parseInt(localStorage.getItem('thirsty_trivia_points') || '0', 10);
            localStorage.setItem('thirsty_trivia_points', currentPoints + hunt.points);

            alert(`🎉 Success! Box Unlocked. You earned +${hunt.points} PTS!`);
            renderTreasureHunts();
            
            // Sync codes count to Supabase leaderboard
            updateUserGameScore('treasure_hunt', unlockedIds.length, 'max');
            fetchGameLeaderboard('treasure_hunt', 'leaderboard-treasure-container');
          } else {
            alert('✗ Invalid box code. Look closer at the clue!');
          }
        };
      }
    });

    document.getElementById('treasure-completed-count').textContent = `${completedCount}/${treasureHunts.length}`;
  };


  // --- SOCIAL RAIDS ---
  const renderSocialRaids = () => {
    const container = document.getElementById('raids-list-container');
    if (!container) return;
    container.innerHTML = '';

    const completedRaids = JSON.parse(localStorage.getItem('thirsty_completed_raids') || '[]');

    raidsData.forEach(raid => {
      const isClaimed = completedRaids.includes(raid.id);
      const isOpened = sessionStorage.getItem(`opened_raid_${raid.id}`) === 'true';

      const card = document.createElement('div');
      card.className = 'raid-card';
      card.innerHTML = `
        <div class="raid-header">
          <span class="raid-title">${raid.title}</span>
          <span class="raid-points">+${raid.points} PTS</span>
        </div>
        <div class="raid-body">${raid.body}</div>
        <div class="raid-actions">
          <a class="raid-btn action" href="${raid.link}" target="_blank" id="raid-link-btn-${raid.id}">Raid Link 📣</a>
          <button class="raid-btn claim" id="raid-claim-btn-${raid.id}" ${isClaimed ? 'disabled' : ''}>
            ${isClaimed ? 'Claimed ✓' : 'Claim points'}
          </button>
        </div>
      `;

      container.appendChild(card);

      const linkBtn = card.querySelector(`#raid-link-btn-${raid.id}`);
      linkBtn.onclick = () => {
        sessionStorage.setItem(`opened_raid_${raid.id}`, 'true');
        // Enable claim button immediately
        const claimBtn = card.querySelector(`#raid-claim-btn-${raid.id}`);
        if (claimBtn) claimBtn.disabled = false;
      };

      const claimBtn = card.querySelector(`#raid-claim-btn-${raid.id}`);
      // Disabled if not claimed and not opened yet
      if (!isClaimed && !isOpened) {
        claimBtn.disabled = true;
      }

      claimBtn.onclick = () => {
        completedRaids.push(raid.id);
        localStorage.setItem('thirsty_completed_raids', JSON.stringify(completedRaids));

        const currentPoints = parseInt(localStorage.getItem('thirsty_trivia_points') || '0', 10);
        localStorage.setItem('thirsty_trivia_points', currentPoints + raid.points);

        alert(`🎉 Raid completed! You claimed +${raid.points} PTS!`);
        renderSocialRaids();

        // Increment raids completed in database
        updateUserGameScore('social_raids', 1, 'add');
        fetchGameLeaderboard('social_raids', 'leaderboard-raids-container');
      };
    });

    document.getElementById('raids-completed-count').textContent = `${completedRaids.length}/${raidsData.length}`;
  };

  // --- BOUNTIES ---
  const renderBounties = () => {
    const container = document.getElementById('bounties-list-container');
    if (!container) return;
    container.innerHTML = '';

    const completedBounties = JSON.parse(localStorage.getItem('thirsty_completed_bounties') || '[]');

    bountiesData.forEach(bounty => {
      const isClaimed = completedBounties.includes(bounty.id);

      const card = document.createElement('div');
      card.className = 'bounty-card';
      card.innerHTML = `
        <div class="bounty-details">
          <div class="bounty-title">${bounty.title}</div>
          <div class="bounty-desc">${bounty.desc}</div>
          <div class="bounty-reward">+${bounty.points} PTS</div>
        </div>
        <button class="bounty-claim-btn" id="bounty-claim-${bounty.id}" ${isClaimed ? 'disabled' : ''}>
          ${isClaimed ? 'Claimed ✓' : 'Verify & Claim'}
        </button>
      `;

      container.appendChild(card);

      const claimBtn = card.querySelector(`#bounty-claim-${bounty.id}`);
      claimBtn.onclick = () => {
        completedBounties.push(bounty.id);
        localStorage.setItem('thirsty_completed_bounties', JSON.stringify(completedBounties));

        const currentPoints = parseInt(localStorage.getItem('thirsty_trivia_points') || '0', 10);
        localStorage.setItem('thirsty_trivia_points', currentPoints + bounty.points);

        alert(`🎉 Mission accomplished! You verified and claimed +${bounty.points} PTS!`);
        renderBounties();

        // Increment bounties completed in database
        updateUserGameScore('bounties_completed', 1, 'add');
        fetchGameLeaderboard('bounties_completed', 'leaderboard-bounties-container');
      };
    });

    document.getElementById('bounties-completed-count').textContent = `${completedBounties.length}/${bountiesData.length}`;
  };

  // --- GAME VIEW SWITCHERS / LISTENERS ---
  const initGamesListeners = () => {
    const btnSelectTrivia = document.getElementById('btn-select-trivia');
    const btnSelectTreasure = document.getElementById('btn-select-treasure');
    const btnSelectRaids = document.getElementById('btn-select-raids');
    const btnSelectBounties = document.getElementById('btn-select-bounties');

    const triviaBackBtn = document.getElementById('trivia-back-btn');
    const treasureBackBtn = document.getElementById('treasure-back-btn');
    const raidsBackBtn = document.getElementById('raids-back-btn');
    const bountiesBackBtn = document.getElementById('bounties-back-btn');

    const triviaRestartBtn = document.getElementById('trivia-restart-btn');
    const triviaFinishBtn = document.getElementById('trivia-finish-btn');

    // Selection Grid
    if (btnSelectTrivia) {
      btnSelectTrivia.onclick = () => {
        switchGameView('trivia-game-view');
        document.getElementById('trivia-category-select').style.display = 'block';
        document.getElementById('trivia-question-screen').style.display = 'none';
        document.getElementById('trivia-results-screen').style.display = 'none';
        fetchGameLeaderboard('trivia_blitz', 'leaderboard-trivia-container');
      };
    }

    if (btnSelectTreasure) {
      btnSelectTreasure.onclick = () => {
        switchGameView('treasure-hunt-view');
        renderTreasureHunts();
        fetchGameLeaderboard('treasure_hunt', 'leaderboard-treasure-container');
      };
    }

    if (btnSelectRaids) {
      btnSelectRaids.onclick = () => {
        switchGameView('raids-game-view');
        renderSocialRaids();
        fetchGameLeaderboard('social_raids', 'leaderboard-raids-container');
      };
    }

    if (btnSelectBounties) {
      btnSelectBounties.onclick = () => {
        switchGameView('bounties-game-view');
        renderBounties();
        fetchGameLeaderboard('bounties_completed', 'leaderboard-bounties-container');
      };
    }

    // Back Buttons
    if (triviaBackBtn) triviaBackBtn.onclick = () => { if (triviaTimerInterval) clearInterval(triviaTimerInterval); renderGames(); };
    if (treasureBackBtn) treasureBackBtn.onclick = () => renderGames();
    if (raidsBackBtn) raidsBackBtn.onclick = () => renderGames();
    if (bountiesBackBtn) bountiesBackBtn.onclick = () => renderGames();

    // Trivia Actions
    if (triviaRestartBtn) {
      triviaRestartBtn.onclick = () => {
        document.getElementById('trivia-category-select').style.display = 'block';
        document.getElementById('trivia-question-screen').style.display = 'none';
        document.getElementById('trivia-results-screen').style.display = 'none';
      };
    }
    if (triviaFinishBtn) triviaFinishBtn.onclick = () => renderGames();
  };

  initGamesListeners();

  const initPostCreator = () => {
    const btnTogglePoll = document.getElementById('btn-toggle-poll-fields');
    const pollFields = document.getElementById('creator-poll-fields');
    const btnSubmitPost = document.getElementById('btn-submit-post');

    if (btnTogglePoll && pollFields) {
      btnTogglePoll.onclick = () => {
        const isHidden = pollFields.style.display === 'none';
        pollFields.style.display = isHidden ? 'block' : 'none';
        btnTogglePoll.textContent = isHidden ? '- REMOVE POLL' : '+ ADD POLL';
      };
    }

    if (btnSubmitPost) {
      btnSubmitPost.onclick = () => {
        const textInput = document.getElementById('creator-post-text');
        const imgInput = document.getElementById('creator-post-image');
        
        const textVal = textInput.value.trim();
        const imgVal = imgInput.value.trim();

        if (!textVal) {
          alert("Please write something to broadcast!");
          return;
        }

        let pollData = null;
        const pollFieldsVisible = pollFields && pollFields.style.display !== 'none';
        
        if (pollFieldsVisible) {
          const qInput = document.getElementById('creator-poll-question');
          const opt1Input = document.getElementById('creator-poll-opt1');
          const opt2Input = document.getElementById('creator-poll-opt2');
          const opt3Input = document.getElementById('creator-poll-opt3');
          const opt4Input = document.getElementById('creator-poll-opt4');

          const question = qInput.value.trim();
          const opt1 = opt1Input.value.trim();
          const opt2 = opt2Input.value.trim();
          const opt3 = opt3Input.value.trim();
          const opt4 = opt4Input.value.trim();

          if (!question || !opt1 || !opt2) {
            alert("Please fill in the poll question and at least two options.");
            return;
          }

          const options = [
            { text: opt1, votes: 0 },
            { text: opt2, votes: 0 }
          ];
          if (opt3) options.push({ text: opt3, votes: 0 });
          if (opt4) options.push({ text: opt4, votes: 0 });

          pollData = {
            question: question,
            options: options
          };
        }

        const newPostId = mockSignals.length ? Math.max(...mockSignals.map(s => s.id)) + 1 : 1;
        const activeUsername = (currentUserProfile && currentUserProfile.username) || 'tc_admin';
        const avatar = (currentUserProfile && currentUserProfile.avatar_url) || "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'><circle cx='50' cy='50' r='50' fill='%23ff3e3e'/><text x='50' y='55' font-family='monospace' font-size='20' fill='white' font-weight='bold' text-anchor='middle'>999</text></svg>";
        
        const newPost = {
          id: newPostId,
          username: activeUsername,
          handle: `@${activeUsername.toLowerCase().replace(/\s+/g, '')}`,
          avatar: avatar,
          time: 'Just now',
          text: textVal,
          media: imgVal || '',
          likes: 0,
          comments: 0,
          liked: false,
          commentsList: []
        };

        if (pollData) {
          newPost.poll = pollData;
        }

        mockSignals.unshift(newPost);
        localStorage.setItem('thirsty_club_signals', JSON.stringify(mockSignals));

        // Clear fields
        textInput.value = '';
        imgInput.value = '';
        if (pollFields) {
          pollFields.style.display = 'none';
          document.getElementById('creator-poll-question').value = '';
          document.getElementById('creator-poll-opt1').value = '';
          document.getElementById('creator-poll-opt2').value = '';
          document.getElementById('creator-poll-opt3').value = '';
          document.getElementById('creator-poll-opt4').value = '';
        }
        if (btnTogglePoll) {
          btnTogglePoll.textContent = '+ ADD POLL';
        }

        renderSignals();
      };
    }
  };

  initPostCreator();

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

  // ==========================================
  // E-commerce Cart & Checkout State Management
  // ==========================================
  let cart = [];
  let selectedProductSize = null;

  // 1. Show Product Details Page
  window.showProductDetails = (productId) => {
    const p = shopProducts.find(prod => prod.id === productId);
    if (!p) return;

    selectedProductSize = p.sizes[0] || null; // default to first size

    const container = document.getElementById('product-details-container');
    if (!container) return;

    container.innerHTML = `
      <button class="product-details-back-btn" id="product-details-back">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        <span>BACK TO SHOP</span>
      </button>

      <div class="product-details-grid">
        <div class="product-details-image-container">
          <img class="product-details-img" src="${p.image}" alt="${p.title}">
        </div>

        <div class="product-details-info">
          <h2 class="product-details-title">${p.title}</h2>
          <div class="product-details-price">${p.price}</div>
          <p class="product-details-desc">${p.desc}</p>

          <div>
            <div class="size-selector-label">SELECT SIZE</div>
            <div class="product-details-sizes">
              ${p.sizes.map((s, idx) => `
                <button class="size-select-chip ${idx === 0 ? 'active' : ''}" data-size="${s}">${s}</button>
              `).join('')}
            </div>
          </div>

          <div class="qty-selector-row">
            <span class="size-selector-label" style="margin-bottom: 0;">QTY</span>
            <input type="number" id="product-details-qty" value="1" min="1" max="99" class="qty-input-box">
          </div>

          <button class="cta-button fill-btn" id="add-to-cart-btn" style="width: 100%; margin-top: 1rem; padding: 1rem;">ADD TO CART</button>
        </div>
      </div>
    `;

    // Bind Details Back button
    const backDetailsBtn = document.getElementById('product-details-back');
    if (backDetailsBtn) {
      backDetailsBtn.addEventListener('click', () => {
        switchView('view-wearthirsty');
      });
    }

    // Bind Size Selection Chips
    const chips = container.querySelectorAll('.size-select-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedProductSize = chip.getAttribute('data-size');
      });
    });

    // Bind Add to Cart CTA
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', () => {
        const qtyInput = document.getElementById('product-details-qty');
        const qty = parseInt(qtyInput?.value || '1', 10);
        if (isNaN(qty) || qty < 1) {
          alert('Please enter a valid quantity.');
          return;
        }

        addToCart(p, selectedProductSize, qty);
      });
    }

    switchView('view-product-details');
  };

  // 2. Add to Cart Function
  const addToCart = (product, size, quantity) => {
    const existingIndex = cart.findIndex(item => item.id === product.id && item.size === size);

    if (existingIndex > -1) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        price: parseFloat(product.price.replace('$', '')),
        size: size,
        quantity: quantity,
        image: product.image
      });
    }

    updateCartBadge();
    renderCartItems();
    openCartSidebar();

    localStorage.setItem('thirsty_cart_added', 'true');
    if (typeof updateBadgesStatus === 'function') {
      updateBadgesStatus();
    }
  };

  // 3. Remove from Cart
  const removeFromCart = (id, size) => {
    cart = cart.filter(item => !(item.id === id && item.size === size));
    updateCartBadge();
    renderCartItems();
  };

  // 4. Update Cart Qty
  const updateCartQty = (id, size, change) => {
    const item = cart.find(item => item.id === id && item.size === size);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
      removeFromCart(id, size);
    } else {
      updateCartBadge();
      renderCartItems();
    }
  };

  // 5. Update Cart Badge Count
  const updateCartBadge = () => {
    const badge = document.getElementById('header-cart-count');
    if (!badge) return;

    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalCount > 0) {
      badge.textContent = totalCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  };

  // 6. Render Cart Items
  const renderCartItems = () => {
    const container = document.getElementById('cart-items-container');
    const subtotalVal = document.getElementById('cart-subtotal-val');
    if (!container) return;

    if (cart.length === 0) {
      container.innerHTML = `<div class="cart-empty-msg" style="text-align: center; color: var(--text-dim); padding-top: 3rem; font-size: 0.9rem;">YOUR CART IS EMPTY</div>`;
      if (subtotalVal) subtotalVal.textContent = '$0.00';
      return;
    }

    container.innerHTML = '';
    let subtotal = 0;

    cart.forEach(item => {
      const rowPrice = item.price * item.quantity;
      subtotal += rowPrice;

      const row = document.createElement('div');
      row.className = 'cart-item-row';
      row.innerHTML = `
        <img src="${item.image}" alt="${item.title}" class="cart-item-img">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.title}</div>
          <div class="cart-item-meta">SIZE: ${item.size}</div>
          <div class="cart-item-price">$${item.price.toFixed(2)}</div>
          <div class="cart-item-qty-control">
            <button class="cart-item-qty-btn decrease-btn" data-id="${item.id}" data-size="${item.size}">-</button>
            <span style="font-family: Satoshi, monospace; font-size: 0.8rem; font-weight: 700;">${item.quantity}</span>
            <button class="cart-item-qty-btn increase-btn" data-id="${item.id}" data-size="${item.size}">+</button>
          </div>
        </div>
        <button class="cart-item-remove-btn" data-id="${item.id}" data-size="${item.size}">&times;</button>
      `;

      // Bind row controls
      row.querySelector('.decrease-btn').addEventListener('click', () => updateCartQty(item.id, item.size, -1));
      row.querySelector('.increase-btn').addEventListener('click', () => updateCartQty(item.id, item.size, 1));
      row.querySelector('.cart-item-remove-btn').addEventListener('click', () => removeFromCart(item.id, item.size));

      container.appendChild(row);
    });

    if (subtotalVal) subtotalVal.textContent = `$${subtotal.toFixed(2)}`;
  };

  // 7. Open/Close Cart Sidebar
  const openCartSidebar = () => {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    if (sidebar) sidebar.classList.add('active');
    if (overlay) overlay.classList.add('active');
  };

  const closeCartSidebar = () => {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
  };

  // Bind Cart Sidebar Toggles
  const headerCartBtn = document.getElementById('header-cart-btn');
  const closeCartBtn = document.getElementById('close-cart-btn');
  const cartOverlay = document.getElementById('cart-overlay');

  if (headerCartBtn) headerCartBtn.addEventListener('click', openCartSidebar);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartSidebar);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCartSidebar);

  // 8. Checkout Modal Handling
  const checkoutDialog = document.getElementById('checkout-dialog');
  const checkoutBtn = document.getElementById('checkout-btn');
  const closeCheckoutBtn = document.getElementById('close-checkout-btn');
  const checkoutTotalVal = document.getElementById('checkout-total-val');
  const checkoutForm = document.getElementById('checkout-form');
  const successDialog = document.getElementById('order-success-dialog');
  const successCloseBtn = document.getElementById('success-close-btn');

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        alert('Your cart is empty.');
        return;
      }
      closeCartSidebar();

      // Update total price in form
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      if (checkoutTotalVal) checkoutTotalVal.textContent = `$${subtotal.toFixed(2)}`;

      // Prefill user details if logged in
      const nameInput = document.getElementById('checkout-name');
      const emailInput = document.getElementById('checkout-email');
      const user = supabase?.auth?.user ? supabase.auth.user() : null;
      if (user) {
        if (emailInput) emailInput.value = user.email || '';
      }

      if (checkoutDialog) checkoutDialog.showModal();
    });
  }

  if (closeCheckoutBtn && checkoutDialog) {
    closeCheckoutBtn.addEventListener('click', () => {
      checkoutDialog.close();
    });
  }

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Validate inputs
      const cardNum = document.getElementById('checkout-cardnumber')?.value || '';
      const expiry = document.getElementById('checkout-expiry')?.value || '';
      const cvv = document.getElementById('checkout-cvv')?.value || '';

      if (!/^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/.test(cardNum.trim())) {
        alert('Please enter a valid 16-digit credit card number.');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(expiry.trim())) {
        alert('Expiry date must be in MM/YY format.');
        return;
      }
      if (!/^\d{3,4}$/.test(cvv.trim())) {
        alert('CVV must be 3 or 4 digits.');
        return;
      }

      // Successful order simulation
      if (checkoutDialog) checkoutDialog.close();

      // Generate random order ID
      const orderId = '#TC999-' + Math.floor(1000 + Math.random() * 9000);
      const successOrderIdSpan = document.getElementById('success-order-id');
      if (successOrderIdSpan) successOrderIdSpan.textContent = orderId;

      // Reset cart
      cart = [];
      updateCartBadge();
      renderCartItems();

      // Open Success dialog
      if (successDialog) successDialog.showModal();
    });
  }

  if (successCloseBtn && successDialog) {
    successCloseBtn.addEventListener('click', () => {
      successDialog.close();
      switchView('view-wearthirsty');
    });
  }

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
      ctx.font = '900 28px "Satoshi", sans-serif';
      ctx.fillText("Thirstyclub999", 0, -8);
      ctx.font = '700 13px "Satoshi", sans-serif';
      ctx.fillText("PASSPORT", 0, 18);
      ctx.restore();

      // 6. Draw Bottom Page Content
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'left';
      ctx.font = '900 22px "Satoshi", sans-serif';
      ctx.fillText("ThirstyClub999", 45, 452);
      ctx.font = '700 11px "Satoshi", sans-serif';
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
        ctx.font = '900 9px "Satoshi", sans-serif';
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
          ctx.font = '900 13px "Satoshi", sans-serif';
          ctx.fillText(value, rx + rw / 2, ry + 42);
        }
      };

      drawRowFull("Name:", holderName, tblX, tblY, tblW);
      drawRowFull("Place of Thirst:", pobVal, tblX, tblY + rowH, tblW);
      drawRowFull("Gender:", genderVal, tblX, tblY + 2 * rowH, tblW);
      drawRowFull("Signature:", sigText, tblX, tblY + 3 * rowH, tblW, true);

      // Draw Unlocked Matcha Stamp Sticker on the Top Page
      const unlockedStickers = JSON.parse(localStorage.getItem('unlocked_stickers') || '[]');
      if (unlockedStickers.includes('matcha')) {
        ctx.save();
        // Position on the Top Page (X: 180, Y: 140)
        ctx.translate(180, 140);
        ctx.rotate(-0.15); // Slightly tilted stamp
        
        // Outer dotted border stamp circle
        ctx.strokeStyle = '#1dbf73';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, 48, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash

        // Inner solid circle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1dbf73';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Green Matcha Swirl icon
        ctx.fillStyle = '#1dbf73';
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.fill();

        // Inner details text
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 9px "Satoshi", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("MATCHA", 0, -6);
        ctx.font = '800 6px "Satoshi", sans-serif';
        ctx.fillText("VERIFIED", 0, 6);
        ctx.restore();
      }
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
    // Initial sync
    if (toggleDarkMode.checked) {
      document.documentElement.classList.remove('light-mode');
    } else {
      document.documentElement.classList.add('light-mode');
    }
    toggleDarkMode.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.documentElement.classList.remove('light-mode');
      } else {
        document.documentElement.classList.add('light-mode');
      }
      updateAdColors(currentAdIndex);
    });
  }

  // Setup Next Carousel countdown timers (Homepage and Drops view)
  const targetDropTime = new Date('June 28, 2026 16:00:00').getTime();
  const targetRaidTime = new Date('June 20, 2026 12:00:00').getTime();
  const targetBountyTime = new Date('June 22, 2026 18:00:00').getTime();

  const updateCountdownTimers = () => {
    const now = new Date().getTime();

    // 1. Next Drop Timer (Countdown)
    const distanceDrop = targetDropTime - now;
    const dropTimer = document.getElementById('carousel-drop-timer');
    const crateTimer = document.getElementById('drops-crate-timer');
    if (distanceDrop < 0) {
      const expiredText = "00 : 00 : 00 : 00";
      if (dropTimer) dropTimer.textContent = expiredText;
      if (crateTimer) crateTimer.textContent = expiredText;
    } else {
      const d = Math.floor(distanceDrop / (1000 * 60 * 60 * 24));
      const h = Math.floor((distanceDrop % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distanceDrop % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distanceDrop % (1000 * 60)) / 1000);
      const timeStr = `${String(d).padStart(2, '0')} : ${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
      if (dropTimer) dropTimer.textContent = timeStr;
      if (crateTimer) crateTimer.textContent = timeStr;
    }

    // 2. Next Raid Timer (Live in Past)
    const distanceRaid = targetRaidTime - now;
    const raidTimer = document.getElementById('carousel-raid-timer');
    if (distanceRaid < 0) {
      if (raidTimer) raidTimer.textContent = "00 : 00 : 00 : 00";
    } else {
      const d = Math.floor(distanceRaid / (1000 * 60 * 60 * 24));
      const h = Math.floor((distanceRaid % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distanceRaid % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distanceRaid % (1000 * 60)) / 1000);
      if (raidTimer) raidTimer.textContent = `${String(d).padStart(2, '0')} : ${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
    }

    // 3. Next Bounty Timer (Live in Past)
    const distanceBounty = targetBountyTime - now;
    const bountyTimer = document.getElementById('carousel-bounty-timer');
    if (distanceBounty < 0) {
      if (bountyTimer) bountyTimer.textContent = "00 : 00 : 00 : 00";
    } else {
      const d = Math.floor(distanceBounty / (1000 * 60 * 60 * 24));
      const h = Math.floor((distanceBounty % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distanceBounty % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distanceBounty % (1000 * 60)) / 1000);
      if (bountyTimer) bountyTimer.textContent = `${String(d).padStart(2, '0')} : ${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
    }
  };

  setInterval(updateCountdownTimers, 1000);
  updateCountdownTimers();

  // --- Carousel Auto-Rotation & Dot Clicks ---
  let currentSlideIndex = 0;
  let carouselInterval = null;

  const showCarouselSlide = (index) => {
    const slides = document.querySelectorAll('#home-carousel-card .carousel-slide');
    const dots = document.querySelectorAll('#home-carousel-card .carousel-dot');
    if (slides.length === 0) return;

    slides.forEach((slide, idx) => {
      if (idx === index) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    dots.forEach((dot, idx) => {
      if (idx === index) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    currentSlideIndex = index;
  };

  const startCarouselRotation = () => {
    if (carouselInterval) clearInterval(carouselInterval);
    carouselInterval = setInterval(() => {
      const slides = document.querySelectorAll('#home-carousel-card .carousel-slide');
      if (slides.length === 0) return;
      const nextIndex = (currentSlideIndex + 1) % slides.length;
      showCarouselSlide(nextIndex);
    }, 5000);
  };

  const initCarousel = () => {
    const dots = document.querySelectorAll('#home-carousel-card .carousel-dot');
    dots.forEach(dot => {
      dot.onclick = () => {
        const targetIdx = parseInt(dot.getAttribute('data-go-to'), 10);
        showCarouselSlide(targetIdx);
        startCarouselRotation();
      };
    });

    // Button Actions inside carousel
    const carouselDropBtn = document.getElementById('carousel-drop-btn');
    if (carouselDropBtn) {
      carouselDropBtn.onclick = () => switchView('view-drops');
    }

    const carouselRaidBtn = document.getElementById('carousel-raid-btn');
    if (carouselRaidBtn) {
      carouselRaidBtn.onclick = () => {
        switchView('view-community');
        switchCommunityTab('games');
        switchGameView('raids-game-view');
        renderSocialRaids();
        fetchGameLeaderboard('social_raids', 'leaderboard-raids-container');
      };
    }

    const carouselBountyBtn = document.getElementById('carousel-bounty-btn');
    if (carouselBountyBtn) {
      carouselBountyBtn.onclick = () => {
        switchView('view-community');
        switchCommunityTab('games');
        switchGameView('bounties-game-view');
        renderBounties();
        fetchGameLeaderboard('bounties_completed', 'leaderboard-bounties-container');
      };
    }

    // Render dynamic news cards
    renderNews();

    showCarouselSlide(0);
    startCarouselRotation();
  };

  initCarousel();

  // --- Community Ad Carousel Auto-Rotation & Clicks ---
  let adCarouselInterval = null;

  const showAdSlide = (index) => {
    const slides = document.querySelectorAll('#community-ad-card .carousel-slide');
    const dots = document.querySelectorAll('#community-ad-dots .carousel-dot');
    if (slides.length === 0) return;

    slides.forEach((slide, idx) => {
      if (idx === index) {
        slide.style.display = 'flex';
        slide.classList.add('active');
      } else {
        slide.style.display = 'none';
        slide.classList.remove('active');
      }
    });

    dots.forEach((dot, idx) => {
      if (idx === index) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    currentAdIndex = index;
    updateAdColors(index);
  };

  const startAdRotation = () => {
    if (adCarouselInterval) clearInterval(adCarouselInterval);
    adCarouselInterval = setInterval(() => {
      const slides = document.querySelectorAll('#community-ad-card .carousel-slide');
      if (slides.length === 0) return;
      const nextIndex = (currentAdIndex + 1) % slides.length;
      showAdSlide(nextIndex);
    }, 6000);
  };

  const initAdCarousel = () => {
    const dots = document.querySelectorAll('#community-ad-dots .carousel-dot');
    dots.forEach(dot => {
      dot.onclick = () => {
        const targetIdx = parseInt(dot.getAttribute('data-ad-go'), 10);
        showAdSlide(targetIdx);
        startAdRotation();
      };
    });

    showAdSlide(0);
    startAdRotation();
  };

  initAdCarousel();

  // --- Dynamic Overall Community Leaderboard ---
  const renderLeaderboard = async () => {
    const container = document.getElementById('community-leaderboard-container');
    if (!container) return;

    // Render 5 skeleton list items first
    container.innerHTML = [1, 2, 3, 4, 5].map(() => `
      <li class="leaderboard-item skeleton-card">
        <div class="skeleton" style="width: 20px; height: 12px;"></div>
        <div class="skeleton" style="width: 28px; height: 28px; border-radius: 50%;"></div>
        <div class="skeleton" style="width: 110px; height: 14px; margin-left: 0.75rem;"></div>
        <div class="skeleton" style="width: 55px; height: 14px; justify-self: end;"></div>
      </li>
    `).join('');

    const calculatePoints = (p) => {
      const scores = p.socials?.game_scores || {};
      let pts = 0;
      if (scores.trivia_blitz) pts += scores.trivia_blitz * 50;
      if (scores.treasure_hunt) pts += scores.treasure_hunt * 150;
      if (scores.social_raids) pts += scores.social_raids * 150;
      if (scores.bounties_completed) pts += scores.bounties_completed * 200;
      return pts;
    };

    let entries = [];
    const fetchStart = Date.now();

    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('username, thirstyclub_id, socials, created_at, avatar_url')
        .order('created_at', { ascending: true })
        .limit(1000);
      
      if (profiles && !error) {
        entries = profiles;
      }
    } catch (e) {
      console.warn("Failed to fetch profiles for leaderboard:", e);
    }

    const mappedEntries = entries.map(e => ({
      username: e.username || 'Anonymous',
      thirstyclub_id: e.thirstyclub_id || 'T999-XXXX',
      created_at: e.created_at || new Date().toISOString(),
      avatar_url: e.avatar_url || '',
      points: calculatePoints(e)
    }));

    if (currentUserProfile) {
      const userExists = mappedEntries.some(e => e.thirstyclub_id === currentUserProfile.thirstyclub_id);
      if (!userExists) {
        const dbPoints = calculatePoints(currentUserProfile);
        const localPoints = parseInt(localStorage.getItem('thirsty_trivia_points') || '0', 10);
        mappedEntries.push({
          username: currentUserProfile.username || 'Guest',
          thirstyclub_id: currentUserProfile.thirstyclub_id || 'T999-XXXX',
          created_at: currentUserProfile.created_at || new Date().toISOString(),
          avatar_url: currentUserProfile.avatar_url || '',
          points: Math.max(dbPoints, localPoints)
        });
      } else {
        const userRow = mappedEntries.find(e => e.thirstyclub_id === currentUserProfile.thirstyclub_id);
        const localPoints = parseInt(localStorage.getItem('thirsty_trivia_points') || '0', 10);
        userRow.points = Math.max(userRow.points, localPoints);
      }
    }

    // Sort by points descending, then by join date ascending as tiebreaker
    mappedEntries.sort((a, b) => b.points - a.points || new Date(a.created_at) - new Date(b.created_at));

    const elapsed = Date.now() - fetchStart;
    const remainingDelay = Math.max(0, 400 - elapsed);
    await new Promise(resolve => setTimeout(resolve, remainingDelay));

    // Render podium for top 3
    const podiumContainer = document.getElementById('leaderboard-podium-container');
    if (podiumContainer) {
      const top3 = mappedEntries.slice(0, 3);
      const podiumItems = [];
      
      // Rank 2 (index 1)
      if (top3[1]) {
        podiumItems.push({
          rank: 2,
          player: top3[1],
          avatar: top3[1].avatar_url || defaultAvatar,
          borderColor: 'rgba(192, 192, 192, 0.3)',
          gradient: 'linear-gradient(135deg, rgba(192, 192, 192, 0.08) 0%, rgba(255,255,255,0.01) 100%)',
          icon: '🥈'
        });
      }
      
      // Rank 1 (index 0)
      if (top3[0]) {
        podiumItems.push({
          rank: 1,
          player: top3[0],
          avatar: top3[0].avatar_url || defaultAvatar,
          borderColor: 'rgba(255, 215, 0, 0.45)',
          gradient: 'linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(255, 62, 62, 0.04) 100%)',
          icon: '👑'
        });
      }
      
      // Rank 3 (index 2)
      if (top3[2]) {
        podiumItems.push({
          rank: 3,
          player: top3[2],
          avatar: top3[2].avatar_url || defaultAvatar,
          borderColor: 'rgba(205, 127, 50, 0.3)',
          gradient: 'linear-gradient(135deg, rgba(205, 127, 50, 0.08) 0%, rgba(255,255,255,0.01) 100%)',
          icon: '🥉'
        });
      }

      podiumItems.sort((a, b) => {
        const order = { 2: 0, 1: 1, 3: 2 };
        return order[a.rank] - order[b.rank];
      });

      podiumContainer.innerHTML = `
        <div class="tab-title" style="margin-bottom: 0.5rem;">TOP MEMBERS</div>
        <div class="top-members-podium">
          ${podiumItems.map(item => {
            const isCurrentUser = currentUserProfile && item.player.thirstyclub_id === currentUserProfile.thirstyclub_id;
            return `
              <div class="podium-card rank-${item.rank} ${isCurrentUser ? 'is-user' : ''}" data-thirstyid="${item.player.thirstyclub_id}">
                <div class="podium-icon">${item.icon}</div>
                <div class="podium-avatar-wrap">
                  <img src="${item.avatar}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <span class="podium-name">${item.player.username}</span>
                <span class="podium-points">${item.player.points.toLocaleString()} PTS</span>
                <span class="podium-rank-label">RANK #${item.rank}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;

      // Add click handlers to podium cards
      podiumContainer.querySelectorAll('.podium-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
          const tid = card.getAttribute('data-thirstyid');
          if (tid) openUserProfileModal(tid);
        });
      });
    }

    // Render list for rank 4 and below
    container.innerHTML = '';
    const remainingPlayers = mappedEntries.slice(3);
    
    remainingPlayers.forEach((e, idx) => {
      const realRank = idx + 4;
      const isCurrentUser = currentUserProfile && e.thirstyclub_id === currentUserProfile.thirstyclub_id;
      const li = document.createElement('li');
      li.className = `leaderboard-item`;
      li.setAttribute('data-thirstyid', e.thirstyclub_id);
      li.style.cursor = 'pointer';
      if (isCurrentUser) {
        li.id = 'user-leaderboard-row';
      }
      li.innerHTML = `
        <span class="rank">#${realRank}</span>
        <div class="leaderboard-avatar-wrap">
          <img src="${e.avatar_url || defaultAvatar}" alt="${e.username}">
        </div>
        <span class="name">${e.username}</span>
        <span class="points">${e.points.toLocaleString()} PTS</span>
      `;
      li.addEventListener('click', () => {
        openUserProfileModal(e.thirstyclub_id);
      });
      container.appendChild(li);
    });
  };

  // --- Composio Spotify and Twitter Integrations ---
  const initComposioIntegrations = () => {
    const compModal = document.getElementById('composio-modal');
    const consentView = document.getElementById('composio-consent-view');
    const loadingView = document.getElementById('composio-loading-view');
    const successView = document.getElementById('composio-success-view');

    const spotifyBtn = document.getElementById('btn-connect-spotify');
    const twitterBtn = document.getElementById('btn-connect-twitter');
    const spotifyDesc = document.getElementById('spotify-integration-desc');
    const twitterDesc = document.getElementById('twitter-integration-desc');

    const updateSpotifyUI = (connected) => {
      if (!spotifyBtn || !spotifyDesc) return;
      if (connected) {
        spotifyBtn.textContent = 'DISCONNECT';
        spotifyBtn.style.background = 'rgba(255, 62, 62, 0.1)';
        spotifyBtn.style.border = '1px solid rgba(255, 62, 62, 0.2)';
        spotifyBtn.style.color = 'var(--accent-color)';
        spotifyDesc.innerHTML = `<span class="active-pulse" style="display:inline-block; width:6px; height:6px; background:#2ed573; border-radius:50%; margin-right:4px; box-shadow:0 0 8px #2ed573; animation: glowPulse 1.5s infinite alternate;"></span> Connected (LekanTC999)`;
        spotifyDesc.style.color = '#2ed573';
      } else {
        spotifyBtn.textContent = 'CONNECT';
        spotifyBtn.style.background = 'var(--accent-color)';
        spotifyBtn.style.border = 'none';
        spotifyBtn.style.color = '#fff';
        spotifyDesc.textContent = 'Verify your stream counts';
        spotifyDesc.style.color = 'var(--text-dim)';
      }
    };

    const updateTwitterUI = (connected) => {
      if (!twitterBtn || !twitterDesc) return;
      if (connected) {
        twitterBtn.textContent = 'DISCONNECT';
        twitterBtn.style.background = 'rgba(255, 62, 62, 0.1)';
        twitterBtn.style.border = '1px solid rgba(255, 62, 62, 0.2)';
        twitterBtn.style.color = 'var(--accent-color)';
        twitterDesc.innerHTML = `<span class="active-pulse" style="display:inline-block; width:6px; height:6px; background:#2ed573; border-radius:50%; margin-right:4px; box-shadow:0 0 8px #2ed573; animation: glowPulse 1.5s infinite alternate;"></span> Connected (@lekan_thirsty)`;
        twitterDesc.style.color = '#2ed573';
      } else {
        twitterBtn.textContent = 'CONNECT';
        twitterBtn.style.background = 'var(--accent-color)';
        twitterBtn.style.border = 'none';
        twitterBtn.style.color = '#fff';
        twitterDesc.textContent = 'Verify retweets & follows';
        twitterDesc.style.color = 'var(--text-dim)';
      }
    };

    // Initial sync
    const isSpotifyConnected = localStorage.getItem('composio_spotify_connected') === 'true';
    const isTwitterConnected = localStorage.getItem('composio_twitter_connected') === 'true';
    updateSpotifyUI(isSpotifyConnected);
    updateTwitterUI(isTwitterConnected);

    // OAuth Redirect detection from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('auth');
    if (authCode && compModal) {
      consentView.style.display = 'none';
      loadingView.style.display = 'none';
      successView.style.display = 'flex';
      
      const successDesc = document.getElementById('composio-success-desc');
      if (authCode === 'spotify') {
        localStorage.setItem('composio_spotify_connected', 'true');
        updateSpotifyUI(true);
        if (successDesc) successDesc.textContent = 'Your Spotify integration is now active. Streaming playtimes and artist follow achievements will be synced automatically.';
      } else if (authCode === 'twitter') {
        localStorage.setItem('composio_twitter_connected', 'true');
        updateTwitterUI(true);
        if (successDesc) successDesc.textContent = 'Your X (Twitter) integration is now active. Retweet and community profile check-ins will verify instantly.';
      }
      compModal.showModal();
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const triggerRedirectAnimation = async (provider) => {
      consentView.style.display = 'none';
      loadingView.style.display = 'flex';
      successView.style.display = 'none';

      const titleEl = document.getElementById('composio-loader-title');
      const descEl = document.getElementById('composio-loader-desc');

      if (titleEl) titleEl.textContent = 'Connecting Secure Gateway...';
      if (descEl) descEl.textContent = 'Handshaking with Composio API authorization key...';

      try {
        const sessionData = await supabase.auth.getSession();
        const userId = sessionData.data?.session?.user?.id;
        
        if (!userId) {
          throw new Error('You must be logged in to connect integrations.');
        }

        const res = await fetch('/api/composio-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: provider,
            entityId: userId,
            redirectUrl: window.location.href.split('?')[0] + `?auth=${provider}`
          })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to generate link');
        }

        if (titleEl) titleEl.textContent = `Redirecting to ${provider}...`;
        if (descEl) descEl.textContent = `Establishing secure OAuth session with ${provider} server...`;

        setTimeout(() => {
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
          } else {
            console.error('No redirectUrl returned from Composio API');
            alert('Integration failed: Invalid response from authentication provider.');
            compModal.close();
          }
        }, 1500);

      } catch (err) {
        console.error('Integration link error:', err);
        alert(err.message || 'An error occurred while connecting the integration.');
        compModal.close();
      }
    };

    if (spotifyBtn) {
      spotifyBtn.onclick = () => {
        const isConnected = localStorage.getItem('composio_spotify_connected') === 'true';
        if (isConnected) {
          localStorage.setItem('composio_spotify_connected', 'false');
          updateSpotifyUI(false);
        } else if (compModal) {
          // Open Modal, populate Spotify specifics
          consentView.style.display = 'block';
          loadingView.style.display = 'none';
          successView.style.display = 'none';

          document.getElementById('composio-target-logo').innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#1DB954" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.894-.982-.336.075-.668-.135-.744-.47-.077-.336.136-.668.47-.744 3.856-.88 7.15-.506 9.822 1.13.294.18.385.564.206.86zm1.225-2.72c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.082-1.182-.413.125-.847-.11-.972-.522-.125-.413.11-.847.522-.972 3.67-1.114 8.243-.574 11.346 1.33.367.227.487.708.26 1.076zm.105-2.81c-3.258-1.934-8.644-2.114-11.758-1.168-.5.152-1.025-.133-1.177-.633-.153-.5.133-1.027.633-1.178 3.593-1.09 9.54-.887 13.298 1.344.45.267.6.846.333 1.296-.266.45-.845.6-1.297.333z"/>
            </svg>
          `;
          document.getElementById('composio-connect-desc').textContent = 'Link your Spotify account via Composio to dynamically sync play counts, tracks, and verified streams for community quests.';
          document.getElementById('composio-permissions-list').innerHTML = `
            <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.75rem; color:#fff;">
              <span style="color:#2ed573;">✓</span> Verify streaming check-ins and hours played
            </div>
            <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.75rem; color:#fff;">
              <span style="color:#2ed573;">✓</span> Unlock automatic Spotify badge rewards
            </div>
          `;

          compModal.showModal();

          document.getElementById('btn-authorize-composio').onclick = () => {
            triggerRedirectAnimation('spotify');
          };
        }
      };
    }

    if (twitterBtn) {
      twitterBtn.onclick = () => {
        const isConnected = localStorage.getItem('composio_twitter_connected') === 'true';
        if (isConnected) {
          localStorage.setItem('composio_twitter_connected', 'false');
          updateTwitterUI(false);
        } else if (compModal) {
          consentView.style.display = 'block';
          loadingView.style.display = 'none';
          successView.style.display = 'none';

          document.getElementById('composio-target-logo').innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          `;
          document.getElementById('composio-connect-desc').textContent = 'Link your X (Twitter) profile via Composio to track social post retweets, follows, and campaign activities.';
          document.getElementById('composio-permissions-list').innerHTML = `
            <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.75rem; color:#fff;">
              <span style="color:#2ed573;">✓</span> Verify campaign retweets and comments automatically
            </div>
            <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.75rem; color:#fff;">
              <span style="color:#2ed573;">✓</span> Fetch verified hashtag contributions
            </div>
          `;

          compModal.showModal();

          document.getElementById('btn-authorize-composio').onclick = () => {
            triggerRedirectAnimation('twitter');
          };
        }
      };
    }

    // Modal control buttons
    const cancelBtn = document.getElementById('btn-cancel-composio');
    if (cancelBtn) {
      cancelBtn.onclick = () => compModal.close();
    }

    const enterBtn = document.getElementById('btn-enter-composio-success');
    if (enterBtn) {
      enterBtn.onclick = () => compModal.close();
    }
  };

  initComposioIntegrations();

  // ==========================================
  // Web Push Notifications
  // ==========================================
  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    
    const VAPID_PUBLIC_KEY = 'BPkah0j6OmMXTbZYPT8Ws8Jqe5acu5I_jjQJU9Ac1wlSUxsPhSY97qaJMy5nFXMgwPZrNQaktd617__OLHXlpTU'; // Replace with actual generated public key

    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: VAPID_PUBLIC_KEY
        });
      }

      // Ensure user is logged in before saving to DB
      const sessionData = await supabase.auth.getSession();
      if (!sessionData.data.session) return;

      const subData = JSON.parse(JSON.stringify(subscription));

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: sessionData.data.session.user.id,
          endpoint: subData.endpoint,
          keys_p256dh: subData.keys.p256dh,
          keys_auth: subData.keys.auth
        }, { onConflict: 'endpoint' });

      if (error) console.error('Error saving push subscription:', error);

    } catch (err) {
      console.warn('Push subscription failed:', err);
    }
  };

  // Attempt to subscribe on load if logged in
  supabase.auth.getSession().then(({ data }) => {
    if (data.session && Notification.permission === 'granted') {
      subscribeToPush();
    }
  });

  const requestDevicePermissions = async () => {
    try {
      if ('Notification' in window) {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            await subscribeToPush();
          }
        }
      }
      
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Just asking for permission
      }
    } catch (err) {
      console.warn("Permission request failed or was denied:", err);
    }
  };

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

      const tbody = document.getElementById('admin-users-list');
      if (tbody) {
        tbody.innerHTML = `
          <tr><td colspan="7"><div class="skeleton" style="height: 35px; width: 100%; border-radius: 4px; margin: 5px 0;"></div></td></tr>
          <tr><td colspan="7"><div class="skeleton" style="height: 35px; width: 100%; border-radius: 4px; margin: 5px 0;"></div></td></tr>
          <tr><td colspan="7"><div class="skeleton" style="height: 35px; width: 100%; border-radius: 4px; margin: 5px 0;"></div></td></tr>
        `;
      }
      const gridWrapper = document.getElementById('admin-grid-view');
      if (gridWrapper) {
        gridWrapper.innerHTML = `
          <div class="product-card skeleton-card" style="height: 120px; width: 100%; padding:0;"><div class="skeleton" style="height: 100%; width: 100%;"></div></div>
          <div class="product-card skeleton-card" style="height: 120px; width: 100%; padding:0;"><div class="skeleton" style="height: 100%; width: 100%;"></div></div>
        `;
      }

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
            <div class="admin-grid-name" style="font-weight: 800; color: #fff; font-size: 1rem;">${escapeHtml(user.username || 'UNKNOWN')}</div>
            <div class="admin-grid-email" style="font-size: 0.8rem; color: var(--admin-text-dim);">${escapeHtml(user.email || '')}</div>
          </div>
          <span class="badge badge-${badgeClass}">${gender}</span>
        </div>
        <div class="admin-grid-details" style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.8rem;">
          <div class="admin-grid-detail-row" style="display: flex; justify-content: space-between;">
            <span style="color: var(--admin-text-dim);">ID</span>
            <span style="font-family: monospace; font-weight: 700;">${escapeHtml(user.thirstyclub_id || 'T999-XXXX')}</span>
          </div>
          <div class="admin-grid-detail-row" style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: var(--admin-text-dim);">Access Level</span>
            <select class="admin-access-select ${accessLvl === 'VIP' ? 'access-vip' : 'access-regular'}" data-userid="${escapeHtml(user.id || user.thirstyclub_id || user.email)}" style="background: #111111; color: var(--admin-text); border: 1px solid rgba(255, 62, 62, 0.25); border-radius: 4px; padding: 0.2rem 0.5rem;">
              <option value="REGULAR" ${accessLvl === 'REGULAR' ? 'selected' : ''}>REGULAR</option>
              <option value="VIP" ${accessLvl === 'VIP' ? 'selected' : ''}>VIP</option>
            </select>
          </div>
        </div>
        <div class="admin-grid-actions" style="display: flex; gap: 0.5rem; margin-top: auto;">
          <button class="${checkInBtnClass}" data-userid="${escapeHtml(user.id || user.thirstyclub_id || user.email)}" style="flex: 1;">${checkInBtnText}</button>
          <button class="admin-view-passport-btn table-action-btn" data-email="${escapeHtml(user.email)}" style="flex: 1;">View Passport</button>
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
        <td>${escapeHtml(user.thirstyclub_id || 'T999-XXXX')}</td>
        <td style="font-weight: 700; color: #fff;">${escapeHtml(user.username || 'UNKNOWN')}</td>
        <td>${escapeHtml(user.email || '')}</td>
        <td><span class="badge badge-${badgeClass}">${gender}</span></td>
        <td>
          <select class="admin-access-select ${accessLvl === 'VIP' ? 'access-vip' : 'access-regular'}" data-userid="${escapeHtml(user.id || user.thirstyclub_id || user.email)}" style="background: #111111; color: var(--admin-text); border: 1px solid rgba(255, 62, 62, 0.25); border-radius: 4px; padding: 0.2rem 0.5rem;">
            <option value="REGULAR" ${accessLvl === 'REGULAR' ? 'selected' : ''}>REGULAR</option>
            <option value="VIP" ${accessLvl === 'VIP' ? 'selected' : ''}>VIP</option>
          </select>
        </td>
        <td>${regDate}</td>
        <td>
          <button class="${checkInBtnClass}" data-userid="${escapeHtml(user.id || user.thirstyclub_id || user.email)}" style="margin-right: 4px; padding: 0.4rem 0.8rem; border-radius: 6px;">${checkInBtnText}</button>
          <button class="admin-view-passport-btn table-action-btn" data-email="${escapeHtml(user.email)}" style="padding: 0.4rem 0.8rem; border-radius: 6px;">View Passport</button>
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
    ctx.font = '900 28px "Satoshi", sans-serif';
    ctx.fillText("Thirstyclub999", 0, -8);
    ctx.font = '700 13px "Satoshi", sans-serif';
    ctx.fillText("PASSPORT", 0, 18);
    ctx.restore();

    // 6. Draw Bottom Page Content
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.font = '900 22px "Satoshi", sans-serif';
    ctx.fillText("ThirstyClub999", 45, 452);
    ctx.font = '700 11px "Satoshi", sans-serif';
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
        ctx.font = '900 13px "Satoshi", sans-serif';
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

        select.className = `admin-access-select ${newAccess === 'VIP' ? 'access-vip' : 'access-regular'}`;
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

      if (!confirm(`Are you sure you want to Check Out ${user.username}?`)) return;

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
            link.download = `thirstyclub999-passport-${(user.username || 'guest').toLowerCase().replace(/\\s+/g, '-')}.png`;
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

                const listBtn = document.querySelector(`.admin-checkout-btn[data-userid="${user.id}"]`);
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

                const listBtn = document.querySelector(`.admin-checkin-btn[data-userid="${user.id}"]`);
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

      if (!confirm(`Are you sure you want to send this broadcast email to all ${adminFetchedUsers.length} users?`)) {
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
        if (broadcastProgressBar) broadcastProgressBar.style.width = `${pct}%`;
        if (broadcastStatusText) {
          broadcastStatusText.textContent = `Sending to ${user.email} (${i + 1}/${adminFetchedUsers.length})...`;
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
          console.error(`Failed to send broadcast to ${user.email}:`, sendErr);
          failureCount++;
        }
      }

      if (broadcastStatusText) {
        broadcastStatusText.textContent = `Blast finished. Sent: ${successCount}. Failed: ${failureCount}`;
      }
      alert(`Broadcast Email Blast complete!\n\nSuccessfully Sent: ${successCount}\nFailed: ${failureCount}`);
      broadcastBtn.disabled = false;
    });
  }

  // Push Notification Blast handler
  const sendPushBtn = document.getElementById('admin-send-push-btn');
  const pushTitle = document.getElementById('admin-push-title');
  const pushBody = document.getElementById('admin-push-body');
  const pushUrl = document.getElementById('admin-push-url');
  const pushStatusContainer = document.getElementById('push-status-container');
  const pushProgressBar = document.getElementById('push-progress-bar');
  const pushStatusText = document.getElementById('push-status-text');

  if (sendPushBtn) {
    sendPushBtn.addEventListener('click', async () => {
      const title = pushTitle?.value.trim();
      const body = pushBody?.value.trim();
      const url = pushUrl?.value.trim();

      if (!title || !body) {
        alert("Please provide both a notification title and message body.");
        return;
      }

      if (!confirm(`Are you sure you want to send this push notification to all subscribed users?`)) {
        return;
      }

      sendPushBtn.disabled = true;
      if (pushStatusContainer) pushStatusContainer.style.display = 'block';
      if (pushProgressBar) pushProgressBar.style.width = '50%';
      if (pushStatusText) pushStatusText.textContent = `Sending push notifications via Vercel...`;

      try {
        const sessionData = await supabase.auth.getSession();
        const token = sessionData.data.session?.access_token;
        
        const response = await fetch('/api/send-push', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: title,
            body: body,
            url: url
          })
        });

        if (pushProgressBar) pushProgressBar.style.width = '100%';

        if (!response.ok) {
          const errRes = await response.json();
          throw new Error(errRes.error || 'Server error');
        }
        
        const resData = await response.json();
        
        if (pushStatusText) {
          pushStatusText.textContent = `Push finished. Sent: ${resData.sent}. Failed: ${resData.failed}`;
        }
        alert(`Push Notifications complete!\n\nTotal Subscribers: ${resData.total_subscribers}\nSent: ${resData.sent}\nFailed: ${resData.failed}\nCleaned up expired: ${resData.expired_cleaned}`);
        
      } catch (sendErr) {
        console.error(`Failed to send push notifications:`, sendErr);
        if (pushStatusText) {
          pushStatusText.textContent = `Push failed: ${sendErr.message}`;
        }
        alert(`Push Notifications failed: ${sendErr.message}`);
      } finally {
        sendPushBtn.disabled = false;
      }
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
        alert(`Mailchimp sync complete!\n\nAdded: ${resData.added || 0}\nUpdated: ${resData.updated || 0}\nErrors: ${resData.errors || 0}`);
      } catch (err) {
        alert("Failed to sync Mailchimp: " + err.message);
      } finally {
        adminSyncMailchimpBtn.textContent = '🐒 Sync Mailchimp';
        adminSyncMailchimpBtn.disabled = false;
      }
    });
  }

  // ==========================================
  // DAILY SPONSOR MODAL & REFERRAL CARD IMPLEMENTATION
  // ==========================================
  const initSponsorModal = () => {
    const modal = document.getElementById('sponsor-modal');
    const triggerCard = document.getElementById('home-sponsor-reward-card');
    const openBtn = document.getElementById('btn-open-sponsor');
    const closeBtn = document.getElementById('btn-close-sponsor-modal');
    const successCloseBtn = document.getElementById('btn-sponsor-success-close');
    const watchBtn = document.getElementById('btn-sponsor-watch');
    
    const adPlayer = document.getElementById('sponsor-ad-player');
    const successOverlay = document.getElementById('sponsor-success-overlay');
    const countdownEl = document.getElementById('ad-timer-countdown');
    const progressBarFill = document.getElementById('ad-progress-bar-fill');
    const sponsorCardStatus = document.getElementById('sponsor-card-status');

    if (!modal) return;

    const checkClaimStatus = () => {
      const today = new Date().toDateString();
      const claimedDate = localStorage.getItem('matcha_daily_claimed_date');
      
      if (claimedDate === today) {
        if (sponsorCardStatus) sponsorCardStatus.textContent = 'Already claimed today ✓';
        if (openBtn) {
          openBtn.textContent = 'CLAIMED';
          openBtn.style.opacity = '0.5';
          openBtn.style.pointerEvents = 'none';
        }
        if (watchBtn) {
          watchBtn.textContent = 'Already Claimed Today';
          watchBtn.disabled = true;
          watchBtn.style.opacity = '0.5';
          watchBtn.style.cursor = 'not-allowed';
        }
      } else {
        if (sponsorCardStatus) sponsorCardStatus.textContent = 'Claim daily gift from matcha.xyz';
        if (openBtn) {
          openBtn.textContent = 'CLAIM';
          openBtn.style.opacity = '1';
          openBtn.style.pointerEvents = 'auto';
        }
        if (watchBtn) {
          watchBtn.textContent = 'Watch Video';
          watchBtn.disabled = false;
          watchBtn.style.opacity = '1';
          watchBtn.style.cursor = 'pointer';
        }
      }
    };

    // Run status check at init
    checkClaimStatus();

    const openModal = () => {
      checkClaimStatus();
      if (adPlayer) adPlayer.style.display = 'none';
      if (successOverlay) successOverlay.style.display = 'none';
      if (closeBtn) closeBtn.style.display = 'flex';
      modal.showModal();
    };

    if (triggerCard) triggerCard.addEventListener('click', openModal);
    if (openBtn) openBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal();
    });

    const closeModal = () => {
      modal.close();
      checkClaimStatus();
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (successCloseBtn) successCloseBtn.addEventListener('click', closeModal);

    // Watch video action
    if (watchBtn) {
      watchBtn.addEventListener('click', () => {
        if (watchBtn.disabled) return;
        
        // Show ad player and hide close button
        if (adPlayer) adPlayer.style.display = 'flex';
        if (closeBtn) closeBtn.style.display = 'none';
        
        let timeLeft = 5;
        if (countdownEl) countdownEl.textContent = `${timeLeft}s`;
        if (progressBarFill) {
          progressBarFill.style.animation = 'none';
          progressBarFill.offsetHeight; // Trigger reflow
          progressBarFill.style.animation = 'ad-progress-animation 5s linear forwards';
        }

        const interval = setInterval(() => {
          timeLeft--;
          if (countdownEl) countdownEl.textContent = `${timeLeft}s`;
          
          if (timeLeft <= 0) {
            clearInterval(interval);
            
            // Claim reward
            const today = new Date().toDateString();
            localStorage.setItem('matcha_daily_claimed_date', today);
            
            // Award points
            const currentPoints = parseInt(localStorage.getItem('thirsty_trivia_points') || '0', 10);
            localStorage.setItem('thirsty_trivia_points', currentPoints + 50);

            // Register sticker
            let stickers = JSON.parse(localStorage.getItem('unlocked_stickers') || '[]');
            if (!stickers.includes('matcha')) {
              stickers.push('matcha');
              localStorage.setItem('unlocked_stickers', JSON.stringify(stickers));
            }

            // Sync with UI
            updateUI();
            drawPassport();
            renderLeaderboard();

            // Transition UI
            if (adPlayer) adPlayer.style.display = 'none';
            if (successOverlay) successOverlay.style.display = 'flex';
            if (closeBtn) closeBtn.style.display = 'flex';
          }
        }, 1000);
      });
    }
  };

  const initReferralCard = () => {
    const referralLinkInput = document.getElementById('referral-link-input');
    const btnCopyReferral = document.getElementById('btn-copy-referral');

    const updateInviteLink = () => {
      const activeUsername = (currentUserProfile && currentUserProfile.username) || 'guest';
      const cleanUsername = activeUsername.toLowerCase().trim().replace(/\s+/g, '_');
      const inviteLink = `https://thirsty.guava.earth/invite/${cleanUsername}`;
      if (referralLinkInput) referralLinkInput.value = inviteLink;
    };

    // Update initially
    updateInviteLink();

    // Hook copy click
    if (btnCopyReferral && referralLinkInput) {
      btnCopyReferral.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Copy to clipboard
        navigator.clipboard.writeText(referralLinkInput.value)
          .then(() => {
            // Visual success feedback
            const originalText = btnCopyReferral.textContent;
            btnCopyReferral.textContent = 'Copied!';
            btnCopyReferral.classList.add('copied');
            
            localStorage.setItem('thirsty_referral_copied', 'true');
            if (typeof updateBadgesStatus === 'function') {
              updateBadgesStatus();
            }
            
            // Revert after 2 seconds
            setTimeout(() => {
              btnCopyReferral.textContent = originalText;
              btnCopyReferral.classList.remove('copied');
            }, 2000);
          })
          .catch(err => {
            console.error('Failed to copy refer link:', err);
            alert('Could not copy link. Please manually copy the field content.');
          });
      });
    }

    // Hook updateUI to keep refer link and level XP progress updated
    const originalUpdateUI = updateUI;
    updateUI = () => {
      originalUpdateUI();
      updateInviteLink();
      
      // Also update level / exp display in dashboard banner
      const statusLevel = document.querySelector('.status-level');
      const statusExp = document.querySelector('.status-exp');
      const expProgressFill = document.querySelector('.exp-progress-fill');
      
      if (statusLevel || statusExp || expProgressFill) {
        let dbPoints = 0;
        if (currentUserProfile) {
          const scores = currentUserProfile.socials?.game_scores || {};
          if (scores.trivia_blitz) dbPoints += scores.trivia_blitz * 50;
          if (scores.treasure_hunt) dbPoints += scores.treasure_hunt * 150;
          if (scores.social_raids) dbPoints += scores.social_raids * 150;
          if (scores.bounties_completed) dbPoints += scores.bounties_completed * 200;
        }
        const localPoints = parseInt(localStorage.getItem('thirsty_trivia_points') || '0', 10);
        const totalPts = Math.max(dbPoints, localPoints);
        
        const lvl = Math.floor(totalPts / 1000) + 1;
        const currentLvlXp = totalPts % 1000;
        const pct = (currentLvlXp / 1000) * 100;
        
        let rankName = "ROOKIE";
        if (lvl >= 2 && lvl < 5) rankName = "PRO";
        else if (lvl >= 5) rankName = "ELITE";
        
        if (statusLevel) statusLevel.textContent = `LEVEL ${String(lvl).padStart(2, '0')} ${rankName}`;
        if (statusExp) statusExp.textContent = `${currentLvlXp.toLocaleString()} / 1,000 PTS`;
        if (expProgressFill) expProgressFill.style.width = `${pct}%`;
      }

      // Sync and update achievements badges status
      if (typeof updateBadgesStatus === 'function') {
        updateBadgesStatus();
      }
    };
  };

  const updateBadgesStatus = () => {
    // Helper to toggle locked/unlocked classes
    const setBadgeState = (id, isUnlocked) => {
      const el = document.getElementById(id);
      if (el) {
        if (isUnlocked) {
          el.classList.remove('locked');
          el.classList.add('unlocked');
        } else {
          el.classList.remove('unlocked');
          el.classList.add('locked');
        }
      }
    };

    // 1. Pioneer: Unlocked if logged in (always true for active session/guest)
    setBadgeState('badge-pioneer', true);

    // 2. Club Connector (badge-master): Connect Spotify or X
    const spotifyConnected = localStorage.getItem('thirsty_spotify_connected') === 'true';
    const twitterConnected = localStorage.getItem('thirsty_twitter_connected') === 'true';
    setBadgeState('badge-master', spotifyConnected || twitterConnected);

    // 3. Social Raider (badge-support): Completed at least one Social Raid
    const completedRaids = JSON.parse(localStorage.getItem('completed_raids') || '[]');
    setBadgeState('badge-support', completedRaids.length > 0);

    // 4. Top Leader (badge-leader): User ranks Top 3 on Leaderboard
    const activeUsername = (currentUserProfile && currentUserProfile.username) || '';
    const top3Names = ['THIRSTYZOID', 'Adeline Palmerston', 'Lekan Thirsty', 'Guest', 'Adeline_Palmerston', 'tc_member'];
    const isTop3 = top3Names.some(name => activeUsername.toLowerCase().includes(name.toLowerCase()));
    setBadgeState('badge-leader', isTop3);

    // 5. Trivia Beast (badge-streak): Played Trivia Blitz
    const playedTrivia = localStorage.getItem('thirsty_game_trivia_blitz') !== null;
    setBadgeState('badge-streak', playedTrivia);

    // 6. Coin Master (badge-100k): Earned at least 1,000 PTS
    const totalPoints = parseInt(localStorage.getItem('thirsty_trivia_points') || '0', 10);
    setBadgeState('badge-100k', totalPoints >= 1000);

    // 7. Collab Shopper (badge-200k): Added at least 1 product to shopping cart
    const addedCart = localStorage.getItem('thirsty_cart_added') === 'true' || (typeof cart !== 'undefined' && cart.length > 0);
    setBadgeState('badge-200k', addedCart);

    // 8. Club Spreader (badge-500k): Copied invite link
    const copiedLink = localStorage.getItem('thirsty_referral_copied') === 'true';
    setBadgeState('badge-500k', copiedLink);

    // Update profile badges count value dynamically
    const badgeCountElement = document.querySelector('.profile-stats-row .stat-col:nth-child(3) .stat-val');
    if (badgeCountElement) {
      const unlockedCount = document.querySelectorAll('.badges-grid .badge-card.unlocked').length;
      badgeCountElement.textContent = unlockedCount;
    }
  };

  // --- Page Entry staggered slide-up transition ---
  const triggerPageTransition = (containerEl) => {
    if (!containerEl) return;
    const targets = containerEl.querySelectorAll(
      '.view-intro-title, .product-card, .game-select-card, .connected-apps-card, .referral-card, .signals-feed-list, .badge-card, .leaderboard-container, .top-members-podium, .per-game-leaderboard-grid, .checkout-summary-card, .events-timeline, .admin-metric-card, .admin-table-container, .news-body-text, .gallery-title, .event-photos-gallery-wrap'
    );
    if (targets.length === 0) return;

    if (typeof motion !== 'undefined') {
      targets.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(15px)';
      });
      motion.animate(
        Array.from(targets),
        { opacity: [0, 1], y: [15, 0] },
        { delay: motion.stagger(0.04), duration: 0.45, easing: [0.16, 1, 0.3, 1] }
      );
    }
  };

  // --- Photo Gallery Lightbox Viewer ---
  const initLightbox = () => {
    const galleryItems = document.querySelectorAll('.gallery-photo-item img');
    const lightbox = document.getElementById('gallery-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');
    const currentIdxEl = document.getElementById('lightbox-current-idx');
    const totalCountEl = document.getElementById('lightbox-total-count');

    if (!lightbox || galleryItems.length === 0) return;

    let imagesList = Array.from(galleryItems).map(img => img.getAttribute('src'));
    let currentIdx = 0;

    totalCountEl.textContent = imagesList.length;

    const openLightbox = (idx) => {
      currentIdx = idx;
      lightboxImg.setAttribute('src', imagesList[currentIdx]);
      currentIdxEl.textContent = currentIdx + 1;
      lightbox.classList.add('active');
    };

    const closeLightbox = () => {
      lightbox.classList.remove('active');
    };

    const nextImage = (e) => {
      if (e) e.stopPropagation();
      currentIdx = (currentIdx + 1) % imagesList.length;
      lightboxImg.setAttribute('src', imagesList[currentIdx]);
      currentIdxEl.textContent = currentIdx + 1;
    };

    const prevImage = (e) => {
      if (e) e.stopPropagation();
      currentIdx = (currentIdx - 1 + imagesList.length) % imagesList.length;
      lightboxImg.setAttribute('src', imagesList[currentIdx]);
      currentIdxEl.textContent = currentIdx + 1;
    };

    galleryItems.forEach((imgEl, idx) => {
      imgEl.parentElement.onclick = () => openLightbox(idx);
    });

    if (closeBtn) closeBtn.onclick = closeLightbox;
    if (nextBtn) nextBtn.onclick = nextImage;
    if (prevBtn) prevBtn.onclick = prevImage;

    lightbox.onclick = (e) => {
      if (e.target === lightbox || e.target === document.querySelector('.lightbox-content-wrap')) {
        closeLightbox();
      }
    };

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    });
  };

  // --- Page Loader controller ---
  window.addEventListener('load', () => {
    const loader = document.getElementById('page-loader');
    if (loader) {
      setTimeout(() => {
        loader.classList.add('loaded');
        const isDirectPWA = window.matchMedia('(display-mode: standalone)').matches || window.location.hostname.includes('club999');
        const isLoggedIn = localStorage.getItem('thirsty_logged_in') === 'true';
        if (isDirectPWA && !isLoggedIn) {
          if (typeof showOnboardingScreen === 'function') {
            showOnboardingScreen();
          }
        }
      }, 1200);
    }
  });

  initSponsorModal();
  initReferralCard();
  initLightbox();

  updateUI();
  drawPassport();
  document.fonts.ready.then(() => {
    drawPassport();
  });
  
  // --- Password Visibility Toggle ---
  document.querySelectorAll('.password-wrapper').forEach(wrapper => {
    const input = wrapper.querySelector('input');
    const btn = wrapper.querySelector('.password-toggle-btn');
    if (input && btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        const icon = btn.querySelector('i');
        if (icon) {
          icon.className = isPassword ? 'ph ph-eye-slash' : 'ph ph-eye';
        }
      });
    }
  });

  // --- User Profile Details Popup & Admin Messaging ---
  const profileModal = document.getElementById('user-profile-modal');
  const closeProfileModalBtn = document.getElementById('close-user-profile-modal');

  if (closeProfileModalBtn && profileModal) {
    closeProfileModalBtn.addEventListener('click', () => {
      profileModal.close();
    });
  }

  window.openUserProfileModal = async (tid) => {
    if (!profileModal) return;

    // Reset default placeholders
    document.getElementById('user-profile-avatar').src = defaultAvatar;
    document.getElementById('user-profile-name').textContent = 'Loading...';
    document.getElementById('user-profile-tid').textContent = tid;
    document.getElementById('user-profile-location').textContent = '...';
    document.getElementById('user-profile-signature').textContent = '...';
    document.getElementById('user-profile-level').textContent = '...';
    document.getElementById('user-profile-streak').textContent = '...';
    document.getElementById('admin-message-section').style.display = 'none';

    profileModal.showModal();

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('thirstyclub_id', tid)
        .single();

      if (profile && !error) {
        document.getElementById('user-profile-avatar').src = profile.avatar_url || defaultAvatar;
        document.getElementById('user-profile-name').textContent = profile.username || 'Anonymous';
        document.getElementById('user-profile-tid').textContent = profile.thirstyclub_id || tid;
        document.getElementById('user-profile-location').textContent = profile.socials?.place_of_thirst || 'LAGOS';
        document.getElementById('user-profile-signature').textContent = profile.socials?.signature || 'Wagwan';
        
        const calculatePoints = (p) => {
          const scores = p.socials?.game_scores || {};
          let pts = 0;
          if (scores.trivia_blitz) pts += scores.trivia_blitz * 50;
          if (scores.treasure_hunt) pts += scores.treasure_hunt * 150;
          if (scores.social_raids) pts += scores.social_raids * 150;
          if (scores.bounties_completed) pts += scores.bounties_completed * 200;
          return pts;
        };
        const pts = calculatePoints(profile);
        const lvl = Math.floor(pts / 500) + 1;
        document.getElementById('user-profile-level').textContent = `LVL ${lvl} (${pts} PTS)`;
        
        const streak = profile.socials?.streak_count || 0;
        document.getElementById('user-profile-streak').textContent = `🔥 ${streak} DAY${streak !== 1 ? 'S' : ''}`;

        // Admin privileges check (GCL3F)
        const isAdmin = currentUserProfile && (currentUserProfile.thirstyclub_id === 'T999-3572' || currentUserProfile.email === 'gclef40@gmail.com');
        const isSelf = currentUserProfile && currentUserProfile.thirstyclub_id === profile.thirstyclub_id;
        
        if (isAdmin && !isSelf) {
          document.getElementById('admin-message-section').style.display = 'block';
          
          const sendBtn = document.getElementById('btn-send-admin-message');
          const textInput = document.getElementById('admin-message-text');
          const statusDiv = document.getElementById('admin-message-status');
          
          textInput.value = '';
          statusDiv.style.display = 'none';
          
          sendBtn.onclick = async () => {
            const msg = textInput.value.trim();
            if (!msg) return;
            
            sendBtn.disabled = true;
            sendBtn.textContent = 'SENDING...';
            
            try {
              const { error: msgErr } = await supabase
                .from('messages')
                .insert({
                  from_id: currentUserProfile.id,
                  to_id: profile.id,
                  message: msg
                });
                
              if (msgErr) throw msgErr;
              
              statusDiv.textContent = '✓ Message Sent Successfully!';
              statusDiv.style.color = '#2ed573';
              statusDiv.style.display = 'block';
              textInput.value = '';
            } catch (err) {
              console.error(err);
              statusDiv.textContent = '✗ Error: ' + err.message;
              statusDiv.style.color = 'var(--accent-color)';
              statusDiv.style.display = 'block';
            } finally {
              sendBtn.disabled = false;
              sendBtn.textContent = 'SEND MESSAGE';
            }
          };
        }
      } else {
        document.getElementById('user-profile-name').textContent = 'Profile Not Found';
      }
    } catch (e) {
      console.error(e);
      document.getElementById('user-profile-name').textContent = 'Error Loading Profile';
    }
  };

  // --- Inbox DM Loading ---
  window.loadInbox = async () => {
    const list = document.getElementById('profile-inbox-list');
    if (!list) return;
    
    if (!currentUserProfile) {
      list.innerHTML = `<div style="text-align: center; color: var(--text-dim); font-size: 0.8rem; padding: 1rem 0;">LOG IN TO VIEW MESSAGES</div>`;
      return;
    }
    
    try {
      const { data: msgs, error } = await supabase
        .from('messages')
        .select('*')
        .eq('to_id', currentUserProfile.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation "messages" does not exist')) {
          list.innerHTML = `<div style="text-align: center; color: var(--text-dim); font-size: 0.8rem; padding: 1rem 0; line-height: 1.4;">"messages" table is not initialized yet. Admin must configure Supabase schema.</div>`;
          return;
        }
        throw error;
      }
      
      if (!msgs || msgs.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: var(--text-dim); font-size: 0.8rem; padding: 1rem 0;">NO MESSAGES RECEIVED</div>`;
        return;
      }
      
      const senderIds = [...new Set(msgs.map(m => m.from_id))];
      const { data: senders } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', senderIds);
        
      const senderMap = {};
      if (senders) {
        senders.forEach(s => {
          senderMap[s.id] = s;
        });
      }
      
      list.innerHTML = msgs.map(m => {
        const sender = senderMap[m.from_id] || { username: 'Admin', avatar_url: defaultAvatar };
        const date = new Date(m.created_at).toLocaleDateString('en-GB', { hour: '2-digit', minute: '2-digit' });
        return `
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 0.75rem; border-radius: 8px; display: flex; gap: 0.75rem; align-items: flex-start;">
            <img src="${sender.avatar_url || defaultAvatar}" style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--accent-color); object-fit: cover;">
            <div style="flex: 1;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                <span style="font-weight: bold; font-size: 0.85rem; color: #fff;">${sender.username}</span>
                <span style="font-size: 0.65rem; color: var(--text-dim);">${date}</span>
              </div>
              <p style="margin: 0; font-size: 0.8rem; color: #eee; line-height: 1.3;">${m.message}</p>
            </div>
          </div>
        `;
      }).join('');
    } catch (e) {
      console.warn("Failed to load inbox:", e);
      list.innerHTML = `<div style="text-align: center; color: var(--accent-color); font-size: 0.8rem; padding: 1rem 0;">Error loading messages</div>`;
    }
  };

  // --- Full Screen Onboarding Controller ---
  const onboardScreen = document.getElementById('onboarding-screen');
  const landingHeader = document.querySelector('header');
  const landingMain = document.querySelector('main');
  const appContainer = document.getElementById('user-dashboard-card');

  window.showOnboardingScreen = () => {
    if (onboardScreen) onboardScreen.style.display = 'flex';
    if (landingHeader) landingHeader.style.display = 'none';
    if (landingMain) landingMain.style.display = 'none';
    if (appContainer) appContainer.style.display = 'none';
  };

  window.hideOnboardingScreen = () => {
    if (onboardScreen) onboardScreen.style.display = 'none';
    if (localStorage.getItem('thirsty_logged_in') === 'true') {
      if (appContainer) appContainer.style.display = 'flex';
      if (landingHeader) landingHeader.style.display = 'none';
      if (landingMain) landingMain.style.display = 'none';
    } else {
      if (appContainer) appContainer.style.display = 'none';
      if (landingHeader) landingHeader.style.display = 'flex';
      if (landingMain) landingMain.style.display = 'block';
    }
  };

  // Onboarding Tab Switching
  const onboardLoginTabBtn = document.getElementById('onboard-login-tab-btn');
  const onboardSignupTabBtn = document.getElementById('onboard-signup-tab-btn');
  const onboardLoginForm = document.getElementById('onboard-login-form');
  const onboardSignupForm = document.getElementById('onboard-signup-form');

  const showOnboardLogin = () => {
    if (onboardLoginTabBtn) onboardLoginTabBtn.classList.add('active');
    if (onboardSignupTabBtn) onboardSignupTabBtn.classList.remove('active');
    if (onboardLoginForm) onboardLoginForm.style.display = 'block';
    if (onboardSignupForm) onboardSignupForm.style.display = 'none';
  };

  const showOnboardSignup = () => {
    if (onboardSignupTabBtn) onboardSignupTabBtn.classList.add('active');
    if (onboardLoginTabBtn) onboardLoginTabBtn.classList.remove('active');
    if (onboardSignupForm) onboardSignupForm.style.display = 'block';
    if (onboardLoginForm) onboardLoginForm.style.display = 'none';
  };

  if (onboardLoginTabBtn) onboardLoginTabBtn.onclick = showOnboardLogin;
  if (onboardSignupTabBtn) onboardSignupTabBtn.onclick = showOnboardSignup;
  
  const onboardSwitchToSignup = document.getElementById('onboard-switch-to-signup');
  if (onboardSwitchToSignup) onboardSwitchToSignup.onclick = showOnboardSignup;
  const onboardSwitchToLogin = document.getElementById('onboard-switch-to-login');
  if (onboardSwitchToLogin) onboardSwitchToLogin.onclick = showOnboardLogin;

  // Onboarding Password toggler
  document.querySelectorAll('#onboarding-screen .password-wrapper').forEach(wrapper => {
    const input = wrapper.querySelector('input');
    const btn = wrapper.querySelector('.password-toggle-btn');
    if (input && btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        const icon = btn.querySelector('i');
        if (icon) {
          icon.className = isPassword ? 'ph ph-eye-slash' : 'ph ph-eye';
        }
      });
    }
  });

  // Onboarding Forgot Password
  const onboardForgotPasswordBtn = document.getElementById('onboard-btn-forgot-password');
  if (onboardForgotPasswordBtn) {
    onboardForgotPasswordBtn.onclick = async () => {
      const email = prompt("Enter your email address to receive a password reset link:");
      if (!email) return;
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail.includes("@")) {
        alert("Please enter a valid email address.");
        return;
      }
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: window.location.origin + '/index.html'
        });
        if (error) throw error;
        alert("Password reset email sent! Please check your inbox (and spam folder) for instructions.");
      } catch (err) {
        alert("Error sending password reset email: " + err.message);
      }
    };
  }

  // Onboarding Login Submit
  if (onboardLoginForm) {
    onboardLoginForm.onsubmit = async (e) => {
      e.preventDefault();
      const errorMsg = document.getElementById('onboard-login-error-msg');
      if (errorMsg) errorMsg.style.display = 'none';

      const submitBtn = onboardLoginForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'LOGGING IN...';
      }

      const loginId = document.getElementById('onboard-login-id').value.trim();
      const password = document.getElementById('onboard-login-password').value;

      try {
        let email = loginId.toLowerCase();
        if (!loginId.includes("@")) {
          // Resolve username/id to email
          const cleanedInput = loginId.replace(/\s+/g, '');
          const thirstIdMatch = cleanedInput.match(/^t(?:-)?999(?:-)?(\d{4})$/i);
          let profile = null;

          if (thirstIdMatch) {
            const resolvedThirstyId = `T999-${thirstIdMatch[1]}`;
            const { data, error } = await supabase
              .from('profiles')
              .select('email')
              .eq('thirstyclub_id', resolvedThirstyId)
              .single();
            profile = data;
            if (error || !profile || !profile.email) {
              throw new Error("Invalid ThirstyID. Make sure it is spelled correctly.");
            }
          } else if (cleanedInput.toUpperCase().startsWith("T999")) {
            throw new Error("Invalid ThirstyID format. It must be in the format T999-XXXX (with 4 numbers).");
          } else {
            const { data, error } = await supabase
              .from('profiles')
              .select('email')
              .ilike('username', loginId)
              .single();
            profile = data;
            if (error || !profile || !profile.email) {
              throw new Error("Username or ThirstyID not found. Make sure it is spelled correctly.");
            }
          }
          email = profile.email;
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (data.session) {
          await syncSessionAndProfile(data.session);
          hideOnboardingScreen();
        }
      } catch (err) {
        let displayMsg = "Login Error: " + err.message;
        if (err.code === 'email_not_confirmed' || err.message?.includes('Email not confirmed')) {
          displayMsg = "Your email has not been confirmed yet. Please check your inbox for a confirmation email from ThirstyClub999.";
        } else if (err.code === 'invalid_credentials' || err.message?.includes('Invalid login credentials')) {
          displayMsg = "Invalid login credentials. Please check your email/username and password are correct.";
        }
        if (errorMsg) {
          errorMsg.textContent = displayMsg;
          errorMsg.style.display = 'block';
        } else {
          alert(displayMsg);
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'LOGIN';
        }
      }
    };
  }

  // Onboarding Signup Submit
  if (onboardSignupForm) {
    onboardSignupForm.onsubmit = async (e) => {
      e.preventDefault();
      const errorMsg = document.getElementById('onboard-signup-error-msg');
      if (errorMsg) errorMsg.style.display = 'none';

      const submitBtn = onboardSignupForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'PROCESSING...';
      }

      const username = document.getElementById('onboard-signup-username').value.trim();
      const email = document.getElementById('onboard-signup-email').value.trim().toLowerCase();
      const password = document.getElementById('onboard-signup-password').value;

      try {
        const { data: existingProfiles, error: profileCheckError } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', username);

        if (profileCheckError) throw new Error("Could not check username availability.");

        if (existingProfiles && existingProfiles.length > 0) {
          if (errorMsg) {
            errorMsg.textContent = "This username is already taken.";
            errorMsg.style.display = 'block';
          } else {
            alert("This username is already taken.");
          }
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } }
        });
        if (error) throw error;

        if (data.session) {
          await syncSessionAndProfile(data.session);
          alert("Registration Successful!\n\nYour account is active, and your ThirstyID has been generated.");
          hideOnboardingScreen();
        } else {
          alert("Registration Successful!\n\nPlease check your email inbox to verify your account. Once verified, your unique ThirstyID will be generated.");
          showOnboardLogin();
        }
      } catch (err) {
        if (errorMsg) {
          errorMsg.textContent = err.message;
          errorMsg.style.display = 'block';
        } else {
          alert("Sign Up Error: " + err.message);
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'GET THIRSTYID & PASSPORT';
        }
      }
    };
  }

  animateCounter('hero-counter', 999);
  animateCounter('logo-counter', 999);
});

