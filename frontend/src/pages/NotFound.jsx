import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">🤔</div>
      <h1 style={{ fontSize: '3rem', color: 'var(--azul)' }}>404</h1>
      <h3>Página no encontrada</h3>
      <p>La página que buscas no existe o fue movida.</p>
      <Link to="/" className="btn btn-primary mt-2">Ir al inicio</Link>
    </div>
  );
}
