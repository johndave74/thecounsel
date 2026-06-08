import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icons'
import { FileIcon, Empty } from '../components/ui'
import { UploadModal } from '../components/modals'
import { useStore } from '../store'
import { fmtDate } from '../data/sampleData'
import api from '../api/client'

export default function Documents() {
  const nav = useNavigate()
  const { documents, getCase, toast } = useStore()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('All')
  const [modal, setModal] = useState(false)

  const cats = ['All', ...Array.from(new Set(documents.map((d) => d.category)))]
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    return documents.filter((d) => {
      if (cat !== 'All' && d.category !== cat) return false
      if (!t) return true
      const cse = getCase(d.caseId)
      return d.name.toLowerCase().includes(t) || (cse?.title.toLowerCase().includes(t)) || (cse?.number.toLowerCase().includes(t))
    })
  }, [q, cat, documents, getCase])

  return (
    <div className="page">
      <UploadModal open={modal} onClose={() => setModal(false)} />

      <div className="page-head">
        <div><h2>Documents</h2><p>{documents.length} files stored</p></div>
        <div className="page-head__actions">
          <button className="btn btn--brass" onClick={() => setModal(true)}><Icon.upload size={17} /> Upload</button>
        </div>
      </div>

      <div className="dropzone mb" onClick={() => setModal(true)} style={{ cursor: 'pointer' }}>
        <Icon.upload size={32} />
        <h4>Drop files to upload</h4>
        <p>Drag & drop documents here, or click to browse. Files are associated with a case after upload.</p>
        <button className="btn btn--brass btn--sm" style={{ marginTop: 14 }} onClick={(e) => { e.stopPropagation(); setModal(true) }}><Icon.folder size={15} /> Browse files</button>
      </div>

      <div className="toolbar">
        <div className="toolbar__search">
          <Icon.search size={17} />
          <input placeholder="Search documents by name or case…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input" style={{ maxWidth: 200 }} value={cat} onChange={(e) => setCat(e.target.value)}>
          {cats.map((c) => <option key={c}>{c === 'All' ? 'All categories' : c}</option>)}
        </select>
      </div>

      <div className="card">
        {filtered.length === 0 ? <Empty icon="folder" title="No documents found" sub="Adjust your search or upload a new file." /> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Document</th><th>Case</th><th>Category</th><th>Size</th><th>Uploaded by</th><th>Date</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const cse = getCase(d.caseId)
                  return (
                    <tr key={d.id} onClick={() => nav(`/app/cases/${d.caseId}`)}>
                      <td><div className="cell-flex"><FileIcon ext={d.ext} /><span className="cell-strong">{d.name}</span></div></td>
                      <td><div className="cell-sub mono">{cse?.number}</div>{cse?.title}</td>
                      <td><span className="tag">{d.category}</span></td>
                      <td className="cell-sub">{d.size}</td>
                      <td>{d.uploadedBy}</td>
                      <td className="nowrap cell-sub">{fmtDate(d.date)}</td>
                      <td><button className="icon-btn" onClick={async (e) => {
                        e.stopPropagation()
                        try { await api.documents.download(d.id, d.name); toast(`Downloading “${d.name}”`, 'info') }
                        catch (err) { toast(err.message || 'Download unavailable', 'warn') }
                      }}><Icon.download size={17} /></button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
