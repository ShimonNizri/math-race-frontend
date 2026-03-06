import Card from "../../components/ui/Card.jsx";
import {Link} from "react-router-dom";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import {useState} from "react";

import "./Auth.css";
import {forgotPassword} from "../../services/authService.js";

function ForgotPasswordPage() {
    const [email, setEmail] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await forgotPassword(email);
            console.log("Password reset link sent to:", email);
        } catch (err) {
            console.log("Failed to request password reset:", err);
        }
    };

    return (
        <>
            <Card className="auth-card">
                <h2>Forgot your password?</h2>
                <p>
                    Don't worry, it happens! Enter your email address below and we'll send you a reset link<br/>
                    If you remember your password, you can return to the login page
                    <Link to={`/login`}> here</Link>
                </p>

                <form onSubmit={handleSubmit}>
                    <Input
                        name={"email"}
                        type={"email"}
                        placeholder={"Email"}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Button type="submit">Send Reset Link</Button>
                </form>
            </Card>
        </>
    )
}

export default ForgotPasswordPage;