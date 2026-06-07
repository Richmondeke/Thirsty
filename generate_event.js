const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

// Find start indices of key sections in index.html
const headerStart = html.indexOf('<header>');
const lineupStart = html.indexOf('<section class="lineup-section" id="lineup">');
const galleryStart = html.indexOf('<section class="gallery-section" id="gallery">');
const galleryEnd = html.indexOf('<section class="passport-section" id="rsvp">');
const footerStart = html.indexOf('<footer>');

console.log('headerStart:', headerStart);
console.log('lineupStart:', lineupStart);
console.log('galleryStart:', galleryStart);
console.log('galleryEnd:', galleryEnd);
console.log('footerStart:', footerStart);

if (headerStart === -1 || lineupStart === -1 || galleryStart === -1 || galleryEnd === -1 || footerStart === -1) {
  console.error("Error: Could not find one of the required sections in index.html");
  process.exit(1);
}

// 1. Everything up to <header>
let newHtml = html.substring(0, headerStart);

// 2. Custom header and simplified hero section for event.html
newHtml += `
  <header>
    <a href="index.html" class="logo">THIRSTYCLUB<span id="logo-counter">999</span></a>
    <button class="mobile-nav-toggle" id="mobile-nav-toggle" aria-label="Toggle navigation">
      <span class="bar"></span>
      <span class="bar"></span>
      <span class="bar"></span>
    </button>
    <nav id="nav-menu">
      <a href="index.html" class="nav-btn members-white">Back to Dashboard</a>
    </nav>
  </header>

  <main>
    <!-- Hero Section -->
    <section class="hero" id="home">
      <video class="hero-bg-video" autoplay loop muted playsinline style="object-fit: cover; opacity: 0.85;">
        <source src="images/Tiger2.mp4" type="video/mp4">
      </video>
      <div class="hero-video-overlay"></div>
      <div class="hero-corner-vignette"></div>
      <div class="hero-overlay"></div>
      
      <div class="hero-content">
        <h1 class="glitch-text">THIRSTYCLUB<span id="hero-counter">999</span></h1>
        <p class="hero-subtitle">JUNE 14TH 2026, LAGOS</p>
      </div>
    </section>
`;

// 3. Lineup and Gallery sections from index.html
newHtml += html.substring(lineupStart, galleryStart);
newHtml += html.substring(galleryStart, galleryEnd);

// 4. Venue section
const venueSection = fs.readFileSync('/tmp/venue_section.html', 'utf8');
newHtml += venueSection;

// 5. Footer, Modals, and scripts from index.html (excluding </body></html> from index.html)
let footerContent = html.substring(footerStart);
// Strip closing tags if they exist at the end of index.html, since we will append them cleanly
const closingBodyIndex = footerContent.indexOf('</body>');
if (closingBodyIndex !== -1) {
  footerContent = footerContent.substring(0, closingBodyIndex);
}

newHtml += footerContent;

// 6. Close tags and event.html specific scripts (GSAP, etc.)
newHtml += `
    <!-- GSAP for Animations -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>

    <script>
      gsap.registerPlugin(ScrollTrigger);

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
