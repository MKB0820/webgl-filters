/**
 * WebGL2 渲染引擎
 */

export class WebGLRenderer {
  private gl: WebGL2RenderingContext
  private canvas: HTMLCanvasElement
  private program: WebGLProgram | null = null
  private texture: WebGLTexture | null = null
  private framebuffers: WebGLFramebuffer[] = []
  private textures: WebGLTexture[] = []

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const gl = canvas.getContext('webgl2')
    if (!gl) {
      throw new Error('WebGL2 不支持')
    }
    this.gl = gl
  }

  /**
   * 创建着色器
   */
  private createShader(type: number, source: string): WebGLShader {
    const gl = this.gl
    const shader = gl.createShader(type)
    if (!shader) {
      throw new Error('创建着色器失败')
    }

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader)
      gl.deleteShader(shader)
      throw new Error(`着色器编译失败: ${info}`)
    }

    return shader
  }

  /**
   * 创建程序
   */
  createProgram(vertexSource: string, fragmentSource: string): void {
    const gl = this.gl

    const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource)
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource)

    const program = gl.createProgram()
    if (!program) {
      throw new Error('创建程序失败')
    }

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program)
      gl.deleteProgram(program)
      throw new Error(`程序链接失败: ${info}`)
    }

    // 清理旧程序
    if (this.program) {
      gl.deleteProgram(this.program)
    }

    this.program = program
    gl.useProgram(program)

    // 设置顶点数据
    this.setupGeometry()
  }

  /**
   * 设置几何体（全屏四边形）
   */
  private setupGeometry(): void {
    const gl = this.gl
    if (!this.program) return

    // 位置坐标 (-1 到 1)
    const positions = new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
    ])

    // 纹理坐标 (0 到 1)
    const texCoords = new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      0, 1,
      1, 0,
      1, 1,
    ])

    // 位置缓冲
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    const positionLocation = gl.getAttribLocation(this.program, 'a_position')
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    // 纹理坐标缓冲
    const texCoordBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW)

    const texCoordLocation = gl.getAttribLocation(this.program, 'a_texCoord')
    gl.enableVertexAttribArray(texCoordLocation)
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0)
  }

  /**
   * 加载图像
   */
  loadImage(image: HTMLImageElement): void {
    const gl = this.gl

    // 设置画布尺寸
    this.canvas.width = image.width
    this.canvas.height = image.height
    gl.viewport(0, 0, image.width, image.height)

    // 创建纹理
    if (this.texture) {
      gl.deleteTexture(this.texture)
    }

    this.texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, this.texture)

    // 设置纹理参数
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    // 上传图像数据
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
  }

  /**
   * 设置 uniform 变量
   */
  setUniform(name: string, value: number | number[]): void {
    const gl = this.gl
    if (!this.program) return

    const location = gl.getUniformLocation(this.program, name)
    if (!location) return

    if (typeof value === 'number') {
      gl.uniform1f(location, value)
    } else if (value.length === 2) {
      gl.uniform2f(location, value[0], value[1])
    }
  }

  /**
   * 渲染
   */
  render(): void {
    const gl = this.gl
    if (!this.program || !this.texture) return

    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  /**
   * 导出为 PNG
   */
  exportPNG(): string {
    return this.canvas.toDataURL('image/png')
  }

  /**
   * 清理资源
   */
  dispose(): void {
    const gl = this.gl

    if (this.program) {
      gl.deleteProgram(this.program)
      this.program = null
    }

    if (this.texture) {
      gl.deleteTexture(this.texture)
      this.texture = null
    }

    this.framebuffers.forEach(fb => gl.deleteFramebuffer(fb))
    this.textures.forEach(tex => gl.deleteTexture(tex))

    this.framebuffers = []
    this.textures = []
  }
}
