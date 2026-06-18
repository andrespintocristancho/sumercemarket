export default function Footer() {
  return (
    <footer style={{
      background: '#003893',
      color: 'white',
      padding: '1.5rem 1rem',
      textAlign: 'center',
      marginTop: '2rem'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <p style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.3rem' }}>
          🇨🇴 SumerceCompra
        </p>
        <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>
          El marketplace gratuito para los colombianos. Publicar es 100% gratis.
        </p>
        <p style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.6rem' }}>
          © {new Date().getFullYear()} SumerceCompra · Hecho con ❤️ en Colombia
        </p>
      </div>
    </footer>
  );
}
