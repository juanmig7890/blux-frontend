export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface Contenido {
  _id?: string;
  id?: string;
  titulo: string;
  imagen: string;
  url: string;
  tipo: string;
  plataforma?: string;
  seccion?: string;
  descripcion?: string;
  año?: number | string;
  rating?: number | string;
}

export interface Perfil {
  id: string;
  nombre: string;
  avatarUrl: string;
  usuarioCorreo?: string;
}

export interface Favorito {
  contenidoId: string;
  titulo: string;
  imagen: string;
  url: string;
  tipo: string;
  plataforma?: string;
  seccion?: string;
}

export const AVATARES = [
  '/imagenes/perfil1.jpg',
  '/imagenes/perfil2.jpg',
  '/imagenes/perfil3.jpg',
  '/imagenes/perfil4.jpg',
];

export const COLLAGE_IMGS = [
  'https://image.tmdb.org/t/p/w300/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
  'https://image.tmdb.org/t/p/w300/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
  'https://image.tmdb.org/t/p/w300/3bhkrj58Vtu7enYsLlegTcKFJua.jpg',
  'https://image.tmdb.org/t/p/w300/rktDFPbfHfUbArZ6OOOKsXcv0Bm.jpg',
  'https://image.tmdb.org/t/p/w300/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  'https://image.tmdb.org/t/p/w300/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
  'https://image.tmdb.org/t/p/w300/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
  'https://image.tmdb.org/t/p/w300/hek3koDUyRQk7FIhPXsa6mT2Zc3.jpg',
  'https://image.tmdb.org/t/p/w300/6CoRTJTmijhBLJTUNoVSUNxZMEI.jpg',
  'https://image.tmdb.org/t/p/w300/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg',
  'https://image.tmdb.org/t/p/w300/gEjNlhZhyHeto6a68oJxRRdPmFr.jpg',
  'https://image.tmdb.org/t/p/w300/xJWPZIYOEFIjZpBL7SVBpcnpXWb.jpg',
  'https://image.tmdb.org/t/p/w300/nkayOAUBUu4mMvyNf9iHSUiPjF1.jpg',
  'https://image.tmdb.org/t/p/w300/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
  'https://image.tmdb.org/t/p/w300/velWPhVMQeQKcxggNEU8YmIo52R.jpg',
  'https://image.tmdb.org/t/p/w300/aQvJ5WPzZgYVDrxLX4R6cLJCmZh.jpg',
  'https://image.tmdb.org/t/p/w300/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
  'https://image.tmdb.org/t/p/w300/A3ZbZsmsvNGdprRi2lKgGEeVLEH.jpg',
  'https://image.tmdb.org/t/p/w300/rPdtLWNsZmAJxmh9n9GbT840J5Z.jpg',
  'https://image.tmdb.org/t/p/w300/y0HUz4eNFbFtwcNLp6Y2SKHrDMo.jpg',
];

export function getId(item: Contenido): string {
  return String(item._id || item.id || '');
}
