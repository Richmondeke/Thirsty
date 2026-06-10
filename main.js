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
  const SUPABASE_URL = "https://qnzszxukvugigprimlwi.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_syk64tdKksD56BZDt7FmZA_0KgZ581e";
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      lock: async (name, acquireTimeout, fn) => fn()
    }
  });

  // Global Session State
  let currentSession = null;
  let currentUserProfile = null;
  let currentUserTicket = null;
  let initialScrollDone = false;
  let recoveryPromptShown = false;
  let isEmailTriggering = false;

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

    const homeSection = document.getElementById('home');
    const lineupSection = document.getElementById('lineup');
    const gallerySection = document.getElementById('gallery');
    const rsvpSection = document.getElementById('rsvp');
    const logo = document.querySelector('.logo');

    if (session) {
      // User is Logged In
      document.body.classList.add('logged-in-user');
      
      if (logo) {
        if (document.getElementById('passport-viewer')) {
          logo.href = '#passport-viewer';
        } else {
          logo.href = '/index.html#passport-viewer';
        }
      }
      
      if (passportViewerSection) {
        if (homeSection) homeSection.style.display = 'none';
        if (lineupSection) lineupSection.style.display = 'none';
        if (gallerySection) gallerySection.style.display = 'none';
        if (rsvpSection) rsvpSection.style.display = 'none';
        if (ticketsSection) ticketsSection.style.display = 'none';
        passportViewerSection.style.display = 'flex';
      }

      // Generate QR Code
      const qrContainer = document.getElementById('hero-qr-code');
      if (qrContainer) {
        const checkinUrl = window.location.origin + '/checkin.html?id=' + (profile?.thirstyclub_id || 'T999-XXXX');
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
      
      const adminTabBtn = document.getElementById('admin-tab-btn');
      if (adminTabBtn) {
        if (isAdmin) {
          adminTabBtn.style.display = 'inline-block';
        } else {
          adminTabBtn.style.display = 'none';
        }
      }

      const accessLvl = currentUserTicket?.status || profile?.socials?.access_level || 'REGULAR';
      
      const ticketAccessLevel = document.getElementById('ticket-access-level');
      if (ticketAccessLevel) ticketAccessLevel.textContent = accessLvl + ' ACCESS';

      const homepageEventAccess = document.getElementById('homepage-event-access');
      if (homepageEventAccess) homepageEventAccess.textContent = accessLvl + ' ACCESS';
      
      const homepageAccessPass = document.getElementById('homepage-access-pass');
      if (homepageAccessPass) homepageAccessPass.textContent = accessLvl + ' ACCESS PASS';

      // Update Dashboard contents
      if (dashWelcomeText) dashWelcomeText.textContent = `Welcome, ${profile?.username || session.user.email.split('@')[0]}`;
      if (ticketUserId) ticketUserId.textContent = profile?.thirstyclub_id || 'T999-XXXX';
      if (ticketUserName) ticketUserName.textContent = profile?.username || 'Guest';
      if (ticketBarcodeId) ticketBarcodeId.textContent = profile?.thirstyclub_id || 'T999-XXXX';

      // Update Profile Inputs
      if (profileUsername) profileUsername.value = profile?.username || '';
      if (profileInstagram) profileInstagram.value = profile?.socials?.instagram || '';
      if (profileTwitter) profileTwitter.value = profile?.socials?.twitter || '';
      if (profileDiscord) profileDiscord.value = profile?.socials?.discord || '';
      if (profileAvatarPreview) {
        profileAvatarPreview.src = profile?.avatar_url || defaultAvatar;
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
      }

      if (passportAuthFields) passportAuthFields.style.display = 'none';
      if (passportLoggedInStatus) passportLoggedInStatus.style.display = 'block';
      if (passportMemberId) {
        passportMemberId.textContent = 'ThirstyID: ' + (profile?.thirstyclub_id || 'T999-XXXX');
      }
      if (downloadPassportBtn) {
        downloadPassportBtn.textContent = 'DOWNLOAD PASSPORT';
      }

      if (passportInputName) passportInputName.value = profile?.username || '';
      if (passportInputPob) passportInputPob.value = profile?.socials?.place_of_thirst || '';
      if (passportInputGender) passportInputGender.value = profile?.socials?.gender || '';
      if (passportInputSig) passportInputSig.value = profile?.socials?.signature || '';

      // Load avatar image into the canvas representation
      if (profile?.avatar_url && (!uploadedImage || uploadedImage.src !== profile.avatar_url)) {
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

      if (logo) {
        if (document.getElementById('passport-viewer')) {
          logo.href = '#home';
        } else {
          logo.href = '/index.html';
        }
      }
      
      if (passportViewerSection) {
        if (homeSection) homeSection.style.display = 'flex';
        if (lineupSection) lineupSection.style.display = '';
        if (gallerySection) gallerySection.style.display = '';
        if (rsvpSection) rsvpSection.style.display = '';
        passportViewerSection.style.display = 'none';
      }

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
      }

      if (passportAuthFields) passportAuthFields.style.display = 'flex';
      if (passportLoggedInStatus) passportLoggedInStatus.style.display = 'none';
      if (downloadPassportBtn) {
        downloadPassportBtn.textContent = 'DOWNLOAD PASSPORT (RSVP)';
      }

      if (passportInputName) passportInputName.value = '';
      if (passportInputPob) passportInputPob.value = '';
      if (passportInputGender) passportInputGender.value = '';
      if (passportInputSig) passportInputSig.value = '';

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

  const triggerWelcomeEmail = async (profile) => {
    try {
      const canvas = document.getElementById('passport-canvas');
      const dataUrl = canvas ? canvas.toDataURL('image/png') : null;
      
      console.log("Sending automatic ticket email for profile:", profile.email);
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          username: profile.username,
          thirstyclub_id: profile.thirstyclub_id || 'T999-XXXX',
          place_of_thirst: profile.socials?.place_of_thirst || 'LAGOS',
          passport_image: dataUrl
        })
      });

      if (res.ok) {
        console.log("Auto ticket email sent successfully!");
        const updatedSocials = {
          ...(profile.socials || {}),
          welcome_email_sent: true
        };
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ socials: updatedSocials })
          .eq('id', profile.id);
        if (updateError) {
          console.error("Error updating profile socials:", updateError);
        } else {
          profile.socials = updatedSocials;
          currentUserProfile = profile;
        }
      } else {
        console.error("Auto ticket email send failed:", await res.text());
      }
    } catch (e) {
      console.warn("Auto ticket email fetch error:", e);
    }
  };

  const syncSessionAndProfile = async (session) => {
    currentSession = session;
    if (session) {
      try {
        // Fetch profile
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError || !profile) {
          console.error("Profile not found or error, attempting fallback upsert:", profileError);
          const fallbackUsername = session.user.user_metadata?.username || session.user.email.split('@')[0];
          const fallbackId = 'T999-' + Math.floor(1000 + Math.random() * 9000);
          
          const { data: upsertedProfile, error: upsertError } = await supabase
            .from('profiles')
            .upsert({
              id: session.user.id,
              email: session.user.email,
              username: fallbackUsername,
              thirstyclub_id: fallbackId,
              socials: {
                instagram: "",
                twitter: "",
                discord: "",
                place_of_thirst: "LAGOS",
                gender: "F",
                signature: "Thirstyzoid",
                role: "user"
              }
            }, { onConflict: 'id' })
            .select()
            .single();

          if (upsertError) {
            console.error("Fallback profile upsert failed:", upsertError);
          } else {
            profile = upsertedProfile;
          }
        }

        if (profile) {
          currentUserProfile = profile;
          
          // Auto-trigger welcome email if not already sent (non-blocking)
          if (profile.email && !profile.socials?.welcome_email_sent && !isEmailTriggering) {
            isEmailTriggering = true;
            console.log("Welcome email not sent yet. Triggering auto email flow...");
            setTimeout(async () => {
              try {
                if (profile.avatar_url && (!uploadedImage || uploadedImage.src !== profile.avatar_url)) {
                  const img = new Image();
                  img.crossOrigin = "anonymous";
                  img.onload = async () => {
                    uploadedImage = img;
                    drawPassport();
                    await triggerWelcomeEmail(profile);
                    isEmailTriggering = false;
                  };
                  img.onerror = () => {
                    isEmailTriggering = false;
                  };
                  img.src = profile.avatar_url;
                } else {
                  drawPassport();
                  await triggerWelcomeEmail(profile);
                  isEmailTriggering = false;
                }
              } catch (err) {
                console.error("Error in auto welcome email trigger:", err);
                isEmailTriggering = false;
              }
            }, 1500);
          }
        }

        // Fetch ticket
        let { data: tickets, error: ticketError } = await supabase
          .from('tickets')
          .select('*')
          .eq('user_id', session.user.id);

        if (ticketError) {
          console.error("Error fetching tickets:", ticketError);
        } else if (tickets && tickets.length > 0) {
          currentUserTicket = tickets[0];
          
          // If the ticket is pending, and we now have a valid logged in session (meaning email confirmed),
          // update the ticket status to VIP in the database.
          if (currentUserTicket.status === 'PENDING') {
            console.log("Found pending ticket, updating status to VIP...");
            const { data: updatedTickets, error: updateTicketError } = await supabase
              .from('tickets')
              .update({ status: 'VIP' })
              .eq('id', currentUserTicket.id)
              .select();
            
            if (updateTicketError) {
              console.error("Failed to update ticket status to VIP:", updateTicketError);
            } else if (updatedTickets && updatedTickets.length > 0) {
              currentUserTicket = updatedTickets[0];
              console.log("Ticket status updated to VIP successfully!");
            }
          }
        }

        // Scroll to passport-viewer on initial page load if already logged in
        if (!initialScrollDone) {
          initialScrollDone = true;
          setTimeout(() => {
            const passportViewer = document.getElementById('passport-viewer');
            if (passportViewer) {
              passportViewer.scrollIntoView({ behavior: 'smooth' });
            }
          }, 800);
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
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      const isLoginPage = window.location.pathname.includes('login');
      if (isLoginPage) {
        console.log("PASSWORD_RECOVERY event received on login page. Custom form will handle it.");
        return;
      }
      console.log("PASSWORD_RECOVERY event detected on non-login page. Redirecting to /login...");
      window.location.replace('/login' + window.location.search + window.location.hash);
      return;
    }

    const isLoginPage = window.location.pathname.includes('login');
    if (session && isLoginPage) {
      console.log("Active session detected on login page. Redirecting to clubhouse immediately...");
      window.location.replace('/index.html#passport-viewer');
      return;
    }

    // Defer async database calls to prevent blocking the lock mechanism
    setTimeout(async () => {
      // Await syncSessionAndProfile first, so that the UI is updated and #passport-viewer is rendered visible
      await syncSessionAndProfile(session);

      if (event === 'SIGNED_IN' && session) {
        // Clean up URL query parameters from Supabase redirect (e.g. code, token)
        if (window.location.search || window.location.hash) {
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
        
        // Force scroll to dashboard
        setTimeout(() => {
          const passportViewer = document.getElementById('passport-viewer');
          if (passportViewer) {
            passportViewer.scrollIntoView({ behavior: 'smooth' });
          }
        }, 300);
      }
    }, 0);
  });

  // Handle Password Recovery on page load (handles PKCE code exchange or implicit token redirects)
  const checkRecoveryFlow = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    const isRecovery = urlParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery' || window.location.hash.includes('type=recovery');

    if (isRecovery) {
      const isLoginPage = window.location.pathname.includes('login');
      if (!isLoginPage) {
        console.log("Password recovery query detected in URL. Redirecting to /login...");
        window.location.replace('/login' + window.location.search + window.location.hash);
      }
    }
  };

  // Run the recovery flow check on initialization
  checkRecoveryFlow();

  const modal = document.getElementById('ticket-modal');
  const openAuthBtn = document.getElementById('open-auth-btn');
  const navMembersBtn = document.getElementById('nav-members-btn');
  const closeModalBtn = document.querySelector('#ticket-modal .close-modal');
  const loginForm = document.getElementById('login-form');

  const openAuthModal = () => {
    const passportViewer = document.getElementById('passport-viewer');
    const isDashboardVisible = passportViewer && (passportViewer.style.display !== 'none' && window.getComputedStyle(passportViewer).display !== 'none');

    if (currentSession && currentUserProfile && (!passportViewer || isDashboardVisible)) {
      // If logged in, navigate straight to passport-viewer section
      if (passportViewer) {
        passportViewer.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = '/index.html#passport-viewer';
      }
    } else {
      // Clear stale memory state if the dashboard exists but is hidden
      if (passportViewer && !isDashboardVisible) {
        currentSession = null;
        currentUserProfile = null;
        currentUserTicket = null;
        updateUI();
      }
      // Redirect to login page
      window.location.href = '/login';
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

      if (!document.getElementById('passport-viewer')) {
        window.location.href = '/index.html#passport-viewer';
        return;
      }

      // Ensure UI is updated then navigate to clubhouse
      updateUI();
      setTimeout(() => {
        const passportViewer = document.getElementById('passport-viewer');
        if (passportViewer) {
          passportViewer.style.display = 'flex'; // force visible
          passportViewer.scrollIntoView({ behavior: 'smooth' });
        }
      }, 400);
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

  // Forgot Password Trigger
  const forgotPasswordBtn = document.getElementById('forgot-password-btn');
  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', async () => {
      let loginIdVal = document.getElementById('login-id').value.trim();
      
      if (!loginIdVal) {
        loginIdVal = prompt("Enter your ThirstyID or Email to reset your password:");
        if (!loginIdVal) return;
        loginIdVal = loginIdVal.trim();
      }

      let email = loginIdVal.toLowerCase();

      // Resolve ThirstyID to Email if necessary
      if (loginIdVal.toUpperCase().startsWith("T999-")) {
        try {
          const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('email')
            .eq('thirstyclub_id', loginIdVal.toUpperCase())
            .single();

          if (profileErr || !profile || !profile.email) {
            alert("Could not find an account with that ThirstyID. Make sure it is correct.");
            return;
          }
          email = profile.email;
        } catch (err) {
          alert("Error resolving ThirstyID: " + err.message);
          return;
        }
      }

      // Trigger reset password email via Supabase
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/?type=recovery',
        });

        if (error) {
          alert("Error sending reset password link: " + error.message);
        } else {
          alert(`Password reset link has been sent to ${email}. Please check your inbox.`);
        }
      } catch (err) {
        alert("Error: " + err.message);
      }
    });
  }

  // Login Submit
  if (loginForm) {
    // Submit immediately on touchstart to prevent double-click requirement caused by keyboard blur layout shifts on mobile
    const loginSubmitBtn = loginForm.querySelector('button[type="submit"]');
    if (loginSubmitBtn) {
      loginSubmitBtn.addEventListener('touchstart', (e) => {
        try {
          if (typeof loginForm.reportValidity !== 'function' || loginForm.reportValidity()) {
            e.preventDefault();
            try {
              if (typeof loginForm.requestSubmit === 'function') {
                loginForm.requestSubmit();
              } else {
                loginForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
              }
            } catch (innerErr) {
              console.error("Exception during touchstart requestSubmit:", innerErr);
              loginForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
          }
        } catch (err) {
          console.error("Error in login touchstart handler:", err);
          // If we caught an error before preventDefault, the event will fall back to default click behavior.
        }
      }, { passive: false });
    }

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
        } else if (!loginId.includes('@')) {
          // Assume it is a username
          // Resolve Username to Email (case-insensitive search)
          const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('email')
            .ilike('username', loginId)
            .single();

          if (profileErr || !profile || !profile.email) {
            throw new Error("Invalid Username. Make sure it is spelled correctly.");
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

        if (modal) modal.close();
        loginForm.reset();
      } catch (err) {
        const errMsg = err.message ? err.message.toLowerCase() : "";
        if (errMsg.includes("email not confirmed") || errMsg.includes("confirm your email") || errMsg.includes("email confirmation")) {
          alert("Your email is registered but has not been verified yet. Please check your inbox for the verification link, or click 'Forgot Password' on the login screen to request a new link.");
        } else {
          alert("Login Error: " + err.message);
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
            socials: {
              ...(currentUserProfile?.socials || {}),
              instagram,
              twitter,
              discord
            }
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

  let ticking = false;
  const updateGallery3DEffect = () => {
    if (!galleryScroller || galleryItems.length === 0) return;

    if (window.innerWidth <= 768) {
      galleryItems.forEach(item => {
        item.style.transform = '';
      });
      return;
    }
    
    if (!ticking) {
      window.requestAnimationFrame(() => {
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
        ticking = false;
      });
      ticking = true;
    }
  };

  if (galleryScroller) {
    let scrollTimeout;
    galleryScroller.addEventListener('scroll', () => {
      galleryScroller.classList.add('scrolling');
      updateGallery3DEffect();
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        galleryScroller.classList.remove('scrolling');
      }, 150);
    }, { passive: true });

    window.addEventListener('resize', updateGallery3DEffect, { passive: true });
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
    let fadeInterval = null;
    
    // Detect mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

    if (!isMobile) {
      heroVideo.removeAttribute('loop');
      heroVideo.loop = false;
    } else {
      heroVideo.setAttribute('loop', '');
      heroVideo.loop = true;
    }
    
    // Set initial audio properties
    heroVideo.muted = true;
    heroVideo.volume = 0;

    const fadeVolume = (targetVolume, duration) => {
      if (fadeInterval) clearInterval(fadeInterval);
      
      // If we are fading in, ensure video is unmuted
      if (targetVolume > 0) {
        heroVideo.muted = false;
      }
      
      const startVolume = heroVideo.volume;
      const startTime = performance.now();
      
      fadeInterval = setInterval(() => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Linear interpolation of volume level
        heroVideo.volume = startVolume + (targetVolume - startVolume) * progress;
        
        if (progress >= 1) {
          clearInterval(fadeInterval);
          fadeInterval = null;
          // If we faded out completely, mute the video
          if (targetVolume === 0) {
            heroVideo.muted = true;
          }
        }
      }, 30); // smooth updates every 30ms
    };

    // Intersection Observer to autoplay on load / scroll into view, and pause when scrolled out of view
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (!isMobile && heroVideo.currentTime >= heroVideo.duration - 0.1) {
            heroVideo.currentTime = 0;
          }
          heroVideo.play().catch(err => {
            console.log("Video autoplay/scroll-in play error:", err);
          });
        } else {
          heroVideo.pause();
        }
      });
    }, { threshold: 0.1 });

    videoObserver.observe(heroVideo);
    
    // Video ended event listener (Web only)
    heroVideo.addEventListener('ended', () => {
      if (!isMobile) {
        if (!isHovered) {
          // Play once on load ends or mouseleave play ends -> return to start and pause
          heroVideo.currentTime = 0;
          heroVideo.pause();
        } else {
          // Plays again to the end and stops (pauses at end)
          heroVideo.pause();
        }
      }
    });

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
      heroSection.classList.add('video-active');
      
      // Fade in to decent volume level (0.5) over 400ms
      fadeVolume(0.5, 400);

      if (!isMobile) {
        // Plays again from start to end and stops
        heroVideo.currentTime = 0;
      }
      heroVideo.play().catch(err => {
        console.log("Video play error:", err);
      });
    });
    
    heroCtaBtn.addEventListener('mouseleave', () => {
      isHovered = false;
      heroContent.classList.remove('cta-hovered');
      heroSection.classList.remove('video-active');
      
      // Fade out to 0 volume over 600ms
      fadeVolume(0, 600);

      if (!isMobile) {
        // When user removes mouse, plays again from start to end and stops
        heroVideo.currentTime = 0;
        heroVideo.play().catch(err => {
          console.log("Video mouseleave play error:", err);
        });
      }
    });
  }

  // ==========================================
  // 11. Thirsty Passport Generator Logic
  // ==========================================
  let uploadedImage = null;
  let adminFetchedUsers = [];
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
    const sigText = document.getElementById('passport-input-sig')?.value || currentUserProfile?.socials?.signature || 'Thirstyzoid';
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
    const nameVal = (document.getElementById('passport-input-name')?.value || currentUserProfile?.username || 'THIRSTYZOID').toUpperCase();
    const pobVal = (document.getElementById('passport-input-pob')?.value || currentUserProfile?.socials?.place_of_thirst || 'LAGOS').toUpperCase();
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

      // 1. User is Logged In: Download passport FIRST, then sync profile in background
      if (currentSession) {
        downloadPassportBtn.disabled = true;
        const originalText = downloadPassportBtn.textContent;
        downloadPassportBtn.textContent = "Downloading...";

        const startTime = Date.now();
        if (processingModal) {
          document.getElementById('processing-status-text').textContent = 'PREPARING DOWNLOAD...';
          processingModal.showModal();
        }
        
        let shouldShowSuccess = false;
        try {
          // Step 1: Download passport IMMEDIATELY (before any DB ops)
          if (processingModal) document.getElementById('processing-status-text').textContent = 'DOWNLOADING PASSPORT...';
          performDownload();

          // Step 2: Compress avatar to ~100KB JPEG thumbnail to avoid Supabase row size limits
          let profilePic = currentUserProfile?.avatar_url || "";
          if (uploadedImage) {
            try {
              const thumbCanvas = document.createElement('canvas');
              const maxSize = 280;
              const ratio = Math.min(maxSize / uploadedImage.width, maxSize / uploadedImage.height);
              thumbCanvas.width = Math.round(uploadedImage.width * ratio);
              thumbCanvas.height = Math.round(uploadedImage.height * ratio);
              thumbCanvas.getContext('2d').drawImage(uploadedImage, 0, 0, thumbCanvas.width, thumbCanvas.height);
              profilePic = thumbCanvas.toDataURL('image/jpeg', 0.72);
            } catch (e) {
              console.warn('Avatar compression skipped:', e);
            }
          }

          // Step 3: Update profile with 8s timeout guard — never blocks the download
          if (processingModal) document.getElementById('processing-status-text').textContent = 'SYNCING PROFILE...';

          const { error: updateError } = await Promise.race([
            supabase.from('profiles').update({
              username: nameVal,
              avatar_url: profilePic,
              socials: {
                ...(currentUserProfile?.socials || {}),
                instagram: currentUserProfile?.socials?.instagram || "",
                twitter: currentUserProfile?.socials?.twitter || "",
                discord: currentUserProfile?.socials?.discord || "",
                place_of_thirst: pobVal,
                gender: genderVal,
                signature: sigVal
              }
            }).eq('id', currentSession.user.id),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
          ]);

          if (updateError) {
            console.warn('Profile sync skipped (download already done):', updateError);
          } else {
            const { data: refreshedProfile } = await supabase
              .from('profiles').select('*').eq('id', currentSession.user.id).single();
            if (refreshedProfile) { currentUserProfile = refreshedProfile; updateUI(); }
          }

          // Trigger transactional email
          try {
            fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: currentSession.user.email,
                username: nameVal,
                thirstyclub_id: currentUserProfile?.thirstyclub_id || 'T999-XXXX',
                place_of_thirst: pobVal,
                passport_image: dataUrl
              })
            }).catch(e => console.warn('Email trigger error (non-blocking):', e));
          } catch (e) {
            console.warn('Email trigger call failed:', e);
          }

          shouldShowSuccess = true;
        } catch (err) {
          // Download already happened — don't block user with error
          console.error('Profile sync error (download complete):', err);
          shouldShowSuccess = true;
        } finally {
          // Always close modal — never get stuck
          const elapsed = Date.now() - startTime;
          const remainingDelay = Math.max(0, 1500 - elapsed);
          if (remainingDelay > 0) await new Promise(r => setTimeout(r, remainingDelay));
          if (processingModal) processingModal.close();
          downloadPassportBtn.disabled = false;
          downloadPassportBtn.textContent = originalText;

          // Open success modal after closing processing modal
          if (shouldShowSuccess) {
            const heading = document.getElementById('success-modal-heading');
            const title = document.getElementById('success-modal-title');
            const desc = document.getElementById('success-modal-desc');
            if (heading) heading.textContent = "ALREADY RSVP'D!";
            if (title) title.textContent = "Welcome Back to Thirstyclub999";
            if (desc) desc.textContent = "You have already RSVP'd for this event. Your passport has been successfully downloaded.";

            const successModal = document.getElementById('success-modal');
            const successMemberId = document.getElementById('success-member-id');
            if (successMemberId) {
              successMemberId.textContent = currentUserProfile?.thirstyclub_id || 'T999-XXXX';
            }
            if (successModal) {
              successModal.showModal();
            }
          }
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

      let shouldShowSuccess = false;
      let memberIdVal = 'T999-XXXX';
      let isPending = false;
      let wasAlreadyRegistered = false;

      // Capture the full passport canvas NOW (before any async — prevents race conditions)
      const signupCanvas = document.getElementById('passport-canvas');
      const signupPassportDataUrl = signupCanvas ? signupCanvas.toDataURL('image/png') : null;

      try {
        // Compress avatar to a small size for signup metadata to avoid exceeding token/DB sizes
        let signUpAvatarUrl = "";
        if (uploadedImage) {
          try {
            const thumbCanvas = document.createElement('canvas');
            const maxSize = 180;
            const ratio = Math.min(maxSize / uploadedImage.width, maxSize / uploadedImage.height);
            thumbCanvas.width = Math.round(uploadedImage.width * ratio);
            thumbCanvas.height = Math.round(uploadedImage.height * ratio);
            thumbCanvas.getContext('2d').drawImage(uploadedImage, 0, 0, thumbCanvas.width, thumbCanvas.height);
            signUpAvatarUrl = thumbCanvas.toDataURL('image/jpeg', 0.7);
          } catch (e) {
            console.warn('Avatar compression for metadata skipped:', e);
            signUpAvatarUrl = uploadedImage.src;
          }
        }

        const profilePic = uploadedImage ? uploadedImage.src : ""; // base64 string

        // Call Supabase SignUp with complete profile metadata (trigger handle_new_user will parse this)
        let signUpData = null;
        let signUpError = null;

        try {
          const { data, error } = await supabase.auth.signUp({
            email: emailVal,
            password: passwordVal,
            options: {
              redirectTo: window.location.origin + '/',
              data: {
                username: nameVal,
                place_of_thirst: pobVal,
                gender: genderVal,
                signature: sigVal,
                avatar_url: signUpAvatarUrl
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
            wasAlreadyRegistered = true;
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
          // Wait briefly to ensure DB trigger and read replicas are fully synced
          await new Promise(resolve => setTimeout(resolve, 1500));

          // Fetch the profile first to get existing data (like thirstyclub_id)
          let refreshedProfile = null;
          for (let i = 0; i < 3; i++) {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', signUpData.session.user.id)
              .single();
            if (data) {
              refreshedProfile = data;
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          if (refreshedProfile) {
            // Update profile in DB immediately with the details
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                username: nameVal,
                avatar_url: profilePic,
                socials: {
                  ...(currentUserProfile?.socials || {}),
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

            // Re-fetch to get the final updated profile
            const { data: finalProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', signUpData.session.user.id)
              .single();

            if (finalProfile) refreshedProfile = finalProfile;
          }
          if (!refreshedProfile) {
            console.warn("Falling back to robust syncSessionAndProfile...");
            await syncSessionAndProfile(signUpData.session);
          } else {
            currentUserProfile = refreshedProfile;
            currentSession = signUpData.session;
            updateUI();
          }

          memberIdVal = refreshedProfile?.thirstyclub_id || 'T999-XXXX';

          // Trigger transactional email (non-blocking)
          try {
            fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: emailVal,
                username: nameVal,
                thirstyclub_id: memberIdVal,
                place_of_thirst: pobVal,
                passport_image: signupPassportDataUrl  // captured from canvas before async signup
              })
            }).catch(e => console.warn('Email trigger error (non-blocking):', e));
          } catch (e) {
            console.warn('Email trigger call failed:', e);
          }

          // Add to Mailchimp Marketing audience/contacts (non-blocking)
          try {
            fetch('/api/mailchimp-subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: emailVal,
                username: nameVal,
                thirstyclub_id: memberIdVal,
                gender: genderVal || '',
                place_of_thirst: pobVal || ''
              })
            }).catch(e => console.warn('Mailchimp subscribe error (non-blocking):', e));
          } catch (e) {
            console.warn('Mailchimp subscribe call failed:', e);
          }

          shouldShowSuccess = true;
        } else {
          // Session is not active yet (requires email confirmation)
          isPending = true;
          if (processingModal) {
            document.getElementById('processing-status-text').textContent = 'GENERATING PASS...';
          }
          // Wait briefly to ensure DB trigger has completed inserting the profile record
          await new Promise(resolve => setTimeout(resolve, 1500));

          let guestProfile = null;
          if (signUpData && signUpData.user) {
            for (let i = 0; i < 3; i++) {
              const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', signUpData.user.id)
                .single();
              if (data) {
                guestProfile = data;
                break;
              }
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }

          memberIdVal = guestProfile?.thirstyclub_id || 'PENDING VERIFICATION';

          // Trigger transactional email (non-blocking, marked as pending)
          try {
            fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: emailVal,
                username: nameVal,
                thirstyclub_id: memberIdVal,
                place_of_thirst: pobVal,
                passport_image: signupPassportDataUrl, // captured from canvas before async signup
                status: 'PENDING'
              })
            }).catch(e => console.warn('Email trigger error (non-blocking):', e));
          } catch (e) {
            console.warn('Email trigger call failed:', e);
          }

          // Add to Mailchimp Marketing audience/contacts (non-blocking, marked as pending)
          try {
            fetch('/api/mailchimp-subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: emailVal,
                username: nameVal,
                thirstyclub_id: memberIdVal,
                gender: genderVal || '',
                place_of_thirst: pobVal || '',
                status: 'pending'
              })
            }).catch(e => console.warn('Mailchimp subscribe error (non-blocking):', e));
          } catch (e) {
            console.warn('Mailchimp subscribe call failed:', e);
          }

          shouldShowSuccess = true;
        }
      } catch (err) {
        const errMsg = err.message ? err.message.toLowerCase() : "";
        if (errMsg.includes("email not confirmed") || errMsg.includes("confirm your email") || errMsg.includes("email confirmation")) {
          alert("This email is registered but has not been verified yet. Please check your inbox for the verification link, or click 'Forgot Password' on the login screen to request a new link.");
        } else {
          alert("RSVP Error: " + err.message);
        }
      } finally {
        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, 3000 - elapsed);
        if (remainingDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingDelay));
        }
        if (processingModal) processingModal.close();
        downloadPassportBtn.disabled = false;
        downloadPassportBtn.textContent = "DOWNLOAD PASSPORT (RSVP)";

        if (shouldShowSuccess) {
          const heading = document.getElementById('success-modal-heading');
          const title = document.getElementById('success-modal-title');
          const desc = document.getElementById('success-modal-desc');

          if (wasAlreadyRegistered) {
            if (heading) heading.textContent = "ALREADY RSVP'D!";
            if (title) title.textContent = "Welcome Back to Thirstyclub999";
            if (desc) desc.textContent = "You have already RSVP'd for this event. Your passport has been successfully downloaded.";
          } else {
            if (heading) heading.textContent = "YOU'RE IN!";
            if (title) title.textContent = "Welcome to Thirstyclub999";
            if (desc) desc.textContent = "Your RSVP is confirmed and your Thirsty ID is generated. Your passport has been successfully downloaded.";
          }

          const successModal = document.getElementById('success-modal');
          const successMemberId = document.getElementById('success-member-id');
          if (successMemberId) {
            successMemberId.textContent = memberIdVal;
          }
          if (successModal) {
            successModal.showModal();
          }
        }
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
      let users = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      const totalEl = document.getElementById('admin-stat-total');
      if (totalEl) totalEl.textContent = 'Loading...';

      while (hasMore) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;

        users = users.concat(data);
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      }

      adminFetchedUsers = users; // Store user profiles globally in the scope for reference

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

          const accessLvl = user.socials?.access_level || 'REGULAR';
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><code class="glow-id-badge">${escapeHtml(user.thirstyclub_id || 'N/A')}</code></td>
            <td>${escapeHtml(user.username || '')}</td>
            <td>${escapeHtml(user.email || '')}</td>
            <td><span class="badge badge-${gender.toLowerCase() || 'na'}">${escapeHtml(gender || 'N/A')}</span></td>
            <td>
              <select class="admin-access-select ${accessLvl === 'VIP' ? 'access-vip' : 'access-regular'}" data-userid="${escapeHtml(user.id)}">
                <option value="REGULAR" ${accessLvl === 'REGULAR' ? 'selected' : ''}>REGULAR</option>
                <option value="VIP" ${accessLvl === 'VIP' ? 'selected' : ''}>VIP</option>
              </select>
            </td>
            <td style="color: var(--text-dim); font-size: 0.8rem;">${date}</td>
            <td>
              <button class="admin-view-passport-btn table-action-btn" data-email="${escapeHtml(user.email)}">View Passport</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      }

      // Update stats UI
      const maleEl = document.getElementById('admin-stat-male');
      const femaleEl = document.getElementById('admin-stat-female');
      const otherEl = document.getElementById('admin-stat-other');

      if (totalEl) totalEl.textContent = users.length;
      if (maleEl) maleEl.textContent = maleCount;
      if (femaleEl) femaleEl.textContent = femaleCount;
      if (otherEl) otherEl.textContent = otherCount;

      // Populate welcome email settings from DB
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

  // Helper to draw admin passport
  const drawAdminPassportOnCanvas = (canvasId, profile, userImage) => {
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

    // Middle Watermark
    if (passportBlendImage.complete && passportBlendImage.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(20, 20, pageW, pageH, [16, 16, 0, 0]);
      ctx.clip();
      ctx.globalAlpha = 0.16;
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

    // Stamp
    const isCheckedIn = (profile.socials?.checked_in === true || profile.checked_in === true);
    if (isCheckedIn) {
      drawStamp(ctx, 300, 202);
    }

    // 6. Draw Bottom Page Content
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.font = '900 22px "Kyrilla", sans-serif';
    ctx.fillText("THIRSTYCLUB999", 45, 452);
    ctx.font = '700 11px "Kyrilla", sans-serif';
    ctx.fillText("PASSPORT", 45 + 5, 470);

    // Left photo
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

    // Right details table
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

    if (logoImage.complete && logoImage.naturalWidth > 0) {
      ctx.save();
      ctx.filter = 'grayscale(100%)';
      const logoSize = 36;
      ctx.drawImage(logoImage, 505, 440, logoSize, logoSize);
      ctx.restore();
    }
  };

  // Wire up admin passport view events
  document.addEventListener('change', async (e) => {
    if (e.target && e.target.classList.contains('admin-access-select')) {
      const selectEl = e.target;
      const userId = selectEl.getAttribute('data-userid');
      const newAccess = selectEl.value;

      try {
        const userProfile = adminFetchedUsers.find(u => u.id === userId);
        if (!userProfile) throw new Error("User not found in local state");

        const updatedSocials = {
          ...userProfile.socials,
          access_level: newAccess
        };

        const { error } = await supabase
          .from('profiles')
          .update({ socials: updatedSocials })
          .eq('id', userId);

        if (error) throw error;
        
        userProfile.socials = updatedSocials;
        
        // Dynamically toggle classes
        if (newAccess === 'VIP') {
          selectEl.classList.remove('access-regular');
          selectEl.classList.add('access-vip');
        } else {
          selectEl.classList.remove('access-vip');
          selectEl.classList.add('access-regular');
        }
        
        // Optional: you can show a small toast or visual confirmation here
        const originalBg = selectEl.style.backgroundColor;
        selectEl.style.backgroundColor = 'rgba(76, 175, 80, 0.2)'; // Green tint
        setTimeout(() => { selectEl.style.backgroundColor = originalBg; }, 1000);

      } catch (err) {
        console.error("Error updating access level:", err);
        alert("Failed to update access level: " + err.message);
        // Revert selection
        const prevAccess = adminFetchedUsers.find(u => u.id === userId)?.socials?.access_level || 'REGULAR';
        selectEl.value = prevAccess;
        if (prevAccess === 'VIP') {
          selectEl.classList.remove('access-regular');
          selectEl.classList.add('access-vip');
        } else {
          selectEl.classList.remove('access-vip');
          selectEl.classList.add('access-regular');
        }
      }
    }
  });

  document.addEventListener('click', async (e) => {
    if (e.target && e.target.classList.contains('admin-view-passport-btn')) {
      e.preventDefault();
      const email = e.target.getAttribute('data-email');
      const user = adminFetchedUsers.find(u => u.email === email);
      if (!user) return;

      const modal = document.getElementById('admin-passport-modal');
      if (!modal) return;

      modal.showModal();

      const canvas = document.getElementById('admin-passport-canvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Loading Passport Photo...', canvas.width / 2, canvas.height / 2);
      }

      const drawIt = (userImg) => {
        drawAdminPassportOnCanvas('admin-passport-canvas', user, userImg);
      };

      if (user.avatar_url) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          drawIt(img);
        };
        img.onerror = () => {
          console.warn("Could not load user avatar for admin drawing");
          drawIt(null);
        };
        img.src = user.avatar_url;
      } else {
        drawIt(null);
      }

      // Hook up download in modal
      const dlBtn = document.getElementById('admin-download-passport-btn');
      if (dlBtn) {
        const newDlBtn = dlBtn.cloneNode(true);
        dlBtn.parentNode.replaceChild(newDlBtn, dlBtn);
        newDlBtn.addEventListener('click', () => {
          if (!canvas) return;
          const formatVal = passportExportFormat?.value || 'png';
          const filename = (user.username || 'user').toLowerCase().replace(/\s+/g, '-');
          const dataUrl = formatVal === 'jpeg'
            ? canvas.toDataURL('image/jpeg', 0.95)
            : canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `thirstyclub999-passport-${filename}.${formatVal === 'jpeg' ? 'jpg' : 'png'}`;
          link.href = dataUrl;
          link.click();
        });
      }
    }
  });

  // Modal Dialog Close handlers
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

  // Welcome Template Saving
  const saveWelcomeBtn = document.getElementById('admin-save-email-template-btn');
  if (saveWelcomeBtn) {
    saveWelcomeBtn.addEventListener('click', async () => {
      const subject = document.getElementById('admin-email-subject')?.value.trim();
      const message = document.getElementById('admin-email-message')?.value.trim();

      if (!currentSession) return;

      try {
        saveWelcomeBtn.disabled = true;
        saveWelcomeBtn.textContent = 'SAVING...';

        const { data: profile } = await supabase
          .from('profiles')
          .select('socials')
          .eq('id', currentSession.user.id)
          .single();

        const updatedSocials = {
          ...(profile?.socials || {}),
          welcome_email_subject: subject,
          welcome_email_message: message
        };

        const { error } = await supabase
          .from('profiles')
          .update({ socials: updatedSocials })
          .eq('id', currentSession.user.id);

        if (error) throw error;

        alert('Welcome email template saved successfully!');
      } catch (err) {
        console.error('Error saving welcome template:', err);
        alert('Failed to save welcome template: ' + err.message);
      } finally {
        saveWelcomeBtn.disabled = false;
        saveWelcomeBtn.textContent = 'SAVE WELCOME TEMPLATE';
      }
    });
  }

  // Broadcast Email Blast
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
        alert("Please enter both Subject and Message body for the broadcast.");
        return;
      }

      if (!adminFetchedUsers || adminFetchedUsers.length === 0) {
        alert("No registered users found to send broadcast.");
        return;
      }

      if (!confirm(`Are you sure you want to send this broadcast email to all ${adminFetchedUsers.length} users?`)) {
        return;
      }

      try {
        broadcastBtn.disabled = true;
        if (broadcastStatusContainer) broadcastStatusContainer.style.display = 'block';

        let sentCount = 0;
        let failedCount = 0;

        for (let i = 0; i < adminFetchedUsers.length; i++) {
          const user = adminFetchedUsers[i];
          const pct = Math.round(((i + 1) / adminFetchedUsers.length) * 100);
          
          if (broadcastProgressBar) broadcastProgressBar.style.width = `${pct}%`;
          if (broadcastStatusText) {
            broadcastStatusText.textContent = `Sending to ${user.email} (${i + 1}/${adminFetchedUsers.length})...`;
          }

          try {
            const res = await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: user.email,
                username: user.username,
                thirstyclub_id: user.thirstyclub_id || 'T999-XXXX',
                place_of_thirst: user.socials?.place_of_thirst || '',
                custom_subject: subject,
                custom_message: message
              })
            });

            if (!res.ok) throw new Error("HTTP " + res.status);
            sentCount++;
          } catch (e) {
            console.error(`Failed to send broadcast to ${user.email}:`, e);
            failedCount++;
          }
        }

        if (broadcastStatusText) {
          broadcastStatusText.textContent = `Broadcast completed! Sent: ${sentCount}, Failed: ${failedCount}`;
        }
        alert(`Broadcast complete. Sent: ${sentCount}, Failed: ${failedCount}`);

      } catch (err) {
        console.error("Broadcast failed:", err);
        alert("Failed to send broadcast: " + err.message);
      } finally {
        broadcastBtn.disabled = false;
        setTimeout(() => {
          if (broadcastStatusContainer) broadcastStatusContainer.style.display = 'none';
          if (broadcastProgressBar) broadcastProgressBar.style.width = '0%';
        }, 5000);
      }
    });
  }

  // ── Admin Table Live Search ───────────────────────────────
  const adminTableSearch = document.getElementById('admin-table-search');
  if (adminTableSearch) {
    adminTableSearch.addEventListener('input', () => {
      const query = adminTableSearch.value.toLowerCase().trim();
      const rows = document.querySelectorAll('#admin-users-list tr');
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }

  // ── Admin Refresh Button ──────────────────────────────────
  const adminRefreshBtn = document.getElementById('admin-refresh-btn');
  if (adminRefreshBtn) {
    adminRefreshBtn.addEventListener('click', async () => {
      adminRefreshBtn.textContent = '↻ Refreshing...';
      adminRefreshBtn.disabled = true;
      try {
        // Re-fetch admin data by triggering tab click logic
        const adminTab = document.getElementById('admin-tab-btn');
        if (adminTab) adminTab.click();
      } finally {
        setTimeout(() => {
          adminRefreshBtn.textContent = '↻ Refresh';
          adminRefreshBtn.disabled = false;
        }, 1500);
      }
    });
  }

  // ── Mailchimp Sync Button ──────────────────────────────────
  const adminSyncMailchimpBtn = document.getElementById('admin-sync-mailchimp-btn');
  if (adminSyncMailchimpBtn) {
    adminSyncMailchimpBtn.addEventListener('click', async () => {
      if (!confirm("Are you sure you want to sync all registered profiles with Mailchimp? This will add or update them in your audience list.")) {
        return;
      }
      adminSyncMailchimpBtn.textContent = '🐒 Syncing...';
      adminSyncMailchimpBtn.disabled = true;
      try {
        const res = await fetch('/api/mailchimp-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ admin_email: currentSession?.user?.email })
        });
        const data = await res.json();
        if (res.ok) {
          alert(`Mailchimp Sync Completed!\n\nTotal Profiles: ${data.total_profiles}\nNew Subscribers: ${data.new_subscribers}\nUpdated: ${data.updated}\nErrors: ${data.errors}`);
        } else {
          alert(`Sync failed: ${data.error || 'Unknown error'}`);
        }
      } catch (err) {
        console.error("Mailchimp sync error:", err);
        alert("Sync failed: " + err.message);
      } finally {
        adminSyncMailchimpBtn.textContent = '🐒 Sync Mailchimp';
        adminSyncMailchimpBtn.disabled = false;
      }
    });
  }

  // ==========================================
  // Login Page Custom State Handling
  // ==========================================
  const loginPageBody = document.querySelector('.login-page-body');
  if (loginPageBody) {
    const loginState = document.getElementById('login-state');
    const forgotState = document.getElementById('forgot-state');
    const resetState = document.getElementById('reset-state');
    const messageState = document.getElementById('message-state');

    const showState = (state) => {
      [loginState, forgotState, resetState, messageState].forEach(el => {
        if (el) el.style.display = 'none';
      });
      if (state) state.style.display = 'block';
    };

    // State navigation
    const forgotTrigger = document.getElementById('forgot-password-trigger');
    if (forgotTrigger) {
      forgotTrigger.addEventListener('click', () => {
        showState(forgotState);
      });
    }

    const backToLoginBtn = document.getElementById('back-to-login-btn');
    if (backToLoginBtn) {
      backToLoginBtn.addEventListener('click', () => {
        showState(loginState);
      });
    }

    // Forgot password form submission
    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
      forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = forgotForm.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Sending...";
        }

        const forgotId = document.getElementById('forgot-id').value.trim();
        let email = forgotId.toLowerCase();

        try {
          // Resolve ThirstyID to Email if necessary
          if (forgotId.toUpperCase().startsWith("T999-")) {
            const { data: profile, error: profileErr } = await supabase
              .from('profiles')
              .select('email')
              .eq('thirstyclub_id', forgotId.toUpperCase())
              .single();

            if (profileErr || !profile || !profile.email) {
              throw new Error("Could not find an account with that ThirstyID.");
            }
            email = profile.email;
          } else if (!forgotId.includes('@')) {
            // Assume Username
            const { data: profile, error: profileErr } = await supabase
              .from('profiles')
              .select('email')
              .ilike('username', forgotId)
              .single();

            if (profileErr || !profile || !profile.email) {
              throw new Error("Could not find an account with that Username.");
            }
            email = profile.email;
          }

          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/login?type=recovery',
          });

          if (error) throw error;

          // Show Success State
          const msgTitle = document.getElementById('message-title');
          const msgDesc = document.getElementById('message-desc');
          const msgBtn = document.getElementById('message-action-btn');

          if (msgTitle) msgTitle.textContent = "LINK SENT";
          if (msgDesc) msgDesc.textContent = `A password recovery link has been sent to ${email}. Please check your inbox.`;
          if (msgBtn) {
            msgBtn.onclick = () => showState(loginState);
          }
          showState(messageState);
        } catch (err) {
          alert("Reset Request Error: " + err.message);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Send Reset Link";
          }
        }
      });
    }

    // Reset/update password form submission
    const resetForm = document.getElementById('reset-form');
    if (resetForm) {
      resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = resetForm.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Updating...";
        }

        const newPassword = document.getElementById('reset-password').value;
        const confirmPassword = document.getElementById('reset-password-confirm').value;

        if (newPassword !== confirmPassword) {
          alert("Passwords do not match!");
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Update Password";
          }
          return;
        }

        try {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) throw error;

          // Clear recovery query params
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);

          // Get fresh session to sync
          const { data: { session: freshSession } } = await supabase.auth.getSession();
          if (freshSession) {
            await syncSessionAndProfile(freshSession);
          }

          // Show Success State
          const msgTitle = document.getElementById('message-title');
          const msgDesc = document.getElementById('message-desc');
          const msgBtn = document.getElementById('message-action-btn');

          if (msgTitle) msgTitle.textContent = "PASSWORD UPDATED";
          if (msgDesc) msgDesc.textContent = "Your password has been successfully updated. You are now logged in.";
          if (msgBtn) {
            msgBtn.onclick = () => {
              window.location.href = '/index.html#passport-viewer';
            };
          }
          showState(messageState);
        } catch (err) {
          alert("Error updating password: " + err.message);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Update Password";
          }
        }
      });
    }

    // Handle check for Recovery state on page load
    const checkLoginPageRecovery = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
      const isRecovery = urlParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery' || window.location.hash.includes('type=recovery');

      if (isRecovery) {
        // Wait up to 6 seconds for session to establish
        let session = null;
        for (let i = 0; i < 24; i++) {
          const { data } = await supabase.auth.getSession();
          if (data && data.session) {
            session = data.session;
            break;
          }
          await new Promise(r => setTimeout(r, 250));
        }

        if (session) {
          showState(resetState);
        } else {
          alert("Could not establish a password reset session. Your token may have expired.");
          showState(loginState);
        }
      } else {
        showState(loginState);
      }
    };

    checkLoginPageRecovery();
  }

});
/* force redeploy Sun Jun 10 00:21:00 WAT 2026 */
