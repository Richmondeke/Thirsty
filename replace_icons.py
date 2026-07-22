import re

with open('index.html', 'r') as f:
    content = f.read()

if '@phosphor-icons' not in content:
    content = content.replace('</head>', '  <script src="https://unpkg.com/@phosphor-icons/web"></script>\n</head>')

def replace_svg(match):
    full_str = match.group(0)
    if 'view-homepage' in full_str:
        icon = '<i class="ph ph-house" style="font-size: 1.4rem;"></i>'
    elif 'view-community' in full_str:
        icon = '<i class="ph ph-users" style="font-size: 1.4rem;"></i>'
    elif 'view-wearthirsty' in full_str:
        icon = '<i class="ph ph-shopping-bag" style="font-size: 1.4rem;"></i>'
    elif 'view-profile' in full_str:
        icon = '<i class="ph ph-user" style="font-size: 1.4rem;"></i>'
    elif 'view-admin' in full_str:
        icon = '<i class="ph ph-shield-star" style="font-size: 1.4rem;"></i>'
    else:
        return full_str
    
    # only replace first svg to avoid nesting issues if any, but dotall is fine
    return re.sub(r'<svg.*?</svg>', icon, full_str, count=1, flags=re.DOTALL)

content = re.sub(r'<button class="nav-tab-item"[^>]*>.*?</button>', replace_svg, content, flags=re.DOTALL)

content = re.sub(r'<button class="header-icon-btn" id="header-cart-btn"[^>]*>.*?<span class="cart-badge-count"[^>]*>.*?</span>\s*<svg.*?</svg>\s*</button>', r'<button class="header-icon-btn" id="header-cart-btn" title="Shopping Cart" style="position: relative;">\n              <span class="cart-badge-count" id="header-cart-count" style="display: none; position: absolute; top: -5px; right: -5px; background: var(--accent-color); color: #fff; font-size: 0.65rem; font-weight: 900; width: 15px; height: 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; line-height: 1;">0</span>\n              <i class="ph ph-shopping-cart" style="font-size: 1.5rem;"></i>\n            </button>', content, flags=re.DOTALL)

content = re.sub(r'<button class="header-icon-btn" id="header-notif-btn"[^>]*>.*?<span class="notif-badge-dot">.*?</span>\s*<svg.*?</svg>\s*</button>', r'<button class="header-icon-btn" id="header-notif-btn" title="Notifications">\n              <span class="notif-badge-dot"></span>\n              <i class="ph ph-bell" style="font-size: 1.5rem;"></i>\n            </button>', content, flags=re.DOTALL)

content = re.sub(r'<button class="header-back-btn" id="app-header-back"[^>]*>.*?<svg.*?</svg>\s*</button>', r'<button class="header-back-btn" id="app-header-back" style="visibility: hidden; display: none;">\n                <i class="ph ph-caret-left" style="font-size: 1.5rem;"></i>\n              </button>', content, flags=re.DOTALL)

with open('index.html', 'w') as f:
    f.write(content)
print("Icons replaced.")
