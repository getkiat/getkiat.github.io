<script>
  // Import components
  import Sidebar from './components/Sidebar.svelte';
  import JsonKeyCounter from './components/tools/JsonKeyCounter.svelte';
  import TableConverter from './components/tools/TableConverter.svelte';
  import ExcelToMarkdownConverter from './components/tools/ExcelToMarkdownConverter.svelte';
  import MarkdownToExcelConverter from './components/tools/MarkdownToExcelConverter.svelte';
  import FeatureFormatTransformer from './components/tools/FeatureFormatTransformer.svelte';
  import PlaceholderTool from './components/tools/PlaceholderTool.svelte';

  // Import global styles
  import './styles/global.css';

  // Navigation and theme state
  let activeToolId = $state('json-key-counter');
  let darkMode = $state(true);

  // Sync dark mode class to body
  $effect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  });
</script>

<div class="app-container" class:dark-mode={darkMode}>
  <!-- Sidebar Navigation -->
  <Sidebar bind:activeToolId bind:darkMode />

  <!-- Main Content Area -->
  <main class="main-content">
    {#if activeToolId === 'json-key-counter'}
      <div class="tool-view"><JsonKeyCounter /></div>
    {:else if activeToolId === 'table-converter'}
      <div class="tool-view"><TableConverter /></div>
    {:else if activeToolId === 'excel-to-markdown'}
      <div class="tool-view"><ExcelToMarkdownConverter /></div>
    {:else if activeToolId === 'markdown-to-excel'}
      <div class="tool-view"><MarkdownToExcelConverter /></div>
    {:else if activeToolId === 'placeholder-2'}
      <div class="tool-view"><FeatureFormatTransformer /></div>
    {/if}
  </main>
</div>

<style>
  .tool-view {
    animation: toolFadeIn 150ms var(--ease-out) both;
  }

  @keyframes toolFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>