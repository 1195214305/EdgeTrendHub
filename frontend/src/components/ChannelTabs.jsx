import { useStore, PLATFORMS } from '../store'

export function ChannelTabs() {
  const { activeChannel, setActiveChannel, subscribedChannels } = useStore()

  const channels = [
    { id: 'all', name: '全部' },
    ...subscribedChannels.map(id => ({
      id,
      name: PLATFORMS[id]?.name || id,
      color: PLATFORMS[id]?.color
    }))
  ]

  return (
    <div className="sticky top-14 z-40 bg-dark/95 backdrop-blur-sm border-b border-dark-border">
      <div className="max-w-2xl mx-auto">
        <div className="flex overflow-x-auto scrollbar-hide px-4 py-2 gap-2 no-select">
          {channels.map(({ id, name, color }) => (
            <button
              key={id}
              onClick={() => setActiveChannel(id)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all touch-feedback ${
                activeChannel === id
                  ? 'bg-primary text-white'
                  : 'bg-dark-card text-gray-400 hover:text-white hover:bg-dark-hover'
              }`}
              style={activeChannel === id && color ? { backgroundColor: color } : {}}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// 频道管理组件（用于设置页）
export function ChannelManager() {
  const { subscribedChannels, toggleChannel } = useStore()

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Object.entries(PLATFORMS).map(([id, { name, color }]) => {
        const isSubscribed = subscribedChannels.includes(id)
        return (
          <button
            key={id}
            onClick={() => toggleChannel(id)}
            className={`p-3 rounded-lg border transition-all touch-feedback ${
              isSubscribed
                ? 'border-primary bg-primary/10'
                : 'border-dark-border bg-dark-card hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className={isSubscribed ? 'text-white' : 'text-gray-400'}>
                {name}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
