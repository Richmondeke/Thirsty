import re

with open('style.css', 'r') as f:
    content = f.read()

# Fix the invalid font-family inside @font-face
content = content.replace("font-family: 'Retron2000', monospace;", "font-family: 'Retron2000';")

with open('style.css', 'w') as f:
    f.write(content)

with open('index.html', 'r') as f:
    html = f.read()

# Cache bust style.css and main.js
html = html.replace('href="style.css?v=20260624.0615"', 'href="style.css?v=v3_fix"')
html = html.replace('src="main.js?v=20260624.0615"', 'src="main.js?v=v3_fix"')

with open('index.html', 'w') as f:
    f.write(html)

# Also fix sw.js to cache the new versions
with open('sw.js', 'r') as f:
    sw = f.read()

sw = sw.replace("const CACHE_NAME = 'thirsty-club-v2';", "const CACHE_NAME = 'thirsty-club-v3';")
with open('sw.js', 'w') as f:
    f.write(sw)
