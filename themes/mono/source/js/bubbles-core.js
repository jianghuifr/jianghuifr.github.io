// Bubbles 核心：ShaderToy 4dl3zn 复刻（去 UI 版本，支持主题切换）
// 版权：Inigo Quilez 2013 - https://iquilezles.org/（教育学习复刻，勿公开分发/商用）
import * as THREE from 'three';

export function initBubbles(container, options) {
  var opts = options || {};
  // isDark: 初始主题（0 = 浅色, 1 = 深色），可随时用 setTheme 更新
  var theme = opts.isDark ? 1 : 0;

  var renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  var clock = new THREE.Clock();

  var uniforms = {
    uTime:       { value: 0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uSpeed:      { value: 1.0 },
    uTheme:      { value: theme },
    uScale:      { value: 1.0 }
  };

  var vertexShader = `
    void main() { gl_Position = vec4(position, 1.0); }
  `;

  var fragmentShader = `
    uniform float uTime;
    uniform vec2  uResolution;
    uniform float uSpeed;
    uniform float uTheme;
    uniform float uScale;

    void main() {
      vec2 uv = (2.0*gl_FragCoord.xy-uResolution.xy) / uResolution.y;

      // background：深色模式暗底，浅色模式亮灰底（贴近 mono --color-bg）
      vec3 color = mix( vec3(0.955, 0.955, 0.965), vec3(0.055, 0.062, 0.075), uTheme );
      color += (0.018*uv.y) * mix(1.0, 1.0, uTheme);

      // bubbles
      for( int i=0; i<40; i++ )
      {
        float pha =      sin(float(i)*546.13+1.0)*0.5 + 0.5;
        float siz = pow( sin(float(i)*651.74+5.0)*0.5 + 0.5, 4.0 );
        float pox =      sin(float(i)*321.55+4.1) * uResolution.x / uResolution.y;

        float rad = (0.1 + 0.5*siz) * uScale;
        vec2  pos = vec2( pox, -1.0-rad + (2.0+2.0*rad)*mod(pha+0.045*uTime*(0.2+0.8*siz),1.0));
        float dis = length( uv - pos );
        // 柔和蓝橙双色（参考原版 4dl3zn 的配色思路：低饱和、雾状融入）
        // 浅色模式用稍弱的粉彩，深色模式用稍亮的余晖色
        float phase = 0.5 + 0.5*sin(float(i)*1.2+1.9);
        vec3 colLight = mix( vec3(0.86, 0.60, 0.34), vec3(0.36, 0.52, 0.72), phase );
        vec3 colDark  = mix( vec3(0.93, 0.63, 0.38), vec3(0.38, 0.58, 0.82), phase );
        vec3 col = mix( colLight, colDark, uTheme );

        float f = length(uv-pos)/rad;
        f = sqrt(clamp(1.0-f*f,0.0,1.0));
        // 柔和混色：向气泡色插值（不深不艳），浅色 0.38 / 深色 0.55
        float mask = (1.0-smoothstep( rad*0.95, rad, dis )) * f;
        color += (col - color) * mask * mix(0.38, 0.55, uTheme);
      }

      // vigneting
      color *= sqrt(1.5-0.5*length(uv));

      gl_FragColor = vec4(color,1.0);
    }
  `;

  var material = new THREE.ShaderMaterial({ uniforms: uniforms, vertexShader: vertexShader, fragmentShader: fragmentShader, depthTest: false, depthWrite: false });
  var quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  scene.add(quad);

  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    renderer.getDrawingBufferSize(uniforms.uResolution.value);
    camera.left = -1; camera.right = 1; camera.top = 1; camera.bottom = -1;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  function animate() {
    requestAnimationFrame(animate);
    var dt = clock.getDelta();
    uniforms.uTime.value += dt * uniforms.uSpeed.value;
    renderer.render(scene, camera);
  }

  resize();
  animate();

  return {
    setTheme: function (isDark) {
      theme = isDark ? 1 : 0;
      uniforms.uTheme.value = theme;
    },
    // 移动端缩放气泡（0~1）：1 = 原始尺寸
    setScale: function (s) {
      uniforms.uScale.value = s || 1.0;
    },
    dispose: function () {
      window.removeEventListener('resize', resize);
      renderer.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    }
  };
}
