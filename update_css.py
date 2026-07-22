import re

with open('style.css', 'r') as f:
    content = f.read()

# Add Retron2000 font-face at the top
if 'Retron2000' not in content:
    font_face = """@font-face {
  font-family: 'Retron2000';
  src: url('Retron2000.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}
"""
    content = content.replace("/* --- Fonts Load --- */", "/* --- Fonts Load --- */\n" + font_face)

# Replace other fonts
content = re.sub(r"font-family:\s*['\"]?(Satoshi|Kyrilla)['\"]?.*?;", "font-family: 'Retron2000', monospace;", content)
# Ensure the body uses it
content = re.sub(r"font-family:\s*.*?sans-serif;", "font-family: 'Retron2000', monospace;", content)

# Fix community tabs wrapping
content = content.replace(""".community-subtabs {
  display: flex;
  flex-wrap: wrap;""", """.community-subtabs {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 8px;""")

with open('style.css', 'w') as f:
    f.write(content)
print("CSS updated for font and community tabs.")
