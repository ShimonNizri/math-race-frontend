// import {useNavigate} from "react-router-dom";
// import Button from "../../components/ui/Button.jsx";
// import {AlertModal} from "../../components/ui/AlertModal.jsx";
//
// import './ProfileModal.css';
//
// function ProfileModal({onClose, user}) {
//     const navigate = useNavigate();
//     const {username, email} = user;
//
//     const handleNavigation = (path) => {
//         onClose();
//         navigate(path);
//     };
//
//     return (
//         <AlertModal title="My Profile" onClose={onClose}>
//             <div className="profile-content">
//                 <div className="profile-avatar">
//                     {username ? username.substring(0, 1).toUpperCase() : '👤'}
//                 </div>
//                 <h3 className="profile-name">{username}</h3>
//                 <p className="profile-email">{email}</p>
//             </div>
//
//             <hr className="profile-divider"/>
//
//             <div className="profile-actions">
//                 <Button onClick={() => handleNavigation('/history')}>
//                     View Game History
//                 </Button>
//
//                 <div className="settings-divider">
//                     <span>Settings</span>
//                 </div>
//
//                 <Button className="btn-settings" onClick={() => handleNavigation('/auth/change-password')}>
//                     Change Password
//                 </Button>
//
//                 <div className="profile-danger-zone">
//                     <Button className="btn-logout" onClick={onClose}>
//                         Logout
//                     </Button>
//                     <Button className="btn-delete" onClick={onClose}>
//                         Delete Account
//                     </Button>
//                 </div>
//             </div>
//         </AlertModal>
//     );
// }
//
// export default ProfileModal;

import {useNavigate} from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import {AlertModal} from "../../components/ui/AlertModal.jsx";

import './ProfileModal.css';

function ProfileModal({onClose, user}) {
    const navigate = useNavigate();
    const {username, email} = user;

    const handleNavigation = (path) => {
        onClose();
        navigate(path);
    };

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