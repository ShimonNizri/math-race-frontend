import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import PasswordForm from "../../components/auth/PasswordForm.jsx";
import { AlertModal, ALERT_TYPES } from "../../components/ui/AlertModal.jsx";
import { changePassword } from "../../services/authService.js";

import ErrorToast from "../../components/ui/ErrorToast.jsx";
import { getErrorMessage } from "../../utils/errorMapper.js";

import './Auth.css'

function ChangePasswordPage() {
    const navigate = useNavigate();

    const [alert, setAlert] = useState(null);

    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleAction = async (password) => {
        if (isLoading) return;

        setIsLoading(true);
        setErrorMessage("");
        setAlert(null);

        try {
            const response = await changePassword(password);

            if (response.success === true) {
                setAlert({
                    type: ALERT_TYPES.SUCCESS,
                    title: "Success",
                    message: "Password changed successfully! You are being redirected home.",
                    onClose: () => navigate('/')
                });

                setTimeout(() => navigate('/'), 5000);
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
                <PasswordForm
                    onSubmit={handleAction}
                    isLoading={isLoading}
                    header={
                        <>
                            <h2>Change The Password</h2>
                            <p>Choose a password (8-14 characters) to keep your account safe.</p>
                        </>
                    }
                    buttonText={isLoading ? "Saving..." : "Save Password"}
                />

                {alert && (
                    <AlertModal
                        type={alert.type}
                        title={alert.title}
                        onClose={alert.onClose || (() => setAlert(null))}
                    >
                        <p>{alert.message}</p>
                    </AlertModal>
                )}
            </Card>
        </div>
    );
}

export default ChangePasswordPage;