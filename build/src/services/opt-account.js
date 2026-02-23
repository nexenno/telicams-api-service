"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperatorAccountService = void 0;
const helpers_1 = __importDefault(require("../assets/helpers"));
const validator_1 = __importDefault(require("validator"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const dbConnector_1 = require("../models/dbConnector");
const var_config_1 = require("../assets/var-config");
const user_operators_1 = require("../models/user-operators");
class OperatorAccountService {
    //========**************OPERATOR  SECTION***********=========================/
    //update operator details
    static async GetOperatorAccount({ res, req, customData: userData }) {
        let optID = userData.account_type === "team" ? userData.operator_id : undefined;
        const pipLine = [
            { $match: { _id: new dbConnector_1.mongoose.Types.ObjectId(userData.auth_id) } },
            { $addFields: { auth_id: "$_id" } },
            { $project: { password: 0 } },
            { $unset: ["__v", "_id"] },
            ...(optID ? [
                {
                    $lookup: {
                        from: var_config_1.DatabaseTableList.user_operators,
                        let: { operatorID: new dbConnector_1.mongoose.Types.ObjectId(optID) },
                        pipeline: [
                            { $match: { $expr: { $eq: ["$_id", "$$operatorID"] } } },
                            { $project: { business_name: 1, business_logo: 1, business_type: 1, } }
                        ],
                        as: "operator_data"
                    }
                },
                { $unwind: { path: "$operator_data", preserveNullAndEmptyArrays: true } },
                {
                    $addFields: {
                        full_name: "$operator_data.business_name",
                        business_name: "$operator_data.business_name",
                        business_logo: "$operator_data.business_logo",
                        business_type: "$operator_data.business_type",
                        fleet_size: "$operator_data.fleet_size",
                    }
                },
                { $unset: "operator_data" }
            ] : [
                { $addFields: { full_name: "$business_name" } },
            ])
        ];
        // get the user's account
        let checkUser = await user_operators_1.UserOperatorModel.aggregate(pipLine).catch(e => ({ error: e }));
        // check for error
        if (checkUser && checkUser.error) {
            console.log("Error getting operator self profile", checkUser.error);
            return helpers_1.default.outputError(res, 500);
        }
        checkUser = checkUser[0] || {};
        delete checkUser.__v;
        delete checkUser._id;
        delete checkUser.password;
        return helpers_1.default.outputSuccess(res, checkUser);
    }
    // //updating user data
    static async UpdateOperatorAccount({ body, id, res, customData: userData }) {
        let phoneNumber = helpers_1.default.getInputValueString(body, "phone_number");
        let businessType = helpers_1.default.getInputValueString(body, "business_type");
        let address = helpers_1.default.getInputValueString(body, "address");
        let country = helpers_1.default.getInputValueString(body, "country");
        let state = helpers_1.default.getInputValueString(body, "state");
        let queryBuilder = {};
        //if the user is not the admin
        if (userData.account_type !== "operator") {
            return helpers_1.default.outputError(res, null, "Only the admin can perform this action");
        }
        if (country) {
            if (country.length > 50)
                return helpers_1.default.outputError(res, null, "Country should not be more than 50 characters");
            //if country has special characters
            if (helpers_1.default.hasInvalidSearchChar(country)) {
                return helpers_1.default.outputError(res, null, "Country should not have special characters");
            }
            queryBuilder.country = country;
        }
        if (state) {
            if (state.length > 50)
                return helpers_1.default.outputError(res, null, "State should not be more than 50 characters");
            if (helpers_1.default.hasInvalidSearchChar(state)) {
                return helpers_1.default.outputError(res, null, "State should not have special characters");
            }
            queryBuilder.state = state;
        }
        if (phoneNumber) {
            if (!helpers_1.default.isNumber({ input: phoneNumber, type: "int", length: 11 })) {
                return helpers_1.default.outputError(res, null, "Phone number is invalid");
            }
            queryBuilder.phone_number = phoneNumber;
        }
        if (businessType) {
            //if the valus is not valid
            if (!["1", "2"].includes(businessType))
                return helpers_1.default.outputError(res, null, "Invalid business type");
            queryBuilder.business_type = parseInt(businessType);
        }
        if (country) {
            //if the value is invalid
            if (helpers_1.default.hasInvalidSearchChar(country)) {
                return helpers_1.default.outputError(res, null, "Country has invalid character");
            }
            //if the length is too long or short
            if (country.length < 2 || country.length > 120) {
                return helpers_1.default.outputError(res, null, country.length < 2 ? "Country is too short" : "Country is too long");
            }
            queryBuilder.country = country;
        }
        if (state) {
            //if the value is invalid
            if (helpers_1.default.hasInvalidSearchChar(state)) {
                return helpers_1.default.outputError(res, null, "State has invalid character");
            }
            //if the length is too long or short
            if (state.length < 2 || state.length > 120) {
                return helpers_1.default.outputError(res, null, state.length < 2 ? "State is too short" : "State is too long");
            }
            queryBuilder.state = state;
        }
        if (address) {
            //if the value is invalid
            if (helpers_1.default.hasInvalidSearchChar(address)) {
                return helpers_1.default.outputError(res, null, "Address has invalid character");
            }
            //if the length is too long or short
            if (address.length < 2 || address.length > 120) {
                return helpers_1.default.outputError(res, null, address.length < 2 ? "Address is too short" : "Address is too long");
            }
            queryBuilder.address = address;
        }
        if (Object.keys(queryBuilder).length === 0) {
            return helpers_1.default.outputError(res, null, "Nothing to update");
        }
        let saveUser = await user_operators_1.UserOperatorModel.findByIdAndUpdate(userData.auth_id, { $set: queryBuilder }, { lean: true, new: true }).catch(e => ({ error: e }));
        //check for error
        if (saveUser && saveUser.error) {
            console.log("Error updating operators by operator", saveUser.error);
            return helpers_1.default.outputError(res, 500);
        }
        //if the query does not execute
        if (!saveUser) {
            return helpers_1.default.outputError(res, null, helpers_1.default.errorText.failedToProcess);
        }
        helpers_1.default.logOperatorActivity({
            auth_id: userData.auth_id, operator_id: userData.auth_id,
            operation: "account-update", body: `Updated account information`,
            data: { id: userData.auth_id, email: saveUser.email },
        }).catch(e => { });
        //output the response
        return helpers_1.default.outputSuccess(res, {});
    }
    static async DeleteOperatorUser({ body, id, res, req, customData: userData }) {
        // 1. get operator account
        const getData = await user_operators_1.UserOperatorModel.findOne({ _id: userData.auth_id }, null, { lean: true }).catch(e => ({ error: e }));
        if (getData && getData.error) {
            console.log("Error getting user account to delete by operator 1", getData.error);
            return helpers_1.default.outputError(res, 500);
        }
        if (!getData) {
            return helpers_1.default.outputError(res, null, "User account not found");
        }
        // only active or pending deletion accounts
        if (![1, 2].includes(getData.account_status)) {
            return helpers_1.default.outputError(res, null, "User account not found.");
        }
        let removeData;
        if (getData.account_type === "team") {
            removeData = await user_operators_1.UserOperatorModel.findByIdAndDelete(userData.auth_id).catch(e => ({ error: e }));
        }
        else {
            // If operator has any related data 
            if (true) {
                removeData = await user_operators_1.UserOperatorModel.findByIdAndUpdate(userData.auth_id, { $set: { status: 3 } }, { new: true }).catch(e => ({ error: e }));
            }
            else {
                // If operator has NO dependencies 
                removeData = await user_operators_1.UserOperatorModel.findByIdAndDelete(userData.auth_id)
                    .catch(e => ({ error: e }));
            }
        }
        // DB error
        if (removeData && removeData.error) {
            console.log("Error removing operator account", removeData.error);
            return helpers_1.default.outputError(res, 500);
        }
        if (!removeData) {
            return helpers_1.default.outputError(res, null, helpers_1.default.errorText.failedToProcess);
        }
        // helpers.logOperatorActivity({
        //   auth_id: userData.auth_id, operation: "account-delete",
        //   body: getData.account_type === "team" ? `Deleted team account` : `Deleted operator account`,
        //   operator_id: helpers.getOperatorAuthID(userData) as string,
        //   data: { id: String(removeData._id), email: removeData.email },
        // }).catch(e => { })
        return helpers_1.default.outputSuccess(res, {});
    }
    //updating user data
    static async ChangeAdminPassword({ body, id, res, customData: userData }) {
        let oldPass = helpers_1.default.getInputValueString(body, "old_password");
        let newPass = helpers_1.default.getInputValueString(body, "new_password");
        //if there's no new password
        if (!newPass) {
            return helpers_1.default.outputError(res, null, "New password is required");
        }
        if (newPass.length < 6) {
            return helpers_1.default.outputError(res, null, "New Password must be 6 characters or more");
        }
        if (!/[A-Z]/.test(newPass)) {
            return helpers_1.default.outputError(res, null, "New password must have atleast one capital letter");
        }
        if (!/[a-z]/.test(newPass)) {
            return helpers_1.default.outputError(res, null, "New password must have atleast one small letter");
        }
        if (!/[0-9]/.test(newPass)) {
            return helpers_1.default.outputError(res, null, "New password must have atleast one number");
        }
        //if the old password less than 6
        if (oldPass.length < 6) {
            return helpers_1.default.outputError(res, null, "Invalid Password");
        }
        //if the old password is same with the new password
        if (oldPass === newPass) {
            return helpers_1.default.outputError(res, null, "New password cannot be same as the old");
        }
        let checkUser = await user_operators_1.UserOperatorModel.findById(userData.auth_id, null, { lean: true }).catch((e) => ({ error: e }));
        //check for error
        if (checkUser && checkUser.error) {
            console.log("error resetting operator password", checkUser.error);
            return helpers_1.default.outputError(res, 500);
        }
        //if the query does not execute
        if (!checkUser)
            return helpers_1.default.outputError(res, null, "Invalid account");
        //if the old password does not match
        if (!bcrypt_1.default.compareSync(oldPass, checkUser.password)) {
            return helpers_1.default.outputError(res, null, "Invalid Password");
        }
        let saveUser = await user_operators_1.UserOperatorModel.findByIdAndUpdate(userData.auth_id, { $set: { password: bcrypt_1.default.hashSync(newPass, 10) } }, { new: true }).catch(e => ({ error: e }));
        //check for error
        if (saveUser && saveUser.error) {
            console.log("Error changing operator self password", saveUser.error);
            return helpers_1.default.outputError(res, 500);
        }
        //if the query does not execute
        if (!saveUser) {
            return helpers_1.default.outputError(res, null, helpers_1.default.errorText.failedToProcess);
        }
        // helpers.logOperatorActivity({
        //   auth_id: userData.auth_id, operation: "account-passwordchange",
        //   body: `Change account password`,
        //   operator_id: helpers.getOperatorAuthID(userData) as string,
        //   data: { id: String(saveUser._id), email: saveUser.email },
        // }).catch(e => { })
        //output the response
        return helpers_1.default.outputSuccess(res);
    }
    //========**************TEAM  SECTION***********=========================/
    //create team member
    static async CreateTeam({ body, id, req, res, customData: userData }) {
        let fullName = helpers_1.default.getInputValueString(body, "full_name");
        let email = helpers_1.default.getInputValueString(body, "email");
        let phoneNumber = helpers_1.default.getInputValueString(body, "phone_number");
        let roleID = helpers_1.default.getInputValueString(body, "role_id");
        let queryBuilder = {};
        if (userData.account_type !== "operator") {
            return helpers_1.default.outputError(res, null, "Only an operator can perform this action");
        }
        if (!id) {
            if (!fullName)
                return helpers_1.default.outputError(res, null, "Full name is required");
            //validate the email
            if (!email)
                return helpers_1.default.outputError(res, null, "email is required");
            //create the account
            queryBuilder.account_type = "team";
            queryBuilder.business_type = 1;
            queryBuilder.operator_id = new dbConnector_1.mongoose.Types.ObjectId(userData.operator_id);
            //check if the account is not approved yet
            let getData = await user_operators_1.UserOperatorModel.findById(userData.auth_id).catch(e => ({ error: e }));
            //check for error
            if (getData && getData.error) {
                console.log("Error getting operator account to create team member", getData.error);
                return helpers_1.default.outputError(res, 500);
            }
            //if no data found or the account is not active
            if (!getData || getData.account_status !== 1) {
                return helpers_1.default.outputError(res, null, "Only approved operator account can add team members");
            }
        }
        if (fullName) {
            //if the name contains invalid string
            if (!/^[a-z\- ]+$/i.test(fullName)) {
                return helpers_1.default.outputError(res, null, "Full name should be alphabets only");
            }
            if (fullName.length < 4 || fullName.length > 60) {
                return helpers_1.default.outputError(res, null, fullName.length < 4 ? "Full name is too short" : "Full name is too long");
            }
            //split the name to check for first and last name
            let nameParts = fullName.split(" ").filter(part => part.trim() !== "");
            //if the name is less than 2
            if (nameParts.length < 2) {
                return helpers_1.default.outputError(res, null, "Please provide at least your first and last name");
            }
            //if the name is more than 3
            if (nameParts.length > 3) {
                return helpers_1.default.outputError(res, null, "Not more than three names are allowed");
            }
            //if the name parts are less than 2 characters
            if (!helpers_1.default.hasAlphabet(nameParts[0], 2)) {
                return helpers_1.default.outputError(res, null, "Provided first name is not valid");
            }
            //if the name parts are less than 2 characters
            if (!helpers_1.default.hasAlphabet(nameParts[0], 2)) {
                return helpers_1.default.outputError(res, null, "Provided first name is not valid");
            }
            //if the name parts are less than 2 characters
            if (!helpers_1.default.hasAlphabet(nameParts[1], 2)) {
                return helpers_1.default.outputError(res, null, nameParts.length > 2 ? "The provided last name seems invalid" : "Your middle name doesn't look valid");
            }
            if (!helpers_1.default.hasAlphabet(nameParts[2], 2)) {
                return helpers_1.default.outputError(res, null, "The provided last name is not valid");
            }
            queryBuilder.business_name = nameParts.join(" ").replace(/\b\w/g, (c) => c.toUpperCase());
        }
        if (email) {
            //string email to lowercase
            email = email.toLowerCase();
            if (!validator_1.default.isEmail(email))
                return helpers_1.default.outputError(res, null, "Invalid email");
            //check if the email or phone exist
            let checkUser = await user_operators_1.UserOperatorModel.findOne({ email: email }, null, { lean: true }).catch(e => ({ error: e }));
            //check for error
            if (checkUser && checkUser.error) {
                return helpers_1.default.outputError(res, 500);
            }
            //if a record is found
            if (checkUser)
                return helpers_1.default.outputError(res, null, "Email already in use");
            queryBuilder.email = email;
        }
        if (phoneNumber) {
            if (!/^[0-9]+$/.test(phoneNumber)) {
                return helpers_1.default.outputError(res, null, "Phone number should be digits only");
            }
            if (!/^0/.test(phoneNumber)) {
                return helpers_1.default.outputError(res, null, "Phone number must start with zero. e.g (070........)");
            }
            if (phoneNumber.length !== 11) {
                return helpers_1.default.outputError(res, null, "Invalid phone number. Phone number expects 11 digits");
            }
            queryBuilder.phone_number = phoneNumber;
        }
        if (roleID) {
            //if role is invalid
            if (helpers_1.default.isInvalidID(roleID)) {
                return helpers_1.default.outputError(res, null, "role_id is invalid");
            }
            // let getRole: SendDBQuery = await OperatorTeamsRoleModel.findById(roleID).catch(e => ({ error: e }))
            // //if there's an error
            // if (getRole && getRole.error) {
            //   console.log(getRole)
            //   return helpers.outputError(res, 500)
            // }
            // if (!getRole) {
            //   return helpers.outputError(res, null, "This role is not available")
            // }
            // queryBuilder.role_id = new mongoose.Types.ObjectId(roleID)
        }
        let saveUser = id ? await user_operators_1.UserOperatorModel.findOneAndUpdate({
            _id: id, operator_id: new dbConnector_1.mongoose.Types.ObjectId(userData.operator_id), account_type: "team"
        }, { $set: queryBuilder }, { lean: true, new: true }).catch(e => ({ error: e })) :
            await user_operators_1.UserOperatorModel.create(queryBuilder).catch(e => ({ error: e }));
        //check for error
        if (saveUser && saveUser.error) {
            console.log("Error creating operator team", saveUser.error);
            return helpers_1.default.outputError(res, 500);
        }
        //if the query does not execute
        if (!saveUser) {
            return helpers_1.default.outputError(res, null, helpers_1.default.errorText.failedToProcess);
        }
        // helpers.logOperatorActivity({
        //   auth_id: userData.auth_id, operator_id: userData.auth_id as string,
        //   operation: "team-create", body: id ? `Updated team member - ${saveUser.first_name} account information - ` : `Added a new team member - ${saveUser.first_name}`,
        //   data: { auth_id: String(saveUser._id), email: saveUser.email || email },
        // }).catch(e => { })
        //output the response
        return helpers_1.default.outputSuccess(res, {});
    }
    /** Private Method: update team */
    static async UpdateTeamStatus({ body, id, res, customData: userData }) {
        let status = helpers_1.default.getInputValueString(body, "status");
        let suspendReason = helpers_1.default.getInputValueString(body, "suspend_reason");
        if (!status)
            return helpers_1.default.outputError(res, null, "Status is required");
        ///if the user is not the account holder
        if (userData.account_type !== "operator") {
            return helpers_1.default.outputError(res, null, "Only the admin can perform this action");
        }
        //if the status is not valid
        if (!["1", "2"].includes(status))
            return helpers_1.default.outputError(res, null, "Invalid status");
        //if the status is suspend and there's no reason
        if (status === "2" && !suspendReason)
            return helpers_1.default.outputError(res, null, "Suspension reason is required");
        if (suspendReason) {
            //check the length
            if (suspendReason.length < 10 || suspendReason.length > 500) {
                return helpers_1.default.outputError(res, null, "Suspension reason must be between 10 and 500 characters");
            }
            //if it does not have text
            if (!helpers_1.default.hasAlphabet(suspendReason, 4)) {
                return helpers_1.default.outputError(res, null, "Suspension reason must have at least 4 alphabet characters");
            }
        }
        //get the current user data
        let getData = await user_operators_1.UserOperatorModel.findOne({
            operator_id: new dbConnector_1.mongoose.Types.ObjectId(userData.auth_id),
            _id: new dbConnector_1.mongoose.Types.ObjectId(id), account_type: "team"
        }).lean().catch((e) => ({ error: e }));
        if (getData && getData.error) {
            console.log("Error finding team account to suspend", getData.error);
            return helpers_1.default.outputError(res, 500);
        }
        //if not an operator
        if (!getData || getData.account_type !== "team") {
            return helpers_1.default.outputError(res, null, "Account not found");
        }
        //if the account is pending
        if (getData.account_status === 0) {
            return helpers_1.default.outputError(res, null, "Cannot change status of a pending account");
        }
        let saveUser = await user_operators_1.UserOperatorModel.findByIdAndUpdate(id, {
            $set: { account_status: parseInt(status), suspend_reason: suspendReason }
        }, { new: true }).catch(e => ({ error: e }));
        //check for error
        if (saveUser && saveUser.error) {
            console.log("Error updating team member status", saveUser.error);
            return helpers_1.default.outputError(res, 500);
        }
        //if the query does not execute
        if (!saveUser) {
            return helpers_1.default.outputError(res, null, helpers_1.default.errorText.failedToProcess);
        }
        //output the response
        return helpers_1.default.outputSuccess(res);
    }
    /** Private Method: get team */
    static async GetTeam({ query, body, id, res, customData: userData }) {
        let q = helpers_1.default.getInputValueString(query, "q");
        let page = helpers_1.default.getInputValueString(query, "page");
        let itemPerPage = helpers_1.default.getInputValueString(query, "item_per_page");
        let status = helpers_1.default.getInputValueString(query, "status");
        let component = helpers_1.default.getInputValueString(query, "component");
        let qBuilder = {
            operator_id: new dbConnector_1.mongoose.Types.ObjectId(userData.operator_id),
            account_type: "team"
        };
        if (id) {
            if (helpers_1.default.isInvalidID(id)) {
                return helpers_1.default.outputError(res, null, 'Invalid auth ID');
            }
            qBuilder._id = new dbConnector_1.mongoose.Types.ObjectId(id);
        }
        if (status) {
            if (!["0", "1", "2"].includes(status)) {
                return helpers_1.default.outputError(res, null, "Invalid status value");
            }
            qBuilder.account_status = parseInt(status);
        }
        if (q) {
            if (!helpers_1.default.isAllowedCharacters(q)) {
                return helpers_1.default.outputError(res, null, "Special characters not allowed on q. q must be alphabet or numeric");
            }
            qBuilder.$or = [
                { business_name: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } }
            ];
        }
        //if item per page
        let getPage = helpers_1.default.getPageItemPerPage(itemPerPage, page);
        //if not valid
        if (getPage.status !== true)
            return helpers_1.default.outputError(res, null, getPage.msg);
        // let pipLine: PipelineQuery = []
        let pipLine = [
            { $match: qBuilder },
            { $project: { password: 0 } },
            { $addFields: { auth_id: "$_id" } },
            { $sort: { _id: -1 } },
            { $skip: getPage.data.page },
            { $limit: getPage.data.item_per_page },
            {
                $lookup: {
                    from: var_config_1.DatabaseTableList.operator_roles,
                    let: { roleID: "$role_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$roleID"] } } },
                        { $project: { name: 1, data: 1 } }
                    ],
                    as: "role_data"
                }
            },
            { $unwind: { path: "$role_data", preserveNullAndEmptyArrays: true } },
            { $unset: ["__v", "_id", "password", "default_code"] },
        ];
        if (component) {
            switch (component) {
                case "count":
                    pipLine = [
                        { $match: qBuilder },
                        { $count: "total" },
                        { $unset: ["__v", "_id"] }
                    ];
                    break;
                default:
                    return helpers_1.default.outputError(res, null, "Component is invalid");
            }
        }
        //if there's no component
        let getData = await user_operators_1.UserOperatorModel.aggregate(pipLine).catch(e => ({ error: e }));
        //check error
        if (getData && getData.error) {
            console.log("Error getting Operator Team", getData.error);
            return helpers_1.default.outputError(res, 500);
        }
        //if there's nothing
        if (id || component) {
            getData = getData.length ? getData[0] : component ? { total: 0 } : {};
        }
        return helpers_1.default.outputSuccess(res, getData);
    }
    /** Private Method: delete team */
    static async DeleteTeam({ body, res, req, id, customData: userData }) {
        //if the user is not accoint holder
        if (userData.account_type !== "operator") {
            return helpers_1.default.outputError(res, null, "Only the admin can perform this action");
        }
        let deleteResult = await user_operators_1.UserOperatorModel.findByIdAndDelete({
            operator_id: new dbConnector_1.mongoose.Types.ObjectId(userData.auth_id),
            _id: new dbConnector_1.mongoose.Types.ObjectId(id)
        }).lean().catch((e) => ({ error: e }));
        if (deleteResult && deleteResult.error) {
            console.log("Error deleting team 1", deleteResult.error);
            return helpers_1.default.outputError(res, 500);
        }
        if (!deleteResult)
            return helpers_1.default.outputError(res, null, "Account not found");
        return helpers_1.default.outputSuccess(res, {});
    }
}
exports.OperatorAccountService = OperatorAccountService;
