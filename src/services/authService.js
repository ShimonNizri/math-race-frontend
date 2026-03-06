import {apiWithOutToken, apiWithToken} from "../api/axios";

const login = async (credentials) => {
    const response = await apiWithOutToken.post('/auth/login', credentials);
    return response.data;
}

const register = async (userData) => {
    const response = await apiWithOutToken.post('/auth/register', userData);
    return response.data;
};

const forgotPassword = async (email) => {
    const response = await apiWithOutToken.post('/auth/forgot-password', {email});
    return response.data;
};

const changePassword = async (newPassword) => {
    const token = localStorage.getItem('token');

    const response = await apiWithToken().post('/auth/change-password', {password: newPassword});
    return response.data;
};

export {
    login,
    register,
    forgotPassword,
    changePassword
};