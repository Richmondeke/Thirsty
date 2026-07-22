import re

with open('main.js', 'r') as f:
    content = f.read()

# Add the URL param check at the start of initComposioIntegrations
injection = """  const initComposioIntegrations = () => {
    // --- Mock OAuth Redirect Flow ---
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('auth');
    if (authCode === 'spotify') {
      localStorage.setItem('composio_spotify_connected', 'true');
      alert('SUCCESS: Spotify account linked!');
      window.history.replaceState({}, document.title, window.location.pathname);
      // Optional: switch back to the profile view if needed
    } else if (authCode === 'twitter') {
      localStorage.setItem('composio_twitter_connected', 'true');
      alert('SUCCESS: X account linked!');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
"""
content = content.replace("  const initComposioIntegrations = () => {", injection)

# Update Spotify onclick
spotify_old = """      spotifyBtn.onclick = () => {
        const nextState = localStorage.getItem('composio_spotify_connected') !== 'true';
        if (nextState) {
          alert('Connecting to Spotify...');
        }
        localStorage.setItem('composio_spotify_connected', nextState ? 'true' : 'false');
        updateSpotifyUI(nextState);
      };"""
spotify_new = """      spotifyBtn.onclick = () => {
        const nextState = localStorage.getItem('composio_spotify_connected') !== 'true';
        if (nextState) {
          spotifyBtn.innerHTML = 'REDIRECTING...';
          setTimeout(() => {
            window.location.href = window.location.pathname + '?auth=spotify';
          }, 800);
        } else {
          localStorage.setItem('composio_spotify_connected', 'false');
          updateSpotifyUI(false);
        }
      };"""
content = content.replace(spotify_old, spotify_new)

# Update Twitter onclick
twitter_old = """      twitterBtn.onclick = () => {
        const nextState = localStorage.getItem('composio_twitter_connected') !== 'true';
        if (nextState) {
          alert('Connecting to X...');
        }
        localStorage.setItem('composio_twitter_connected', nextState ? 'true' : 'false');
        updateTwitterUI(nextState);
      };"""
twitter_new = """      twitterBtn.onclick = () => {
        const nextState = localStorage.getItem('composio_twitter_connected') !== 'true';
        if (nextState) {
          twitterBtn.innerHTML = 'REDIRECTING...';
          setTimeout(() => {
            window.location.href = window.location.pathname + '?auth=twitter';
          }, 800);
        } else {
          localStorage.setItem('composio_twitter_connected', 'false');
          updateTwitterUI(false);
        }
      };"""
content = content.replace(twitter_old, twitter_new)

with open('main.js', 'w') as f:
    f.write(content)

print("OAuth flow implemented.")
