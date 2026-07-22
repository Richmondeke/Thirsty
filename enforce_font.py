import re

with open('style.css', 'r') as f:
    content = f.read()

# Remove fontshare import
content = re.sub(r"@import url\('https://api\.fontshare\.com[^']+'\);", "", content)

# Remove all font-family declarations except inside @font-face
# First, protect @font-face
font_faces = []
def save_font_face(match):
    font_faces.append(match.group(0))
    return f"/* FONT_FACE_PLACEHOLDER_{len(font_faces)-1} */"

content = re.sub(r"@font-face\s*\{[^}]+\}", save_font_face, content)

# Now remove all font-family declarations
content = re.sub(r"font-family:[^;]+;", "", content)

# Put @font-face back
for i, ff in enumerate(font_faces):
    content = content.replace(f"/* FONT_FACE_PLACEHOLDER_{i} */", ff)

# Add global font and text-transform to body and inputs
global_styles = """
body, input, button, textarea, select, .mobile-app-container, .app-header-title {
  font-family: 'Retron2000', monospace !important;
  text-transform: uppercase !important;
}

/* Exclude icon fonts from the override if necessary */
i[class^="ph"], i[class*=" ph"] {
  font-family: "Phosphor" !important;
  text-transform: none !important;
}
"""

content += "\n" + global_styles

with open('style.css', 'w') as f:
    f.write(content)
print("Font enforced globally.")
