import React, { useState } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import './ManageProfileLayout.css';

function ManageProfileLayout() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const closeMenu = () => setIsMenuOpen(false);

    return (
        <div className="manage-profile-layout">

            <div className="mobile-menu-header">
                <h3>Profile Menu</h3>
                <button
                    className="hamburger-btn"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? '✖' : '☰'}
                </button>
            </div>

            <aside className={`profile-sidebar ${isMenuOpen ? 'open' : ''}`}>
                <Link to="/" className="btn-back-home" onClick={closeMenu}>
                    ⬅ Back to Home
                </Link>

                <nav className="profile-nav">
                    <NavLink to="/manage-profile" end className="nav-tab" onClick={closeMenu}>
                        Personal Details
                    </NavLink>

                    <NavLink to="/manage-profile/history" className="nav-tab" onClick={closeMenu}>
                        Game History
                    </NavLink>
                </nav>
            </aside>

            <main className="profile-content-area">
                <Outlet />
            </main>

        </div>
    );
}

export default ManageProfileLayout;