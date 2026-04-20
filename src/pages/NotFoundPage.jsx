import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";

function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="page-wrapper">
            <Card className="theme-yellow" style={{ maxWidth: '500px', textAlign: 'center' }}>

                <img
                    src={logo}
                    alt="Math Race Logo"
                    className="dashboard-logo"
                    style={{ marginBottom: '24px', maxWidth: '250px', width: '100%' }}
                />

                <h1 style={{
                    fontSize: '80px',
                    margin: '0',
                    color: 'var(--yellow)',
                    textShadow: '4px 4px 0 var(--code-bg)',
                    lineHeight: '1'
                }}>
                    404
                </h1>

                <h2 style={{ fontSize: '28px', marginTop: '16px', marginBottom: '8px' }}>
                    Oops! You're Lost
                </h2>

                <p style={{ marginBottom: '32px', color: 'var(--text)', fontSize: '18px', lineHeight: '1.5' }}>
                    Looks like you wandered off the track. The page or room you are looking for doesn't exist.
                </p>

                <Button onClick={() => navigate('/')}>
                    Back to Dashboard
                </Button>

            </Card>
        </div>
    );
}

export default NotFoundPage;