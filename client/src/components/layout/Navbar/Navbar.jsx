import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { LoopMark } from '../../common/LoopMark';
import { useAuth } from '../../../hooks/useAuth';
import styles from './Navbar.module.css';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <header>
      <nav className={styles.navbar} aria-label="Primary">
        <Link to="/" className={styles.brand}>
          <LoopMark size={26} color="var(--veloop-primary)" />
          VELOOP Rewards
        </Link>

        <div className={styles.links}>
          <Link to="/" className={styles.navLink}>
            Giveaways
          </Link>
          {isAuthenticated && (
            <Link to="/my-participations" className={styles.navLink}>
              My Entries
            </Link>
          )}
        </div>

        <div className={styles.actions}>
          {isAuthenticated ? (
            <>
              <span className={styles.balancePill}>{user.balances.ve} VEs</span>
              <button type="button" className={styles.ghostButton} onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.ghostButton}>
                Log in
              </Link>
              <Link to="/register" className={styles.primaryButton}>
                Create account
              </Link>
            </>
          )}

          <button
            type="button"
            className={styles.menuButton}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {isMenuOpen && (
        <div className={styles.mobilePanel}>
          <Link to="/" onClick={() => setIsMenuOpen(false)}>
            Giveaways
          </Link>
          {isAuthenticated && (
            <Link to="/my-participations" onClick={() => setIsMenuOpen(false)}>
              My Entries ({user.balances.ve} VEs)
            </Link>
          )}
          {!isAuthenticated && (
            <>
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                Log in
              </Link>
              <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                Create account
              </Link>
            </>
          )}
          {isAuthenticated && <button type="button" onClick={handleLogout}>Log out</button>}
        </div>
      )}
    </header>
  );
}
