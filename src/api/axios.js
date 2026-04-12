import axios from "axios";
import {cookieService} from "../services/cookieService.js";

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
    const auth_token = cookieService.getAuthToken();
    const guest_token = cookieService.getGuestToken();

    if (auth_token) {
        config.headers.Authorization = `Bearer ${auth_token}`;
    }

    if (guest_token){
        config.headers.GuestToken = guest_token;
    }

    return config;
}, (error) => {
    console.log("Something went wrong");
    return Promise.reject(error);
});

export {
    apiWithOutToken,
    apiWithToken,
};