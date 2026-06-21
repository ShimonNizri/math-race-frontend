import axios from "axios";
import {cookieService} from "../services/cookieService.js";

const IP_SERVER = '10.36.92.56:8085';
const BASE_URL = `http://${IP_SERVER}/api`;

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

const apiWithAdminToken = axios.create({
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

apiWithAdminToken.interceptors.request.use((config) => {
    const admin_token = cookieService.getAdminToken();

    if (admin_token) {
        config.headers.Authorization = `Bearer ${admin_token}`;
    }

    return config;
}, (error) => {
    console.log("Something went wrong");
    return Promise.reject(error);
});

export {
    apiWithOutToken,
    apiWithToken,
    apiWithAdminToken,
    IP_SERVER
};