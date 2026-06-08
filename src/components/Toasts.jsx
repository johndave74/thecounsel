import { useStore } from '../store'
import Icon from './Icons'

const ICONS = { ok: 'checkCircle', info: 'doc', warn: 'alert' }

export default function Toasts() {
  const { toasts } = useStore()
  return (
    <div className="toast-host">
      {toasts.map((t) => {
        const Ico = Icon[ICONS[t.kind] || 'checkCircle']
        return (
          <div className={`toast toast--${t.kind}`} key={t.id}>
            <Ico size={18} />
            <span>{t.message}</span>
          </div>
        )
      })}
    </div>
  )
}
