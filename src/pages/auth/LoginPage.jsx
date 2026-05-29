import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import {useState, useContext, useEffect} from "react";
import {Link, useLocation, useNavigate} from "react-router-dom";

import { login } from "../../services/authService.js";
import { WebSocketContext } from "../../services/webSocket/WebSocketContext.js";
import logo from "../../assets/logo.png";

import ErrorToast from "../../components/ui/ErrorToast.jsx";
import { getErrorMessage } from "../../utils/errorMapper.js";

function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const { updateAuthToken } = useContext(WebSocketContext);

    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const fromPath = location.state?.from?.pathname || "/";
    const fromSearch = location.state?.from?.search || "";
    const from = fromPath + fromSearch;

    useEffect(() => {
        if (location.state && location.state.alertMessage) {
            setErrorMessage(location.state.alertMessage);

            navigate(location.pathname, {
                replace: true,
                state: { from: location.state.from }
            });
        }
    }, [location, navigate]);

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
            const response = await login(formData);

            if (response.success === true) {
                updateAuthToken(response.data.token, response.data.dayToSaveToken);

                // שימוש ב-navigate במקום רענון עמוד מלא. מחזיר את המשתמש ליעד שחישבנו
                navigate(from, { replace: true });
            } else {
                const code = response.errorCode;
                setErrorMessage(getErrorMessage(code));

                if (code === 1005 || code === 1301) {
                    setFormData({ email: "", password: "" });
                }
            }
        } catch (err) {
            console.log("Login failed:", err);
            setErrorMessage(getErrorMessage(9000));
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
                <div>
                    <img
                        src={logo}
                        alt="Math Race Logo"
                        className="dashboard-logo"
                    />
                    <h2>Welcome back!</h2>
                    <p>
                        To start playing and enjoy, just log in to your account first<br/>
                        If you don't have one, you can create one
                        <Link to={`/auth/register`}> here</Link>
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
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
                    <Link to={"/auth/forgot-password"}>Forgot password?</Link>

                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign in"}
                    </Button>
                </form>
            </Card>
        </div>
    )
}

export default LoginPage;