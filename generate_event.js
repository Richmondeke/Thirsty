const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

// We want to extract:
// 1. Everything up to the <header>
// 2. The header, but we replace the nav
// 3. The hero background and logo overlay
// 4. The lineup section
// 5. The gallery section
// 6. The venue section (read from /tmp/venue_section.html)
// 7. The footer and the end of the file

let newHtml = html.substring(0, html.indexOf('<header class="site-header">'));

newHtml += `
    <header class="site-header">
      <div class="header-container">
        <a href="index.html" class="logo" style="text-decoration: none;">THIRSTYCLUB<span class="accent">999</span></a>
        
        <!-- Desktop Nav -->
        <nav class="desktop-nav">
          <ul class="nav-list">
            <li><a href="index.html" class="nav-link">Back to Dashboard</a></li>
          </ul>
        </nav>

        <!-- Mobile Menu Toggle -->
        <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Toggle menu">
          <span class="hamburger-box">
            <span class="hamburger-inner"></span>
          </span>
        </button>
      </div>
    </header>

    <!-- Mobile Nav -->
    <div class="mobile-nav-overlay" id="mobile-nav-overlay">
      <nav class="mobile-nav-menu">
        <ul class="mobile-nav-list">
          <li><a href="index.html" class="mobile-nav-link">Back to Dashboard</a></li>
        </ul>
      </nav>
    </div>

    <!-- Hero Section -->
    <section class="hero" id="home">
      <!-- Looping Concert Background Video -->
      <video class="hero-bg-video" autoplay loop muted playsinline>
        <source src="images/Tiger2.mp4" type="video/mp4">
      </video>
      <div class="hero-video-overlay"></div>
      
      <!-- Vignette at both top and bottom -->
      <div class="vignette-top-bottom"></div>

      <!-- Hero Content (Logged Out State - Default) -->
      <div class="hero-logo-overlay">
        <h1 class="hero-main-title">THIRSTYCLUB<span class="accent">999</span></h1>
        <p class="hero-subtitle">JUNE 14TH 2026, LAGOS</p>
      </div>
    </section>
`;

const lineupStart = html.indexOf('<section class="lineup-section" id="lineup">');
const galleryStart = html.indexOf('<section class="gallery-section" id="gallery">');
const galleryEnd = html.indexOf('<section class="rsvp-section" id="rsvp">'); // The section after gallery

newHtml += html.substring(lineupStart, galleryStart);
newHtml += html.substring(galleryStart, galleryEnd);

// Venue section
const venueSection = fs.readFileSync('/tmp/venue_section.html', 'utf8');
newHtml += venueSection;

const footerStart = html.indexOf('<footer class="site-footer">');
newHtml += html.substring(footerStart, html.indexOf('</body>'));

newHtml += `
    <!-- GSAP for Animations -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>

    <script>
      gsap.registerPlugin(ScrollTrigger);

      // Mobile Menu Toggle
      const mobileBtn = document.getElementById('mobile-menu-btn');
      const mobileNav = document.getElementById('mobile-nav-overlay');
      const mobileLinks = document.querySelectorAll('.mobile-nav-link');

      if (mobileBtn && mobileNav) {
        mobileBtn.addEventListener('click', () => {
          mobileBtn.classList.toggle('active');
          mobileNav.classList.toggle('active');
          document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
        });

        mobileLinks.forEach(link => {
          link.addEventListener('click', () => {
            mobileBtn.classList.remove('active');
            mobileNav.classList.remove('active');
            document.body.style.overflow = '';
          });
        });
      }

      // Parallax text in lineup
      gsap.to('.marquee-text', {
        xPercent: -50,
        ease: 'none',
        scrollTrigger: {
          trigger: '.lineup-section',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1
        }
      });

      gsap.to('.marquee-text.reverse', {
        xPercent: 50,
        ease: 'none',
        scrollTrigger: {
          trigger: '.lineup-section',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1
        }
      });

      // Gallery Accordion logic
      const panels = document.querySelectorAll('.gallery-panel');
      if (panels.length > 0) {
        panels.forEach(panel => {
          panel.addEventListener('mouseenter', () => {
            panels.forEach(p => p.classList.remove('active'));
            panel.classList.add('active');
          });
          panel.addEventListener('click', () => {
            if (panel.classList.contains('active') && window.innerWidth <= 768) {
              panel.classList.remove('active');
            } else {
              panels.forEach(p => p.classList.remove('active'));
              panel.classList.add('active');
            }
          });
        });
      }
    </script>
</body>
</html>
`;

fs.writeFileSync('event.html', newHtml);
console.log('event.html generated successfully.');
