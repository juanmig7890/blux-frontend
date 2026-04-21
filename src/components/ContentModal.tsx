'use client';
import { API, AVATARES, type Contenido, getId } from '@/types';

interface Props {
  item: Contenido;
  esFav: boolean;
  onClose: () => void;
  onToggleFav: () => void;
}

export default function ContentModal({ item, esFav, onClose, onToggleFav }: Props) {
  const esLive = item.tipo === 'LIVE';

  return (
    <>
      <div className="modal-overlay show" onClick={onClose} />
      <div className="content-modal show">
        <div className="modal-inner">
          <div className="modal-img-wrap">
            <img src={item.imagen} alt={item.titulo}
                 onError={(e) => { (e.target as HTMLImageElement).src = AVATARES[0]; }} />
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <h2 className="modal-title">{item.titulo}</h2>
            <div className="modal-badges">
              <span className={`modal-badge ${esLive ? 'purple' : 'blue'}`}>
                {esLive ? '🔴 LIVE' : item.tipo || 'Película'}
              </span>
              {item.plataforma && <span className="modal-badge">{item.plataforma}</span>}
              {item.seccion    && <span className="modal-badge">{item.seccion}</span>}
            </div>
            <div className="modal-actions">
              <button className="modal-btn play" onClick={() => item.url && window.open(item.url, '_blank')}>
                ▶ Reproducir
              </button>
              <button className={`modal-btn fav${esFav ? ' active' : ''}`} onClick={onToggleFav}>
                <svg width="18" height="18" fill={esFav ? 'currentColor' : 'none'}
                     stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z" strokeWidth="2"/>
                </svg>
                {esFav ? 'En Mi Lista' : 'Mi Lista'}
              </button>
            </div>
            <div className="modal-detail">
              {item.plataforma && <p><strong style={{ color: 'white' }}>Plataforma:</strong> {item.plataforma}</p>}
              {item.tipo       && <p style={{ marginTop: 8 }}><strong style={{ color: 'white' }}>Tipo:</strong> {item.tipo}</p>}
              {item.descripcion && <p style={{ marginTop: 8 }}>{item.descripcion}</p>}
              {item.seccion    && <p style={{ marginTop: 8 }}><strong style={{ color: 'white' }}>Sección:</strong> {item.seccion}</p>}
              {item.año        && <p style={{ marginTop: 8 }}><strong style={{ color: 'white' }}>Año:</strong> {item.año}</p>}
              {item.rating     && <p style={{ marginTop: 8 }}><strong style={{ color: 'white' }}>Rating:</strong> ⭐ {item.rating}/10</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
