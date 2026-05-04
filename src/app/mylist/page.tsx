'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ContentModal from '@/components/ContentModal';
import { API, AVATARES, type Contenido, getId } from '@/types';

const RADIUS    = 320;
const CARD_W    = 200;
const CARD_H    = 300;
const SPIN_SPEED = 0.25;
const ITEMS_IN_WHEEL = 5;

interface ListItem extends Contenido {
  id: string;
}

export default function MyListPage() {
  const router = useRouter();
  const [miLista, setMiLista]       = useState<ListItem[]>([]);
  const [modalItem, setModalItem]   = useState<Contenido | null>(null);
  const [loading, setLoading]       = useState(true);

  const angleRef = useRef(0);
  const pauseRef = useRef(false);
  const rafRef   = useRef<number>();
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const correo = localStorage.getItem('userEmail');
    if (!correo) { router.push('/'); return; }
    cargarMiLista();
  }, []);

  const cargarMiLista = async () => {
    setLoading(true);
    const correo = localStorage.getItem('userEmail');
    try {
      const res  = await fetch(`${API}/v1/favoritos/mis-favoritos?correo=${correo}`);
      const favs = await res.json();
      if (!favs || favs.length === 0) { setMiLista([]); setLoading(false); return; }
      const items: ListItem[] = favs.map((f: any) => ({
        id: f.contenidoId, _id: f.contenidoId,
        titulo: f.titulo || 'Sin título', imagen: f.imagen || AVATARES[0],
        url: f.url || '', tipo: f.tipo || 'Película',
        plataforma: f.plataforma || '', seccion: f.seccion || '',
      }));
      setMiLista(items);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const quitarDeLista = async (itemId: string) => {
    const correo = localStorage.getItem('userEmail');
    try {
      // ✅ FIX: se manda correo y contenidoId en el body, no en query params
      await fetch(`${API}/v1/favoritos/eliminar`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contenidoId: itemId }),
      });
      setMiLista(prev => prev.filter(i => i.id !== itemId));
    } catch {}
  };

  const carouselItems = miLista.slice(0, ITEMS_IN_WHEEL);
  const [carouselAngle, setCarouselAngle] = useState(0);

  useEffect(() => {
    if (carouselItems.length < 2) return;
    let angle = 0;
    const step = () => {
      if (!pauseRef.current) {
        angle += SPIN_SPEED;
        setCarouselAngle(angle);
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [carouselItems.length]);

  if (loading) return (
    <>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner" />
      </div>
    </>
  );

  if (miLista.length === 0) return (
    <>
      <Navbar />
      <div className="mylist-page">
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h2>Tu lista está vacía</h2>
          <p>Agrega películas y series a tu lista para verlas aquí.</p>
          <button className="btn-main" style={{ maxWidth: 200, margin: '0 auto' }}
                  onClick={() => router.push('/home')}>
            Explorar catálogo
          </button>
        </div>
      </div>
    </>
  );

  const n = carouselItems.length;
  const angleStep = 360 / n;

  return (
    <>
      <Navbar />
      <div className="mylist-page">
        <div className="mylist-header">
          <h1>Mi Lista</h1>
          <p className="mylist-count">
            {miLista.length} título{miLista.length !== 1 ? 's' : ''} guardado{miLista.length !== 1 ? 's' : ''}
          </p>
        </div>

        {carouselItems.length >= 2 && (
          <div className="carousel-section"
               onMouseEnter={() => { pauseRef.current = true; }}
               onMouseLeave={() => { pauseRef.current = false; }}>
            <div className="carousel-wrap">
              {carouselItems.map((item, i) => {
                const theta = ((carouselAngle + i * angleStep) * Math.PI) / 180;
                const x = Math.sin(theta) * RADIUS;
                const z = Math.cos(theta) * RADIUS;
                const scale = (z + RADIUS + 100) / (2 * RADIUS + 100);
                const zIndex = Math.round(scale * 100);
                const left = `calc(50% + ${x}px - ${CARD_W / 2}px)`;
                const top  = `calc(50% - ${CARD_H / 2}px)`;
                return (
                  <div key={item.id} className="carousel-card"
                       style={{ width: CARD_W, height: CARD_H, left, top, transform: `translateY(-50%) scale(${scale})`, zIndex, opacity: 0.3 + scale * 0.7 }}
                       onClick={() => setModalItem(item)}>
                    <img src={item.imagen} alt={item.titulo}
                         onError={(e) => { (e.target as HTMLImageElement).src = AVATARES[0]; }} />
                    <div className="carousel-overlay" />
                    <div className="carousel-info">
                      <div className="carousel-info-title">{item.titulo}</div>
                      <div className="carousel-info-meta">{item.plataforma || ''}</div>
                      <div className="carousel-info-btns">
                        <button className="carousel-btn play"
                                onClick={e => { e.stopPropagation(); item.url && window.open(item.url, '_blank'); }}>
                          ▶
                        </button>
                        <button className="carousel-btn remove"
                                onClick={e => { e.stopPropagation(); quitarDeLista(item.id); }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mylist-grid-section">
          <div className="mylist-grid-header">
            <h2 className="mylist-grid-title">Todos los títulos</h2>
            <span className="mylist-grid-count">{miLista.length} ítems</span>
          </div>
          <div className="mylist-grid">
            {miLista.map(item => (
              <div key={item.id} className="list-card" onClick={() => setModalItem(item)}>
                <div className="list-card-img">
                  <img src={item.imagen} alt={item.titulo} loading="lazy"
                       onError={(e) => { (e.target as HTMLImageElement).src = AVATARES[0]; }} />
                  <button className="list-card-remove"
                          onClick={e => { e.stopPropagation(); quitarDeLista(item.id); }}>
                    ✕
                  </button>
                </div>
                <div className="list-card-info">
                  <div className="list-card-title">{item.titulo}</div>
                  <div className="list-card-meta">{item.tipo || 'Película'} {item.plataforma ? `· ${item.plataforma}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modalItem && (
        <ContentModal
          item={modalItem}
          esFav={true}
          onClose={() => setModalItem(null)}
          onToggleFav={() => { quitarDeLista(getId(modalItem)); setModalItem(null); }}
        />
      )}
    </>
  );
}