import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import cesium from "vite-plugin-cesium";

// https://vite.dev/config/
export default defineConfig({
	plugins: [vue(), cesium()],
	server: {
		proxy: {
			"/api": {
				target: "http://localhost:9999",
				changeOrigin: true,
			},
		},
	},
});
