import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import './ProfilePage.css';

function ProfilePage({ user }) {
    const navigate = useNavigate();
    const { username, email } = user;

    return (
        <div className="profile-card-design">
            <div className="profile-avatar-large">
                {username ? username.substring(0, 1).toUpperCase() : '👤'}
            </div>
            <h2 className="profile-display-name">{username}</h2>
            <p className="profile-display-email">{email}</p>

            <div className="management-actions">
                <Button
                    className="btn-change-password"
                    onClick={() => navigate('/auth/change-password')}
                >
                    Change Password
                </Button>

                <Button
                    className="btn-delete-account"
                    onClick={() => {
                        if(window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                            // Delete logic
                        }
                    }}
                >
                    Delete Account
                </Button>
            </div>
        </div>
    );
}

export default ProfilePage;