import os

css_append = """
/* --- Extra PWA and Cutoff Fixes --- */
.app-header, .mobile-app-container {
  padding-top: env(safe-area-inset-top);
}
.app-bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
}

@media (max-width: 768px) {
  .hero-content h1 {
    font-size: 8vw !important;
    word-break: break-word;
    max-width: 95%;
    margin: 0 auto;
  }
}

@media (max-width: 480px) {
  .hero-content h1 {
    font-size: 10vw !important;
    word-break: break-word;
  }
  .app-header {
    height: calc(70px + env(safe-area-inset-top));
    padding-top: env(safe-area-inset-top);
  }
}
"""

with open('style.css', 'a') as f:
    f.write(css_append)
print("PWA CSS applied.")
