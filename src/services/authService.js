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

const verifyAccount = async (token) => {
    const response = await apiWithOutToken.post('/auth/verify-account', {token});
    return response.data;
};

const resetPassword = async (newPassword,token) => {
    const response = await apiWithOutToken.post('/auth/reset-password', {
        token: token,
        newPassword: newPassword
    });
    return response.data;
};

const changePassword = async (data) => {
    const response = await apiWithToken.post('/auth/change-password', {
        newPassword: data.newPassword,
        oldPassword: data.oldPassword,
    });
    return response.data;
};

const createGuestToken = async () => {
    const response = await apiWithOutToken.post('/auth/create-guestToken');
    return response.data;
};

export {
    login,
    register,
    forgotPassword,
    resetPassword,
    verifyAccount,
    changePassword,
    createGuestToken,
};