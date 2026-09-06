// Six Lines（ShaderToy DtXfDr 复刻）— 首页背景核心
// 6 条正弦波线在透明画布上加法混合；带渐入（opacity 0→1）动画。
// 版权：ShaderToy DtXfDr 原作者（教育学习复刻，勿公开分发/商用）。
import * as THREE from 'three';

export function initLines(container, options) {
  var opts = options || {};
  var startTime = performance.now();

  var renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', alpha: true });
  renderer.setClearColor(0x000000, 0); // alpha 透明
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  var clock = new THREE.Clock();

  var uniforms = {
    uTime:       { value: 0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uSpeed:      { value: 0.8 } // 慢速，背景感
  };

  var vertexShader = `
    void main() { gl_Position = vec4(position, 1.0); }
  `;

  var fragmentShader = `
    uniform float uTime;
    uniform vec2  uResolution;
    uniform float uSpeed;

    #define S smoothstep

    vec4 Line(vec2 uv, float speed, float height, vec3 col) {
      float env  = 1.0 - S(0., 1., abs(uv.x));
      uv.y += env * sin(uTime * speed + uv.x * height) * .2;
      float fade = .06 * S(.2, .9, abs(uv.x));
      float line = 1.0 - S(0., max(fade, 1e-4), abs(uv.y) - .004);
      float edge = 1.0 - S(.3, 1., abs(uv.x));
      return vec4(line * col, 1.0) * edge;
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy - .5 * uResolution.xy) / uResolution.y;
      vec4 O = vec4 (0.);
      for (float i = 0.; i <= 5.; i += 1.) {
        float t = i / 5.;
        O += Line(uv, 0.8 + t * 0.5, 4. + t, vec3(.2 + t * .7, .2 + t * .4, 0.3 + t * 0.3));
      }
      gl_FragColor = O;
    }
  `;

  var material = new THREE.ShaderMaterial({ uniforms: uniforms, vertexShader: vertexShader, fragmentShader: fragmentShader, depthTest: false, depthWrite: false, transparent: true });
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

  // 渐入：canvas opacity 0 → 1（1.5s ease-out，延迟 60ms 保证过渡触发）
  var canvas = renderer.domElement;
  canvas.style.opacity = '0';
  canvas.style.transition = 'opacity 1.5s ease-out';
  setTimeout(function () { canvas.style.opacity = '1'; }, 60);

  function animate() {
    requestAnimationFrame(animate);
    var dt = clock.getDelta();
    uniforms.uTime.value += dt * uniforms.uSpeed.value;
    renderer.render(scene, camera);
  }

  resize();
  animate();

  return {
    setTheme: function () { /* 线条色固定，无需主题切换 */ },
    dispose: function () {
      window.removeEventListener('resize', resize);
      renderer.dispose();
      material.dispose();
      if (container.contains(canvas)) container.removeChild(canvas);
    }
  };
}
