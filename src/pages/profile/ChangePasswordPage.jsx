import {useEffect, useState} from "react";
import { useNavigate, Link } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import { changePassword } from "../../services/authService.js";

import ErrorToast from "../../components/ui/ErrorToast.jsx";
import { getErrorMessage } from "../../utils/errorMapper.js";

import './ChangePasswordPage.css';

function ChangePasswordPage() {
    const navigate = useNavigate();

    const [alert, setAlert] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isLoading) return;

        // בדיקה שהסיסמאות החדשות תואמות לפני השליחה לשרת
        if (formData.newPassword !== formData.confirmPassword) {
            setErrorMessage("The new passwords do not match.");
            return;
        }

        setIsLoading(true);
        setErrorMessage("");
        setAlert(null);

        try {
            const response = await changePassword({
                oldPassword: formData.oldPassword,
                newPassword: formData.newPassword
            });

            if (response.success === true) {
                // הצגת מודאל ההצלחה
                setAlert({
                    title: "Success!",
                    message: "Password changed successfully! You are being redirected to manage profile.",
                    onClose: () => navigate('/manage-profile')
                });

                // מעבר אוטומטי אחרי 5 שניות
                setTimeout(() => navigate('/manage-profile'), 5000);
            } else {
                const code = response.errorCode;
                setErrorMessage(getErrorMessage(code));
            }
        } catch (err) {
            console.error(err);

            if (err.response && err.response.status === 404) {
                setErrorMessage(getErrorMessage(9001));
            } else {
                setErrorMessage(getErrorMessage(9000));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page-wrapper">

            <ErrorToast
                message={errorMessage}
                onClose={() => setErrorMessage("")}
            />

            <Card className="theme-red">
                <div>
                    <h2>Change Your Password</h2>
                    <p>Enter your current password and choose a new one (8-14 characters) to keep your account safe.</p>
                </div>

                <form className="change-password-form" onSubmit={handleSubmit}>
                    <Input
                        name={"oldPassword"}
                        type={"password"}
                        placeholder={"Current Password"}
                        value={formData.oldPassword}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />

                    <Input
                        name={"newPassword"}
                        type={"password"}
                        placeholder={"New Password"}
                        value={formData.newPassword}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />

                    <Input
                        name={"confirmPassword"}
                        type={"password"}
                        placeholder={"Confirm New Password"}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />

                    <Link to={"/auth/forgot-password"} className="forgot-password-link">
                        Forgot password?
                    </Link>

                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save Password"}
                    </Button>
                </form>

                {/* מודאל הצלחה נקי מבוסס CSS */}
                {alert && (
                    <div className="success-modal-overlay">
                        <div className="success-modal-box">
                            <button
                                className="success-modal-close"
                                onClick={alert.onClose}
                                title="Close"
                            >
                                <svg width="16" height="16" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>

                            <h3 className="success-modal-title">{alert.title}</h3>
                            <p className="success-modal-message">{alert.message}</p>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

export default ChangePasswordPage;