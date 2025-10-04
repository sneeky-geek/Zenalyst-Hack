import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Upload, TrendingUp, Brain } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: BarChart3 },
    { path: '/upload', label: 'Upload Files', icon: Upload },
    { path: '/analytics', label: 'Analytics', icon: TrendingUp },
    { path: '/insights', label: 'AI Insights', icon: Brain },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          🤖 Zenalyst AI
        </Link>
        <ul className="navbar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`navbar-link ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <Icon size={16} style={{ display: 'inline', marginRight: '8px' }} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;