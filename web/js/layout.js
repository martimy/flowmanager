// Shared layout components for FlowManager
// the side menu
Vue.component("app-sidebar", {
  props: ["currentTime"],
  data() {
    return {
      currentPath: window.location.pathname.split("/").pop() || "index.html",
    };
  },
  template: `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <img src="img/logo.svg" width="28" height="28">
        <div>
          <div class="sidebar-brand-name">FlowManager</div>
          <div class="sidebar-brand-sub">SDN Application</div>
        </div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section-label">Monitor</div>
        <a href="index.html" :class="['nav-link', { active: currentPath === 'index.html' || currentPath === '' }]">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h5v5H2zm7 0h5v5H9zM2 9h5v5H2zm7 0h5v5H9z"/></svg>Dashboard
        </a>
        <a href="flows.html" :class="['nav-link', { active: currentPath === 'flows.html' }]">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 3h14v2H1zm0 4h14v2H1zm0 4h14v2H1z"/></svg>Flows
        </a>
        <a href="groups.html" :class="['nav-link', { active: currentPath === 'groups.html' }]">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a3 3 0 110 6A3 3 0 018 1zm-5 9a5 5 0 0110 0v1H3v-1z"/></svg>Groups
        </a>
        <a href="meters.html" :class="['nav-link', { active: currentPath === 'meters.html' }]">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a6 6 0 100 12A6 6 0 008 2zM7 5h2v4H7zm0 5h2v2H7z"/></svg>Meters
        </a>
        <a href="topology.html" :class="['nav-link', { active: currentPath === 'topology.html' }]">
          <svg viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="2"/><circle cx="2" cy="3" r="1.5"/><circle cx="14" cy="3" r="1.5"/><circle cx="2" cy="13" r="1.5"/><circle cx="14" cy="13" r="1.5"/><line x1="3.5" y1="3.5" x2="6.5" y2="7" stroke="currentColor" stroke-width="1"/><line x1="12.5" y1="3.5" x2="9.5" y2="7" stroke="currentColor" stroke-width="1"/><line x1="3.5" y1="12.5" x2="6.5" y2="9" stroke="currentColor" stroke-width="1"/><line x1="12.5" y1="12.5" x2="9.5" y2="9" stroke="currentColor" stroke-width="1"/></svg>Topology
        </a>
        <a href="messages.html" :class="['nav-link', { active: currentPath === 'messages.html' }]">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 2h14a1 1 0 011 1v8a1 1 0 01-1 1H5l-4 3V3a1 1 0 011-1z"/></svg>Messages
        </a>
        
        <div class="nav-section-label" style="margin-top:8px">Control</div>
        <a href="flowform.html" :class="['nav-link', { active: currentPath === 'flowform.html' }]">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Flow Control
        </a>
        <a href="groupform.html" :class="['nav-link', { active: currentPath === 'groupform.html' }]">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Group Control
        </a>
        <a href="meterform.html" :class="['nav-link', { active: currentPath === 'meterform.html' }]">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Meter Control
        </a>
        
        <div class="nav-section-label" style="margin-top:8px">System</div>
        <a href="config.html" :class="['nav-link', { active: currentPath === 'config.html' }]">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 1h3l.5 2a5 5 0 011.4.8l2-.5 1.5 2.6-1.5 1.4a5 5 0 010 1.6l1.5 1.4L13.4 13l-2-.5A5 5 0 0110 13.2l-.5 2h-3l-.5-2A5 5 0 014.6 12.5l-2 .5L1.1 10.4 2.6 9A5 5 0 012.6 7.4L1.1 5.6 2.6 3l2 .5A5 5 0 016 2.8zM8 6a2 2 0 100 4A2 2 0 008 6z"/></svg>Configuration
        </a>
        <a href="about.html" :class="['nav-link', { active: currentPath === 'about.html' }]">
          <svg viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M8 7v5M8 5v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>About
        </a>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-clock">{{ currentTime }}</div>
      </div>
    </aside>
  `,
});

// Title and Clock
Vue.component("app-topbar", {
  props: ["title", "lastUpdated"],
  template: `
    <header class="topbar">
      <div class="topbar-title">{{ title }}</div>
      <div class="topbar-right">
        <span class="last-updated" v-if="lastUpdated">Updated {{ lastUpdated }}</span>
        <slot></slot>
      </div>
    </header>
  `,
});

// Title and number of switches
Vue.component("app-topbar-sw", {
  props: ["title", "numSwitches"],
  template: `
    <header class="topbar">
      <div class="topbar-title">{{ title }}</div>
      <div class="topbar-right">
        <span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--text-muted)" v-if="numSwitches">
          {{ numSwitches }} switch{{ numSwitches !== 1 ? 'es' : '' }} available
        </span>
      </div>
    </header>
  `,
});
