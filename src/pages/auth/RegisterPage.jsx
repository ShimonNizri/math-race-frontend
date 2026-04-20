import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/ui/Input.jsx";

import { register } from "../../services/authService.js";

import ErrorToast from "../../components/ui/ErrorToast.jsx";
import { getErrorMessage } from "../../utils/errorMapper.js";

import './Auth.css'
import logo from "../../assets/logo.png";

function RegisterPage() {
    const navigate = useNavigate();

    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: ""
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

        setIsLoading(true);
        setErrorMessage("");

        try {
            const response = await register(formData);

            if (response.success === true) {
                console.log("Registered successfully!");
                setFormData({ username: "", email: "", password: "" });
                navigate("/");
            } else {
                const code = response.errorCode;

                setErrorMessage(getErrorMessage(code));

                if (code === 1002 || code === 1004) {
                    setFormData(prev => ({ ...prev, email: "", password: "" }));
                } else if (code === 1003) {
                    setFormData(prev => ({ ...prev, username: "" }));
                } else if (code === 1000) {
                }
            }
        } catch (err) {
            console.log("Registration failed:", err);

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

            <Card className="theme-green" >
                <div>
                    <img
                        src={logo}
                        alt="Math Race Logo"
                        className="dashboard-logo"
                    />

                    <h2>Welcome!</h2>
                    <p>
                        Ready to start? Create your profile to play<br/>
                        If you already have an account, you can log in
                        <Link to={`/auth/login`}> here</Link>
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Input
                        name={"username"}
                        placeholder={"Username"}
                        value={formData.username}
                        onChange={handleChange}
                        required
                        disabled={isLoading} // נטרול השדה בזמן טעינה
                    />
                    <Input
                        name={"email"}
                        type={"email"}
                        placeholder={"Email"}
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />
                    <Input
                        name={"password"}
                        type={"password"}
                        placeholder={"Password"}
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                </form>
            </Card>
        </div>
    )
}

export default RegisterPage;