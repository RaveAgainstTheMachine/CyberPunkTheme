/* ============================================================================
   CYBERPUNK 2077 // NIGHT CITY NETRUNNER HUD - FRIENDS PANEL, RESIZER & PLAYBAR TELEMETRY
   ============================================================================ */

(function () {
  const MAIN_ROW_SELECTOR = '.RGNMWtyj73_-WdhflrmuY, ._1rDh5rXSFZJOqCa4UpnI4z ._3xRRJfD2xy95i9NhJxLTp0';
  const GAMES_PANEL_SELECTOR = '._9sPoVBFyE_vE87mnZJ5aB';
  const GAMES_RESIZER_SELECTOR = '._276E6ijBpjMA2_iTxNhhjc';
  const PLAYBAR_STATS_SELECTOR = '._3Y87YQY56ZCOqhgcZFaDc5 ._1mDAVT4sTzFRwJtlKCw2Ws';

  let searchQuery = '';
  const collapsedSections = {
    ingame: false,
    online: false,
    offline: true,
  };

  function getFriendsApp() {
    try {
      return (
        window.g_FriendsUIApp ||
        (window.opener && window.opener.g_FriendsUIApp) ||
        (window.parent && window.parent.g_FriendsUIApp) ||
        null
      );
    } catch (e) {
      return null;
    }
  }

  function openFriendChat(friend) {
    const app = getFriendsApp();
    if (!app || !friend) return;
    try {
      const ctx = app.GetDefaultBrowserContext ? app.GetDefaultBrowserContext() : undefined;
      if (app.UIStore && typeof app.UIStore.ShowFriendChatDialogWhenReady === 'function') {
        app.UIStore.ShowFriendChatDialogWhenReady(ctx, friend.accountid, true, true);
      } else if (typeof app.ShowFriendChatDialog === 'function') {
        app.ShowFriendChatDialog(ctx, friend.accountid, true);
      } else if (typeof friend.OpenChatDialog === 'function') {
        friend.OpenChatDialog(ctx);
      }
    } catch (err) {
      console.error('[CyberpunkHUD] Failed to open friend chat:', err);
    }
  }

  function openFriendsPopup() {
    const app = getFriendsApp();
    try {
      if (app && app.UIStore && typeof app.UIStore.ShowPopupFriendsList === 'function') {
        const ctx = app.GetDefaultBrowserContext ? app.GetDefaultBrowserContext() : undefined;
        app.UIStore.ShowPopupFriendsList(ctx, false, true);
      } else if (window.SteamClient && window.SteamClient.URL) {
        window.SteamClient.URL.ExecuteSteamURL('steam://open/friends');
      }
    } catch (err) {
      console.error('[CyberpunkHUD] Failed to open friends popup:', err);
    }
  }

  function getStatusClass(friend) {
    const p = friend && friend.persona;
    if (!p) return 'offline';
    if (p.is_ingame) return 'ingame';
    if (p.is_online) return 'online';
    return 'offline';
  }

  function getStatusLabel(friend) {
    const p = friend && friend.persona;
    if (!p) return 'OFFLINE';
    if (p.is_ingame) {
      return friend.current_game_name || p.m_strGameExtraInfo || 'IN-GAME';
    }
    if (p.is_online) {
      if (p.is_awayOrSnooze || p.m_ePersonaState === 3) return 'AWAY';
      if (p.m_ePersonaState === 4) return 'SNOOZE';
      if (p.m_ePersonaState === 2) return 'BUSY';
      return 'ONLINE';
    }
    return 'OFFLINE';
  }

  function getAvatarUrl(friend) {
    const p = friend && friend.persona;
    return (
      (p && (p.avatar_url_medium || p.avatar_url)) ||
      'https://avatars.akamai.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_medium.jpg'
    );
  }

  let listContainerEl = null;
  let selfNameEl = null;
  let selfStatusEl = null;
  let selfAvatarEl = null;

  function createPanelDOM() {
    const resizer = document.createElement('div');
    resizer.id = 'cp-friends-resizer';

    const panel = document.createElement('div');
    panel.id = 'cp-friends-panel';

    const savedWidth = localStorage.getItem('cp_friends_panel_width');
    if (savedWidth) {
      panel.style.width = savedWidth + 'px';
    }

    // Header
    const header = document.createElement('div');
    header.className = 'cp-fp-header';

    const selfRow = document.createElement('div');
    selfRow.className = 'cp-fp-self';

    const avatarWrap = document.createElement('div');
    avatarWrap.className = 'cp-fp-avatar-wrap';
    selfAvatarEl = document.createElement('img');
    selfAvatarEl.className = 'cp-fp-avatar online';
    selfAvatarEl.src = 'https://avatars.akamai.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_medium.jpg';
    avatarWrap.appendChild(selfAvatarEl);

    const selfInfo = document.createElement('div');
    selfInfo.className = 'cp-fp-self-info';
    selfNameEl = document.createElement('div');
    selfNameEl.className = 'cp-fp-self-name';
    selfNameEl.textContent = 'NETRUNNER';
    selfStatusEl = document.createElement('div');
    selfStatusEl.className = 'cp-fp-self-status';
    selfStatusEl.textContent = '// LINK ESTABLISHED';
    selfInfo.appendChild(selfNameEl);
    selfInfo.appendChild(selfStatusEl);

    const popoutBtn = document.createElement('button');
    popoutBtn.className = 'cp-fp-popout-btn';
    popoutBtn.textContent = 'CHAT';
    popoutBtn.title = 'Open Full Friends & Chat Window';
    popoutBtn.addEventListener('click', openFriendsPopup);

    selfRow.appendChild(avatarWrap);
    selfRow.appendChild(selfInfo);
    selfRow.appendChild(popoutBtn);

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'cp-fp-search';
    searchInput.placeholder = 'FILTER NETRUNNERS...';
    searchInput.value = searchQuery;
    searchInput.addEventListener('input', (e) => {
      searchQuery = (e.target.value || '').trim().toLowerCase();
      renderFriendsList();
    });

    header.appendChild(selfRow);
    header.appendChild(searchInput);

    listContainerEl = document.createElement('div');
    listContainerEl.className = 'cp-fp-list';

    panel.appendChild(header);
    panel.appendChild(listContainerEl);

    setupFriendsResizer(resizer, panel);

    return { resizer, panel };
  }

  function renderFriendsList() {
    if (!listContainerEl) return;
    const app = getFriendsApp();
    const friendStore = app && app.FriendStore;
    if (!friendStore) {
      listContainerEl.innerHTML =
        '<div style="padding:12px;font-family:var(--cp-font-mono, \'Share Tech Mono\', monospace);font-size:11px;color:#64748b;">// CONNECTING TO NEURAL NET...</div>';
      return;
    }

    // Update Self Header
    const self = friendStore.self;
    if (self) {
      if (selfNameEl) selfNameEl.textContent = self.display_name || 'NETRUNNER';
      if (selfStatusEl) selfStatusEl.textContent = '// ' + getStatusLabel(self);
      if (selfAvatarEl) {
        selfAvatarEl.src = getAvatarUrl(self);
        selfAvatarEl.className = 'cp-fp-avatar ' + getStatusClass(self);
      }
    }

    const allFriends = Array.from(friendStore.all_friends || []);
    const filtered = searchQuery
      ? allFriends.filter((f) => {
          const name = (
            (f.display_name || '') +
            ' ' +
            (f.nickname || '') +
            ' ' +
            (f.current_game_name || '')
          ).toLowerCase();
          return name.includes(searchQuery);
        })
      : allFriends;

    const ingame = [];
    const online = [];
    const offline = [];

    for (const f of filtered) {
      if (!f || !f.persona) continue;
      if (f.persona.is_ingame) ingame.push(f);
      else if (f.persona.is_online) online.push(f);
      else offline.push(f);
    }

    const sortByName = (a, b) => (a.display_name || '').localeCompare(b.display_name || '');
    ingame.sort(sortByName);
    online.sort(sortByName);
    offline.sort(sortByName);

    listContainerEl.innerHTML = '';

    const sections = [
      { key: 'ingame', title: `// IN-GAME [${ingame.length}]`, items: ingame, cls: 'ingame' },
      { key: 'online', title: `// ONLINE [${online.length}]`, items: online, cls: 'online' },
      { key: 'offline', title: `// OFFLINE [${offline.length}]`, items: offline, cls: 'offline' },
    ];

    for (const sec of sections) {
      const headerEl = document.createElement('div');
      headerEl.className = `cp-fp-section-header ${sec.cls}`;
      const isCollapsed = collapsedSections[sec.key] && !searchQuery;
      headerEl.innerHTML = `<span>${sec.title}</span><span>${isCollapsed ? '[+]' : '[-]'}</span>`;
      headerEl.addEventListener('click', () => {
        collapsedSections[sec.key] = !collapsedSections[sec.key];
        renderFriendsList();
      });
      listContainerEl.appendChild(headerEl);

      if (!isCollapsed) {
        for (const friend of sec.items) {
          const row = document.createElement('div');
          row.className = `cp-fp-item ${sec.cls}`;

          const avatar = document.createElement('img');
          avatar.className = `cp-fp-avatar ${sec.cls}`;
          avatar.src = getAvatarUrl(friend);
          avatar.loading = 'lazy';

          const info = document.createElement('div');
          info.className = 'cp-fp-item-info';

          const name = document.createElement('div');
          name.className = 'cp-fp-item-name';
          name.textContent = friend.nickname
            ? `${friend.display_name} (${friend.nickname})`
            : friend.display_name;

          const sub = document.createElement('div');
          sub.className = 'cp-fp-item-sub';
          sub.textContent = getStatusLabel(friend);

          info.appendChild(name);
          info.appendChild(sub);

          row.appendChild(avatar);
          row.appendChild(info);

          row.addEventListener('click', () => openFriendChat(friend));
          listContainerEl.appendChild(row);
        }
      }
    }
  }

  /** Attach drag move/end listeners with blur and zero-button guards for X11/Wayland edge releases. */
  function bindDragLifecycle(isActive, onMove, onEnd) {
    const finish = () => {
      if (!isActive()) return;
      onEnd();
    };
    document.addEventListener('mousemove', (e) => {
      if (!isActive()) return;
      if (e.buttons === 0) {
        finish();
        return;
      }
      onMove(e);
    });
    document.addEventListener('mouseup', finish);
    window.addEventListener('blur', finish);
  }

  function setupFriendsResizer(resizer, panel) {
    let isResizing = false;
    let startX = 0;
    let startWidth = 270;
    let direction = -1;

    resizer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing = true;
      resizer.classList.add('cp-resizing');
      startX = e.clientX;
      startWidth = panel.getBoundingClientRect().width;

      const parentRect = panel.parentElement
        ? panel.parentElement.getBoundingClientRect()
        : { left: 0, width: window.innerWidth };
      const panelRect = panel.getBoundingClientRect();
      const isOnLeft = panelRect.left + panelRect.width / 2 < parentRect.left + parentRect.width / 2;
      direction = isOnLeft ? 1 : -1;
    });

    bindDragLifecycle(
      () => isResizing,
      (e) => {
        const dx = (e.clientX - startX) * direction;
        const newWidth = Math.max(210, Math.min(480, startWidth + dx));
        panel.style.width = newWidth + 'px';
      },
      () => {
        isResizing = false;
        resizer.classList.remove('cp-resizing');
        localStorage.setItem('cp_friends_panel_width', parseInt(panel.style.width, 10));
      }
    );
  }

  function setupBidirectionalGamesResizer() {
    const gamesPanel = document.querySelector(GAMES_PANEL_SELECTOR);
    const gamesResizer = document.querySelector(GAMES_RESIZER_SELECTOR);
    if (!gamesPanel || !gamesResizer || gamesResizer.dataset.cpPatched) return;
    gamesResizer.dataset.cpPatched = 'true';

    let isResizing = false;
    let startX = 0;
    let startWidth = 272;
    let direction = 1;

    gamesResizer.addEventListener(
      'mousedown',
      (e) => {
        const parentRect = gamesPanel.parentElement
          ? gamesPanel.parentElement.getBoundingClientRect()
          : { left: 0, width: window.innerWidth };
        const panelRect = gamesPanel.getBoundingClientRect();
        const isOnLeft = panelRect.left + panelRect.width / 2 < parentRect.left + parentRect.width / 2;
        if (isOnLeft) return; // Native Steam handler handles left-side resizing

        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        startX = e.clientX;
        startWidth = panelRect.width;
        direction = -1;
      },
      true
    );

    bindDragLifecycle(
      () => isResizing,
      (e) => {
        const dx = (e.clientX - startX) * direction;
        const newWidth = Math.max(240, Math.min(window.innerWidth * 0.45, startWidth + dx));
        gamesPanel.style.width = newWidth + 'px';
      },
      () => {
        isResizing = false;
      }
    );
  }

  /* ==========================================================================
     GAME PAGE PLAY BAR TELEMETRY (ACHIEVEMENTS, PLAYERS // 7D PEAK, SIZE ON DISK)
     ========================================================================== */

  const playerStatsCache = new Map(); // appId -> { current, peak7d, ts, fetching }
  const CACHE_TTL_MS = 5 * 60 * 1000;
  const RETRY_FAIL_MS = 20 * 1000;
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const CHARTS_CACHE_KEY = 'cp_steamcharts_top_cache_v1';
  const PEAK_HISTORY_KEY = 'cp_peak7d_history_v1';
  let topChartsCache = { ts: 0, promise: null, byAppId: new Map() };

  function getFiber(el) {
    if (!el) return null;
    const key = Object.keys(el).find((k) => k.startsWith('__reactFiber'));
    return key ? el[key] : null;
  }

  function getCurrentGameContext(playBarStatsEl) {
    let appId = null;
    let overview = null;
    let details = null;
    let achievements = null;

    // 1. Walk up React Fiber from PlayBar
    try {
      let fiber = getFiber(playBarStatsEl);
      let depth = 0;
      while (fiber && depth < 45) {
        const props = fiber.memoizedProps;
        if (props) {
          if (!overview && props.overview && props.overview.appid) {
            overview = props.overview;
            appId = Number(props.overview.appid);
          }
          if (!details && props.details) {
            details = props.details;
          }
          if (!achievements && props.achievements) {
            achievements = props.achievements;
          }
          if (!appId && (props.appid || props.nAppID)) {
            appId = Number(props.appid || props.nAppID);
          }
        }
        fiber = fiber.return;
        depth++;
      }
    } catch (e) {}

    // 2. Fallback: URL pathname or Hero Image asset path
    if (!appId) {
      try {
        const loc =
          (window.MainWindowBrowserManager && window.MainWindowBrowserManager.m_lastLocation) ||
          (window.opener &&
            window.opener.MainWindowBrowserManager &&
            window.opener.MainWindowBrowserManager.m_lastLocation);
        if (loc && loc.pathname) {
          const m = loc.pathname.match(/\/app\/(\d+)/);
          if (m) appId = parseInt(m[1], 10);
        }
      } catch (e) {}
    }

    if (!appId) {
      const heroImg = document.querySelector('.NZMJ6g2iVnFsOOp-lDmIP img[src*="/assets/"]');
      if (heroImg && heroImg.src) {
        const m = heroImg.src.match(/\/assets\/(\d+)/);
        if (m) appId = parseInt(m[1], 10);
      }
    }

    // 3. Query Steam internal stores (appStore & appDetailsStore)
    if (appId) {
      try {
        const appStore = window.appStore || (window.opener && window.opener.appStore);
        if (!overview && appStore && typeof appStore.GetAppOverviewByAppID === 'function') {
          overview = appStore.GetAppOverviewByAppID(appId);
        }
      } catch (e) {}

      try {
        const appDetailsStore = window.appDetailsStore || (window.opener && window.opener.appDetailsStore);
        if (appDetailsStore) {
          if (!details && typeof appDetailsStore.GetAppDetails === 'function') {
            details = appDetailsStore.GetAppDetails(appId);
          }
          if (!achievements && typeof appDetailsStore.GetAchievements === 'function') {
            achievements = appDetailsStore.GetAchievements(appId);
          }
        }
        if (!achievements && details && details.achievements) {
          achievements = details.achievements;
        }
      } catch (e) {}
    }

    return { appId, overview, details, achievements };
  }

  function formatSizeBytes(bytes) {
    const b = Number(bytes);
    if (!b || isNaN(b) || b <= 0) return null;
    const gb = b / (1024 * 1024 * 1024);
    if (gb >= 1) return gb.toFixed(2) + ' GB';
    const mb = b / (1024 * 1024);
    if (mb >= 1) return mb.toFixed(1) + ' MB';
    return Math.max(1, Math.round(b / 1024)) + ' KB';
  }

  function extractSizeOnDisk(overview, details) {
    const candidates = [
      overview && overview.size_on_disk,
      overview && overview.m_ulSizeOnDisk,
      overview && overview.local_per_client_data && overview.local_per_client_data.size_on_disk,
      overview && overview.per_client_data && overview.per_client_data[0] && overview.per_client_data[0].size_on_disk,
      details && details.lDiskSpaceRequiredBytes,
      details && details.unDiskSpace,
    ];
    for (const c of candidates) {
      if (c !== undefined && c !== null && Number(c) > 0) {
        return formatSizeBytes(c);
      }
    }
    return null;
  }

  function extractAchievements(achievements, playBarStatsEl) {
    if (achievements && typeof achievements.nTotal === 'number' && achievements.nTotal > 0) {
      return {
        achieved: achievements.nAchieved || 0,
        total: achievements.nTotal,
      };
    }

    // Fallback: Check sticky header or page achievement summary
    const stickyAchVal = document.querySelector(
      '._39RheXihcN6H2k2muQTjkI ._1kiZKVbDe-9Ikootk57kpA:has(._25YVDTaClw6Y2COPsU0UaV) ._2TYVGoD27ZMfjRirKQNLfk'
    );
    if (stickyAchVal && stickyAchVal.textContent) {
      const m = stickyAchVal.textContent.trim().match(/(\d+)\s*\/\s*(\d+)/);
      if (m) {
        return { achieved: parseInt(m[1], 10), total: parseInt(m[2], 10) };
      }
    }

    return null;
  }

  async function fetchTextWithTimeout(url, timeoutMs = 8000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return null;
      return await res.text();
    } catch (e) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  function recordAndGetRolling7dPeak(appId, observedCount) {
    const now = Date.now();
    try {
      const raw = localStorage.getItem(PEAK_HISTORY_KEY);
      const map = raw ? JSON.parse(raw) : {};
      const key = String(appId);
      const samples = Array.isArray(map[key]) ? map[key].filter((s) => s && now - s[0] <= SEVEN_DAYS_MS) : [];
      if (typeof observedCount === 'number' && observedCount > 0) {
        samples.push([now, observedCount]);
      }
      // Keep peak per day / bounded samples
      map[key] = samples.slice(-50);
      localStorage.setItem(PEAK_HISTORY_KEY, JSON.stringify(map));
      let maxVal = 0;
      for (const s of samples) {
        if (s[1] > maxVal) maxVal = s[1];
      }
      return maxVal > 0 ? maxVal : null;
    } catch (e) {
      return typeof observedCount === 'number' ? observedCount : null;
    }
  }

  async function getSteamOfficialChartsMap() {
    if (topChartsCache.byAppId.size > 0 && Date.now() - topChartsCache.ts < CACHE_TTL_MS) {
      return topChartsCache.byAppId;
    }
    if (topChartsCache.promise) return topChartsCache.promise;

    topChartsCache.promise = (async () => {
      const map = new Map();
      // Both ISteamChartsService endpoints return Access-Control-Allow-Origin: https://steamloopback.host directly
      const [concurrentText, mostPlayedText] = await Promise.all([
        fetchTextWithTimeout('https://api.steampowered.com/ISteamChartsService/GetGamesByConcurrentPlayers/v1/?format=json', 6000),
        fetchTextWithTimeout('https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/?format=json', 6000),
      ]);

      const ingestRanks = (txt) => {
        if (!txt) return;
        try {
          const data = JSON.parse(txt);
          const ranks = data && data.response && Array.isArray(data.response.ranks) ? data.response.ranks : [];
          for (const r of ranks) {
            const id = Number(r.appid);
            if (!id) continue;
            const prev = map.get(id) || { current: null, peak: null };
            const cur = typeof r.concurrent_in_game === 'number' ? r.concurrent_in_game : null;
            const pk = typeof r.peak_in_game === 'number' ? r.peak_in_game : null;
            map.set(id, {
              current: cur !== null ? cur : prev.current,
              peak: pk !== null ? Math.max(pk, prev.peak || 0) : prev.peak,
            });
          }
        } catch (e) {}
      };

      ingestRanks(mostPlayedText);
      ingestRanks(concurrentText);

      if (map.size > 0) {
        topChartsCache.byAppId = map;
        topChartsCache.ts = Date.now();
        try {
          localStorage.setItem(CHARTS_CACHE_KEY, JSON.stringify({ ts: topChartsCache.ts, items: Array.from(map.entries()) }));
        } catch (e) {}
      }
      topChartsCache.promise = null;
      return topChartsCache.byAppId;
    })();

    return topChartsCache.promise;
  }

  function extractMax7dFromChartArray(chartData) {
    if (!Array.isArray(chartData) || chartData.length === 0) return { max7d: null, latestVal: null };
    const lastPoint = chartData[chartData.length - 1];
    const latestTs = Array.isArray(lastPoint) ? Number(lastPoint[0]) : Date.now();
    const cutoff = Math.max(Date.now(), latestTs) - SEVEN_DAYS_MS;

    let max7d = 0;
    for (let i = chartData.length - 1; i >= 0; i--) {
      const pt = chartData[i];
      if (!Array.isArray(pt) || pt.length < 2) continue;
      const ts = Number(pt[0]);
      const val = Number(pt[1]);
      if (ts < cutoff) break;
      if (val > max7d) max7d = val;
    }

    return {
      max7d: max7d > 0 ? max7d : null,
      latestVal: Array.isArray(lastPoint) && typeof lastPoint[1] === 'number' ? lastPoint[1] : null,
    };
  }

  async function fetchSteamCharts7dPeak(appId) {
    // r.jina.ai returns Access-Control-Allow-Origin: https://steamloopback.host for SteamCharts JSON & page
    const rawChartTxt = await fetchTextWithTimeout(
      `https://r.jina.ai/https://steamcharts.com/app/${appId}/chart-data.json`,
      8000
    );
    if (rawChartTxt) {
      const m = rawChartTxt.match(/\[\s*\[\s*\d+\s*,\s*\d+[\s\S]*\]\s*\]/);
      if (m) {
        try {
          const parsed = JSON.parse(m[0]);
          const res = extractMax7dFromChartArray(parsed);
          if (res.max7d || res.latestVal) return res;
        } catch (e) {}
      }
    }

    // Fallback: SteamCharts app summary page for 24-hour peak if hourly chart array was unavailable
    const pageTxt = await fetchTextWithTimeout(`https://r.jina.ai/https://steamcharts.com/app/${appId}`, 7000);
    if (pageTxt) {
      const peakMatch = pageTxt.match(/([\d,]+)\s*\n+\s*24-hour peak/i);
      const curMatch = pageTxt.match(/([\d,]+)\s*\n+\s*playing\s+(?:\d+|an)\s+(?:min|hour)/i);
      const peak24 = peakMatch ? parseInt(peakMatch[1].replace(/,/g, ''), 10) : null;
      const curPage = curMatch ? parseInt(curMatch[1].replace(/,/g, ''), 10) : null;
      if (peak24 || curPage) {
        return { max7d: peak24 || null, latestVal: curPage || null };
      }
    }

    return { max7d: null, latestVal: null };
  }

  async function fetchPlayerStatsForApp(appId) {
    // Ignore non-Steam shortcuts (synthetic IDs >= 2,000,000,000)
    if (!appId || appId >= 2000000000) return null;

    const cached = playerStatsCache.get(appId);
    if (cached) {
      if (cached.fetching) return cached;
      const age = Date.now() - cached.ts;
      if ((cached.current !== null || cached.peak7d !== null) && age < CACHE_TTL_MS) {
        return cached;
      }
      if (cached.current === null && cached.peak7d === null && age < RETRY_FAIL_MS) {
        return cached;
      }
    }

    const entry = { current: null, peak7d: null, ts: Date.now(), fetching: true };
    playerStatsCache.set(appId, entry);

    // Note: ?format=json on api.steampowered.com returns Access-Control-Allow-Origin: https://steamloopback.host natively!
    const currentUrl = `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}&format=json`;

    try {
      const [currentText, chartsMap, steamChartsRes] = await Promise.all([
        fetchTextWithTimeout(currentUrl, 6000),
        getSteamOfficialChartsMap(),
        fetchSteamCharts7dPeak(appId),
      ]);

      if (currentText) {
        try {
          const currentData = JSON.parse(currentText);
          if (currentData && currentData.response && typeof currentData.response.player_count === 'number') {
            entry.current = currentData.response.player_count;
          }
        } catch (e) {}
      }

      const officialTop = chartsMap ? chartsMap.get(Number(appId)) : null;
      if (entry.current === null && officialTop && typeof officialTop.current === 'number') {
        entry.current = officialTop.current;
      }
      if (entry.current === null && steamChartsRes && typeof steamChartsRes.latestVal === 'number') {
        entry.current = steamChartsRes.latestVal;
      }

      const rollingPeak = recordAndGetRolling7dPeak(
        appId,
        Math.max(entry.current || 0, (officialTop && officialTop.peak) || 0, (steamChartsRes && steamChartsRes.max7d) || 0)
      );

      const peakCandidates = [
        steamChartsRes && steamChartsRes.max7d,
        officialTop && officialTop.peak,
        rollingPeak,
        entry.current,
      ].filter((v) => typeof v === 'number' && v > 0);

      if (peakCandidates.length > 0) {
        entry.peak7d = Math.max(...peakCandidates);
      }
    } catch (e) {
      console.error('[CyberpunkHUD] Player telemetry fetch error:', e);
    } finally {
      entry.fetching = false;
      entry.ts = Date.now();
      updateGamePagePlayBar();
    }

    return entry;
  }

  function updateGamePagePlayBar() {
    const playBarStats = document.querySelector(PLAYBAR_STATS_SELECTOR);
    if (!playBarStats) return;

    const { appId, overview, details, achievements } = getCurrentGameContext(playBarStats);
    if (!appId) return;

    // 1. ACHIEVEMENTS (Only inject custom block if Steam didn't already render native achievements in PlayBar)
    const hasNativeAch = Array.from(playBarStats.children).some(
      (child) => !child.classList.contains('cp-playbar-stat') && child.querySelector('._25YVDTaClw6Y2COPsU0UaV')
    );
    let achEl = playBarStats.querySelector('.cp-stat-achievements');

    if (hasNativeAch) {
      if (achEl) achEl.remove();
    } else {
      const achData = extractAchievements(achievements, playBarStats);
      if (achData && achData.total > 0) {
        if (!achEl) {
          achEl = document.createElement('div');
          achEl.className = 'cp-playbar-stat cp-stat-achievements';
          playBarStats.appendChild(achEl);
        }
        const pct = Math.min(100, Math.max(0, Math.round((achData.achieved / achData.total) * 100)));
        const sig = `${achData.achieved}/${achData.total}`;
        if (achEl.dataset.cpSig !== sig) {
          achEl.dataset.cpSig = sig;
          achEl.innerHTML = `
            <div class="cp-stat-label">ACHIEVEMENTS</div>
            <div class="cp-stat-row">
              <span class="cp-stat-value">${achData.achieved}/${achData.total}</span>
              <div class="cp-ach-bar"><div class="cp-ach-fill" style="width:${pct}%"></div></div>
            </div>
          `;
        }
      } else if (achEl) {
        achEl.remove();
      }
    }

    // 2. PLAYERS // 7D PEAK (Ignore non-Steam shortcut IDs >= 2,000,000,000)
    let playersEl = playBarStats.querySelector('.cp-stat-players');
    if (appId >= 2000000000) {
      if (playersEl) playersEl.remove();
    } else {
      const pStats = playerStatsCache.get(appId);
      const needsRefresh =
        !pStats ||
        (!pStats.fetching &&
          Date.now() - pStats.ts >=
            (pStats.current !== null || pStats.peak7d !== null ? CACHE_TTL_MS : RETRY_FAIL_MS));
      if (needsRefresh) {
        fetchPlayerStatsForApp(appId);
      }

      if (!playersEl) {
        playersEl = document.createElement('div');
        playersEl.className = 'cp-playbar-stat cp-stat-players';
        playBarStats.appendChild(playersEl);
      }

      const activeStats = playerStatsCache.get(appId) || pStats;
      if (!activeStats || activeStats.fetching) {
        if (playersEl.dataset.cpSig !== 'loading') {
          playersEl.dataset.cpSig = 'loading';
          playersEl.style.display = '';
          playersEl.innerHTML = `
            <div class="cp-stat-label">PLAYERS // 7D PEAK</div>
            <div class="cp-stat-value">...</div>
          `;
        }
      } else if (activeStats.current !== null || activeStats.peak7d !== null) {
        const curStr = activeStats.current !== null ? activeStats.current.toLocaleString('en-US') : '--';
        const peakStr = activeStats.peak7d !== null ? activeStats.peak7d.toLocaleString('en-US') : null;
        const sig = `${curStr}|${peakStr || ''}`;
        if (playersEl.dataset.cpSig !== sig) {
          playersEl.dataset.cpSig = sig;
          playersEl.style.display = '';
          if (peakStr) {
            playersEl.title = `Current Players: ${curStr} | 7-Day Peak: ${peakStr}`;
            playersEl.innerHTML = `
              <div class="cp-stat-label">PLAYERS // 7D PEAK</div>
              <div class="cp-stat-value">${curStr} <span class="cp-stat-peak">// ${peakStr}</span></div>
            `;
          } else {
            playersEl.title = `Current Players: ${curStr}`;
            playersEl.innerHTML = `
              <div class="cp-stat-label">PLAYERS</div>
              <div class="cp-stat-value">${curStr}</div>
            `;
          }
        }
      } else {
        playersEl.style.display = 'none';
      }
    }

    // 3. SIZE ON DISK (Only inject if not already injected by another plugin)
    const hasExternalSize = playBarStats.querySelector('[data-size-on-disk]');
    let sizeEl = playBarStats.querySelector('.cp-stat-size');
    if (hasExternalSize) {
      if (sizeEl) sizeEl.remove();
    } else {
      const sizeStr = extractSizeOnDisk(overview, details);
      if (sizeStr) {
        if (!sizeEl) {
          sizeEl = document.createElement('div');
          sizeEl.className = 'cp-playbar-stat cp-stat-size';
          playBarStats.appendChild(sizeEl);
        }
        if (sizeEl.dataset.cpSig !== sizeStr) {
          sizeEl.dataset.cpSig = sizeStr;
          sizeEl.innerHTML = `
            <div class="cp-stat-label">SIZE ON DISK</div>
            <div class="cp-stat-value">${sizeStr}</div>
          `;
        }
      } else if (sizeEl) {
        sizeEl.remove();
      }
    }
  }

  function ensureMounted() {
    const mainRow = document.querySelector(MAIN_ROW_SELECTOR);
    if (mainRow) {
      let panel = document.getElementById('cp-friends-panel');
      let resizer = document.getElementById('cp-friends-resizer');

      if (!panel || !resizer) {
        const created = createPanelDOM();
        resizer = created.resizer;
        panel = created.panel;
        mainRow.appendChild(resizer);
        mainRow.appendChild(panel);
        renderFriendsList();
      } else if (panel.parentElement !== mainRow) {
        mainRow.appendChild(resizer);
        mainRow.appendChild(panel);
      }

      setupBidirectionalGamesResizer();
    }

    updateGamePagePlayBar();
  }

  // Observe DOM and update Friends list & Game Page PlayBar periodically
  let rafScheduled = false;
  const observer = new MutationObserver(() => {
    if (rafScheduled) return;
    rafScheduled = true;
    requestAnimationFrame(() => {
      rafScheduled = false;
      ensureMounted();
    });
  });

  function start() {
    if (!document.body) {
      setTimeout(start, 200);
      return;
    }
    ensureMounted();
    observer.observe(document.body, { childList: true, subtree: true });
    setInterval(() => {
      renderFriendsList();
      updateGamePagePlayBar();
    }, 2500);
  }

  start();
})();
