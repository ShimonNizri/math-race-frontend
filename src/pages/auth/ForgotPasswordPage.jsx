import Card from "../../components/ui/Card.jsx";
import { Link } from "react-router-dom";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import { useState } from "react";

import { forgotPassword } from "../../services/authService.js";

import ErrorToast from "../../components/ui/ErrorToast.jsx";
import { getErrorMessage } from "../../utils/errorMapper.js";

import logo from "../../assets/logo.png";
import './Auth.css'

function ForgotPasswordPage() {
    const [email, setEmail] = useState("");

    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isLoading) return;

        setIsLoading(true);
        setErrorMessage("");

        try {
            const response = await forgotPassword(email);

            if (response.success === true) {
                console.log("Password reset link sent to:", email);
                setIsSuccess(true);
                setEmail("");
            } else {
                const code = response.errorCode;

                setErrorMessage(getErrorMessage(code));

                if (code === 1301) {
                    setEmail("");
                }
            }
        } catch (err) {
            console.log("Failed to request password reset:", err);

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

            <Card className="theme-yellow">
                {!isSuccess ? (
                    <>
                        <img
                            src={logo}
                            alt="Math Race Logo"
                            className="dashboard-logo"
                        />

                        <h2>Forgot your password?</h2>
                        <p>
                            Don't worry, it happens! Enter your email address below and we'll send you a reset link<br/>
                            If you remember your password, you can return to the login page
                            <Link to={`/auth/login`}> here</Link>
                        </p>

                        <form onSubmit={handleSubmit}>
                            <Input
                                name={"email"}
                                type={"email"}
                                placeholder={"Email"}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Sending..." : "Send Reset Link"}
                            </Button>
                        </form>
                    </>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h2>Check Your Email</h2>
                        <p>
                            We've sent a password reset link to your email address.
                            Please check your inbox (and spam folder) to continue.
                        </p>
                        <Link to={`/auth/login`} style={{ alignSelf: 'center', marginTop: '10px' }}>
                            <Button type="button">Return to Login</Button>
                        </Link>
                    </div>
                )}
            </Card>
        </div>
    )
}

export default ForgotPasswordPage;