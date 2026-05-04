'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ContentCard from '@/components/ContentCard';
import ContentModal from '@/components/ContentModal';
import { API, AVATARES, type Contenido, getId } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [catalogo, setCatalogo]       = useState<Contenido[]>([]);
  const [enVivo, setEnVivo]           = useState<Contenido[]>([]);
  const [secciones, setSecciones]     = useState<Record<string, Contenido[]>>({});
  const [heroItems, setHeroItems]     = useState<Contenido[]>([]);
  const [heroIndex, setHeroIndex]     = useState(0);
  const [heroProgress, setHeroProgress] = useState(0);
  const [favoritosSet, setFavoritosSet] = useState<Set<string>>(new Set());
  const [modalItem, setModalItem]     = useState<Contenido | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contenido[]>([]);
  const [searching, setSearching]     = useState(false);
  const heroTimer  = useRef<NodeJS.Timeout>();
  const heroStart  = useRef(Date.now());

  useEffect(() => {
    const correo = localStorage.getItem('userEmail');
    if (!correo) { router.push('/'); return; }
    cargarFavoritos().then(cargarHome);
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

  const cargarHome = async () => {
    try {
      const res = await fetch(`${API}/v1/flux/home`);
      const data = await res.json();
      const cats: Contenido[] = data.catalogo || [];
      const live: Contenido[] = data.en_vivo  || [];

      setCatalogo(cats);
      setEnVivo(live);

      const heroes = cats.slice(0, 5);
      setHeroItems(heroes);

      const secs: Record<string, Contenido[]> = {};
      cats.forEach(c => {
        const s = c.seccion || 'Otros';
        if (!secs[s]) secs[s] = [];
        secs[s].push(c);
      });
      setSecciones(secs);
    } catch (e) { console.error('Error cargando home:', e); }
  };

  useEffect(() => {
    if (heroItems.length === 0) return;
    heroStart.current = Date.now();
    const DURACION = 7000;
    heroTimer.current = setInterval(() => {
      const elapsed = Date.now() - heroStart.current;
      const pct = Math.min((elapsed / DURACION) * 100, 100);
      setHeroProgress(pct);
      if (elapsed >= DURACION) {
        setHeroIndex(i => (i + 1) % heroItems.length);
        heroStart.current = Date.now();
        setHeroProgress(0);
      }
    }, 100);
    return () => clearInterval(heroTimer.current);
  }, [heroItems]);

  const heroItem = heroItems[heroIndex] || null;

  const toggleFav = useCallback(async (itemId: string) => {
    const correo = localStorage.getItem('userEmail');
    const esFav  = favoritosSet.has(itemId);
    try {
      if (esFav) {
        // ✅ FIX: se manda correo y contenidoId en el body, no en query params
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
        setFavoritosSet(prev => new Set([...prev, itemId]));
      }
    } catch {}
  }, [favoritosSet]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearching(false); return; }
    setSearching(true);
    try {
      const res = await fetch(`${API}/v1/flux/buscar?query=${encodeURIComponent(query)}`);
      setSearchResults(await res.json());
    } catch {}
  }, []);

  return (
    <>
      <Navbar onSearch={handleSearch} />

      {searching ? (
        <div className="search-results">
          <h2>Resultados para "{searchQuery}"</h2>
          <div className="search-grid">
            {searchResults.length === 0
              ? <p style={{ color: '#888' }}>Sin resultados.</p>
              : searchResults.map(item => (
                  <ContentCard key={getId(item)} item={item} esFav={favoritosSet.has(getId(item))}
                               onCardClick={setModalItem} onToggleFav={toggleFav} />
                ))
            }
          </div>
        </div>
      ) : (
        <>
          {heroItem && (
            <section className="hero-section">
              <div className="hero-bg" style={{ backgroundImage: `url('${heroItem.imagen}')` }} />
              <div className="hero-content">
                <h1 className="hero-title">{heroItem.titulo}</h1>
                <div className="hero-meta">
                  <span>🎬 {heroItem.tipo || 'Película'}</span>
                  {heroItem.plataforma && <><span className="dot" /><span>{heroItem.plataforma}</span></>}
                  {heroItem.seccion    && <><span className="dot" /><span>{heroItem.seccion}</span></>}
                </div>
                <p className="hero-desc">{heroItem.descripcion || `Disponible en ${heroItem.plataforma || ''}`}</p>
                <div className="hero-buttons">
                  <button className="hero-btn play" onClick={() => heroItem.url && window.open(heroItem.url, '_blank')}>
                    ▶ Reproducir
                  </button>
                  <button className="hero-btn info" onClick={() => setModalItem(heroItem)}>
                    ℹ Más info
                  </button>
                </div>
              </div>
              <div className="hero-progress">
                <div className="hero-progress-bar" style={{ width: `${heroProgress}%` }} />
              </div>
            </section>
          )}

          <div className="main-content">
            {Object.entries(secciones).map(([seccion, items]) => (
              <section key={seccion} className="content-section">
                <div className="section-header"><h2>{seccion}</h2></div>
                <div className="cards-row">
                  {items.map(item => (
                    <ContentCard key={getId(item)} item={item} esFav={favoritosSet.has(getId(item))}
                                 onCardClick={setModalItem} onToggleFav={toggleFav} />
                  ))}
                </div>
              </section>
            ))}

            {enVivo.length > 0 && (
              <section className="live-section">
                <div className="live-section-header">
                  <div className="live-dot" />
                  <h2>En Vivo</h2>
                </div>
                <div className="cards-row">
                  {enVivo.slice(0,15).map(item => (
                    <ContentCard key={getId(item)} item={item} esFav={favoritosSet.has(getId(item))}
                                 onCardClick={setModalItem} onToggleFav={toggleFav} />
                  ))}
                </div>
              </section>
            )}
            <div style={{ height: 48 }} />
          </div>
        </>
      )}

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