'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ContentModal from '@/components/ContentModal';
import { API, AVATARES, type Contenido, getId } from '@/types';

function formatViewers(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
}

export default function LivePage() {
  const router = useRouter();
  const [streams, setStreams]       = useState<Contenido[]>([]);
  const [filtrados, setFiltrados]   = useState<Contenido[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [catActual, setCatActual]   = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalItem, setModalItem]   = useState<Contenido | null>(null);
  const [loading, setLoading]       = useState(true);
  const [nombre, setNombre]         = useState('Usuario');
  const [avatar, setAvatar]         = useState(AVATARES[0]);

  useEffect(() => {
    const correo = localStorage.getItem('userEmail');
    if (!correo) { router.push('/'); return; }
    setNombre(localStorage.getItem('activeProfileName') || 'Usuario');
    setAvatar(localStorage.getItem('activeProfileAvatar') || AVATARES[0]);
    cargarStreams();
  }, []);

  const cargarStreams = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/v1/flux/en-vivo`);
      const data: Contenido[] = await res.json();
      setStreams(data);
      setFiltrados(data);
      
      // SOLUCIÓN AL ERROR DE TYPE: Reemplazo de [...new Set(...)] por Array.from()
      const cats = Array.from(new Set(data.map(s => s.seccion).filter(Boolean))) as string[];
      setCategorias(cats);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const filtrarPorCategoria = (cat: string) => {
    setCatActual(cat);
    aplicarFiltros(cat, searchQuery);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    aplicarFiltros(catActual, query);
  };

  const aplicarFiltros = (cat: string, query: string) => {
    let base = cat === 'all' ? [...streams] : streams.filter(s => s.seccion === cat);
    if (query.trim()) {
      const q = query.toLowerCase();
      base = base.filter(s =>
        (s.titulo || '').toLowerCase().includes(q) ||
        (s.plataforma || '').toLowerCase().includes(q) ||
        (s.seccion || '').toLowerCase().includes(q)
      );
    }
    setFiltrados(base);
  };

  const featured  = filtrados.slice(0, 3);
  const restantes = filtrados.slice(3);

  return (
    <div className="live-layout">
      {/* Sidebar */}
      <aside className="live-sidebar">
        <div className="sidebar-profile">
          <img className="sidebar-avatar" src={avatar} alt={nombre}
               onError={(e) => { (e.target as HTMLImageElement).src = AVATARES[0]; }} />
          <span className="sidebar-name">{nombre}</span>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-section-title">Canales activos</div>
          {streams.slice(0, 5).map(s => {
            const inicial = (s.plataforma || s.titulo || 'S')[0].toUpperCase();
            const viewers = formatViewers(Math.floor(Math.random() * 30000) + 300);
            return (
              <div key={getId(s)} className="sidebar-channel" onClick={() => setModalItem(s)}>
                <div className="sidebar-ch-thumb-placeholder">{inicial}</div>
                <div className="sidebar-ch-info">
                  <div className="sidebar-ch-name">{s.plataforma || 'Canal'}</div>
                  <div className="sidebar-ch-game">{s.seccion || 'Streaming'} · {viewers}</div>
                </div>
                <div className="sidebar-ch-live" />
              </div>
            );
          })}
        </div>
        {streams.length > 5 && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">Recomendados</div>
            {streams.slice(5, 12).map(s => {
              const inicial = (s.plataforma || s.titulo || 'S')[0].toUpperCase();
              const viewers = formatViewers(Math.floor(Math.random() * 20000) + 200);
              return (
                <div key={getId(s)} className="sidebar-channel" onClick={() => setModalItem(s)}>
                  <div className="sidebar-ch-thumb-placeholder">{inicial}</div>
                  <div className="sidebar-ch-info">
                    <div className="sidebar-ch-name">{s.plataforma || 'Canal'}</div>
                    <div className="sidebar-ch-game">{s.seccion || 'Streaming'} · {viewers}</div>
                  </div>
                  <div className="sidebar-ch-live" />
                </div>
              );
            })}
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="live-main">
        <Navbar onSearch={handleSearch} />
        {loading ? (
          <div className="loading-state show" style={{ marginTop: 80 }}>
            <div className="spinner" /><span>Cargando streams...</span>
          </div>
        ) : (
          <>
            {/* Filtros categoría */}
            {categorias.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                <button className={`filter-btn${catActual === 'all' ? ' active' : ''}`}
                        onClick={() => filtrarPorCategoria('all')}>Todos</button>
                {categorias.map(cat => (
                  <button key={cat} className={`filter-btn${catActual === cat ? ' active' : ''}`}
                          onClick={() => filtrarPorCategoria(cat)}>{cat}</button>
                ))}
              </div>
            )}

            {/* Featured */}
            {featured.length > 0 && (
              <>
                <h2 className="live-section-h">
                  <span className="live-dot-sm" /> En Vivo Ahora
                </h2>
                <div className="featured-grid">
                  {featured.map(s => {
                    const viewers = formatViewers(Math.floor(Math.random() * 50000) + 1000);
                    return (
                      <div key={getId(s)} className="featured-card" onClick={() => setModalItem(s)}>
                        <div className="featured-thumb">
                          <img src={s.imagen} alt={s.titulo} loading="lazy"
                               onError={(e) => { (e.target as HTMLImageElement).src = AVATARES[0]; }} />
                          <div className="featured-live-pill">
                            <span className="live-dot-sm" /> VIVO
                          </div>
                        </div>
                        <div className="featured-info">
                          <div className="featured-name">{s.titulo}</div>
                          <div className="featured-game">{s.plataforma || ''}</div>
                          <div className="featured-viewers">👁 {viewers} espectadores</div>
                          {s.seccion && (
                            <div className="featured-tags">
                              <span className="featured-tag">{s.seccion}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Grid de streamers */}
            {restantes.length > 0 && (
              <>
                <h2 className="live-section-h" style={{ marginTop: 32 }}>Más Canales</h2>
                <div className="streamers-grid">
                  {restantes.map(s => {
                    const viewers = formatViewers(Math.floor(Math.random() * 15000) + 100);
                    return (
                      <div key={getId(s)} className="streamer-card" onClick={() => setModalItem(s)}>
                        <div className="streamer-thumb">
                          <img src={s.imagen} alt={s.titulo} loading="lazy"
                               onError={(e) => { (e.target as HTMLImageElement).src = AVATARES[0]; }} />
                          <div className="streamer-live-pill">VIVO</div>
                        </div>
                        <div className="streamer-info">
                          <div className="streamer-name">{s.titulo}</div>
                          <div className="streamer-viewers">{viewers} espectadores</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {filtrados.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#666' }}>
                <p style={{ fontSize: '3rem', marginBottom: 16 }}>📡</p>
                <p>No hay transmisiones en vivo en este momento.</p>
              </div>
            )}
          </>
        )}
      </main>

      {modalItem && (
        <ContentModal
          item={modalItem}
          esFav={false}
          onClose={() => setModalItem(null)}
          onToggleFav={() => {}}
        />
      )}
    </div>
  );
}