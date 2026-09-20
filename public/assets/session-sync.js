/**
 * KALAM FF PANEL - Robust Multi-Tier Session Persistence & Cross-Tab Sync Engine
 * Ensures users stay logged in across browser refreshes, tab closures, and page reloads.
 */
(function() {
  'use strict';

  var STORAGE_KEY_USER = 'kalam_auth_user';
  var STORAGE_KEY_TOKEN = 'kalam_session_token';
  var STORAGE_KEY_BALANCE = 'kalam_wallet_balance';
  var STORAGE_KEY_LAST_ACTIVE = 'kalam_session_last_active';
  var COOKIE_NAME_SESSION = 'kalam_auth_session';
  var COOKIE_NAME_TOKEN = 'kalam_session_token';
  var CHANNEL_NAME = 'kalam_auth_broadcast';

  var broadcastChannel = null;
  try {
    if (typeof window.BroadcastChannel === 'function') {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    }
  } catch (e) {}

  // Helper: Read Cookie by Name
  function getCookie(name) {
    try {
      var match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
      return match ? decodeURIComponent(match[1]) : null;
    } catch (e) {
      return null;
    }
  }

  // Helper: Set Persistent Cookie (30 Days)
  function setCookie(name, value, days) {
    try {
      var d = days || 30;
      var expires = new Date(Date.now() + d * 24 * 60 * 60 * 1000).toUTCString();
      var isHttps = window.location.protocol === 'https:';
      var cookieStr = name + '=' + encodeURIComponent(value) + '; path=/; expires=' + expires + '; SameSite=Lax' + (isHttps ? '; Secure' : '');
      document.cookie = cookieStr;
    } catch (e) {}
  }

  // Helper: Delete Cookie
  function deleteCookie(name) {
    try {
      document.cookie = name + '=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    } catch (e) {}
  }

  // Helper: Safely parse JSON
  function safeJsonParse(str) {
    if (!str || typeof str !== 'string') return null;
    try {
      return JSON.parse(str);
    } catch (e) {
      return null;
    }
  }

  // 1. Session Restoration Engine on Startup
  function restoreSessionFromAllTiers() {
    try {
      var localUserStr = localStorage.getItem(STORAGE_KEY_USER);
      var localUser = safeJsonParse(localUserStr);

      var sessionUserStr = sessionStorage.getItem(STORAGE_KEY_USER);
      var sessionUser = safeJsonParse(sessionUserStr);

      var cookieUserStr = getCookie(COOKIE_NAME_SESSION);
      var cookieUser = safeJsonParse(cookieUserStr);

      var resolvedUser = localUser || sessionUser || cookieUser;

      if (resolvedUser && resolvedUser.id) {
        // Sync to all tiers if missing in any
        if (!localUser) {
          try { localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(resolvedUser)); } catch (e) {}
        }
        if (!sessionUser) {
          try { sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(resolvedUser)); } catch (e) {}
        }
        if (!cookieUser) {
          setCookie(COOKIE_NAME_SESSION, JSON.stringify(resolvedUser), 30);
        }

        // Restore balance if available
        if (typeof resolvedUser.balance === 'number') {
          try { localStorage.setItem(STORAGE_KEY_BALANCE, resolvedUser.balance.toString()); } catch (e) {}
        }

        try { localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, Date.now().toString()); } catch (e) {}

        // Verify with server in background
        verifyServerSession(resolvedUser);
      } else {
        // Check if server has an active session for us via cookie
        fetchServerSession();
      }
    } catch (err) {
      console.warn('[SessionSync] Error during session restoration:', err);
    }
  }

  // 2. Fetch Active Session from Server
  function fetchServerSession() {
    try {
      fetch('/api/auth/session', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      })
      .then(function(res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function(data) {
        if (data && data.success && data.user) {
          var u = data.user;
          try {
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(u));
            sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(u));
            if (typeof u.balance === 'number') {
              localStorage.setItem(STORAGE_KEY_BALANCE, u.balance.toString());
            }
            setCookie(COOKIE_NAME_SESSION, JSON.stringify(u), 30);
            if (data.sessionId) {
              setCookie(COOKIE_NAME_TOKEN, data.sessionId, 30);
              localStorage.setItem(STORAGE_KEY_TOKEN, data.sessionId);
            }
          } catch (e) {}
        }
      })
      .catch(function() {});
    } catch (e) {}
  }

  // 3. Verify / Sync Active User with Server
  function verifyServerSession(user) {
    if (!user || !user.id) return;
    try {
      fetch('/api/auth/login-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
        credentials: 'same-origin'
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data && data.success && data.user) {
          if (typeof data.user.balance === 'number') {
            try { localStorage.setItem(STORAGE_KEY_BALANCE, data.user.balance.toString()); } catch (e) {}
          }
          if (data.sessionId) {
            setCookie(COOKIE_NAME_TOKEN, data.sessionId, 30);
            try { localStorage.setItem(STORAGE_KEY_TOKEN, data.sessionId); } catch (e) {}
          }
        }
      })
      .catch(function() {});
    } catch (e) {}
  }

  // 4. Hook Storage Prototype for Transparent Auto-Syncing
  try {
    var originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, val) {
      var result = originalSetItem.apply(this, arguments);
      if (key === STORAGE_KEY_USER) {
        try {
          var userObj = safeJsonParse(val);
          if (userObj && userObj.id) {
            // Mirror to sessionStorage & Cookie
            if (this === localStorage) {
              sessionStorage.setItem(STORAGE_KEY_USER, val);
            } else {
              localStorage.setItem(STORAGE_KEY_USER, val);
            }
            setCookie(COOKIE_NAME_SESSION, val, 30);
            localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, Date.now().toString());

            // Notify server
            verifyServerSession(userObj);

            // Broadcast to other open tabs
            if (broadcastChannel) {
              broadcastChannel.postMessage({ type: 'AUTH_LOGIN', user: userObj });
            }
          }
        } catch (e) {}
      } else if (key === STORAGE_KEY_BALANCE) {
        if (broadcastChannel) {
          broadcastChannel.postMessage({ type: 'BALANCE_UPDATED', balance: val });
        }
      }
      return result;
    };

    var originalRemoveItem = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function(key) {
      var result = originalRemoveItem.apply(this, arguments);
      if (key === STORAGE_KEY_USER) {
        try {
          if (this === localStorage) {
            sessionStorage.removeItem(STORAGE_KEY_USER);
          } else {
            localStorage.removeItem(STORAGE_KEY_USER);
          }
          deleteCookie(COOKIE_NAME_SESSION);
          deleteCookie(COOKIE_NAME_TOKEN);
          localStorage.removeItem(STORAGE_KEY_TOKEN);
          localStorage.removeItem(STORAGE_KEY_LAST_ACTIVE);

          // Inform server of logout
          fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(function() {});

          // Broadcast logout to all tabs
          if (broadcastChannel) {
            broadcastChannel.postMessage({ type: 'AUTH_LOGOUT' });
          }
        } catch (e) {}
      }
      return result;
    };
  } catch (e) {}

  // 5. Cross-Tab Synchronization Listeners
  if (broadcastChannel) {
    broadcastChannel.onmessage = function(ev) {
      try {
        var msg = ev.data;
        if (!msg) return;
        if (msg.type === 'AUTH_LOGIN' && msg.user) {
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(msg.user));
          sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(msg.user));
        } else if (msg.type === 'AUTH_LOGOUT') {
          localStorage.removeItem(STORAGE_KEY_USER);
          sessionStorage.removeItem(STORAGE_KEY_USER);
          deleteCookie(COOKIE_NAME_SESSION);
          deleteCookie(COOKIE_NAME_TOKEN);
        } else if (msg.type === 'BALANCE_UPDATED' && msg.balance !== undefined) {
          localStorage.setItem(STORAGE_KEY_BALANCE, msg.balance.toString());
        }
      } catch (e) {}
    };
  }

  window.addEventListener('storage', function(e) {
    if (e.key === STORAGE_KEY_USER) {
      if (e.newValue) {
        setCookie(COOKIE_NAME_SESSION, e.newValue, 30);
      } else {
        deleteCookie(COOKIE_NAME_SESSION);
        deleteCookie(COOKIE_NAME_TOKEN);
      }
    }
  });

  // 6. Sliding Expiration on Active User Interaction
  var lastTouchTime = 0;
  function onUserActive() {
    var now = Date.now();
    if (now - lastTouchTime > 60000) { // Throttle touch to once per minute
      lastTouchTime = now;
      try {
        localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, now.toString());
        var user = safeJsonParse(localStorage.getItem(STORAGE_KEY_USER));
        if (user) {
          setCookie(COOKIE_NAME_SESSION, JSON.stringify(user), 30);
        }
      } catch (e) {}
    }
  }

  window.addEventListener('click', onUserActive, { passive: true });
  window.addEventListener('keydown', onUserActive, { passive: true });
  window.addEventListener('touchstart', onUserActive, { passive: true });

  // Run restoration on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restoreSessionFromAllTiers);
  } else {
    restoreSessionFromAllTiers();
  }

  // Also verify when window regains focus (e.g. returning from another tab or after sleep)
  window.addEventListener('focus', function() {
    restoreSessionFromAllTiers();
  });

  // Export global helper for manual programmatic refresh
  window.KalamSession = {
    sync: restoreSessionFromAllTiers,
    getUser: function() {
      return safeJsonParse(localStorage.getItem(STORAGE_KEY_USER)) || safeJsonParse(getCookie(COOKIE_NAME_SESSION));
    },
    logout: function() {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  };
})();
