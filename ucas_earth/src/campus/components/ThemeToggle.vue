<template>
  <button
    class="theme-toggle"
    :class="{ light: theme === 'light' }"
    @click="toggle"
    :title="theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'"
    type="button"
  >
    <span class="toggle-track">
      <span class="toggle-thumb">
        <span class="icon-sun">☀</span>
        <span class="icon-moon">☾</span>
      </span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { useTheme } from '../composables/useTheme';

const { theme, toggle } = useTheme();
</script>

<style scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

.toggle-track {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: rgba(100, 180, 255, 0.2);
  border: 1px solid var(--border-primary);
  transition: background 0.3s ease, border-color 0.3s ease;
}

.theme-toggle:hover .toggle-track {
  background: rgba(100, 180, 255, 0.3);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #7ee6ff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.theme-toggle.light .toggle-thumb {
  transform: translateX(20px);
  background: #f0a030;
}

.icon-sun,
.icon-moon {
  position: absolute;
  font-size: 11px;
  line-height: 1;
  transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.icon-sun {
  color: #fff8e0;
  opacity: 0;
  transform: rotate(-90deg) scale(0.6);
}

.icon-moon {
  color: #fff;
  opacity: 1;
  transform: rotate(0deg) scale(1);
}

.theme-toggle.light .icon-sun {
  opacity: 1;
  transform: rotate(0deg) scale(1);
}

.theme-toggle.light .icon-moon {
  opacity: 0;
  transform: rotate(90deg) scale(0.6);
}
</style>
