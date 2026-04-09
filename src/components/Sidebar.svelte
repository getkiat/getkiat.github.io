<script>
  let { activeToolId = $bindable(), darkMode = $bindable() } = $props();

  // Define available tools
  const tools = [
    { id: 'json-key-counter', name: 'JSON Key Counter', icon: 'curly-braces' },
    { id: 'excel-to-markdown', name: 'Excel to Markdown', icon: 'file-text' },
    { id: 'markdown-to-excel', name: 'Markdown to Excel', icon: 'file-export' },
    { id: 'table-converter', name: 'POI Format Transformer', icon: 'table' },
    { id: 'placeholder-2', name: 'Feature Format Transformer', icon: 'layers' },
    { id: 'diff-compare', name: 'Diff / Text Compare', icon: 'git-compare' }
  ];

  // Toggle dark/light mode
  function toggleTheme() {
    darkMode = !darkMode;
  }

  // Set active tool and propagate to parent
  function setActiveTool(id) {
    activeToolId = id;
  }
</script>

<aside class="sidebar">
  <div class="logo-container">
    <span class="logo">DevTools</span>
    <button class="theme-toggle" onclick={toggleTheme}>
      {#if darkMode}
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
      {/if}
    </button>
  </div>
  
  <nav class="tool-nav" aria-label="Developer tools">
    <ul>
      {#each tools as tool}
        <li class:active={activeToolId === tool.id}
            class="nav-item"
            aria-current={activeToolId === tool.id ? 'page' : undefined}
            onclick={() => setActiveTool(tool.id)}
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTool(tool.id); } }}
            tabindex="0">
          {#if tool.icon === 'curly-braces'}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 8 3 12 7 16"></polyline><polyline points="17 8 21 12 17 16"></polyline><line x1="14" y1="4" x2="10" y2="20"></line></svg>
          {:else if tool.icon === 'table'}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
          {:else if tool.icon === 'file-text'}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          {:else if tool.icon === 'file-export'}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline><path d="m14 17 3-3-3-3"></path><line x1="21" y1="14" x2="17" y2="14"></line></svg>
          {:else if tool.icon === 'tool'}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
          {:else if tool.icon === 'layers'}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
          {:else if tool.icon === 'git-compare'}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M6 21V9a9 9 0 0 0 9 9"></path><path d="M18 3v6"></path></svg>
          {:else if tool.icon === 'bar-chart'}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
          {/if}
          <span>{tool.name}</span>
        </li>
      {/each}
    </ul>
  </nav>
</aside>

<style>
  /* Sidebar Styles */
  .sidebar {
    width: 240px;
    background: var(--secondary-bg);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    position: relative;
  }

  /* Subtle noise grain for tactile depth */
  .sidebar::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    opacity: 0.03;
    pointer-events: none;
    mix-blend-mode: overlay;
  }

  .logo-container {
    padding: 1.25rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border-color);
  }

  .logo {
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 1rem;
    letter-spacing: -0.02em;
    color: var(--accent);
    text-shadow: 0 0 20px var(--accent-glow);
  }

  .logo::before {
    content: '{ ';
    opacity: 0.4;
  }

  .logo::after {
    content: ' }';
    opacity: 0.4;
  }
  
  .theme-toggle {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-color);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    border-radius: 50%;
    transition: background-color 200ms var(--ease-out), transform 160ms var(--ease-out);
  }

  .theme-toggle:active {
    transform: scale(0.9);
  }

  @media (hover: hover) and (pointer: fine) {
    .theme-toggle:hover {
      background-color: var(--sidebar-hover);
    }
  }
  
  .tool-nav {
    padding: 0.75rem 0.75rem;
  }

  .tool-nav ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .tool-nav li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0.75rem;
    cursor: pointer;
    color: var(--text-secondary);
    font-size: 0.85rem;
    font-weight: 500;
    border-radius: 0.5rem;
    transition: background-color 200ms var(--ease-out), color 200ms var(--ease-out), transform 160ms var(--ease-out);
    /* Stagger animation on page load */
    opacity: 0;
    animation: sidebarFadeIn 300ms var(--ease-out) both;
  }

  .tool-nav li:nth-child(1) { animation-delay: 0ms; }
  .tool-nav li:nth-child(2) { animation-delay: 40ms; }
  .tool-nav li:nth-child(3) { animation-delay: 80ms; }
  .tool-nav li:nth-child(4) { animation-delay: 120ms; }
  .tool-nav li:nth-child(5) { animation-delay: 160ms; }
  .tool-nav li:nth-child(6) { animation-delay: 200ms; }

  @keyframes sidebarFadeIn {
    from {
      opacity: 0;
      transform: translateX(-8px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .tool-nav li:active {
    transform: scale(0.98);
  }

  @media (hover: hover) and (pointer: fine) {
    .tool-nav li:hover {
      background-color: var(--sidebar-hover);
    }
  }

  .tool-nav li.active {
    background-color: var(--sidebar-active);
    color: var(--accent);
    font-weight: 600;
    position: relative;
  }

  .tool-nav li.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 25%;
    bottom: 25%;
    width: 3px;
    border-radius: 0 2px 2px 0;
    background-color: var(--accent);
    box-shadow: 0 0 8px var(--accent-glow);
  }

  .tool-nav li svg {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
  }
  
  /* Responsive design */
  @media (max-width: 768px) {
    .sidebar {
      width: 100%;
      height: auto;
      border-right: none;
      border-bottom: 1px solid var(--border-color);
    }
    
    .tool-nav ul {
      display: flex;
      overflow-x: auto;
      padding: 0.5rem;
    }
    
    .tool-nav li {
      padding: 0.5rem;
      flex-direction: column;
      text-align: center;
      border-radius: 0.5rem;
      min-width: 80px;
    }
  }
</style>