/**
 * GLSL 着色器代码
 */

// 顶点着色器（通用）
export const vertexShaderSource = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;

out vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`

// 片段着色器：原图（无滤镜）
export const fragmentShaderOriginal = `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 outColor;

uniform sampler2D u_image;

void main() {
  outColor = texture(u_image, v_texCoord);
}
`

// 片段着色器：亮度调节
export const fragmentShaderBrightness = `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 outColor;

uniform sampler2D u_image;
uniform float u_brightness; // -1.0 到 1.0

void main() {
  vec4 color = texture(u_image, v_texCoord);
  outColor = vec4(color.rgb + u_brightness, color.a);
}
`

// 片段着色器：对比度调节
export const fragmentShaderContrast = `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 outColor;

uniform sampler2D u_image;
uniform float u_contrast; // 0.0 到 2.0

void main() {
  vec4 color = texture(u_image, v_texCoord);
  vec3 adjusted = (color.rgb - 0.5) * u_contrast + 0.5;
  outColor = vec4(adjusted, color.a);
}
`

// 片段着色器：饱和度调节
export const fragmentShaderSaturation = `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 outColor;

uniform sampler2D u_image;
uniform float u_saturation; // 0.0 到 2.0

void main() {
  vec4 color = texture(u_image, v_texCoord);

  // 计算灰度值
  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  // 混合灰度和原色
  vec3 adjusted = mix(vec3(gray), color.rgb, u_saturation);
  outColor = vec4(adjusted, color.a);
}
`

// 片段着色器：色相旋转
export const fragmentShaderHue = `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 outColor;

uniform sampler2D u_image;
uniform float u_hue; // 0.0 到 360.0 度

// RGB 转 HSV
vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// HSV 转 RGB
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec4 color = texture(u_image, v_texCoord);

  vec3 hsv = rgb2hsv(color.rgb);
  hsv.x += u_hue / 360.0;
  hsv.x = fract(hsv.x); // 保持在 0-1 范围

  vec3 rgb = hsv2rgb(hsv);
  outColor = vec4(rgb, color.a);
}
`

// 片段着色器：高斯模糊（简化版，单向）
export const fragmentShaderBlur = `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 outColor;

uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_blurAmount; // 0.0 到 10.0

void main() {
  vec2 texelSize = 1.0 / u_resolution;
  float blur = u_blurAmount;

  vec4 sum = vec4(0.0);
  float weight = 0.0;

  // 9x9 高斯核（简化）
  for (float x = -4.0; x <= 4.0; x += 1.0) {
    for (float y = -4.0; y <= 4.0; y += 1.0) {
      vec2 offset = vec2(x, y) * texelSize * blur;
      float w = exp(-(x*x + y*y) / (2.0 * 2.0 * 2.0)); // 高斯权重
      sum += texture(u_image, v_texCoord + offset) * w;
      weight += w;
    }
  }

  outColor = sum / weight;
}
`

export interface FilterShader {
  name: string
  fragmentShader: string
  uniforms: string[]
}

export const filterShaders: FilterShader[] = [
  {
    name: '原图',
    fragmentShader: fragmentShaderOriginal,
    uniforms: [],
  },
  {
    name: '亮度',
    fragmentShader: fragmentShaderBrightness,
    uniforms: ['u_brightness'],
  },
  {
    name: '对比度',
    fragmentShader: fragmentShaderContrast,
    uniforms: ['u_contrast'],
  },
  {
    name: '饱和度',
    fragmentShader: fragmentShaderSaturation,
    uniforms: ['u_saturation'],
  },
  {
    name: '色相',
    fragmentShader: fragmentShaderHue,
    uniforms: ['u_hue'],
  },
  {
    name: '模糊',
    fragmentShader: fragmentShaderBlur,
    uniforms: ['u_resolution', 'u_blurAmount'],
  },
]
