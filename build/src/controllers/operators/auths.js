"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const simplenodejs_1 = require("@increase21/simplenodejs");
const helpers_1 = __importDefault(require("../../assets/helpers"));
const validator_1 = __importDefault(require("validator"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_operators_1 = require("../../models/user-operators");
const file_config_1 = require("../../assets/file-config");
const otp_requests_1 = require("../../models/otp-requests");
const var_config_1 = require("../../assets/var-config");
class OperatorAuthController extends simplenodejs_1.SimpleNodeJsController {
    /** Public Method: Login operator */
    async login() {
        //allow only post
        if (this.method !== "post")
            return helpers_1.default.outputError(this.res, 405);
        let email = helpers_1.default.getInputValueString(this.body, "email");
        let password = helpers_1.default.getInputValueString(this.body, "password");
        if (!email)
            return helpers_1.default.outputError(this.res, null, "Email is required");
        //if the email is invalid
        if (!validator_1.default.isEmail(email))
            return helpers_1.default.outputError(this.res, null, "Email is invalid");
        //check the password
        if (!password)
            return helpers_1.default.outputError(this.res, null, "password is required");
        if (password.length < 6) {
            return helpers_1.default.outputError(this.res, null, "Password must be 6 characters or more");
        }
        //check if there's capital letter
        if (!/[A-Z]/.test(password)) {
            return helpers_1.default.outputError(this.res, null, "password must have atleast one capital letter");
        }
        if (!/[a-z]/.test(password)) {
            return helpers_1.default.outputError(this.res, null, "password must have atleast one small letter");
        }
        if (!/[0-9]/.test(password)) {
            return helpers_1.default.outputError(this.res, null, "password must have atleast one number");
        }
        email = email.toLowerCase();
        let checkUser = await user_operators_1.UserOperatorModel.findOne({ email: email }, null, { lean: true }).catch(e => ({ error: e }));
        //if there's an error
        if (checkUser && checkUser.error) {
            console.log("Error on operator login", checkUser.error);
            return helpers_1.default.outputError(this.res, 500);
        }
        if (!checkUser)
            return helpers_1.default.outputError(this.res, null, "Invalid login credentials");
        if (!checkUser.password)
            return helpers_1.default.outputError(this.res, null, "Email or password incorrect");
        //if the password is invalid
        if (!bcrypt_1.default.compareSync(password, checkUser.password)) {
            return helpers_1.default.outputError(this.res, null, "Email or password incorrect");
        }
        //check if a user is suspended
        if (checkUser.account_status === 2) {
            return helpers_1.default.outputError(this.res, 401, `Your account has been suspended. ${checkUser.account_type === "team" ? "Please contact your administrator for more information." : "Kindly contact support for more information."}`);
        }
        //JWT token
        let JWTData = {
            auth_id: checkUser._id,
            user_type: "operator",
            account_type: checkUser.account_type,
            name: checkUser.business_name,
            operator_id: checkUser.account_type === "operator" ? checkUser._id : checkUser.operator_id
        };
        //delete the user's password
        delete checkUser.password;
        delete checkUser.__v;
        delete checkUser._id;
        checkUser.auth_id = JWTData.auth_id;
        let signinToken = jsonwebtoken_1.default.sign(JWTData, file_config_1.fileConfig.config.jwtSecret, { expiresIn: helpers_1.default.setJWTExpireTime() });
        helpers_1.default.logOperatorActivity({
            auth_id: JWTData.auth_id, operator_id: JWTData.operator_id,
            operation: "account-login", body: `Login to the portal`,
            data: { id: String(JWTData.auth_id), email: email },
        }).catch(e => { });
        return helpers_1.default.outputSuccess(this.res, { ...checkUser, token: signinToken });
    }
    //** Public Method: Register operator */
    async register() {
        //allow only post
        if (this.method !== "post")
            return helpers_1.default.outputError(this.res, 405);
        let email = helpers_1.default.getInputValueString(this.body, "email");
        let password = helpers_1.default.getInputValueString(this.body, "password");
        let businessName = helpers_1.default.getInputValueString(this.body, "business_name");
        let phoneNumber = helpers_1.default.getInputValueString(this.body, "phone_number");
        let businessNumber = helpers_1.default.getInputValueString(this.body, "business_number");
        let businessType = helpers_1.default.getInputValueString(this.body, "business_type");
        let country = helpers_1.default.getInputValueString(this.body, "country");
        let state = helpers_1.default.getInputValueString(this.body, "state");
        let fleetSize = helpers_1.default.getInputValueString(this.body, "fleet_size");
        if (!email)
            return helpers_1.default.outputError(this.res, null, "Email is required");
        if (!password)
            return helpers_1.default.outputError(this.res, null, "Password is required");
        if (!businessName)
            return helpers_1.default.outputError(this.res, null, "Business name is required");
        if (!country)
            return helpers_1.default.outputError(this.res, null, "Country is required");
        if (!businessType)
            return helpers_1.default.outputError(this.res, null, "Business type is required");
        if (!fleetSize)
            return helpers_1.default.outputError(this.res, null, "Fleet size is required");
        if (!["1", "2"].includes(businessType))
            return helpers_1.default.outputError(this.res, null, "Invalid business type");
        email = email.toLowerCase();
        if (!validator_1.default.isEmail(email))
            return helpers_1.default.outputError(this.res, null, "Email is invalid");
        if (email.length > 100)
            return helpers_1.default.outputError(this.res, null, "Email should not be more than 100 characters");
        if (password.length > 30)
            return helpers_1.default.outputError(this.res, null, "Password should not be more than 30 characters");
        if (password.length < 6)
            return helpers_1.default.outputError(this.res, null, "Password must be 6 characters or more");
        if (businessName.length > 100)
            return helpers_1.default.outputError(this.res, null, "Business name should not be more than 100 characters");
        if (businessName.length < 3)
            return helpers_1.default.outputError(this.res, null, "Business name must be 3 characters or more");
        if (!helpers_1.default.hasAlphabet(businessName, 2)) {
            return helpers_1.default.outputError(this.res, null, "Business name must have at least 2 letters");
        }
        //check if there's capital letter
        if (helpers_1.default.hasInvalidSearchChar(businessName)) {
            return helpers_1.default.outputError(this.res, null, "Business name should not have special characters");
        }
        if (phoneNumber) {
            if (!helpers_1.default.isNumber({ input: phoneNumber, type: "int", length: 11 })) {
                return helpers_1.default.outputError(this.res, null, "Phone number is invalid");
            }
        }
        if (!helpers_1.default.isNumber({ input: fleetSize, type: "int", maxLength: 6 })) {
            return helpers_1.default.outputError(this.res, null, "Fleet size is invalid");
        }
        if (country.length > 50)
            return helpers_1.default.outputError(this.res, null, "Country should not be more than 50 characters");
        if (state && state.length > 50)
            return helpers_1.default.outputError(this.res, null, "State should not be more than 50 characters");
        //if country has special characters
        if (helpers_1.default.hasInvalidSearchChar(country)) {
            return helpers_1.default.outputError(this.res, null, "Country should not have special characters");
        }
        if (state && helpers_1.default.hasInvalidSearchChar(state)) {
            return helpers_1.default.outputError(this.res, null, "State should not have special characters");
        }
        //check if there's capital letter
        if (!/[A-Z]/.test(password)) {
            return helpers_1.default.outputError(this.res, null, "Password must have atleast one capital letter");
        }
        if (!/[a-z]/.test(password)) {
            return helpers_1.default.outputError(this.res, null, "Password must have atleast one small letter");
        }
        if (!/[0-9]/.test(password)) {
            return helpers_1.default.outputError(this.res, null, "Password must have atleast one number");
        }
        //check if email exists
        const checkExisting = await user_operators_1.UserOperatorModel.findOne({
            $or: [{ email: email }, { business_name: { $regex: businessName, $options: 'i' } }]
        }, null, { lean: true }).catch(e => ({ error: e }));
        if (checkExisting && checkExisting.error) {
            console.log("Error checking existing operator during registration", checkExisting.error);
            return helpers_1.default.outputError(this.res, 500);
        }
        if (checkExisting && checkExisting.email_status !== 0) {
            // Determine which field(s) caused the conflict
            if (checkExisting.email === email) {
                return helpers_1.default.outputError(this.res, null, "Email already exists");
            }
            // For business_name, use regex match to check
            if (checkExisting.business_name === businessName) {
                return helpers_1.default.outputError(this.res, null, "Business name already exists");
            }
            return helpers_1.default.outputError(this.res, null, "Email or Business name already exists");
        }
        let qBuilder = {
            email: email, password: bcrypt_1.default.hashSync(password, 10),
            business_name: businessName, phone_number: phoneNumber,
            business_number: businessNumber, country: country, state: state,
            account_type: "operator", account_status: 0, fleet_size: parseInt(fleetSize),
            business_type: parseInt(businessType)
        };
        //create the operator account
        const createOp = checkExisting ? await user_operators_1.UserOperatorModel.findByIdAndUpdate(checkExisting._id, { $set: qBuilder }, { new: true, lean: true }).catch(e => ({ error: e })) : await user_operators_1.UserOperatorModel.create(qBuilder).catch(e => ({ error: e }));
        if (createOp && createOp.error) {
            console.log("Error creating operator account", createOp.error);
            return helpers_1.default.outputError(this.res, 500);
        }
        if (!createOp) {
            return helpers_1.default.outputError(this.res, null, "Failed to create operator account. Kindly retry");
        }
        let dateNow = new Date();
        dateNow.setMinutes(dateNow.getMinutes() + 10); //otp valid for 10 minutes
        let otpCode = helpers_1.default.generateOTPCode(4);
        //log the otp request
        let saveRequest = await otp_requests_1.OtpRequestModel.create({
            email: email, name: businessType === "1" ? businessName.split(" ")[0] : businessName,
            pin: otpCode, expired_at: dateNow,
            otp_type: var_config_1.varConfig.otp_type[1], subject: "Complete Your Registration",
            status: 0, user_type: "operator",
            data: { email: email, name: businessName, user_type: "operator" },
        }).catch(e => ({ error: e }));
        //check for error
        if (saveRequest && saveRequest.error) {
            console.log("Error creating registration OTP for operator", saveRequest.error);
            return helpers_1.default.outputError(this.res, 500);
        }
        //if failed to create the account
        if (!saveRequest) {
            return helpers_1.default.outputError(this.res, null, helpers_1.default.errorText.failedToProcess);
        }
        return helpers_1.default.outputSuccess(this.res, { email, otp_code: file_config_1.fileConfig.config.env !== "live" ? otpCode : undefined });
    }
    /** Public Method: To get a password reset code */
    async forgotPassword() {
        //if the method is invalid
        if (this.method !== "post")
            return helpers_1.default.outputError(this.res, 405);
        let email = helpers_1.default.getInputValueString(this.body, "email");
        //if the email is invalid
        if (!email)
            return helpers_1.default.outputError(this.res, null, "Email is required");
        //if not a valid email
        if (!validator_1.default.isEmail(email))
            return helpers_1.default.outputError(this.res, null, "Invalid email address");
        email = email.toLowerCase();
        let getData = await user_operators_1.UserOperatorModel.findOne({ email: email }, null, { lean: true }).catch(e => ({ error: e }));
        //if there's an error
        if (getData && getData.error) {
            console.log("Error on forget password operator", getData.error);
            return helpers_1.default.outputError(this.res, 500);
        }
        //if there's no account
        if (!getData)
            return helpers_1.default.outputError(this.res, null, "No account found");
        let dateNow = new Date();
        dateNow.setMinutes(dateNow.getMinutes() + 10); //otp valid for 10 minutes
        let otpCode = helpers_1.default.generateOTPCode(4);
        //log the otp request
        let saveRequest = await otp_requests_1.OtpRequestModel.create({
            email: email, name: getData.account_type === 1 ? getData.business_name.split(" ")[0] : getData.business_logo,
            pin: otpCode, expired_at: dateNow,
            otp_type: var_config_1.varConfig.otp_type[0], subject: "Password Reset",
            status: 0, user_type: "operator",
            data: { email: email, name: getData.business_name, user_type: "operator" },
        }).catch(e => ({ error: e }));
        //check for error
        if (saveRequest && saveRequest.error) {
            console.log("Error creating reset password for operator", saveRequest.error);
            return helpers_1.default.outputError(this.res, 500);
        }
        //if failed to create the account
        if (!saveRequest) {
            return helpers_1.default.outputError(this.res, null, helpers_1.default.errorText.failedToProcess);
        }
        helpers_1.default.logOperatorActivity({
            auth_id: getData._id, operator_id: getData.operator_id || getData._id,
            operation: "account-forgotpass", body: `Initiate forgot password process`,
            data: { id: String(getData._id), email: email },
        }).catch(e => { });
        return helpers_1.default.outputSuccess(this.res, file_config_1.fileConfig.config.env !== "live" ? { otp_code: otpCode } : {});
    }
    //** Public Method: To reset password */
    async resetPassword() {
        //allow only put
        if (this.method !== "post")
            return helpers_1.default.outputError(this.res, 405);
        let otp = helpers_1.default.getInputValueString(this.body, "otp_code");
        let newPass = helpers_1.default.getInputValueString(this.body, "new_password");
        let email = helpers_1.default.getInputValueString(this.body, "email");
        if (!email) {
            return helpers_1.default.outputError(this.res, null, "Email is required");
        }
        email = email.toLowerCase();
        //if the email is invalid
        if (!validator_1.default.isEmail(email)) {
            return helpers_1.default.outputError(this.res, null, "Email is invalid");
        }
        if (!otp) {
            return helpers_1.default.outputError(this.res, null, "OTP is required");
        }
        if (otp.length !== 4) {
            return helpers_1.default.outputError(this.res, null, "OTP should have 4 characters");
        }
        if (!newPass) {
            return helpers_1.default.outputError(this.res, null, "New password is required");
        }
        if (newPass.length < 6) {
            return helpers_1.default.outputError(this.res, null, "New Password must be 6 characters or more");
        }
        if (!/[A-Z]/.test(newPass)) {
            return helpers_1.default.outputError(this.res, null, "New password must have atleast one capital letter");
        }
        if (!/[a-z]/.test(newPass)) {
            return helpers_1.default.outputError(this.res, null, "New password must have atleast one small letter");
        }
        if (!/[0-9]/.test(newPass)) {
            return helpers_1.default.outputError(this.res, null, "New password must have atleast one number");
        }
        //check if the OTP was sent and confirmed
        let getOTPConfim = await otp_requests_1.OtpRequestModel.findOne({
            email: email, pin: otp, user_type: "operator"
        }, null, { lean: true }).catch(e => ({ error: e }));
        //check for error
        if (getOTPConfim && getOTPConfim.error) {
            console.log("Error checking otp for reset operator pass", getOTPConfim.error);
            return helpers_1.default.outputError(this.res, 500);
        }
        //if a record is found
        if (!getOTPConfim)
            return helpers_1.default.outputError(this.res, null, "Request not found");
        //if the OTP type is not registration
        if (getOTPConfim.otp_type !== var_config_1.varConfig.otp_type[0]) {
            return helpers_1.default.outputError(this.res, null, "Request not found");
        }
        //if the OTP has not been confirmed
        if (getOTPConfim.status !== 1)
            return helpers_1.default.outputError(this.res, null, "Failed: OTP not confirmed");
        //if the OTP is expired
        let now = new Date();
        //check expiry
        if (!getOTPConfim.expired_at || new Date(getOTPConfim.expired_at) < now) {
            return helpers_1.default.outputError(this.res, null, "OTP has expired. Kindly retry the process again");
        }
        let checkUser = await user_operators_1.UserOperatorModel.findOne({ email: getOTPConfim.email }, null, { lean: true }).catch(e => ({ error: e }));
        //check for error
        if (checkUser && checkUser.error) {
            console.log("Error getting operator account for updating new password", checkUser.error);
            return helpers_1.default.outputError(this.res, 500);
        }
        if (!checkUser) {
            return helpers_1.default.outputError(this.res, null, "Account not found");
        }
        //check password against old password
        if (checkUser.password && bcrypt_1.default.compareSync(newPass, checkUser.password)) {
            return helpers_1.default.outputError(this.res, null, "You cannot reuse your old password");
        }
        let updatePassword = await user_operators_1.UserOperatorModel.findOneAndUpdate({ _id: checkUser._id }, {
            $set: { password: bcrypt_1.default.hashSync(newPass, 10) }
        }, { lean: true, new: true }).catch(e => ({ error: e }));
        //if there's an error
        if (updatePassword && updatePassword.error) {
            console.log("Error resetting operator pass", updatePassword.error);
            return helpers_1.default.outputError(this.res, 500);
        }
        if (!updatePassword) {
            return helpers_1.default.outputError(this.res, null, helpers_1.default.errorText.failedToProcess);
        }
        //update the OTP to used
        await otp_requests_1.OtpRequestModel.findByIdAndUpdate(getOTPConfim._id, { $set: { status: 2 } }).catch(e => ({ error: e }));
        helpers_1.default.logOperatorActivity({
            auth_id: updatePassword._id, operator_id: updatePassword.operator_id || updatePassword._id,
            operation: "account-resetpass", body: `Reset password successfully`,
            data: { id: String(updatePassword._id), email: email },
        }).catch(e => { });
        return helpers_1.default.outputSuccess(this.res);
    }
    //endpoint to confirm OTP
    async confirmOtp() {
        //allow only put
        if (this.method !== "post")
            return helpers_1.default.outputError(this.res, 405);
        let otp = helpers_1.default.getInputValueString(this.body, "otp_code");
        let email = helpers_1.default.getInputValueString(this.body, "email");
        if (!email)
            return helpers_1.default.outputError(this.res, null, "Email is required");
        email = email.toLowerCase();
        //if the email is invalid
        if (!validator_1.default.isEmail(email))
            return helpers_1.default.outputError(this.res, null, "Email is invalid");
        if (!otp)
            return helpers_1.default.outputError(this.res, null, "OTP is required");
        if (otp.length !== 4)
            return helpers_1.default.outputError(this.res, null, "OTP should have 4 characters");
        let getOTPConfim = await otp_requests_1.OtpRequestModel.findOne({
            email: email, pin: otp, user_type: "operator"
        }, null, { lean: true }).catch(e => ({ error: e }));
        //check for error
        if (getOTPConfim && getOTPConfim.error) {
            console.log("Error confirming otp for operator", getOTPConfim.error);
            return helpers_1.default.outputError(this.res, 500);
        }
        //if a record is found
        if (!getOTPConfim)
            return helpers_1.default.outputError(this.res, null, "Request not found");
        //if the OTP type is not registration
        if (![var_config_1.varConfig.otp_type[0], var_config_1.varConfig.otp_type[1]].includes(getOTPConfim.otp_type)) {
            return helpers_1.default.outputError(this.res, null, "Request not found");
        }
        //if the OTP has already been confirmed
        if (getOTPConfim.status === 1)
            return helpers_1.default.outputError(this.res, null, "OTP already confirmed");
        //if the OTP is expired
        let now = new Date();
        //check expiry
        if (!getOTPConfim.expired_at || new Date(getOTPConfim.expired_at) < now) {
            return helpers_1.default.outputError(this.res, null, "OTP has expired");
        }
        //update the OTP to confirmed
        let updateOTP = await otp_requests_1.OtpRequestModel.findByIdAndUpdate(getOTPConfim._id, { $set: { status: 1 } }, { lean: true, new: true }).catch(e => ({ error: e }));
        //check for error
        if (updateOTP && updateOTP.error) {
            console.log("Error updating otp to confirmed for operator", updateOTP.error);
            return helpers_1.default.outputError(this.res, 500);
        }
        if (!updateOTP) {
            return helpers_1.default.outputError(this.res, null, helpers_1.default.errorText.failedToProcess);
        }
        //if the OTP is for registration, update the operator account to active
        if (updateOTP.otp_type === var_config_1.varConfig.otp_type[1]) {
            await user_operators_1.UserOperatorModel.findOneAndUpdate({ email: email, email_status: 0 }, { $set: { email_status: 1 } }).catch(e => ({ error: e }));
        }
        return helpers_1.default.outputSuccess(this.res);
    }
}
exports.default = OperatorAuthController;
