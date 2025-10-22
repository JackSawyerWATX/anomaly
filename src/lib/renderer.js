export default class Renderer {
  constructor(canvas, dpr = 1) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2');
    this.dpr = dpr;
    this.defaultSource = `#version 300 es
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform vec2 mouse;
out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy/resolution.xy;
    vec3 col = 0.5 + 0.5*cos(time+uv.xyx+vec3(0,2,4));
    fragColor = vec4(col, 1.0);
}`;
    this.program = null;
    this.uniformLocations = {};
    this.startTime = performance.now();
    this.mousePos = [0, 0];
  }

  setup() {
    const gl = this.gl;
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  }

  init() {
    this.updateShader(this.defaultSource);
  }

  updateScale(dpr) {
    this.dpr = dpr;
    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  updateShader(source) {
    const gl = this.gl;
    
    // Create vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, `#version 300 es
      in vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }`);
    gl.compileShader(vertexShader);

    // Create fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, source);
    gl.compileShader(fragmentShader);

    // Check for shader compile errors
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(fragmentShader);
      throw new Error(error);
    }

    // Create and link program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('Unable to link the shader program');
    }

    // Clean up
    if (this.program) {
      gl.deleteProgram(this.program);
    }
    this.program = program;

    // Setup attributes and uniforms
    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    this.uniformLocations = {
      resolution: gl.getUniformLocation(program, 'resolution'),
      time: gl.getUniformLocation(program, 'time'),
      mouse: gl.getUniformLocation(program, 'mouse'),
    };
  }

  updateMouse(x, y) {
    this.mousePos = [x, y];
  }

  render(now) {
    const gl = this.gl;
    gl.useProgram(this.program);

    // Update uniforms
    gl.uniform2f(this.uniformLocations.resolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.uniformLocations.time, (now - this.startTime) * 0.001);
    gl.uniform2f(this.uniformLocations.mouse, this.mousePos[0], this.mousePos[1]);

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
