import {useNavigate} from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import {AlertModal} from "../../components/ui/AlertModal.jsx";

import './ProfileModal.css';

function ProfileModal({onClose, user}) {
    const navigate = useNavigate();

    const handleNavigation = (path) => {
        onClose();
        navigate(path);
    };

    if (!user) {
        return (
            <AlertModal title="" onClose={onClose}>
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

    // === מצב מחובר (Authenticated View) ===
    const {username, email} = user;

    return (
        <AlertModal title="My Profile" onClose={onClose}>
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

                <Button className="btn-logout" onClick={onClose}>
                    Logout
                </Button>
            </div>
        </AlertModal>
    );
}

export default ProfileModal;