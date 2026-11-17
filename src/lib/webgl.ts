/**
 * WebGL2 渲染引擎
 */

export class WebGLRenderer {
  private gl: WebGL2RenderingContext
  readonly canvas: HTMLCanvasElement
  private program: WebGLProgram | null = null
  private texture: WebGLTexture | null = null
  private vao: WebGLVertexArrayObject | null = null
  private imageLocation: WebGLUniformLocation | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const gl = canvas.getContext('webgl2')
    if (!gl) {
      throw new Error('WebGL2 不支持')
    }
    this.gl = gl
    this.setupGeometry()
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

    // 固定 attribute 位置，几何缓冲只需在构造时建立一次
    gl.bindAttribLocation(program, 0, 'a_position')
    gl.bindAttribLocation(program, 1, 'a_texCoord')

    gl.linkProgram(program)

    // 着色器对象链接后即可删除，程序会保留其编译结果
    gl.detachShader(program, vertexShader)
    gl.detachShader(program, fragmentShader)
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)

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
    this.imageLocation = gl.getUniformLocation(program, 'u_image')
  }

  /**
   * 建立全屏四边形几何（只执行一次）
   */
  private setupGeometry(): void {
    const gl = this.gl

    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)

    // 位置坐标 (-1 到 1)，三角形带拆成两个三角形
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

    // 位置缓冲 → attribute 0
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    // 纹理坐标缓冲 → attribute 1
    const texCoordBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0)

    gl.bindVertexArray(null)
    this.vao = vao
  }

  /**
   * 加载图像
   */
  loadImage(image: HTMLImageElement): void {
    const gl = this.gl

    // 设置画布尺寸
    this.canvas.width = image.naturalWidth || image.width
    this.canvas.height = image.naturalHeight || image.height
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)

    // 创建纹理
    if (this.texture) {
      gl.deleteTexture(this.texture)
    }

    this.texture = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texture)

    // 设置纹理参数
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    // 上传图像数据
    // 图片数据的第一行是图像顶部，而纹理坐标 v=0 在底部，不翻转会上下颠倒
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
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

    // 激活纹理单元 0 并绑定纹理
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texture)

    // 告诉着色器 u_image 使用纹理单元 0
    if (this.imageLocation) {
      gl.uniform1i(this.imageLocation, 0)
    }

    gl.bindVertexArray(this.vao)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    gl.bindVertexArray(null)
  }

  /**
   * 导出为 PNG
   *
   * canvas 未开启 preserveDrawingBuffer，绘制缓冲在合成后即被清空，
   * 因此导出前必须用当前程序重新绘制一帧。
   */
  exportPNG(): string {
    this.render()
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

    if (this.vao) {
      gl.deleteVertexArray(this.vao)
      this.vao = null
    }

    this.imageLocation = null
  }
}
