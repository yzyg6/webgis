import * as Cesium from "cesium";

export type WeatherType = "clear" | "rain" | "snow" | "fog";

export class RainEffect {
	private viewer: Cesium.Viewer;
	private stage: Cesium.PostProcessStage;
	private tiltAngle: number;
	private rainSize: number;
	private rainSpeed: number;

	constructor(viewer: Cesium.Viewer, options?: { tiltAngle?: number; rainSize?: number; rainSpeed?: number }) {
		this.viewer = viewer;
		this.tiltAngle = options?.tiltAngle ?? -0.6;
		this.rainSize = options?.rainSize ?? 0.1;
		this.rainSpeed = options?.rainSpeed ?? 1000.0;

		this.stage = new Cesium.PostProcessStage({
			name: "czm_rain",
			fragmentShader: `
				uniform sampler2D colorTexture;
				in vec2 v_textureCoordinates;
				uniform float tiltAngle;
				uniform float rainSize;
				uniform float rainSpeed;
				float hash(float x) {
					return fract(sin(x * 133.3) * 13.13);
				}
				void main() {
					float time = czm_frameNumber / rainSpeed;
					vec2 resolution = czm_viewport.zw;
					vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
					vec3 c = vec3(0.6, 0.7, 0.8);
					float a = tiltAngle;
					float si = sin(a), co = cos(a);
					uv *= mat2(co, -si, si, co);
					uv *= length(uv + vec2(0.0, 4.9)) * rainSize + 1.0;
					float v = 1.0 - sin(hash(floor(uv.x * 100.0)) * 2.0);
					float b = clamp(abs(sin(20.0 * time * v + uv.y * (5.0 / (2.0 + v)))) - 0.95, 0.0, 1.0) * 20.0;
					c *= v * b;
					out_FragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(c, 1.0), 0.5);
				}
			`,
			uniforms: {
				tiltAngle: () => this.tiltAngle,
				rainSize: () => this.rainSize,
				rainSpeed: () => this.rainSpeed,
			},
		});
		this.viewer.scene.postProcessStages.add(this.stage);
	}

	show(visible: boolean): void {
		this.stage.enabled = visible;
	}

	destroy(): void {
		this.viewer.scene.postProcessStages.remove(this.stage);
		this.stage.destroy();
	}
}

export class SnowEffect {
	private viewer: Cesium.Viewer;
	private stage: Cesium.PostProcessStage;
	private snowSize: number;
	private snowSpeed: number;

	constructor(viewer: Cesium.Viewer, options?: { snowSize?: number; snowSpeed?: number }) {
		this.viewer = viewer;
		this.snowSize = options?.snowSize ?? 0.02;
		this.snowSpeed = options?.snowSpeed ?? 60.0;

		this.stage = new Cesium.PostProcessStage({
			name: "czm_snow",
			fragmentShader: `
				uniform sampler2D colorTexture;
				in vec2 v_textureCoordinates;
				uniform float snowSize;
				uniform float snowSpeed;
				float hash(float x) {
					return fract(sin(x * 133.3) * 13.13);
				}
				void main() {
					float time = czm_frameNumber / snowSpeed;
					vec2 resolution = czm_viewport.zw;
					vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
					vec3 c = vec3(0.95, 0.95, 0.97);
					float si = sin(0.3), co = cos(0.3);
					uv *= mat2(co, -si, si, co);
					uv *= length(uv + vec2(0.0, 4.9)) * snowSize + 1.0;
					float v = 1.0 - sin(hash(floor(uv.x * 80.0)) * 2.0);
					float b = clamp(abs(sin(10.0 * time * v + uv.y * (4.0 / (2.0 + v)))) - 0.92, 0.0, 1.0) * 15.0;
					c *= 0.5 + 0.5 * v * b;
					out_FragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(c, 1.0), 0.4);
				}
			`,
			uniforms: {
				snowSize: () => this.snowSize,
				snowSpeed: () => this.snowSpeed,
			},
		});
		this.viewer.scene.postProcessStages.add(this.stage);
	}

	show(visible: boolean): void {
		this.stage.enabled = visible;
	}

	destroy(): void {
		this.viewer.scene.postProcessStages.remove(this.stage);
		this.stage.destroy();
	}
}
