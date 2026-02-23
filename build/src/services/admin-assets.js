"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAssetService = void 0;
const helpers_1 = __importDefault(require("../assets/helpers"));
const var_config_1 = require("../assets/var-config");
const dbConnector_1 = require("../models/dbConnector");
const device_lists_1 = require("../models/device-lists");
const user_operators_1 = require("../models/user-operators");
class AdminAssetService {
    //========**************DEVICE  SECTION***********=========================/
    static async RegisterDevice({ body, id, res, req, customData: userData }) {
        let deviceID = helpers_1.default.getInputValueString(body, "device_number");
        let deviceModel = helpers_1.default.getInputValueString(body, "device_model");
        let deviceOEM = helpers_1.default.getInputValueString(body, "device_oem");
        let operatorID = helpers_1.default.getInputValueString(body, "operator_id");
        let qBuilder = {};
        if (!deviceID)
            return helpers_1.default.outputError(res, null, "Device ID is required");
        if (!deviceModel)
            return helpers_1.default.outputError(res, null, "Device model is required");
        if (!deviceOEM)
            return helpers_1.default.outputError(res, null, "Device OEM is required");
        if (!id) {
            if (!deviceID)
                return helpers_1.default.outputError(res, null, "Device ID is required");
            if (!deviceModel)
                return helpers_1.default.outputError(res, null, "Device model is required");
            if (!deviceOEM)
                return helpers_1.default.outputError(res, null, "Device OEM is required");
            qBuilder.created_by = "admin";
        }
        if (operatorID) {
            if (helpers_1.default.isInvalidID(operatorID))
                return helpers_1.default.outputError(res, null, "Invalid operator id");
            qBuilder.operator_id = new dbConnector_1.mongoose.Types.ObjectId(operatorID);
        }
        if (deviceModel) {
            if (!helpers_1.default.isAllowedCharacters(deviceModel)) {
                return helpers_1.default.outputError(res, null, "Device model has invalid characters");
            }
            //if the length is too long or short
            if (deviceModel.length < 2 || deviceModel.length > 120) {
                return helpers_1.default.outputError(res, null, deviceModel.length < 2 ? "Device model is too short" : "Device model is too long");
            }
            qBuilder.device_model = deviceModel;
        }
        if (deviceOEM) {
            if (!helpers_1.default.isAllowedCharacters(deviceOEM)) {
                return helpers_1.default.outputError(res, null, "Device OEM has invalid characters");
            }
            //if the length is too long or short
            if (deviceOEM.length < 2 || deviceOEM.length > 120) {
                return helpers_1.default.outputError(res, null, deviceOEM.length < 2 ? "Device OEM is too short" : "Device OEM is too long");
            }
            qBuilder.device_oem = deviceOEM;
        }
        if (deviceID) {
            if (!helpers_1.default.isNumber({ input: deviceID, type: "int", minLength: 10, maxLength: 20 })) {
                return helpers_1.default.outputError(res, null, "Device ID must be a number with length between 10 and 20");
            }
            //check if the device ID already exist
            let checkDevice = await device_lists_1.DashcamDeviceModel.findOne({ device_number: deviceID }).catch(e => ({ error: e }));
            //check for error
            if (checkDevice && checkDevice.error) {
                console.log("Error checking existing device for registration", checkDevice.error);
                return helpers_1.default.outputError(res, 500);
            }
            //if a record is found
            if (checkDevice)
                return helpers_1.default.outputError(res, null, "Device ID already registered");
            qBuilder.device_number = deviceID;
        }
        if (Object.keys(qBuilder).length === 0)
            return helpers_1.default.outputError(res, null, "Nothing to update");
        let saveDevice = id ? await device_lists_1.DashcamDeviceModel.findByIdAndUpdate(id, { $set: qBuilder }, { lean: true, new: true }).catch(e => ({ error: e })) : await device_lists_1.DashcamDeviceModel.create(qBuilder).catch(e => ({ error: e }));
        //check for error
        if (saveDevice && saveDevice.error) {
            console.log("Error registering device by admin", saveDevice.error);
            return helpers_1.default.outputError(res, 500);
        }
        if (!saveDevice)
            return helpers_1.default.outputError(res, null, helpers_1.default.errorText.failedToProcess);
        // helpers.logOperatorActivity({
        //   auth_id: userData.auth_id, operator_id: optID as string,
        //   operation: "device-register", body: id ? `Updated device - ${saveDevice.device_model} information` : `Registered a new device - ${saveDevice.device_model}`,
        //   data: { id: String(saveDevice._id), device_number: saveDevice.device_number },
        // }).catch(e => { })
        return helpers_1.default.outputSuccess(res, {});
    }
    static async GetDevices({ query, body, id, res, customData: userData }) {
        let q = helpers_1.default.getInputValueString(query, "q");
        let itemPerPage = helpers_1.default.getInputValueString(query, "item_per_page");
        let page = helpers_1.default.getInputValueString(query, "page");
        let operatorID = helpers_1.default.getInputValueString(query, "operator_id");
        let activeStatus = helpers_1.default.getInputValueString(query, "active_status");
        let assignStatus = helpers_1.default.getInputValueString(query, "assign_status");
        let component = helpers_1.default.getInputValueString(query, "component");
        let qBuilder = {};
        if (operatorID) {
            if (helpers_1.default.isInvalidID(operatorID))
                return helpers_1.default.outputError(res, null, "Invalid operator ID");
            qBuilder.operator_id = new dbConnector_1.mongoose.Types.ObjectId(operatorID);
        }
        if (id) {
            qBuilder._id = new dbConnector_1.mongoose.Types.ObjectId(id);
        }
        if (activeStatus) {
            if (!["0", "1", "2", "3"].includes(activeStatus)) {
                return helpers_1.default.outputError(res, null, "Invalid active status");
            }
            qBuilder.active_status = parseInt(activeStatus);
        }
        if (assignStatus) {
            if (!["0", "1", "2"].includes(assignStatus)) {
                return helpers_1.default.outputError(res, null, "Invalid assign status");
            }
            qBuilder.assign_status = parseInt(assignStatus);
        }
        if (q) {
            if (!helpers_1.default.isNumber({ input: q, type: "int", minLength: 10, maxLength: 20 })) {
                return helpers_1.default.outputError(res, null, "Search must be a number between 10 and 20 digits");
            }
            qBuilder.device_number = q;
        }
        let getPage = helpers_1.default.getPageItemPerPage(itemPerPage, page);
        if (getPage.status !== true)
            return helpers_1.default.outputError(res, null, getPage.msg);
        let pipLine = [
            { $match: qBuilder },
            { $sort: { _id: -1 } },
            { $skip: getPage.data.page },
            { $limit: getPage.data.item_per_page },
            {
                $lookup: {
                    from: var_config_1.DatabaseTableList.user_operators,
                    let: { optID: "$operator_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$optID"] } } },
                        { $project: { business_name: 1, business_type: 1 } }
                    ],
                    as: "operator_data"
                }
            },
            { $unwind: { path: "$operator_data", preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    business_name: "$operator_data.business_name",
                    business_type: "$operator_data.business_type"
                }
            },
            { $unset: ["__v", "_id", "operator_data"] },
        ];
        if (id) {
            pipLine.push({
                $lookup: {
                    from: var_config_1.DatabaseTableList.vehicle_lists,
                    let: { vehID: "$vehicle_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$vehID"] } } },
                        {
                            $project: {
                                plate_number: 1, device_assigned_at: 1,
                                vehicle_oem: 1, vehicle_model: 1, vehicle_vin: 1,
                                status: 1, suspend_reason: 1
                            }
                        }
                    ],
                    as: "vehicle_data"
                }
            }, {
                $unwind: {
                    path: "$vehicle_data",
                    preserveNullAndEmptyArrays: true
                }
            });
        }
        if (component) {
            switch (component) {
                case "count":
                    pipLine = [
                        { $match: qBuilder },
                        { $count: "total" },
                        { $unset: ["__v", "_id"] }
                    ];
                    break;
                case "count-status":
                    pipLine = [
                        { $match: qBuilder },
                        {
                            $group: {
                                _id: null,
                                total_count: { $sum: 1 },
                                total_inactive: { $sum: { $cond: [{ $eq: ["$status", 0] }, 1, 0] } },
                                total_active: { $sum: { $cond: [{ $eq: ["$status", 1] }, 1, 0] } },
                                total_suspended: { $sum: { $cond: [{ $eq: ["$status", 2] }, 1, 0] } },
                            }
                        },
                    ];
                    break;
                default:
                    return helpers_1.default.outputError(res, null, "Component is invalid");
            }
            let getData = await device_lists_1.DashcamDeviceModel.aggregate(pipLine).catch(e => ({ error: e }));
            if (getData && getData.error) {
                console.log("Error getting device count by status", getData.error);
                return helpers_1.default.outputError(res, 500);
            }
            if (component) {
                getData = getData.length ? getData[0] : {};
            }
            return helpers_1.default.outputSuccess(res, getData);
        }
    }
    static async DeleteDevice({ body, res, req, id, customData: userData }) {
        //if method is not delete
        let getData = await device_lists_1.DashcamDeviceModel.findOne({
            _id: new dbConnector_1.mongoose.Types.ObjectId(id)
        }).lean().catch((e) => ({ error: e }));
        //check for error
        if (getData && getData.error) {
            console.log("Error finding device by admin to delete", getData.error);
            return helpers_1.default.outputError(res, 500);
        }
        if (!getData)
            return helpers_1.default.outputError(res, null, "Device not found");
        //TODO: check if the device has data that is linked to other tables, if yes, return error
        let deleteResult = await device_lists_1.DashcamDeviceModel.findByIdAndDelete(id).lean().catch((e) => ({ error: e }));
        if (deleteResult && deleteResult.error) {
            console.log("Error deleting device by admin", deleteResult.error);
            return helpers_1.default.outputError(res, 500);
        }
        if (!deleteResult)
            return helpers_1.default.outputError(res, null, "Device not found");
        // helpers.logOperatorActivity({
        //   auth_id: userData.auth_id, operator_id: optID as string,
        //   operation: "device-delete", body: `Deleted device - ${getData.device_model}`,
        //   data: { id: String(getData._id), device_id: getData.device_id },
        // }).catch(e => { })
        return helpers_1.default.outputSuccess(res, {});
    }
    static async UpdateDeviceStatus({ body, res, req, id, customData: userData }) {
        let status = helpers_1.default.getInputValueString(body, "status");
        let reason = helpers_1.default.getInputValueString(body, "reason");
        if (!status)
            return helpers_1.default.outputError(res, null, "Status is required");
        if (!["0", "1", "2"].includes(status))
            return helpers_1.default.outputError(res, null, "Invalid status");
        if (status === "2" && !reason)
            return helpers_1.default.outputError(res, null, "Suspension reason is required");
        if (reason && (reason.length < 5 || reason.length > 300)) {
            return helpers_1.default.outputError(res, null, "Suspension reason must be between 5 and 300 characters");
        }
        let getData = await device_lists_1.DashcamDeviceModel.findOne({
            _id: new dbConnector_1.mongoose.Types.ObjectId(id)
        }).catch((e) => ({ error: e }));
        //check for error
        if (getData && getData.error) {
            console.log("Error finding device by admin to update status", getData.error);
            return helpers_1.default.outputError(res, 500);
        }
        if (!getData)
            return helpers_1.default.outputError(res, null, "Device not found");
        let saveDevice = await device_lists_1.DashcamDeviceModel.findByIdAndUpdate(id, {
            $set: { active_status: parseInt(status), suspension_reason: reason }
        }, { new: true }).catch(e => ({ error: e }));
        //check for error
        if (saveDevice && saveDevice.error) {
            console.log("Error updating device status by admin", saveDevice.error);
            return helpers_1.default.outputError(res, 500);
        }
        if (!saveDevice)
            return helpers_1.default.outputError(res, null, helpers_1.default.errorText.failedToProcess);
        // helpers.logOperatorActivity({
        //   auth_id: userData.auth_id, operator_id: optID as string,
        //   operation: "device-status-update", body: `Updated device - ${getData.device_model} status to ${["Inactive", "Active", "Suspended"][parseInt(status)]}`,
        //   data: { id: String(getData._id), device_id: getData.device_id, new_status: status, suspension_reason: reason },
        // }).catch(e => { })
        return helpers_1.default.outputSuccess(res, {});
    }
    static async AssignDeviceToOperator({ body, res, req, id, customData: userData }) {
        let optID = helpers_1.default.getInputValueString(body, "operator_id");
        if (!optID)
            return helpers_1.default.outputError(res, null, "Operator id is required");
        //validating the ID
        if (helpers_1.default.isInvalidID(optID))
            return helpers_1.default.outputError(res, null, "Invalid operator id");
        //get the vehicle
        let getOpt = await user_operators_1.UserOperatorModel.findById(optID).lean().catch(e => ({ error: e }));
        //check for error
        if (getOpt && getOpt.error) {
            console.log("Error checking operator for assign vehicle", getOpt.error);
            return helpers_1.default.outputError(res, 500);
        }
        if (!getOpt)
            return helpers_1.default.outputError(res, null, "Operator not found");
        //if the account is not active, cannot assign vehicle
        if (getOpt && getOpt.active_status !== 1)
            return helpers_1.default.outputError(res, null, "Operator account is not active");
        //get the device data
        let getDevice = await device_lists_1.DashcamDeviceModel.findById(id).lean().catch(e => ({ error: e }));
        //check for error
        if (getDevice && getDevice.error) {
            console.log("Error checking device for assign operator", getDevice.error);
            return helpers_1.default.outputError(res, 500);
        }
        if (!getDevice)
            return helpers_1.default.outputError(res, null, "Device not found");
        //check if the device is already assigned to another operator
        if (getDevice.operator_id || getDevice.vehicle_id) {
            return helpers_1.default.outputError(res, null, "This device is already assigned to another operator");
        }
        //update the vehicle and rider table
        let Assignveh = await device_lists_1.DashcamDeviceModel.findByIdAndUpdate(id, {
            $set: { operator_id: optID, assign_status: 1, }
        }, { lean: true, new: true }).catch((e) => ({ error: e }));
        if (Assignveh && Assignveh.error) {
            console.log("Error assigning device to operator", Assignveh.error);
            return helpers_1.default.outputError(res, 500);
        }
        //if the query does not execute
        if (!Assignveh)
            return helpers_1.default.outputError(res, null, helpers_1.default.errorText.failedToProcess);
        // helpers.logOperatorActivity({
        //   auth_id: userData.auth_id, operator_id: optID as string, operation: "assign-vehicle",
        //   data: { id: vehicleID, plate_number: getVeh.plate_number },
        //   body: `Assigned ${getVeh.plate_number} vehicle to rider - ${checkRiderExist.full_name}`
        // }).catch(e => { })
        return helpers_1.default.outputSuccess(res);
    }
    static async UnAssignVehicleDevice({ body, res, req, id, customData: userData }) {
        //get the vehicle data 
        let getVeh = await device_lists_1.DashcamDeviceModel.findById(id)
            .populate("operator_id", "business_name", user_operators_1.UserOperatorModel).lean().catch(e => ({ error: e }));
        //check for error
        if (getVeh && getVeh.error) {
            console.log("Error checking vehicle on unassign", getVeh.error);
            return helpers_1.default.outputError(res, 500);
        }
        //if the query does not execute
        if (!getVeh)
            return helpers_1.default.outputError(res, null, "Device not found on this vehicle");
        //if the vehicle is not assigned to any device
        if (!getVeh.operator_id && !getVeh.vehicle_id) {
            return helpers_1.default.outputError(res, null, "This device is not assigned to any operator or vehicle");
        }
        //update the vehicle and rider table
        let Assignveh = await device_lists_1.DashcamDeviceModel.findByIdAndUpdate(id, {
            $unset: { operator_id: 1, vehicle_id: 1, assign_status: 0 },
        }, { lean: true, new: true }).catch(e => ({ error: e }));
        if (Assignveh && Assignveh.error) {
            console.log("Error unassigning device from operator or vehicle", Assignveh.error);
            return helpers_1.default.outputError(res, 500);
        }
        //if the query does not execute
        if (!Assignveh)
            return helpers_1.default.outputError(res, null, helpers_1.default.errorText.failedToProcess);
        // helpers.logOperatorActivity({
        //   auth_id: userData.auth_id, operator_id: optID as string,
        //   operation: "unassign-vehicle",
        //   data: { id: vehicleID, plate_number: getVeh.plate_number },
        //   body: `Unassigned ${getVeh.plate_number} from ${getVeh.rider_id.full_name}`
        // }).catch(e => { })
        return helpers_1.default.outputSuccess(res);
    }
}
exports.AdminAssetService = AdminAssetService;
