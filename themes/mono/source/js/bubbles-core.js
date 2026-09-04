// Bubbles 核心：ShaderToy 4dl3zn 复刻（去 UI 版本）
// 版权：Inigo Quilez 2013 - https://iquilezles.org/（教育学习复刻，勿公开分发/商用）
import * as THREE from 'three';

export function initBubbles(container, options) {
  var opts = options || {};
  var startTime = performance.now();

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
    uSpeed:      { value: 1.0 }
  };

  var vertexShader = `
    void main() { gl_Position = vec4(position, 1.0); }
  `;

  var fragmentShader = `
    uniform float uTime;
    uniform vec2  uResolution;
    uniform float uSpeed;

    void main() {
      vec2 uv = (2.0*gl_FragCoord.xy-uResolution.xy) / uResolution.y;

      // background（适配 mono：深色底，气泡为蓝灰点缀）
      vec3 color = vec3(0.055 + 0.018*uv.y);

      // bubbles
      for( int i=0; i<40; i++ )
      {
        float pha =      sin(float(i)*546.13+1.0)*0.5 + 0.5;
        float siz = pow( sin(float(i)*651.74+5.0)*0.5 + 0.5, 4.0 );
        float pox =      sin(float(i)*321.55+4.1) * uResolution.x / uResolution.y;

        float rad = 0.1 + 0.5*siz;
        vec2  pos = vec2( pox, -1.0-rad + (2.0+2.0*rad)*mod(pha+0.1*uTime*(0.2+0.8*siz),1.0));
        float dis = length( uv - pos );
        // mono 配色：蓝灰气泡（稍亮，保证动效可见）
        vec3  col = mix( vec3(0.30,0.42,0.68), vec3(0.16,0.42,0.72), 0.5+0.5*sin(float(i)*1.2+1.9));

        float f = length(uv-pos)/rad;
        f = sqrt(clamp(1.0-f*f,0.0,1.0));
        color -= col.zyx *(1.0-smoothstep( rad*0.95, rad, dis )) * f * 1.6;
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

  var playing = !opts.reducedMotion;
  // 非手动暂停：macOS 窗口失焦/切页也自然暂停由浏览器 RAF 保证

  function animate() {
    requestAnimationFrame(animate);
    var dt = clock.getDelta();
    if (playing) uniforms.uTime.value += dt * uniforms.uSpeed.value;
    renderer.render(scene, camera);
  }

  resize();
  animate();

  return {
    // 页面隐藏时释放资源（可选）
    dispose: function () {
      window.removeEventListener('resize', resize);
      renderer.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    }
  };
}
