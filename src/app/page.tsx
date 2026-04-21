'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { API, AVATARES, COLLAGE_IMGS, type Perfil } from '@/types';

type FormView = 'login' | 'register' | 'recovery';

export default function IndexPage() {
  const router = useRouter();
  const [splashHide, setSplashHide] = useState(false);
  const [loginShow, setLoginShow] = useState(false);
  const [form, setForm] = useState<FormView>('login');

  // Auth state
  const [lEmail, setLEmail] = useState('');
  const [lPass, setLPass]   = useState('');
  const [lErr, setLErr]     = useState('');
  const [lOk, setLOk]       = useState('');

  const [rEmail, setREmail] = useState('');
  const [rPass, setRPass]   = useState('');
  const [rPhone, setRPhone] = useState('');
  const [rErr, setRErr]     = useState('');
  const [rOk, setROk]       = useState('');

  const [recEmail, setRecEmail]   = useState('');
  const [recMsg, setRecMsg]       = useState('');
  const [recMsgType, setRecMsgType] = useState<'ok'|'err'>('ok');
  const [recStep2, setRecStep2]   = useState(false);
  const [recCode, setRecCode]     = useState('');
  const [recNew, setRecNew]       = useState('');
  const [recMsg2, setRecMsg2]     = useState('');

  // Profile pages
  const [page, setPage] = useState<'auth'|'select'|'setup'>('auth');
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [setupNames, setSetupNames] = useState(['Perfil 1','Perfil 2','Perfil 3','Perfil 4']);
  const [setupAvatars, setSetupAvatars] = useState([...AVATARES]);
  const [avatarModal, setAvatarModal] = useState(false);
  const [avatarTarget, setAvatarTarget] = useState<number|null>(null);

  // Splash
  useEffect(() => {
    const t = setTimeout(() => {
      setSplashHide(true);
      setTimeout(() => setLoginShow(true), 100);
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  const clearMsgs = () => {
    setLErr(''); setLOk(''); setRErr(''); setROk('');
    setRecMsg(''); setRecMsg2('');
  };

  const toggle = (f: FormView) => { clearMsgs(); setForm(f); };

  const doRegister = async () => {
    if (!rEmail || !rPass) return setRErr('Completa los campos obligatorios.');
    if (rPass.length < 8) return setRErr('La contraseña debe tener al menos 8 caracteres.');
    try {
      const res = await fetch(`${API}/v1/auth/registrar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: rEmail, password: rPass, telefono: rPhone }),
      });
      const data = await res.json();
      if (res.ok) { setROk('✅ Cuenta creada. Ahora inicia sesión.'); setTimeout(() => toggle('login'), 1800); }
      else setRErr(data.error || 'Error al registrar.');
    } catch { setRErr('Error de conexión.'); }
  };

  const doLogin = async () => {
    if (!lEmail || !lPass) return setLErr('Completa todos los campos.');
    try {
      const res = await fetch(`${API}/v1/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: lEmail, password: lPass }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('userEmail', lEmail);
        if (data.rol === 'ADMIN') {
          localStorage.setItem('userRol', 'ADMIN');
          setLOk('¡Bienvenido Admin!');
          setTimeout(() => router.push('/admin'), 1000);
        } else {
          localStorage.setItem('userRol', 'USER');
          setLOk('¡Acceso concedido!');
          setTimeout(() => verificarPerfiles(lEmail), 1000);
        }
      } else setLErr(data.error || 'Credenciales incorrectas.');
    } catch { setLErr('Error de conexión.'); }
  };

  const verificarPerfiles = async (correo: string) => {
    try {
      const res = await fetch(`${API}/v1/perfiles/listar?correo=${correo}`);
      const data = await res.json();
      if (!data || data.length === 0) setPage('setup');
      else { setPerfiles(data); setPage('select'); }
    } catch { setPage('setup'); }
  };

  const guardarPerfiles = async () => {
    const correo = localStorage.getItem('userEmail');
    const body = setupNames.map((nombre, i) => ({
      nombre, avatarUrl: setupAvatars[i], usuarioCorreo: correo,
    }));
    try {
      const res = await fetch(`${API}/v1/perfiles/guardar-lote`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) { const data = await res.json(); setPerfiles(data); setPage('select'); }
      else alert('Error al guardar perfiles.');
    } catch { alert('Error de conexión.'); }
  };

  const seleccionarPerfil = (p: Perfil) => {
    localStorage.setItem('activeProfileId', p.id);
    localStorage.setItem('activeProfileName', p.nombre);
    localStorage.setItem('activeProfileAvatar', p.avatarUrl || AVATARES[0]);
    router.push('/home');
  };

  const editarPerfil = async (p: Perfil) => {
    const nombre = prompt('Nuevo nombre:', p.nombre);
    if (nombre === null) return;
    await fetch(`${API}/v1/perfiles/actualizar`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id, nombre: nombre.trim() || p.nombre, avatarUrl: p.avatarUrl }),
    });
    const correo = localStorage.getItem('userEmail');
    const res = await fetch(`${API}/v1/perfiles/listar?correo=${correo}`);
    setPerfiles(await res.json());
  };

  const toggleEdicion = async () => {
    const next = !modoEdicion;
    setModoEdicion(next);
    const correo = localStorage.getItem('userEmail');
    const res = await fetch(`${API}/v1/perfiles/listar?correo=${correo}`);
    setPerfiles(await res.json());
  };

  const enviarCodigo = async () => {
    if (!recEmail) return (setRecMsg('Ingresa tu correo.'), setRecMsgType('err'));
    try {
      const res = await fetch(`${API}/v1/auth/recuperar/solicitar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: recEmail }),
      });
      const data = await res.json();
      if (res.ok) { setRecMsg('✅ Código enviado. Revisa tu correo.'); setRecMsgType('ok'); setRecStep2(true); }
      else { setRecMsg(data.error || 'Error al enviar código.'); setRecMsgType('err'); }
    } catch { setRecMsg('Error de conexión.'); setRecMsgType('err'); }
  };

  const cambiarPass = async () => {
    if (!recCode || !recNew) return setRecMsg2('Completa todos los campos.');
    try {
      const res = await fetch(`${API}/v1/auth/recuperar/cambiar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: recEmail, codigo: recCode, newPassword: recNew }),
      });
      const data = await res.json();
      if (res.ok) { setRecMsg2('✅ Contraseña cambiada. Inicia sesión.'); setTimeout(() => toggle('login'), 2000); }
      else setRecMsg2(data.error || 'Código incorrecto.');
    } catch { setRecMsg2('Error de conexión.'); }
  };

  // Collage
  const collageImgs = [...COLLAGE_IMGS].sort(() => Math.random() - 0.5).slice(0, 20);

  if (page === 'select') return (
    <div className="select-page">
      <h1 className="select-title">¿Quién está viendo ahora?</h1>
      <div className="profile-grid">
        {perfiles.map(p => (
          <div key={p.id} className={`profile-card${modoEdicion ? ' editing' : ''}`}
               onClick={() => modoEdicion ? editarPerfil(p) : seleccionarPerfil(p)}>
            <img className="profile-img" src={p.avatarUrl || AVATARES[0]} alt={p.nombre}
                 onError={(e) => { (e.target as HTMLImageElement).src = AVATARES[0]; }} />
            <div className="edit-icon">✏️</div>
            <p className="profile-name">{p.nombre}</p>
          </div>
        ))}
      </div>
      <button className={`manage-btn${modoEdicion ? ' active' : ''}`} onClick={toggleEdicion}>
        Administrar Perfiles
      </button>
    </div>
  );

  if (page === 'setup') return (
    <>
      <div className="setup-page">
        <h1 className="setup-title">Configura tus perfiles</h1>
        <p className="setup-subtitle">Elige un nombre para tus 4 perfiles iniciales</p>
        <div className="setup-grid">
          {[0,1,2,3].map(i => (
            <div key={i} className="setup-card">
              <img src={setupAvatars[i]} alt={`perfil ${i+1}`}
                   onClick={() => { setAvatarTarget(i); setAvatarModal(true); }}
                   onError={(e) => { (e.target as HTMLImageElement).src = AVATARES[0]; }} />
              <input value={setupNames[i]} placeholder={`Perfil ${i+1}`}
                     onChange={e => { const n=[...setupNames]; n[i]=e.target.value; setSetupNames(n); }} />
            </div>
          ))}
        </div>
        <button className="btn-main" style={{ maxWidth: 200, margin: '20px auto' }} onClick={guardarPerfiles}>
          Guardar y Continuar
        </button>
      </div>
      {avatarModal && (
        <div className="modal" onClick={() => setAvatarModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Elige tu Avatar</h2>
            <div className="avatar-selection-grid">
              {AVATARES.map(av => (
                <img key={av} src={av} alt="avatar" onClick={() => {
                  if (avatarTarget !== null) {
                    const a = [...setupAvatars]; a[avatarTarget] = av; setSetupAvatars(a);
                  }
                  setAvatarModal(false);
                }} />
              ))}
            </div>
            <button className="manage-btn" onClick={() => setAvatarModal(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* SPLASH */}
      <div className={`splash${splashHide ? ' hide' : ''}`}>
        <div className="splash-logo">
          <div className="splash-icon">
            <svg viewBox="0 0 80 80" fill="none">
              <rect x="4"  y="4"  width="33" height="72" rx="5" fill="#009CF3"/>
              <rect x="43" y="4"  width="33" height="33" rx="5" fill="#009CF3"/>
              <rect x="43" y="43" width="33" height="33" rx="5" fill="#009CF3"/>
            </svg>
          </div>
          <span className="splash-text">BLUX</span>
        </div>
      </div>

      {/* LOGIN PAGE */}
      <div className={`login-page${loginShow ? ' show' : ''}`}>
        <div className="collage-side">
          <div className="collage-grid">
            {collageImgs.map((src, i) => (
              <div key={i} className="collage-item">
                <img src={src} alt="" />
              </div>
            ))}
          </div>
        </div>

        <div className="login-side">
          <div className="blob" />
          <div className="panel-logo">BLUX</div>
          <div className="back-btn" onClick={() => toggle('login')}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* LOGIN */}
          {form === 'login' && (
            <div className="form-wrap">
              <p className="form-label">Iniciar Sesión</p>
              <div className="field">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="7" r="4" strokeWidth="2"/></svg>
                <input type="email" placeholder="Correo" value={lEmail} onChange={e=>setLEmail(e.target.value)}
                       onKeyDown={e=>e.key==='Enter'&&doLogin()} />
              </div>
              <div className="field">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" strokeWidth="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="2" strokeLinecap="round"/></svg>
                <input type="password" placeholder="Contraseña" value={lPass} onChange={e=>setLPass(e.target.value)}
                       onKeyDown={e=>e.key==='Enter'&&doLogin()} />
              </div>
              <p className="forgot" onClick={() => toggle('recovery')}>¿Olvidaste tu contraseña?</p>
              {lErr && <div className="msg err">{lErr}</div>}
              {lOk  && <div className="msg ok">{lOk}</div>}
              <button className="btn-main" onClick={doLogin}>Iniciar Sesión</button>
              <p className="switch-link">¿No tienes cuenta? <span onClick={() => toggle('register')}>Registrarse</span></p>
            </div>
          )}

          {/* REGISTER */}
          {form === 'register' && (
            <div className="form-wrap">
              <p className="form-label">Crear Cuenta</p>
              <div className="field">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="7" r="4" strokeWidth="2"/></svg>
                <input type="email" placeholder="Correo" value={rEmail} onChange={e=>setREmail(e.target.value)} />
              </div>
              <div className="field">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" strokeWidth="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="2" strokeLinecap="round"/></svg>
                <input type="password" placeholder="Contraseña (mín. 8 caracteres)" value={rPass} onChange={e=>setRPass(e.target.value)} />
              </div>
              <div className="field">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.07 3.4 2 2 0 0 1 3.05 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.09a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 15.02v1.9z" strokeWidth="2"/></svg>
                <input type="tel" placeholder="Teléfono (opcional)" value={rPhone} onChange={e=>setRPhone(e.target.value)} />
              </div>
              {rErr && <div className="msg err">{rErr}</div>}
              {rOk  && <div className="msg ok">{rOk}</div>}
              <button className="btn-main" onClick={doRegister}>Crear Cuenta</button>
              <p className="switch-link">¿Ya tienes cuenta? <span onClick={() => toggle('login')}>Iniciar Sesión</span></p>
            </div>
          )}

          {/* RECOVERY */}
          {form === 'recovery' && (
            <div className="form-wrap">
              <p className="form-label">Recuperar Contraseña</p>
              <p style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: 20 }}>
                Te enviaremos un código de 6 dígitos a tu correo electrónico.
              </p>
              <div className="field">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="7" r="4" strokeWidth="2"/></svg>
                <input type="email" placeholder="Tu correo registrado" value={recEmail} onChange={e=>setRecEmail(e.target.value)} />
              </div>
              {recMsg && <div className={`msg ${recMsgType}`}>{recMsg}</div>}
              {!recStep2 && <button className="btn-main" onClick={enviarCodigo}>Enviar Código</button>}
              {recStep2 && (
                <>
                  <div className="field" style={{ marginTop: 10 }}>
                    <input type="text" placeholder="Código de 6 dígitos" maxLength={6} value={recCode} onChange={e=>setRecCode(e.target.value)} />
                  </div>
                  <div className="field">
                    <input type="password" placeholder="Nueva contraseña" value={recNew} onChange={e=>setRecNew(e.target.value)} />
                  </div>
                  {recMsg2 && <div className="msg err">{recMsg2}</div>}
                  <button className="btn-main" onClick={cambiarPass}>Cambiar Contraseña</button>
                </>
              )}
              <p className="switch-link" style={{ cursor: 'pointer' }} onClick={() => toggle('login')}>
                <span>Volver al inicio</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
