import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { setSearchQuery } from '../../store/slices/postsSlice';
import { useTheme } from '../../contexts/ThemeContext';
import { Search, Menu, X, Sun, Moon, User, LogOut, Plus, BookOpen } from 'lucide-react';
import './Header.css';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      dispatch(setSearchQuery(searchInput.trim()));
      navigate('/search');
      setSearchInput('');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          {/* Logo */}
          <Link to="/" className="logo">
            <BookOpen size={24} />
            <span>BlogApp</span>
          </Link>

          {/* Search Bar */}
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-input-container">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Search posts, tags, or authors..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="search-input"
              />
            </div>
          </form>

          {/* Desktop Navigation */}
          <nav className="desktop-nav">
            <button
              onClick={toggleTheme}
              className="btn btn-ghost"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {isAuthenticated ? (
              <>
                <Link to="/create-post" className="btn btn-primary">
                  <Plus size={20} />
                  <span>Write</span>
                </Link>
                <Link to={`/profile/${user.id}`} className="btn btn-ghost">
                  <User size={20} />
                  <span>{user.name}</span>
                </Link>
                <button onClick={handleLogout} className="btn btn-ghost">
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">
                  Login
                </Link>
                <Link to="/signup" className="btn btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="mobile-nav">
            <form className="mobile-search-form" onSubmit={handleSearch}>
              <div className="search-input-container">
                <Search size={20} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="search-input"
                />
              </div>
            </form>

            <div className="mobile-nav-links">
              <button
                onClick={toggleTheme}
                className="mobile-nav-item"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                <span>Toggle Theme</span>
              </button>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/create-post"
                    className="mobile-nav-item"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Plus size={20} />
                    <span>Write Post</span>
                  </Link>
                  <Link
                    to={`/profile/${user.id}`}
                    className="mobile-nav-item"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User size={20} />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="mobile-nav-item"
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="mobile-nav-item"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="mobile-nav-item"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;

