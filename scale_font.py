import os

css_append = """
/* --- Retron 2000 Scale Fix --- */
html {
  font-size: 12px !important; /* Scale down rems to fit the chunky pixel font */
}

/* Adjust components that might break */
.app-header-title {
  font-size: 1.1rem !important;
  line-height: 1.2;
}

.glitch-text {
  word-break: break-word;
}
"""

with open('style.css', 'a') as f:
    f.write(css_append)
print("Font scaling applied.")
