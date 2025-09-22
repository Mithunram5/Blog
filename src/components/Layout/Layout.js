import React from 'react';
import Header from './Header';
import Footer from './Footer';
import NotificationContainer from '../UI/NotificationContainer';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        {children}
      </main>
      <Footer />
      <NotificationContainer />
    </div>
  );
};

export default Layout;

