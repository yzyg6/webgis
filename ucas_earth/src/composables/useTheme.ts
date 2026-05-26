import { ref, watch } from 'vue';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'ucas-theme';
const theme = ref<Theme>(loadTheme());

function loadTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* ignore */ }
  return 'dark';
}

function applyTheme(value: Theme): void {
  document.documentElement.setAttribute('data-theme', value);
}

applyTheme(theme.value);

watch(theme, (value) => {
  applyTheme(value);
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch { /* ignore */ }
});

export function useTheme() {
  const toggle = (): void => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark';
  };

  return {
    theme,
    toggle,
  };
}
