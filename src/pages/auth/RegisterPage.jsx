import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import Input from "../../components/ui/Input.jsx";

import "./Auth.css";
import {register} from "../../services/authService.js";

function RegisterPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: ""
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
            await register(formData);
            console.log("Registered successfully!");

            navigate("/");
        } catch (err) {
            console.log("Registration failed:", err);
        }
    };

    return (
        <>
            <Card className="auth-card">
                <div>
                    <h2>Welcome</h2>
                    <p>
                        Ready to start? Create your profile to play<br/>
                        If you already have an account, you can log in
                        <Link to={`/login`}> here</Link>
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Input
                        name={"username"}
                        placeholder={"Username"}
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
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
                    <Button type="submit">Create Account</Button>
                </form>
            </Card>
        </>
    )
}

export default RegisterPage;