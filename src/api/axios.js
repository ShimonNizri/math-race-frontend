import axios from "axios";
import {cookieService} from "../Services/cookieService.jsx";

const BASE_URL = 'http://localhost:8085/api';

const apiWithOutToken = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

const apiWithToken = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

apiWithToken.interceptors.request.use((config) => {
    const token = cookieService.getToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export {
    apiWithOutToken,
    apiWithToken,
};