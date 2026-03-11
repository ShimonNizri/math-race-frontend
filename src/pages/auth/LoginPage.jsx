import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import {useState} from "react";
import {Link, useNavigate} from "react-router-dom";

import "./Auth.css";
import {login} from "../../services/authService.js";
import {cookieService} from "../../services/cookieService.jsx";

function LoginPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await login(formData);
            if (response.success === true) {
                console.log(response);
                console.log("Logged in successfully!");
                cookieService.setToken(response.data.token,response.data.dayToSaveToken);
                navigate("/");

            }else {
                console.log("Login failed : " + response.message);
            }
        } catch (err) {
            console.log("Login failed:", err);
        }
    };

    return (
        <>
            <Card className={"auth-card"}>
                <div>
                    <h2>Welcome back!</h2>
                    <p>
                        To start playing and enjoy, just log in to your account first<br/>
                        If you don't have one, you can create one
                        <Link to={`/register`}> here</Link>
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
                    />
                    <Input
                        name={"password"}
                        type={"password"}
                        placeholder={"Password"}
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <Link to={"/forgot-password"}>Forgot password?</Link>
                    <Button type="submit">Sign in</Button>
                </form>
            </Card>
        </>
    )
}

export default LoginPage;