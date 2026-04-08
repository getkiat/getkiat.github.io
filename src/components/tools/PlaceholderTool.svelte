<script>
  let { toolName } = $props();
</script>

<div class="tool-placeholder">
  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="16"></line>
    <line x1="8" y1="12" x2="16" y2="12"></line>
  </svg>
  <h2>{toolName || 'Future Tool'}</h2>
  <p>This tool is coming soon!</p>
</div>

<style>
  .tool-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 60vh;
    text-align: center;
    color: var(--text-secondary);
    padding: 2rem;
  }
  
  .tool-placeholder svg {
    margin-bottom: 1rem;
    opacity: 0.6;
  }
  
  .tool-placeholder h2 {
    margin: 0;
    margin-bottom: 0.5rem;
  }
  
  .tool-placeholder p {
    margin: 0;
    font-size: 1.1rem;
  }
</style>