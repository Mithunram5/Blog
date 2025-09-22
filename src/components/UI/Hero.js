import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, TrendingUp } from 'lucide-react';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="highlight">Welcome</span> to Our Blog
            </h1>
            <p className="hero-description">
              Explore our collection of insightful articles and stories.
            </p>
            <div className="hero-actions">
              <Link to="/signup" className="btn btn-primary btn-lg">
                Get Started <ArrowRight size={20} className="icon-space" />
              </Link>
              <Link to="/search" className="btn btn-secondary btn-lg">
                Explore Posts
              </Link>
            </div>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-icon">
                <BookOpen size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-number">1,200+</span>
                <span className="stat-l">Blog Posts</span>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">
                <Users size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-number">500+</span>
                <span className="stat-l">Active Writers</span>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">
                <TrendingUp size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-number">10K+</span>
                <span className="stat-l">Monthly Readers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

