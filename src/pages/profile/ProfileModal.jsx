import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import { ALERT_TYPES, AlertModal } from "../../components/ui/AlertModal.jsx";
import { myProfile } from "../../services/userProfileService.js";
import { generateAdminToken } from "../../services/adminService.js";
import { cookieService } from "../../services/cookieService.js";
import { ClipLoader } from "react-spinners";
import { useWebSocket } from "../../services/webSocket/WebSocketContext.js";
import './ProfileModal.css';

function ProfileModal({ onClose, user: initialUser, onLogout }) {
    const navigate = useNavigate();
    const { updateAuthToken } = useWebSocket() || {};

    const [user, setUser] = useState(initialUser || null);
    const [loading, setLoading] = useState(!initialUser);
    const [error, setError] = useState(false);

    const [adminLoading, setAdminLoading] = useState(false);
    const [adminError, setAdminError] = useState(false);

    const fetchUserData = async () => {
        setLoading(true);
        setError(false);
        try {
            const response = await myProfile();

            if (response && response.success && response.data) {
                setUser(response.data);
            } else if (response && response.username) {
                setUser(response);
            }
        } catch (error) {
            console.error("Failed to fetch user profile in modal:", error);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (initialUser) return;
        fetchUserData();
    }, [initialUser]);

    const handleNavigation = (path) => {
        onClose();
        navigate(path);
    };

    const handleLogout = () => {
        console.log("מבצע יציאה מהחשבון...");

        if (typeof updateAuthToken === 'function') {
            updateAuthToken(null, null);
        }

        setUser(null);
        if (onLogout) onLogout();

        onClose();
    };


    const handleAdminPanelClick = async () => {
        const existingAdminToken = cookieService.getAdminToken();

        if (existingAdminToken) {
            handleNavigation('/admin/dashboard');
            return;
        }

        setAdminLoading(true);
        setAdminError(false);

        try {
            const response = await generateAdminToken();

            const payload = response && response.data ? response.data : response;

            if (payload && payload.token) {
                cookieService.setAdminToken(payload.token, payload.minutesToSaveToken);
                handleNavigation('/admin/dashboard');
            } else {
                console.error("Token missing in response payload:", response);
                setAdminError(true);
            }
        } catch (error) {
            console.error("Failed to generate admin token:", error);
            setAdminError(true);
        } finally {
            setAdminLoading(false);
        }
    };

    if (loading) {
        return (
            <AlertModal type={ALERT_TYPES.INFO} title="" onClose={onClose}>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <ClipLoader color="#36d7b7" />
                </div>
            </AlertModal>
        );
    }

    if (error) {
        return (
            <AlertModal type={ALERT_TYPES.ERROR} title="" onClose={onClose}>
                <div className="profile-content" style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '10px' }}>🔌</div>
                    <h3 className="profile-name" style={{ textAlign: 'center', fontSize: '24px', lineHeight: '1.2', color: '#d9534f' }}>
                        Connection Failed
                    </h3>
                    <p className="profile-email" style={{ textAlign: 'center', lineHeight: '1.4', marginTop: '12px' }}>
                        Unable to connect to the server. Please check your connection or try again later.
                    </p>
                </div>

                <hr className="profile-divider"/>

                <div className="profile-actions" style={{ justifyContent: 'center' }}>
                    <Button onClick={fetchUserData} style={{ width: '100%' }}>
                        Try Again
                    </Button>
                </div>
            </AlertModal>
        );
    }

    if (adminError) {
        return (
        <AlertModal type={ALERT_TYPES.ERROR} title="" onClose={onClose}>
            <div className="profile-content" style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '10px' }}>⚠️</div>
                <h3 className="profile-name" style={{ textAlign: 'center', fontSize: '24px', lineHeight: '1.2', color: '#d9534f' }}>
                    Admin Access Denied
                </h3>
                <p className="profile-email" style={{ textAlign: 'center', lineHeight: '1.4', marginTop: '12px' }}>
                    Failed to generate admin token. You may not have the required permissions or the server encountered an error.
                </p>
            </div>

            <hr className="profile-divider"/>

            <div className="profile-actions" style={{ justifyContent: 'center' }}>
                <Button onClick={() => setAdminError(false)} style={{ width: '100%' }}>
                    Back to Profile
                </Button>
            </div>
        </AlertModal>
    );
    }

    if (!user) {
        return (
            <AlertModal type={ALERT_TYPES.INFO} title="" onClose={onClose}>
                <div className="profile-content" style={{ marginTop: '16px' }}>
                    <h3 className="profile-name" style={{ textAlign: 'center', fontSize: '24px', lineHeight: '1.2' }}>
                        Oops! You're not logged in
                    </h3>
                    <p className="profile-email" style={{ textAlign: 'center', lineHeight: '1.4', marginTop: '12px' }}>
                        You need to log in or create an account to view your stats, history, and manage your profile.
                    </p>
                </div>

                <hr className="profile-divider"/>

                <div className="profile-actions">
                    <Button onClick={() => handleNavigation('/auth/login')}>
                        Log In
                    </Button>
                    <Button className="btn-register" onClick={() => handleNavigation('/auth/register')}>
                        Create Account
                    </Button>
                </div>
            </AlertModal>
        );
    }

    const { username, email, role } = user;

    return (
        <AlertModal type={ALERT_TYPES.INFO} title="My Profile" onClose={onClose}>
            <div className="profile-content">
                <div className="profile-avatar">
                    {username ? username.substring(0, 1).toUpperCase() : '👤'}
                </div>
                <h3 className="profile-name">{username}</h3>
                <p className="profile-email">{email}</p>
            </div>

            <hr className="profile-divider"/>

            <div className="profile-actions">
                <Button onClick={() => handleNavigation('/manage-profile')}>
                    Manage Profile
                </Button>

                {role === 'ADMIN' && (
                    <Button
                        className="btn-admin-panel"
                        onClick={handleAdminPanelClick}
                        disabled={adminLoading}
                    >
                        {adminLoading ? <ClipLoader size={16} color="#ffffff" /> : "Management Panel"}
                    </Button>
                )}

                <Button className="btn-logout" onClick={handleLogout}>
                    Logout
                </Button>
            </div>
        </AlertModal>
    );
}

export default ProfileModal;