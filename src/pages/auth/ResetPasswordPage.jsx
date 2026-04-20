import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import PasswordForm from "../../components/auth/PasswordForm.jsx";
import { AlertModal, ALERT_TYPES } from "../../components/ui/AlertModal.jsx";
import { resetPassword } from "../../services/authService.js";

import ErrorToast from "../../components/ui/ErrorToast.jsx";
import { getErrorMessage } from "../../utils/errorMapper.js";

import './Auth.css'

function ResetPasswordPage() {
    const navigate = useNavigate();
    const { token } = useParams();

    const [alert, setAlert] = useState(null);

    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleAction = async (password) => {
        if (isLoading) return;

        setIsLoading(true);
        setErrorMessage("");
        setAlert(null);

        try {
            const response = await resetPassword(password, token);

            if (response.success === true) {
                setAlert({
                    type: ALERT_TYPES.SUCCESS,
                    title: "Reset Successful",
                    message: "Your password has been reset. Please log in with your new password.",
                    onClose: () => navigate('/auth/login')
                });

                setTimeout(() => navigate('/auth/login'), 5000);
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

            <Card className="theme-blue">
                <PasswordForm
                    onSubmit={handleAction}
                    isLoading={isLoading}
                    header={
                        <>
                            <h2>Create New Password</h2>
                            <p>Enter your new password below to regain access to your account.</p>
                        </>
                    }
                    buttonText={isLoading ? "Resetting..." : "Reset & Login"}
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

export default ResetPasswordPage;