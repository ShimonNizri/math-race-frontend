import {BrowserRouter, Routes, Route} from 'react-router-dom';

import './App.css'
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import DashboardPage from "./pages/dashboard/DashboardPage.jsx";
import GameHistoryPage from "./pages/history/GameHistoryPage.jsx";
import GameDetailsPage from "./pages/history/GameDetailsPage.jsx";
import JoinRacePage from "./pages/race/JoinRacePage.jsx";
import VerifyAccountPage from "./pages/auth/VerifyAccountPage.jsx";
import ChangePasswordPage from "./pages/auth/ChangePasswordPage.jsx";

function App() {

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/register" element={<RegisterPage/>}/>
                <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
                <Route path="/change-password" element={<ChangePasswordPage/>}/>
                <Route path="/reset-password/:token" element={<ResetPasswordPage/>}/>
                <Route path="/verify/:token" element={<VerifyAccountPage/>}/>

                <Route path="/race/join" element={<JoinRacePage/>}/>

                <Route element={<MainLayout />}>
                    <Route path="/" element={<DashboardPage/>}/>
                    <Route path="/history" element={<GameHistoryPage/>}/>
                    <Route path="/history/:gameId" element={<GameDetailsPage/>}/>
                </Route>
            </Routes>
        </BrowserRouter>

    )
}

export default App
