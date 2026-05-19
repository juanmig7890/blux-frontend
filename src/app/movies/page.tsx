'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ContentModal from '@/components/ContentModal';
import { API, AVATARES, type Contenido, getId } from '@/types';

export default function MoviesPage() {
  const router = useRouter();
  const [todas, setTodas]         = useState<Contenido[]>([]);
  const [filtradas, setFiltradas] = useState<Contenido[]>([]);
  const [secciones, setSecciones] = useState<string[]>([]);
  const [seccionActual, setSeccionActual] = useState('all');
  const [searchVal, setSearchVal] = useState('');
  const [favoritosSet, setFavoritosSet] = useState<Set<string>>(new Set());
  const [modalItem, setModalItem] = useState<Contenido | null>(null);
  const [loading, setLoading]     = useState(true);
  const [heroItem, setHeroItem]   = useState<Contenido | null>(null);

  useEffect(() => {
    const correo = localStorage.getItem('userEmail');
    if (!correo) { router.push('/'); return; }
    cargarFavoritos().then(cargarPeliculas);
  }, []);

  const cargarFavoritos = async () => {
    const correo = localStorage.getItem('userEmail');
    if (!correo) return;
    try {
      const res = await fetch(`${API}/v1/favoritos/mis-favoritos?correo=${correo}`);
      const favs = await res.json();
      setFavoritosSet(new Set(favs.map((f: any) => String(f.contenidoId))));
    } catch {}
  };

  const cargarPeliculas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/v1/flux/catalogo`);
      const data = await res.json();
      const items: Contenido[] = Array.isArray(data) ? data : (data.items || []);
      setTodas(items);
      setFiltradas(items);
      if (items.length > 0) setHeroItem(items[0]);
      
      // ✅ CORRECCIÓN 1: Evitar desestructuración directa del Set de secciones
      const secs = Array.from(new Set(items.map(p => p.seccion).filter(Boolean))) as string[];
      setSecciones(secs);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const filtrarPorSeccion = (sec: string) => {
    setSeccionActual(sec);
    setSearchVal('');
    setFiltradas(sec === 'all' ? [...todas] : todas.filter(p => p.seccion === sec));
  };

  const filtrarPorBusqueda = (val: string) => {
    setSearchVal(val);
    const q = val.toLowerCase().trim();
    setFiltradas(q.length < 2 ? [...todas]
      : todas.filter(p => p.titulo?.toLowerCase().includes(q) || p.seccion?.toLowerCase().includes(q)));
  };

  const toggleFav = useCallback(async (itemId: string) => {
    const correo = localStorage.getItem('userEmail');
    const esFav  = favoritosSet.has(itemId);
    try {
      if (esFav) {
        // ✅ FIX anterior: se manda correo y contenidoId en el body, no en query params
        await fetch(`${API}/v1/favoritos/eliminar`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correo, contenidoId: itemId }),
        });
        setFavoritosSet(prev => { const n = new Set(prev); n.delete(itemId); return n; });
      } else {
        await fetch(`${API}/v1/favoritos/agregar`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correo, contenidoId: itemId }),
        });
        
        // ✅ CORRECCIÓN 2: Uso de Array.from().concat() para actualizar el Set sin romper el build
        setFavoritosSet(prev => new Set(Array.from(prev).concat(itemId)));
      }
    } catch {}
  }, [favoritosSet]);

  return (
    <>
      <Navbar />
      <div className="movies-page">
        {heroItem && (
          <div className="movies-hero">
            <div className="movies-hero-bg" style={{ backgroundImage: `url('${heroItem.imagen}')` }} />
            <div className="movies-hero-content">
              <h1 className="movies-hero-title">{heroItem.titulo}</h1>
              <div className="movies-hero-btns">
                <button className="hero-btn play" onClick={() => heroItem.url && window.open(heroItem.url, '_blank')}>▶ Reproducir</button>
                <button className="hero-btn info" onClick={() => setModalItem(heroItem)}>ℹ Más info</button>
              </div>
            </div>
          </div>
        )}

        <div className="movies-filters">
          <div className="movies-filters-top">
            <div>
              <h2 id="moviesTitle">
                {seccionActual === 'all' ? 'Todas las películas' : seccionActual}
              </h2>
              <span className="movies-count">{filtradas.length} títulos</span>
            </div>
            <input className="movies-search" type="text" placeholder="Buscar..."
                   value={searchVal} onChange={e => filtrarPorBusqueda(e.target.value)} />
          </div>
          <div className="filters-scroll">
            <button className={`filter-btn${seccionActual === 'all' ? ' active' : ''}`}
                    onClick={() => filtrarPorSeccion('all')}>Todas</button>
            {secciones.map(sec => (
              <button key={sec} className={`filter-btn${seccionActual === sec ? ' active' : ''}`}
                      onClick={() => filtrarPorSeccion(sec)}>{sec}</button>
            ))}
          </div>
        </div>

        <div className="movies-grid-section">
          <div className={`loading-state${loading ? ' show' : ''}`}>
            <div className="spinner" /><span>Cargando catálogo...</span>
          </div>
          {!loading && (
            <div className="movies-grid">
              {filtradas.map(item => {
                const itemId = getId(item);
                const esFav  = favoritosSet.has(itemId);
                return (
                  <div key={itemId} className="movie-card" onClick={() => setModalItem(item)}>
                    <div className="movie-card-img">
                      <img src={item.imagen} alt={item.titulo} loading="lazy"
                           onError={(e) => { (e.target as HTMLImageElement).src = AVATARES[0]; }} />
                      <button className={`movie-card-fav${esFav ? ' active' : ''}`}
                              onClick={e => { e.stopPropagation(); toggleFav(itemId); }}>
                        {esFav ? '♥' : '♡'}
                      </button>
                    </div>
                    <div className="movie-card-info">
                      <div className="movie-card-title">{item.titulo}</div>
                      <div className="movie-card-meta">{item.plataforma || ''} {item.seccion ? `· ${item.seccion}` : ''}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {modalItem && (
        <ContentModal
          item={modalItem}
          esFav={favoritosSet.has(getId(modalItem))}
          onClose={() => setModalItem(null)}
          onToggleFav={() => { toggleFav(getId(modalItem)); setModalItem({ ...modalItem }); }}
        />
      )}
    </>
  );
}