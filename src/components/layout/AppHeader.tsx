import { useAuth } from '../../contexts/AuthContext';

export default function AppHeader() {
  const { currentUser } = useAuth();

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        height: 56,
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <span
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          fontFamily: 'var(--font-family)',
        }}
      >
        Klaro
      </span>

      {currentUser?.photoURL && (
        <img
          src={currentUser.photoURL}
          alt="Profile"
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-full)',
            objectFit: 'cover',
          }}
        />
      )}
    </header>
  );
}
