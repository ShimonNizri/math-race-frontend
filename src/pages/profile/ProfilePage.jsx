import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { ClipLoader } from "react-spinners";
import { getErrorMessage } from "../../utils/errorMapper.js";

import { myProfile, requestAccountDeletion, updateUsername } from "../../services/userProfileService.js";

import './ProfilePage.css';
import ErrorToast from "../../components/ui/ErrorToast.jsx";
import ConfirmModal from "../../components/ui/ConfirmModal.jsx";

function ProfilePage() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // סטייטים לעריכת שם המשתמש
    const [newUsername, setNewUsername] = useState("");
    const [isUpdatingName, setIsUpdatingName] = useState(false);

    // סטייטים למחיקת חשבון
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isRequestingDelete, setIsRequestingDelete] = useState(false);

    // סטייטים להודעות - ErrorToast ולהודעות הצלחה
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await myProfile();

                if (response && response.success && response.data) {
                    setUser(response.data);
                    setNewUsername(response.data.username);
                } else if (response && response.username) {
                    setUser(response);
                    setNewUsername(response.username);
                } else {
                    navigate('/auth/login');
                }
            } catch (error) {
                console.error("Failed to fetch user profile:", error);
                navigate('/auth/login');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [navigate]);

    // ולידציה שתואמת להגבלות ה-DTO בשרת (UpdateUsernameRequest)
    const validateUsername = (name) => {
        if (!name || name.trim().length === 0) {
            return "Username cannot be empty";
        }
        if (name.length < 3 || name.length > 15) {
            return "Username must be between 3 and 15 characters";
        }
        if (/\s/.test(name)) {
            return "Username cannot contain spaces";
        }
        return null;
    };

    const handleSaveUsername = async () => {
        setErrorMessage("");
        setSuccessMessage("");

        const validationError = validateUsername(newUsername);
        if (validationError) {
            setErrorMessage(validationError); // מקפיץ את השגיאה ב-Toast
            return;
        }

        if (newUsername === user.username) return;

        setIsUpdatingName(true);

        try {
            const response = await updateUsername({ username: newUsername });

            if (response.success === true) {
                setUser({ ...user, username: newUsername });
                setSuccessMessage("Username updated successfully!");

                // העלמת הודעת ההצלחה אחרי כמה שניות
                setTimeout(() => setSuccessMessage(""), 5000);
            } else {
                setErrorMessage(getErrorMessage(response.errorCode));
            }
        } catch (error) {
            console.error("Error updating username:", error);

            if (error.response && error.response.data && error.response.data.errorCode) {
                setErrorMessage(getErrorMessage(error.response.data.errorCode));
            } else {
                setErrorMessage(getErrorMessage(9000));
            }
        } finally {
            setIsUpdatingName(false);
        }
    };

    const handleConfirmDeleteRequest = async () => {
        setIsDeleteModalOpen(false);
        setIsRequestingDelete(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const response = await requestAccountDeletion();

            if (response.success === true) {
                setSuccessMessage("A verification email has been sent. Please check your inbox.");
            } else {
                setErrorMessage(getErrorMessage(response.errorCode));
            }
        } catch (error) {
            console.error("Error requesting deletion:", error);
            setErrorMessage(getErrorMessage(9000));
        } finally {
            setIsRequestingDelete(false);
        }
    };

    if (loading) {
        return <div className="loading-container"><ClipLoader color="#36d7b7" /></div>;
    }

    if (!user) return null;

    const hasNameChanged = newUsername !== user.username;

    return (
        // התיקון כאן: שימוש ב-Fragment במקום ב-div.page-wrapper
        <>
            {/* הקפצת שגיאות באמצעות הקומפוננטה שלך */}
            <ErrorToast
                message={errorMessage}
                onClose={() => setErrorMessage("")}
            />

            <div className="profile-card-design">
                <div className="profile-avatar-large">
                    {user.username ? user.username.substring(0, 1).toUpperCase() : '👤'}
                </div>

                <div className="profile-edit-section">
                    <Input
                        name="username"
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        disabled={isUpdatingName || isRequestingDelete}
                        placeholder="Enter new username"
                        style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}
                    />

                    {hasNameChanged && (
                        <Button
                            className="btn-save-username"
                            onClick={handleSaveUsername}
                            disabled={isUpdatingName}
                        >
                            {isUpdatingName ? "Saving..." : "Save Changes"}
                        </Button>
                    )}
                </div>

                <p className="profile-display-email">{user.email}</p>

                {/* הצגת הודעת הצלחה אינליין (ללא Toast) */}
                {successMessage && (
                    <div className="profile-feedback-message success">
                        {successMessage}
                    </div>
                )}

                <div className="management-actions">
                    <Button
                        className="btn-change-password"
                        onClick={() => navigate('/manage-profile/change-password')}
                        disabled={isUpdatingName || isRequestingDelete}
                    >
                        Change Password
                    </Button>

                    <Button
                        className="btn-delete-account"
                        onClick={() => setIsDeleteModalOpen(true)}
                        disabled={isUpdatingName || isRequestingDelete}
                    >
                        {isRequestingDelete ? "Processing..." : "Delete Account"}
                    </Button>
                </div>

                <ConfirmModal
                    isOpen={isDeleteModalOpen}
                    title="Warning: Account Deletion"
                    message="Are you sure you want to request account deletion? An email will be sent to you to confirm this action."
                    confirmText="Yes, Send Email"
                    cancelText="Cancel"
                    onConfirm={handleConfirmDeleteRequest}
                    onCancel={() => setIsDeleteModalOpen(false)}
                />
            </div>
        </>
    );
}

export default ProfilePage;