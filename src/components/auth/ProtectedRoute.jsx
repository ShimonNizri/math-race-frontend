import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute({ user }) {
    if (!user) {
        return <Navigate
            to="/auth/login"
            replace
            state={{ alertMessage: "You need to log in or create an account to access this feature." }}
        />;
    }

    return <Outlet />;
}

export default ProtectedRoute;