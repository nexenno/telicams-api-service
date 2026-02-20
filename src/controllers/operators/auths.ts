import { SimpleNodeJsController } from "@increase21/simplenodejs";
import helpers from "../../assets/helpers";
import validator from "validator";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";
import { UserOperatorModel, UserOperatorTypes } from "../../models/user-operators";
import { JWTTokenPayload, SendDBQuery } from "../../typings/general";
import { fileConfig } from "../../assets/file-config";
import { OtpRequestModel, OtpRequestTypes } from "../../models/otp-requests";
import { varConfig } from "../../assets/var-config";


export class OperatorAuthController extends SimpleNodeJsController {

  /** Public Method: Login operator */
  async login() {
    //allow only post
    if (this.method !== "post") return helpers.outputError(this.res, 405)

    let email = helpers.getInputValueString(this.body, "email")
    let password = helpers.getInputValueString(this.body, "password")

    if (!email) return helpers.outputError(this.res, null, "Email is required")

    //if the email is invalid
    if (!validator.isEmail(email)) return helpers.outputError(this.res, null, "Email is invalid")

    //check the password
    if (!password) return helpers.outputError(this.res, null, "password is required")

    if (password.length < 6) {
      return helpers.outputError(this.res, null, "Password must be 6 characters or more")
    }

    //check if there's capital letter
    if (!/[A-Z]/.test(password)) {
      return helpers.outputError(this.res, null, "password must have atleast one capital letter")
    }
    if (!/[a-z]/.test(password)) {
      return helpers.outputError(this.res, null, "password must have atleast one small letter")
    }
    if (!/[0-9]/.test(password)) {
      return helpers.outputError(this.res, null, "password must have atleast one number")
    }

    email = email.toLowerCase()

    let checkUser: SendDBQuery = await UserOperatorModel.findOne({ email: email }, null, { lean: true }).catch(e => ({ error: e }))

    if (checkUser && checkUser.error) {
      console.log("Error on operator login", checkUser.error)
      return helpers.outputError(this.res, 500)
    }

    if (!checkUser) return helpers.outputError(this.res, null, "Invalid login credentials")

    if (!checkUser.password) return helpers.outputError(this.res, null, "Email or password incorrect")

    //if the password is invalid
    if (!bcrypt.compareSync(password, checkUser.password)) {
      return helpers.outputError(this.res, null, "Email or password incorrect")
    }

    //check if a user is suspended
    if (checkUser.account_status === 2) {
      return helpers.outputError(this.res, 401, "Your account has been suspended. Kindly contact support")
    }

    //JWT token
    let JWTData: JWTTokenPayload = {
      auth_id: checkUser._id,
      user_type: "operator",
      name: checkUser.business_name,
      operator_id: checkUser.account_type === "operator" ? checkUser._id : checkUser.operator_id
    }

    //delete the user's password
    delete checkUser.password
    delete checkUser.__v
    delete checkUser._id
    checkUser.auth_id = JWTData.auth_id
    let signinToken = JWT.sign(JWTData, fileConfig.config.jwtSecret, { expiresIn: helpers.setJWTExpireTime() })

    // helpers.logOperatorActivity({
    //   auth_id: JWTData.auth_id, operator_id: JWTData.operator_id as string,
    //   operation: "account-login", body: `Login to the portal`,
    //   data: { id: String(JWTData.auth_id), email: email },
    // }).catch(e => { })

    return helpers.outputSuccess(this.res, { ...checkUser, token: signinToken })
  }

  //** Public Method: Register operator */
  async register() {
    //allow only post
    if (this.method !== "post") return helpers.outputError(this.res, 405)

    let email = helpers.getInputValueString(this.body, "email")
    let password = helpers.getInputValueString(this.body, "password")
    let businessName = helpers.getInputValueString(this.body, "business_name")
    let phoneNumber = helpers.getInputValueString(this.body, "phone_number")
    let businessNumber = helpers.getInputValueString(this.body, "business_number")
    let businessType = helpers.getInputValueString(this.body, "business_type")
    let country = helpers.getInputValueString(this.body, "country")
    let state = helpers.getInputValueString(this.body, "state")
    let fleetSize = helpers.getInputValueString(this.body, "fleet_size")

    if (!email) return helpers.outputError(this.res, null, "Email is required")

    if (!password) return helpers.outputError(this.res, null, "Password is required")

    if (!businessName) return helpers.outputError(this.res, null, "Business name is required")

    if (!country) return helpers.outputError(this.res, null, "Country is required")

    if (!businessType) return helpers.outputError(this.res, null, "Business type is required")

    if (!fleetSize) return helpers.outputError(this.res, null, "Fleet size is required")

    if (!["1", "2"].includes(businessType)) return helpers.outputError(this.res, null, "Invalid business type")

    email = email.toLowerCase()

    if (!validator.isEmail(email)) return helpers.outputError(this.res, null, "Email is invalid")
    if (email.length > 100) return helpers.outputError(this.res, null, "Email should not be more than 100 characters")
    if (password.length > 30) return helpers.outputError(this.res, null, "Password should not be more than 30 characters")
    if (password.length < 6) return helpers.outputError(this.res, null, "Password must be 6 characters or more")
    if (businessName.length > 100) return helpers.outputError(this.res, null, "Business name should not be more than 100 characters")
    if (businessName.length < 3) return helpers.outputError(this.res, null, "Business name must be 3 characters or more")
    if (!helpers.hasAlphabet(businessName, 2)) {
      return helpers.outputError(this.res, null, "Business name must have at least 2 letters")
    }
    //check if there's capital letter
    if (helpers.hasInvalidSearchChar(businessName)) {
      return helpers.outputError(this.res, null, "Business name should not have special characters")
    }

    if (phoneNumber) {
      if (!helpers.isNumber({ input: phoneNumber, type: "int", length: 11 })) {
        return helpers.outputError(this.res, null, "Phone number is invalid")
      }
    }

    if (!helpers.isNumber({ input: fleetSize, type: "int", maxLength: 6 })) {
      return helpers.outputError(this.res, null, "Fleet size is invalid")
    }

    if (country.length > 50) return helpers.outputError(this.res, null, "Country should not be more than 50 characters")
    if (state && state.length > 50) return helpers.outputError(this.res, null, "State should not be more than 50 characters")
    //if country has special characters
    if (helpers.hasInvalidSearchChar(country)) {
      return helpers.outputError(this.res, null, "Country should not have special characters")
    }

    if (state && helpers.hasInvalidSearchChar(state)) {
      return helpers.outputError(this.res, null, "State should not have special characters")
    }

    //check if there's capital letter
    if (!/[A-Z]/.test(password)) {
      return helpers.outputError(this.res, null, "Password must have atleast one capital letter")
    }
    if (!/[a-z]/.test(password)) {
      return helpers.outputError(this.res, null, "Password must have atleast one small letter")
    }
    if (!/[0-9]/.test(password)) {
      return helpers.outputError(this.res, null, "Password must have atleast one number")
    }

    //check if email exists
    const checkExisting: SendDBQuery = await UserOperatorModel.findOne({
      $or: [{ email: email }, { business_name: { $regex: businessName, $options: 'i' } }]
    }, null, { lean: true }).catch(e => ({ error: e }));

    if (checkExisting && checkExisting.error) {
      console.log("Error checking existing operator during registration", checkExisting.error);
      return helpers.outputError(this.res, 500);
    }

    if (checkExisting) {
      // Determine which field(s) caused the conflict
      if (checkExisting.email === email) {
        return helpers.outputError(this.res, null, "Email already exists");
      }
      // For business_name, use regex match to check
      if (checkExisting.business_name === businessName) {
        return helpers.outputError(this.res, null, "Business name already exists");
      }
      return helpers.outputError(this.res, null, "Email or Business name already exists");
    }

    //create the operator account
    const createOp: SendDBQuery = await UserOperatorModel.create({
      email: email, password: bcrypt.hashSync(password, 10),
      business_name: businessName, phone_number: phoneNumber,
      business_number: businessNumber, country: country, state: state,
      account_type: "operator", account_status: 0, fleet_size: parseInt(fleetSize),
      business_type: parseInt(businessType)
    }).catch(e => ({ error: e }));

    if (createOp && createOp.error) {
      console.log("Error creating operator account", createOp.error)
      return helpers.outputError(this.res, 500)
    }

    if (!createOp) {
      return helpers.outputError(this.res, null, "Failed to create operator account. Kindly retry")
    }

    //get the created user as object
    let checkUser = createOp.toObject();

    //JWT token
    let JWTData: JWTTokenPayload = {
      auth_id: checkUser._id,
      user_type: "operator",
      name: checkUser.business_name,
      operator_id: checkUser._id
    }

    //delete the user's password
    delete checkUser.password
    delete checkUser.__v
    delete checkUser._id
    checkUser.auth_id = JWTData.auth_id

    let signinToken = JWT.sign(JWTData, fileConfig.config.jwtSecret, { expiresIn: helpers.setJWTExpireTime() })


    return helpers.outputSuccess(this.res, { ...checkUser, token: signinToken })
  }

  /** Public Method: To get a password reset code */
  async forgotPassword() {
    //if the method is invalid
    if (this.req.method !== "post") return helpers.outputError(this.res, 405)

    let email = helpers.getInputValueString(this.body, "email")

    //if the email is invalid
    if (!email) return helpers.outputError(this.res, null, "Email is required")

    //if not a valid email
    if (!validator.isEmail(email)) return helpers.outputError(this.res, null, "Invalid email address")

    email = email.toLowerCase()

    let getData: SendDBQuery<UserOperatorTypes> = await UserOperatorModel.findOne({ email: email }, null,
      { lean: true }).catch(e => ({ error: e }))

    //if there's an error
    if (getData && getData.error) {
      console.log("Error on forget password operator", getData.error)
      return helpers.outputError(this.res, 500)
    }

    //if there's no account
    if (!getData) return helpers.outputError(this.res, null, "No account found")

    let dateNow = new Date();
    dateNow.setMinutes(dateNow.getMinutes() + 10); //otp valid for 10 minutes
    let otpCode = helpers.generateOTPCode(4);

    //log the otp request
    let saveRequest: SendDBQuery = await OtpRequestModel.create({
      email: email, name: getData.account_type === 1 ? getData.business_name.split(" ")[0] : getData.business_logo,
      pin: otpCode, expired_at: dateNow,
      otp_type: varConfig.otp_type[0], subject: "Password Reset",
      status: 0, user_type: "operator",
      data: { email: email, name: getData.business_name, user_type: "operator" },
    }).catch(e => ({ error: e }));

    //check for error
    if (saveRequest && saveRequest.error) {
      console.log("Error creating reset password for operator", saveRequest.error)
      return helpers.outputError(this.res, 500);
    }

    //if failed to create the account
    if (!saveRequest) {
      return helpers.outputError(this.res, null, helpers.errorText.failedToProcess);
    }

    // helpers.logOperatorActivity({
    //   auth_id: getData._id, operator_id: getData.operator_id || getData._id as string,
    //   operation: "account-forgotpass", body: `Initiate forgot password process`,
    //   data: { id: String(getData._id), email: email },
    // }).catch(e => { })

    return helpers.outputSuccess(this.res, fileConfig.config.env !== "live" ? { otp_code: otpCode } : {});
  }

  //** Public Method: To reset password */
  async resetPassword() {
    //allow only put
    if (this.method !== "post") return helpers.outputError(this.res, 405)

    let otp = helpers.getInputValueString(this.body, "otp_code")
    let newPass = helpers.getInputValueString(this.body, "new_password")
    let email = helpers.getInputValueString(this.body, "email");

    if (!email) {
      return helpers.outputError(this.res, null, "Email is required");
    }

    email = email.toLowerCase();

    //if the email is invalid
    if (!validator.isEmail(email)) {
      return helpers.outputError(this.res, null, "Email is invalid");
    }

    if (!otp) {
      return helpers.outputError(this.res, null, "OTP is required")
    }

    if (otp.length !== 4) {
      return helpers.outputError(this.res, null, "OTP should have 4 characters")
    }

    if (!newPass) {
      return helpers.outputError(this.res, null, "New password is required")
    }

    if (newPass.length < 6) {
      return helpers.outputError(this.res, null, "New Password must be 6 characters or more")
    }

    if (!/[A-Z]/.test(newPass)) {
      return helpers.outputError(this.res, null, "New password must have atleast one capital letter")
    }
    if (!/[a-z]/.test(newPass)) {
      return helpers.outputError(this.res, null, "New password must have atleast one small letter")
    }
    if (!/[0-9]/.test(newPass)) {
      return helpers.outputError(this.res, null, "New password must have atleast one number")
    }

    //check if the OTP was sent and confirmed
    let getOTPConfim: SendDBQuery<OtpRequestTypes> = await OtpRequestModel.findOne({
      email: email, pin: otp, user_type: "operator"
    }, null, { lean: true }).catch(e => ({ error: e }))

    //check for error
    if (getOTPConfim && getOTPConfim.error) {
      console.log("Error checking otp for reset operator pass", getOTPConfim.error)
      return helpers.outputError(this.res, 500);
    }

    //if a record is found
    if (!getOTPConfim) return helpers.outputError(this.res, null, "Request not found");

    //if the OTP type is not registration
    if (getOTPConfim.otp_type !== varConfig.otp_type[0]) {
      return helpers.outputError(this.res, null, "Request not found");
    }

    //if the OTP has not been confirmed
    if (getOTPConfim.status !== 1) return helpers.outputError(this.res, null, "Failed: OTP not confirmed")

    //if the OTP is expired
    let now = new Date();

    //check expiry
    if (!getOTPConfim.expired_at || new Date(getOTPConfim.expired_at) < now) {
      return helpers.outputError(this.res, null, "OTP has expired. Kindly retry the process again");
    }

    let checkUser: SendDBQuery = await UserOperatorModel.findOne({ email: getOTPConfim.email }, null,
      { lean: true }).catch(e => ({ error: e }))

    //check for error
    if (checkUser && checkUser.error) {
      console.log("Error getting operator account for updating new password", checkUser.error)
      return helpers.outputError(this.res, 500)
    }

    if (!checkUser) {
      return helpers.outputError(this.res, null, "Account not found")
    }

    //check password against old password
    if (checkUser.password && bcrypt.compareSync(newPass, checkUser.password)) {
      return helpers.outputError(this.res, null, "You cannot reuse your old password")
    }

    let updatePassword: SendDBQuery = await UserOperatorModel.findOneAndUpdate({ _id: checkUser._id }, {
      $set: { password: bcrypt.hashSync(newPass, 10) }
    }, { lean: true, new: true }).catch(e => ({ error: e }))

    //if there's an error
    if (updatePassword && updatePassword.error) {
      console.log("Error resetting operator pass", updatePassword.error)
      return helpers.outputError(this.res, 500)
    }

    if (!updatePassword) {
      return helpers.outputError(this.res, null, helpers.errorText.failedToProcess)
    }

    //update the OTP to used
    await OtpRequestModel.findByIdAndUpdate(getOTPConfim._id, { $set: { status: 2 } }).catch(e => ({ error: e }))

    // helpers.logOperatorActivity({
    //   auth_id: updatePassword._id, operator_id: updatePassword.operator_id || updatePassword._id as string,
    //   operation: "account-resetpass", body: `Reset password successfully`,
    //   data: { id: String(updatePassword._id), email: email },
    // }).catch(e => { })

    return helpers.outputSuccess(this.res)
  }

  //endpoint to confirm OTP
  async confirmOtp() {
    //allow only put
    if (this.method !== "post") return helpers.outputError(this.res, 405)

    let otp = helpers.getInputValueString(this.body, "otp_code")
    let email = helpers.getInputValueString(this.body, "email");

    if (!email) return helpers.outputError(this.res, null, "Email is required");

    email = email.toLowerCase();

    //if the email is invalid
    if (!validator.isEmail(email)) return helpers.outputError(this.res, null, "Email is invalid");

    if (!otp) return helpers.outputError(this.res, null, "OTP is required")

    if (otp.length !== 4) return helpers.outputError(this.res, null, "OTP should have 4 characters")

    let getOTPConfim: SendDBQuery = await OtpRequestModel.findOne({
      email: email, pin: otp, user_type: "operator"
    }, null, { lean: true }).catch(e => ({ error: e }))

    //check for error
    if (getOTPConfim && getOTPConfim.error) {
      console.log("Error confirming otp for operator", getOTPConfim.error)
      return helpers.outputError(this.res, 500);
    }

    //if a record is found
    if (!getOTPConfim) return helpers.outputError(this.res, null, "Request not found");

    //if the OTP type is not registration
    if (getOTPConfim.otp_type !== varConfig.otp_type[0]) {
      return helpers.outputError(this.res, null, "Request not found");
    }

    //if the OTP has already been confirmed
    if (getOTPConfim.status === 1) return helpers.outputError(this.res, null, "OTP already confirmed")

    //if the OTP is expired
    let now = new Date();

    //check expiry
    if (!getOTPConfim.expired_at || new Date(getOTPConfim.expired_at) < now) {
      return helpers.outputError(this.res, null, "OTP has expired");
    }

    //update the OTP to confirmed
    let updateOTP: SendDBQuery = await OtpRequestModel.findByIdAndUpdate(getOTPConfim._id, { $set: { status: 1 } },
      { lean: true, new: true }).catch(e => ({ error: e }))

    //check for error
    if (updateOTP && updateOTP.error) {
      console.log("Error updating otp to confirmed for operator", updateOTP.error)
      return helpers.outputError(this.res, 500);
    }

    if (!updateOTP) {
      return helpers.outputError(this.res, null, helpers.errorText.failedToProcess)
    }

    return helpers.outputSuccess(this.res)
  }

}