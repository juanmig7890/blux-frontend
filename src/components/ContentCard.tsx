'use client';
import { AVATARES, type Contenido, getId } from '@/types';

interface Props {
  item: Contenido;
  esFav: boolean;
  onCardClick: (item: Contenido) => void;
  onToggleFav: (itemId: string) => void;
}

export default function ContentCard({ item, esFav, onCardClick, onToggleFav }: Props) {
  const itemId = getId(item);
  const esLive = item.tipo === 'LIVE';

  return (
    <div className="content-card" onClick={() => onCardClick(item)}>
      <div className="card-img-wrap">
        <img src={item.imagen} alt={item.titulo} loading="lazy"
             onError={(e: React.SyntheticEvent<HTMLImageElement>) => { (e.target as HTMLImageElement).src = AVATARES[0]; }} />
        {esLive && <div className="card-live-badge">LIVE</div>}
      </div>
      <div className="card-info">
        <div className="card-info-title">{item.titulo}</div>
        <div className="card-info-meta">
          <span>{item.plataforma || ''}</span>
          {item.seccion && <><span>·</span><span>{item.seccion}</span></>}
        </div>
        <div className="card-info-actions">
          <button className="card-btn card-btn-play"
                  onClick={e => { e.stopPropagation(); item.url && window.open(item.url, '_blank'); }}>
            ▶ Play
          </button>
          <button className={`card-btn card-btn-fav${esFav ? ' active' : ''}`}
                  onClick={e => { e.stopPropagation(); onToggleFav(itemId); }}>
            {esFav ? '♥' : '♡'}
          </button>
        </div>
      </div>
    </div>
  );
}
