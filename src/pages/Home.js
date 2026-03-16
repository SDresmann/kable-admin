import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

function KableLogo() {
  return (
    <Link to="/" className="kable-logo" aria-label="Kable Academy">
      <span className="logo-k-wrap">
        <span className="logo-k-letter">K</span>
      </span>
      <span className="logo-rest">able Academy</span>
    </Link>
  );
}

/* Kable brand: navy #172649, green #6ecf81 */
const HOME_TILES = [
  { title: 'CREATE USER', bgType: 'solid', tileClass: 'tile-navy', to: '/create-user' },
  { title: 'STUDENTS', bgType: 'solid', tileClass: 'tile-green', to: '/students' },
  { title: 'COHORTS', bgType: 'solid', tileClass: 'tile-navy', to: '/cohorts' },
  { title: 'ARCHIVE', bgType: 'solid', tileClass: 'tile-green', to: '/archive' },
];

function HomeTile({ title, bgType, bgImage, tileClass, to }) {
  const style =
    bgType === 'image'
      ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${bgImage})` }
      : undefined;
  const className = `home-tile ${bgType === 'image' ? 'tile-with-image' : ''} ${tileClass || ''}`.trim();
  const content = <span className="tile-title">{title}</span>;
  if (to) {
    return (
      <Link to={to} className={className} style={style}>
        {content}
      </Link>
    );
  }
  return (
    <div className={className} style={style}>
      {content}
    </div>
  );
}

export default function HomePage() {
  const { user, logout } = useAuth();
  return (
    <div className="home-page">
      <header className="page-header">
        <KableLogo />
        <div className="header-links">
          {user ? (
            <>
              <Link to="/change-password" className="header-link">Change password</Link>
              <button type="button" onClick={logout} className="header-link">Logout</button>
            </>
          ) : (
            <Link to="/login" className="header-link">Log in</Link>
          )}
          <Link to="/help" className="header-link">Help</Link>
        </div>
      </header>
      <main className="home-main">
        <h1 className="home-heading">ADMIN DASHBOARD</h1>
        <p className="home-subheading">
          Select an option to manage your classes and students:
        </p>
        <div className="home-grid">
          {HOME_TILES.map((tile, i) => (
            <HomeTile key={i} {...tile} />
          ))}
        </div>
      </main>
    </div>
  );
}
