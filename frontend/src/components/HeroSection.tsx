"use client";

import React, { useEffect } from "react";
import "./HeroSection.css";

export default function HeroSection() {
  useEffect(() => {
    // Adding class triggers CSS staggered animations
    const timer = setTimeout(() => {
      const heroContent = document.querySelector(".hero-content");
      const heroVisual = document.querySelector(".hero-visual");
      if (heroContent) heroContent.classList.add("animate-start");
      if (heroVisual) heroVisual.classList.add("animate-start");
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Background Layer */}
      <div className="bg-pattern"></div>
      <div className="bg-gradient"></div>
      <div className="bg-[--bg-color] w-full">
        {/* Hero Section */}
        <section className="hero-container" id="hero">
          {/* Left Content */}
          <div className="hero-content">
            {/* Badge */}
            <div className="badge stagger-in">
              <div className="badge-dot"></div>
              Trusted by 50,000+ patients across India
            </div>

            {/* Headline */}
            <h1 className="stagger-in">
              Your Health,
              <br />
              <span className="highlight-wrapper">
                <span className="word">Connected</span>
                <svg
                  viewBox="0 0 280 20"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 15Q140 -5 275 15"
                    fill="none"
                    stroke="var(--accent-cta)"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            {/* Subheadline */}
            <p className="subheadline stagger-in">
              MediConnect bridges the gap between patients and qualified
              doctors. Book appointments, manage medical records, and access
              quality healthcare — all in one seamless platform.
            </p>

            {/* CTA Buttons */}
            <div className="cta-group stagger-in">
              <a href="#" className="btn btn-primary">
                Book an Appointment
                <svg
                  className="arrow"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </a>
              <a href="#" className="btn btn-secondary">
                Join as a Doctor
              </a>
            </div>

            {/* Trust Badges */}
            <div className="trust-badges stagger-in">
              <div className="trust-badge">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                No hidden fees
              </div>
              <div className="separator"></div>
              <div className="trust-badge">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                Verified doctors only
              </div>
              <div className="separator"></div>
              <div className="trust-badge">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                Instant confirmation
              </div>
            </div>
          </div>

          {/* Right Visual */}
          <div className="hero-visual">
            <div className="illustration-wrapper">
              {/* Abstract CSS/SVG Art */}
              <svg
                className="main-svg"
                viewBox="0 0 400 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Background glow ring */}
                <circle
                  cx="200"
                  cy="200"
                  r="140"
                  fill="url(#blue-glow)"
                  opacity="0.6"
                />

                {/* Cross motif base */}
                <rect
                  x="180"
                  y="100"
                  width="40"
                  height="200"
                  rx="10"
                  fill="#0A1628"
                  opacity="0.04"
                />
                <rect
                  x="100"
                  y="180"
                  width="200"
                  height="40"
                  rx="10"
                  fill="#0A1628"
                  opacity="0.04"
                />

                {/* Network connections */}
                <g stroke="var(--accent-cta)" strokeWidth="2">
                  {/* Center to Top Right */}
                  <path className="svg-dash" d="M200 200 L280 120" />
                  {/* Center to Bottom Right */}
                  <path className="svg-dash" d="M200 200 L300 250" />
                  {/* Center to Bottom Left */}
                  <line x1="200" y1="200" x2="120" y2="280" opacity="0.3" />
                  {/* Top Right to Top */}
                  <line x1="280" y1="120" x2="200" y2="60" opacity="0.4" />
                </g>

                {/* Floating nodes */}
                {/* Center */}
                <circle cx="200" cy="200" r="12" fill="var(--text-main)" />
                <circle
                  cx="200"
                  cy="200"
                  className="svg-node-pulse"
                  fill="#FFFFFF"
                  stroke="var(--accent-cta)"
                  strokeWidth="2"
                />

                {/* Outer Nodes */}
                <circle cx="280" cy="120" r="8" fill="var(--accent-cta)" />
                <circle
                  cx="280"
                  cy="120"
                  className="svg-node-pulse-del1"
                  fill="none"
                  stroke="var(--accent-cta)"
                  strokeWidth="2"
                  opacity="0.6"
                />

                <circle cx="300" cy="250" r="6" fill="#10B981" />
                <circle cx="120" cy="280" r="8" fill="#F59E0B" />
                <circle cx="200" cy="60" r="6" fill="var(--text-main)" />
                <circle cx="100" cy="150" r="4" fill="var(--accent-cta)" />

                {/* Concentric abstract circles */}
                <circle
                  cx="200"
                  cy="200"
                  r="80"
                  stroke="var(--accent-cta)"
                  strokeWidth="1"
                  strokeDasharray="4 8"
                  opacity="0.5"
                />
                <circle
                  cx="200"
                  cy="200"
                  r="130"
                  stroke="var(--text-main)"
                  strokeWidth="1"
                  opacity="0.1"
                />
                <circle
                  cx="200"
                  cy="200"
                  r="180"
                  stroke="var(--accent-cta)"
                  strokeWidth="1"
                  opacity="0.1"
                />

                {/* Defines */}
                <defs>
                  <radialGradient id="blue-glow" cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0%" stopColor="#E0F2FE" />
                    <stop offset="100%" stopColor="#F8FAFC" stopOpacity="0" />
                  </radialGradient>
                </defs>
              </svg>

              {/* Floating Stat Cards */}
              <div className="stat-card card-1">
                <div className="stat-icon icon-blue">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="stat-content">
                  <h4>50K+</h4>
                  <p>Happy Patients</p>
                </div>
              </div>

              <div className="stat-card card-2">
                <div className="stat-icon icon-green">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22v-5" />
                    <path d="M9 8V2" />
                    <path d="M15 8V2" />
                    <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
                  </svg>
                </div>
                <div className="stat-content">
                  <h4>500+</h4>
                  <p>Verified Doctors</p>
                </div>
              </div>

              <div className="stat-card card-3">
                <div className="stat-icon icon-amber">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div className="stat-content">
                  <h4>4.9</h4>
                  <p>Average Rating</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
