'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { API, AVATARES, type Contenido, getId } from '@/types';

const SECCIONES_BASE = ['Acción', 'Comedia', 'Drama', 'Terror', 'Ciencia Ficción', 'Animación', 'Documental', 'Romance'];

type Tab = 'catalogo' | 'agregar';

interface FormState {
  titulo: string; plataforma: string; tipo: string;
  seccion: string; imagen: string; url: string;
  descripcion: string; año: string; rating: string;
  seccionCustom: string; useCustomSeccion: boolean;
}

const emptyForm: FormState = {
  titulo: '', plataforma: '', tipo: '', seccion: '',
  imagen: '', url: '', descripcion: '', año: '', rating: '',
  seccionCustom: '', useCustomSeccion: false,
};

export default function AdminPage() {
  const router = useRouter();
  const [correo, setCorreo]         = useState('');
  const [tab, setTab]               = useState<Tab>('catalogo');
  const [catalogo, setCatalogo]     = useState<Contenido[]>([]);
  const [filtrado, setFiltrado]     = useState<Contenido[]>([]);
  const [form, setForm]             = useState<FormState>(emptyForm);
  const [editId, setEditId]         = useState<string | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [confirmDel, setConfirmDel] = useState<{ id: string; titulo: string } | null>(null);
  const [toast, setToast]           = useState<{ msg: string; tipo: 'success' | 'error' } | null>(null);
  const [formMsg, setFormMsg]       = useState<{ msg: string; tipo: 'ok' | 'err' } | null>(null);
  const imgTimer = useRef<number>();

  useEffect(() => {
    const c = localStorage.getItem('userEmail');
    const r = localStorage.getItem('userRol');
    if (!c || r !== 'ADMIN') { router.push('/'); return; }
    setCorreo(c);
    cargarCatalogo();
  }, []);

  const cargarCatalogo = async () => {
    try {
      const res  = await fetch(`${API}/v1/flux/catalogo`);
      const data = await res.json();
      const items: Contenido[] = Array.isArray(data) ? data : (data.items || []);
      setCatalogo(items);
      setFiltrado(items);
    } catch (e) { console.error(e); }
  };

  const filtrarCatalogo = (q: string) => {
    const lq = q.toLowerCase().trim();
    setFiltrado(!lq ? [...catalogo]
      : catalogo.filter(c =>
          c.titulo?.toLowerCase().includes(lq) ||
          c.plataforma?.toLowerCase().includes(lq) ||
          c.tipo?.toLowerCase().includes(lq) ||
          c.seccion?.toLowerCase().includes(lq)
        ));
  };

  const stats = {
    total: catalogo.length,
    peliculas: catalogo.filter(c => c.tipo?.toLowerCase().includes('pelícu') || c.tipo?.toLowerCase().includes('pelicu')).length,
    series: catalogo.filter(c => c.tipo?.toLowerCase().includes('serie')).length,
    secciones: new Set(catalogo.map(c => c.seccion).filter(Boolean)).size,
  };

  const seccionFinal = form.useCustomSeccion ? form.seccionCustom : form.seccion;

  const guardarContenido = async () => {
    const { titulo, plataforma, tipo, imagen } = form;
    if (!titulo || !plataforma || !tipo || !imagen) {
      setFormMsg({ msg: 'Título, plataforma, tipo e imagen son obligatorios.', tipo: 'err' });
      return;
    }
    const payload = { titulo, plataforma, tipo, seccion: seccionFinal, imagen, url: form.url, descripcion: form.descripcion, año: form.año, rating: form.rating };
    try {
      let res: Response;
      if (modoEdicion && editId) {
        res = await fetch(`${API}/v1/flux/admin/editar/${editId}?correoAdmin=${correo}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API}/v1/flux/admin/agregar?correoAdmin=${correo}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
      }
      if (res.ok) {
        setFormMsg({ msg: modoEdicion ? '✅ Contenido actualizado.' : '✅ Contenido agregado.', tipo: 'ok' });
        await cargarCatalogo();
        setTimeout(() => { limpiarForm(); setTab('catalogo'); }, 1500);
      } else {
        const data = await res.json();
        setFormMsg({ msg: data.error || 'Error al guardar.', tipo: 'err' });
      }
    } catch { setFormMsg({ msg: 'Error de conexión.', tipo: 'err' }); }
  };

  const editarContenido = (itemId: string) => {
    const item = catalogo.find(c => getId(c) === itemId);
    if (!item) return;
    setModoEdicion(true);
    setEditId(itemId);
    const secBase = SECCIONES_BASE.includes(item.seccion || '');
    setForm({
      titulo: item.titulo || '', plataforma: item.plataforma || '', tipo: item.tipo || '',
      seccion: secBase ? (item.seccion || '') : '',
      imagen: item.imagen || '', url: item.url || '',
      descripcion: (item as any).descripcion || '', año: String((item as any).año || ''),
      rating: String((item as any).rating || ''),
      seccionCustom: !secBase ? (item.seccion || '') : '',
      useCustomSeccion: !secBase && !!item.seccion,
    });
    setTab('agregar');
  };

  const confirmarEliminar = async () => {
    if (!confirmDel) return;
    try {
      const res = await fetch(`${API}/v1/flux/admin/eliminar/${confirmDel.id}?correoAdmin=${correo}`, { method: 'DELETE' });
      setConfirmDel(null);
      if (res.ok) { await cargarCatalogo(); showToast('Contenido eliminado.', 'success'); }
      else { const d = await res.json(); showToast(d.error || 'Error al eliminar.', 'error'); }
    } catch { showToast('Error de conexión.', 'error'); setConfirmDel(null); }
  };

  const limpiarForm = () => {
    setForm(emptyForm); setEditId(null); setModoEdicion(false); setFormMsg(null);
  };

  const showToast = (msg: string, tipo: 'success' | 'error') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  const getBadgeClass = (tipo: string) => {
    const t = tipo?.toLowerCase() || '';
    if (t.includes('live')) return 'badge badge-live';
    if (t.includes('serie')) return 'badge badge-series';
    return 'badge badge-movie';
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">BLUX</div>
        <div className="admin-email">{correo}</div>
        <div className={`sidebar-item${tab === 'catalogo' ? ' active' : ''}`} onClick={() => setTab('catalogo')}>
          📋 Catálogo
        </div>
        <div className={`sidebar-item${tab === 'agregar' ? ' active' : ''}`}
             onClick={() => { if (!modoEdicion) limpiarForm(); setTab('agregar'); }}>
          ➕ {modoEdicion ? 'Editar' : 'Agregar'}
        </div>
        <div className="sidebar-item" style={{ marginTop: 'auto' }}
             onClick={() => { localStorage.clear(); router.push('/'); }}>
          🚪 Cerrar sesión
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {/* TAB CATALOGO */}
        <div className={`tab${tab === 'catalogo' ? ' active' : ''}`}>
          <div className="stats-grid">
            <div className="stat-card"><span className="stat-label">Total</span><span className="stat-value">{stats.total}</span></div>
            <div className="stat-card"><span className="stat-label">Películas</span><span className="stat-value">{stats.peliculas}</span></div>
            <div className="stat-card"><span className="stat-label">Series</span><span className="stat-value">{stats.series}</span></div>
            <div className="stat-card"><span className="stat-label">Secciones</span><span className="stat-value">{stats.secciones}</span></div>
          </div>

          <div className="search-bar">
            <input type="text" placeholder="Buscar contenido..." onChange={e => filtrarCatalogo(e.target.value)} />
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Título</th>
                  <th>Plataforma</th>
                  <th>Tipo</th>
                  <th>Sección</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrado.map(item => {
                  const itemId = getId(item);
                  return (
                    <tr key={itemId}>
                      <td>
                        <img className="td-thumb" src={item.imagen || ''} alt={item.titulo}
                             onError={(e) => { (e.target as HTMLImageElement).style.background = '#222'; }} />
                      </td>
                      <td>
                        <div className="td-title">{item.titulo}</div>
                        <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{item.url || 'Sin URL'}</div>
                      </td>
                      <td><span className="badge badge-movie">{item.plataforma || '-'}</span></td>
                      <td><span className={getBadgeClass(item.tipo || '')}>{item.tipo || '-'}</span></td>
                      <td><span className="badge">{item.seccion || '-'}</span></td>
                      <td>
                        <div className="action-btns">
                          <button className="btn-edit" onClick={() => editarContenido(itemId)}>✏️ Editar</button>
                          <button className="btn-delete" onClick={() => setConfirmDel({ id: itemId, titulo: item.titulo })}>🗑️ Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtrado.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#555' }}>No hay contenido.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TAB AGREGAR/EDITAR */}
        <div className={`tab${tab === 'agregar' ? ' active' : ''}`}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 24 }}>
            <div className="form-section">
              <h3>{modoEdicion ? 'Editar Contenido' : 'Agregar Contenido'}</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Título *</label>
                  <input type="text" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Título del contenido" />
                </div>
                <div className="form-group">
                  <label>Plataforma *</label>
                  <input type="text" value={form.plataforma} onChange={e => setForm(f => ({ ...f, plataforma: e.target.value }))} placeholder="Netflix, HBO, etc." />
                </div>
                <div className="form-group">
                  <label>Tipo *</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    <option value="Película">Película</option>
                    <option value="Serie">Serie</option>
                    <option value="Documental">Documental</option>
                    <option value="LIVE">LIVE</option>
                    <option value="Anime">Anime</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Sección</label>
                  <select value={form.useCustomSeccion ? '_custom' : form.seccion}
                          onChange={e => {
                            if (e.target.value === '_custom') setForm(f => ({ ...f, useCustomSeccion: true, seccion: '' }));
                            else setForm(f => ({ ...f, useCustomSeccion: false, seccion: e.target.value, seccionCustom: '' }));
                          }}>
                    <option value="">Sin sección</option>
                    {SECCIONES_BASE.map(s => <option key={s} value={s}>{s}</option>)}
                    <option value="_custom">Personalizada...</option>
                  </select>
                  {form.useCustomSeccion && (
                    <input type="text" style={{ marginTop: 8 }} placeholder="Nombre de sección"
                           value={form.seccionCustom} onChange={e => setForm(f => ({ ...f, seccionCustom: e.target.value }))} />
                  )}
                </div>
                <div className="form-group full">
                  <label>URL de imagen *</label>
                  <input type="text" value={form.imagen} onChange={e => setForm(f => ({ ...f, imagen: e.target.value }))} placeholder="https://..." />
                </div>
                <div className="form-group full">
                  <label>URL de reproducción</label>
                  <input type="text" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." />
                </div>
                <div className="form-group full">
                  <label>Descripción</label>
                  <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción del contenido..." />
                </div>
                <div className="form-group">
                  <label>Año</label>
                  <input type="number" value={form.año} onChange={e => setForm(f => ({ ...f, año: e.target.value }))} placeholder="2024" />
                </div>
                <div className="form-group">
                  <label>Rating (0–10)</label>
                  <input type="number" value={form.rating} min="0" max="10" step="0.1" onChange={e => setForm(f => ({ ...f, rating: e.target.value }))} placeholder="8.5" />
                </div>
              </div>
              {formMsg && <div className={`msg ${formMsg.tipo}`} style={{ marginTop: 16 }}>{formMsg.msg}</div>}
              <div className="form-actions">
                <button className="btn-save" onClick={guardarContenido}>
                  {modoEdicion ? '💾 Actualizar' : '➕ Agregar'}
                </button>
                <button className="btn-cancel" onClick={() => { limpiarForm(); setTab('catalogo'); }}>
                  Cancelar
                </button>
              </div>
            </div>

            {/* Preview */}
            <div>
              <p style={{ fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Preview</p>
              <div className="preview-card">
                {form.imagen
                  ? <img src={form.imagen} alt="preview" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  : <div style={{ aspectRatio: '2/3', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>🖼️</div>
                }
                <div className="preview-card-body">
                  <div className="preview-card-title">{form.titulo || 'Sin título'}</div>
                  <div className="preview-card-meta">{[form.plataforma, form.tipo].filter(Boolean).join(' · ')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Confirm delete modal */}
      {confirmDel && (
        <div className="confirm-modal">
          <div className="confirm-box">
            <h3>¿Eliminar contenido?</h3>
            <p>Se eliminará permanentemente "{confirmDel.titulo}".</p>
            <div className="confirm-actions">
              <button className="btn-confirm-del" onClick={confirmarEliminar}>Eliminar</button>
              <button className="btn-cancel" onClick={() => setConfirmDel(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast show ${toast.tipo}`}>
          {toast.tipo === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}
    </div>
  );
}
