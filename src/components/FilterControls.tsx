import type { FilterShader } from '../lib/shaders'

interface FilterControlsProps {
  filters: FilterShader[]
  currentFilter: number
  onFilterChange: (index: number) => void
  filterParams: Record<string, number>
  onParamChange: (name: string, value: number) => void
}

export default function FilterControls({
  filters,
  currentFilter,
  onFilterChange,
  filterParams,
  onParamChange,
}: FilterControlsProps) {
  const currentFilterData = filters[currentFilter]

  const getParamConfig = (uniformName: string) => {
    switch (uniformName) {
      case 'u_brightness':
        return { label: '亮度', min: -1, max: 1, step: 0.01, default: 0 }
      case 'u_contrast':
        return { label: '对比度', min: 0, max: 2, step: 0.01, default: 1 }
      case 'u_saturation':
        return { label: '饱和度', min: 0, max: 2, step: 0.01, default: 1 }
      case 'u_hue':
        return { label: '色相', min: 0, max: 360, step: 1, default: 0 }
      case 'u_blurAmount':
        return { label: '模糊程度', min: 0, max: 10, step: 0.1, default: 0 }
      default:
        return null
    }
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-semibold">滤镜控制</h2>

      {/* 滤镜选择 */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          选择滤镜
        </label>
        <div className="grid grid-cols-2 gap-2">
          {filters.map((filter, index) => (
            <button
              key={index}
              onClick={() => onFilterChange(index)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                currentFilter === index
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.name}
            </button>
          ))}
        </div>
      </div>

      {/* 参数调节 */}
      {currentFilterData.uniforms.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">参数调节</h3>
          {currentFilterData.uniforms.map(uniformName => {
            const config = getParamConfig(uniformName)
            if (!config || uniformName === 'u_resolution') return null

            const value = filterParams[uniformName] ?? config.default

            return (
              <div key={uniformName}>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm text-gray-600">
                    {config.label}
                  </label>
                  <span className="text-sm font-medium text-gray-900">
                    {value.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={config.min}
                  max={config.max}
                  step={config.step}
                  value={value}
                  onChange={(e) => onParamChange(uniformName, parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>{config.min}</span>
                  <button
                    onClick={() => onParamChange(uniformName, config.default)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    重置
                  </button>
                  <span>{config.max}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 提示信息 */}
      <div className="mt-6 rounded-lg bg-blue-50 p-4 text-xs text-gray-600">
        <p className="font-semibold text-blue-900">💡 提示</p>
        <ul className="mt-2 space-y-1">
          <li>• 实时预览，调节参数即时生效</li>
          <li>• 支持导出为 PNG 格式</li>
          <li>• 使用 WebGL2 GPU 加速</li>
        </ul>
      </div>
    </div>
  )
}
