export const getErrorMessage = (errorCode) => {
    const errors = {
        1000: "Missing details. Please fill out all fields.",
        9000: "An unexpected server error occurred. Please try again.",
        9001: "The requested path does not exist.",

        // Login Errors
        1001: "Incorrect email or password.",
        1005: "Email is not verified. A new verification email has been sent.",
        1301: "Email is not verified. A verification link was sent recently, please check your inbox.",

        // Register Errors
        1004: "Cannot register with this email (account deleted).",
        1002: "This email is already registered.",
        1003: "This username is already taken.",

        // Verify Account Errors
        1100: "Invalid or expired token.",
        1007: "Account not found.",

        // Forgot / Reset Password
        1006: "Email not found in our system.",
        1008: "New password cannot be the same as the old one."
    };

    return errors[errorCode] || "An unknown error occurred.";
};