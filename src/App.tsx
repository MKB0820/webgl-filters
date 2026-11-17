import { useState, useRef, useEffect, useCallback } from 'react'
import { WebGLRenderer } from './lib/webgl'
import { vertexShaderSource, filterShaders } from './lib/shaders'
import FilterControls from './components/FilterControls'
import ImageUpload from './components/ImageUpload'

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<WebGLRenderer | null>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [currentFilter, setCurrentFilter] = useState(0)
  const [filterParams, setFilterParams] = useState<Record<string, number>>({
    u_brightness: 0,
    u_contrast: 1,
    u_saturation: 1,
    u_hue: 0,
    u_blurAmount: 0,
  })

  // 初始化 WebGL
  useEffect(() => {
    if (!canvasRef.current) return

    try {
      const renderer = new WebGLRenderer(canvasRef.current)
      rendererRef.current = renderer
    } catch (error) {
      console.error('WebGL 初始化失败:', error)
      alert('您的浏览器不支持 WebGL2')
    }

    return () => {
      rendererRef.current?.dispose()
    }
  }, [])

  // 应用滤镜
  const applyFilter = useCallback(() => {
    if (!rendererRef.current || !image) return

    const filter = filterShaders[currentFilter]

    try {
      rendererRef.current.createProgram(vertexShaderSource, filter.fragmentShader)

      // 设置 uniform 参数
      filter.uniforms.forEach(uniformName => {
        if (uniformName === 'u_resolution') {
          rendererRef.current?.setUniform(uniformName, [image.width, image.height])
        } else {
          const value = filterParams[uniformName]
          if (value !== undefined) {
            rendererRef.current?.setUniform(uniformName, value)
          }
        }
      })

      rendererRef.current.render()
    } catch (error) {
      console.error('渲染失败:', error)
    }
  }, [image, currentFilter, filterParams])

  // 加载图像
  useEffect(() => {
    if (!image || !rendererRef.current) return

    rendererRef.current.loadImage(image)
    applyFilter()
  }, [image, applyFilter])

  // 应用滤镜变化
  useEffect(() => {
    applyFilter()
  }, [applyFilter])

  const handleImageLoad = (img: HTMLImageElement) => {
    setImage(img)
  }

  const handleExport = () => {
    if (!rendererRef.current) return

    const dataUrl = rendererRef.current.exportPNG()
    const link = document.createElement('a')
    link.download = `filtered-image-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">WebGL 图像滤镜实验室</h1>
          <p className="mt-2 text-sm text-gray-600">
            GLSL 实时图像滤镜：亮度、对比度、色相与高斯模糊
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!image ? (
          <ImageUpload onImageLoad={handleImageLoad} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
            {/* 画布区域 */}
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">预览</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setImage(null)
                      setCurrentFilter(0)
                    }}
                    className="rounded-lg bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-700"
                  >
                    更换图片
                  </button>
                  <button
                    onClick={handleExport}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                  >
                    导出 PNG
                  </button>
                </div>
              </div>

              <div className="flex justify-center overflow-auto rounded-lg bg-gray-100 p-4">
                <canvas
                  ref={canvasRef}
                  className="max-h-[600px] max-w-full"
                />
              </div>
            </div>

            {/* 控制面板 */}
            <FilterControls
              filters={filterShaders}
              currentFilter={currentFilter}
              onFilterChange={setCurrentFilter}
              filterParams={filterParams}
              onParamChange={(name, value) => {
                setFilterParams(prev => ({ ...prev, [name]: value }))
              }}
            />
          </div>
        )}
      </main>
    </div>
  )
}
