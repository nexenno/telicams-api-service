"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperatorAssetService = void 0;
const helpers_1 = __importStar(require("../assets/helpers"));
const dbConnector_1 = require("../models/dbConnector");
const device_lists_1 = require("../models/device-lists");
const opt_vehlists_1 = require("../models/opt-vehlists");
const var_config_1 = require("../assets/var-config");
const device_data_1 = require("../models/device-data");
const user_operators_1 = require("../models/user-operators");
class OperatorAssetService {
    //========**************DEVICE  SECTION***********=========================/
    static async GetDevices({ query, body, id, res, customData: userData }) {
        let q = helpers_1.default.getInputValueString(query, "q");
        let itemPerPage = helpers_1.default.getInputValueString(query, "item_per_page");
        let page = helpers_1.default.getInputValueString(query, "page");
        let activeStatus = helpers_1.default.getInputValueString(query, "active_status");
        let component = helpers_1.default.getInputValueString(query, "component");
        let optID = helpers_1.default.getOperatorAuthID(userData);
        let qBuilder = { operator_id: new dbConnector_1.mongoose.Types.ObjectId(optID), };
        if (id) {
            qBuilder._id = new dbConnector_1.mongoose.Types.ObjectId(id);
        }
        if (activeStatus) {
            if (!["0", "1", "2", "3"].includes(activeStatus)) {
                return helpers_1.default.outputError(res, null, "Invalid active status");
            }
            qBuilder.active_status = parseInt(activeStatus);
        }
        else {
            //@ts-ignore
            qBuilder.active_status = { $ne: 3 };
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
            { $project: { created_by: 0, operator_id: 0, } },
            { $sort: { _id: -1 } },
            { $skip: getPage.data.page },
            { $limit: getPage.data.item_per_page },
            { $unset: ["__v", "_id", "operator_id"] },
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
    static async AssignDeviceToVehicle({ body, res, req, id, customData: userData }) {
        let vehicleID = helpers_1.default.getInputValueString(body, "vehicle_id");
        let optID = helpers_1.default.getOperatorAuthID(userData);
        if (!vehicleID)
            return helpers_1.default.outputError(res, null, "Vehicle id is required");
        //validating the ID
        if (helpers_1.default.isInvalidID(vehicleID))
            return helpers_1.default.outputError(res, null, "Invalid vehicle id");
        //get the vehicle
        let getOpt = await opt_vehlists_1.OptVehicleListModel.findOne({ _id: vehicleID, operator_id: optID }).lean().catch(e => ({ error: e }));
        //check for error
        if (getOpt && getOpt.error) {
            console.log("Error checking vehicle for assign device by operator", getOpt.error);
            return helpers_1.default.outputError(res, 500);
        }
        if (!getOpt)
            return helpers_1.default.outputError(res, null, "Vehicle not found");
        //if the vehicle is not active, cannot assign device
        if (getOpt && getOpt.status !== 1)
            return helpers_1.default.outputError(res, null, "Vehicle is not active");
        //if the vehicle is already assigned with a device, return error
        if (getOpt.device_assigned || getOpt.device_id) {
            return helpers_1.default.outputError(res, null, "Vehicle is already assigned with a device");
        }
        //get the device data
        let getDevice = await device_lists_1.DashcamDeviceModel.findOne({ _id: id, operator_id: optID }).lean().catch(e => ({ error: e }));
        //check for error
        if (getDevice && getDevice.error) {
            console.log("Error checking device for operator assign vehicle", getDevice.error);
            return helpers_1.default.outputError(res, 500);
        }
        if (!getDevice)
            return helpers_1.default.outputError(res, null, "Device not found");
        //check if the device is already assigned to another operator
        if (getDevice.vehicle_id)
            return helpers_1.default.outputError(res, null, "This device is already assigned to vehicle");
        //update the device with the vehicle id and assign status
        let Assignveh = await device_lists_1.DashcamDeviceModel.findByIdAndUpdate(id, {
            $set: { vehicle_id: vehicleID, assign_status: 2 }
        }, { lean: true, new: true }).catch((e) => ({ error: e }));
        if (Assignveh && Assignveh.error) {
            console.log("Error assigning device to operator", Assignveh.error);
            return helpers_1.default.outputError(res, 500);
        }
        //if the query does not execute
        if (!Assignveh)
            return helpers_1.default.outputError(res, null, helpers_1.default.errorText.failedToProcess);
        //add the device id to the vehicle
        await opt_vehlists_1.OptVehicleListModel.findByIdAndUpdate(vehicleID, { $set: { device_id: id, device_assigned: 1 } }).catch(e => { });
        helpers_1.default.logOperatorActivity({
            auth_id: userData.auth_id, operator_id: optID, operation: "assign-device",
            data: { id: vehicleID, plate_number: getOpt.plate_number },
            body: `Assigned device with number ${getDevice.device_number} to vehicle ${getOpt.plate_number}`
        }).catch(e => { });
        return helpers_1.default.outputSuccess(res);
    }
    static async UnassignDeviceFromVehicle({ body, res, req, id, customData: userData }) {
        let optID = helpers_1.default.getOperatorAuthID(userData);
        //get the device data
        let getDevice = await opt_vehlists_1.OptVehicleListModel.findOne({
            device_id: id, operator_id: optID
        }).lean().catch(e => ({ error: e }));
        //check for error
        if (getDevice && getDevice.error) {
            console.log("Error checking device for operator unassign device", getDevice.error);
            return helpers_1.default.outputError(res, 500);
        }
        if (!getDevice)
            return helpers_1.default.outputError(res, null, "Device not found");
        //remove the device id from the vehicle and change assign status
        let unAssign = await opt_vehlists_1.OptVehicleListModel.findByIdAndUpdate(getDevice._id, {
            $unset: { device_id: 1 }, $set: { device_assigned: 0 }
        }, { lean: true, new: true }).catch((e) => ({ error: e }));
        if (unAssign && unAssign.error) {
            console.log("Error unassigning device from vehicle", unAssign.error);
            return helpers_1.default.outputError(res, 500);
        }
        //if the query does not execute
        if (!unAssign)
            return helpers_1.default.outputError(res, null, helpers_1.default.errorText.failedToProcess);
        //remove the vehicle id from the device
        await device_lists_1.DashcamDeviceModel.findOneAndUpdate({ operator_id: optID, _id: id }, { $unset: { vehicle_id: 1 }, $set: { assign_status: 1 } }).catch(e => { });
        helpers_1.default.logOperatorActivity({
            auth_id: userData.auth_id, operator_id: optID, operation: "unassign-device",
            data: { id: getDevice._id, plate_number: getDevice.plate_number },
            body: `Unassigned device with number ${getDevice.device_number} from vehicle ${getDevice.plate_number}`
        }).catch(e => { });
        return helpers_1.default.outputSuccess(res);
    }
    static async DeleteDevice({ body, res, req, id, customData: userData }) {
        let optID = helpers_1.default.getOperatorAuthID(userData);
        //if method is not delete
        let getData = await device_lists_1.DashcamDeviceModel.findOne({
            _id: new dbConnector_1.mongoose.Types.ObjectId(id), operator_id: optID
        }).lean().catch((e) => ({ error: e }));
        //check for error
        if (getData && getData.error) {
            console.log("Error finding device by admin to delete", getData.error);
            return helpers_1.default.outputError(res, 500);
        }
        if (!getData)
            return helpers_1.default.outputError(res, null, "Device not found");
        //if the device is link, request for unlinking
        if (getData.vehicle_id)
            return helpers_1.default.outputError(res, null, "Device is currently assigned to a vehicle.");
        let deleteResult = await device_lists_1.DashcamDeviceModel.findByIdAndDelete(id).lean().catch((e) => ({ error: e }));
        if (deleteResult && deleteResult.error) {
            console.log("Error deleting device by operator", deleteResult.error);
            return helpers_1.default.outputError(res, 500);
        }
        if (!deleteResult)
            return helpers_1.default.outputError(res, null, helpers_1.default.errorText.failedToProcess);
        helpers_1.default.logOperatorActivity({
            auth_id: userData.auth_id, operator_id: optID,
            operation: "device-delete", body: `Deleted a device - ${getData.device_model}`,
            data: {},
        }).catch(e => { });
        return helpers_1.default.outputSuccess(res, {});
    }
    static async RegisterDevice({ body, id, res, req, customData: userData }) {
        let deviceID = helpers_1.default.getInputValueString(body, "device_number");
        let deviceModel = helpers_1.default.getInputValueString(body, "device_model");
        let deviceOEM = helpers_1.default.getInputValueString(body, "device_oem");
        let optID = helpers_1.default.getOperatorAuthID(userData);
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
            qBuilder.created_by = "operator";
            qBuilder.operator_id = new dbConnector_1.mongoose.Types.ObjectId(optID);
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
        let saveDevice = id ? await device_lists_1.DashcamDeviceModel.findOneAndUpdate({ _id: id, operator_id: optID }, { $set: qBuilder }, { lean: true, new: true }).catch(e => ({ error: e })) : await device_lists_1.DashcamDeviceModel.create(qBuilder).catch(e => ({ error: e }));
        //check for error
        if (saveDevice && saveDevice.error) {
            console.log("Error registering device by admin", saveDevice.error);
            return helpers_1.default.outputError(res, 500);
        }
        if (!saveDevice)
            return helpers_1.default.outputError(res, null, helpers_1.default.errorText.failedToProcess);
        helpers_1.default.logOperatorActivity({
            auth_id: userData.auth_id, operator_id: optID,
            operation: "device-register", body: id ? `Updated device - ${saveDevice.device_number} information` : `Registered a new device - ${deviceID}`,
            data: { id: String(saveDevice._id), device_number: saveDevice.device_number },
        }).catch(e => { });
        return helpers_1.default.outputSuccess(res, {});
    }
    //========**************VEHICLE SECTION***********=========================/
    static async AddVehicles({ body, id, res, customData: userData }) {
        let plateNo = helpers_1.default.getInputValueString(body, "plate_number");
        let vehOEM = helpers_1.default.getInputValueString(body, "vehicle_oem");
        let vehModel = helpers_1.default.getInputValueString(body, "vehicle_model");
        let vehVin = helpers_1.default.getInputValueString(body, "vehicle_vin");
        let yearPurchase = helpers_1.default.getInputValueString(body, "year_purchase");
        let collectionID = helpers_1.default.getInputValueString(body, "collection_id");
        let optID = helpers_1.default.getOperatorAuthID(userData);
        let qBuilder = {};
        let logMsg = "Updated";
        //if there's no ID for update
        if (!id) {
            if (!plateNo)
                return helpers_1.default.outputError(res, null, "Plate number is required");
            if (!vehOEM)
                return helpers_1.default.outputError(res, null, "Vehicle OEM is required");
            if (!vehModel)
                return helpers_1.default.outputError(res, null, "Vehicle model is required");
            //check if the account is not approved yet
            let getData = await user_operators_1.UserOperatorModel.findById(optID).catch(e => ({ error: e }));
            //check for error
            if (getData && getData.error) {
                console.log("Error getting operator account to add vehicle", getData.error);
                return helpers_1.default.outputError(res, 500);
            }
            //if no data found or the account is not active
            if (!getData || getData.account_status !== 1)
                return helpers_1.default.outputError(res, null, "Only approved account can add vehicles");
            qBuilder.operator_id = new dbConnector_1.mongoose.Types.ObjectId(optID);
        }
        //year you bought the vehicle
        if (yearPurchase) {
            if (!helpers_1.default.isNumber({ input: yearPurchase, type: "int", unit: "positive", length: 4 })) {
                return helpers_1.default.outputError(res, null, "Invalid year of purchase");
            }
            qBuilder.year_purchase = yearPurchase;
            logMsg += logMsg.length > 7 ? `, year of purchase to ${yearPurchase}` : ` year of purchase to ${yearPurchase}`;
        }
        //VIN of the vehicle
        if (vehVin) {
            //if the value is invalid
            if (!helpers_1.default.isAllowedCharacters(vehVin)) {
                return helpers_1.default.outputError(res, null, "Vehicle vin contains invalid characters");
            }
            if (vehVin.length < 3 || vehVin.length > 45) {
                return helpers_1.default.outputError(res, null, vehVin.length < 3 ? "Vehicle vin is too short" : "Vehicle vin is too long");
            }
            qBuilder.vehicle_vin = vehVin;
            logMsg += logMsg.length > 7 ? `, vin to ${vehVin}` : ` vin to ${vehVin}`;
        }
        if (vehModel) {
            if (vehModel.length < 3 || vehModel.length > 45) {
                return helpers_1.default.outputError(res, null, vehModel.length < 3 ? "Vehicle model is too short" : "Vehicle model is too long");
            }
            qBuilder.vehicle_model = vehModel;
            logMsg += logMsg.length > 7 ? `, model to ${vehModel}` : ` model to ${vehModel}`;
        }
        if (vehOEM) {
            if (vehOEM.length < 3 || vehOEM.length > 45) {
                return helpers_1.default.outputError(res, null, vehOEM.length < 3 ? "Vehicle OEM is too short" : "Vehicle OEM is too long");
            }
            qBuilder.vehicle_oem = vehOEM;
            logMsg += logMsg.length > 7 ? `, OEM to ${vehOEM}` : ` OEM to ${vehOEM}`;
        }
        if (collectionID) {
            //if not valid
            let getCol = await device_lists_1.CollectionListModel.findOne({ operator_id: optID, _id: collectionID }).catch(e => ({ error: e }));
            //check for error
            if (getCol && getCol.error) {
                console.log("Error checking collection for vehicle", getCol.error);
                return helpers_1.default.outputError(res, 500);
            }
            if (!getCol)
                return helpers_1.default.outputError(res, null, "Collection not found");
            qBuilder.collection_id = new dbConnector_1.mongoose.Types.ObjectId(collectionID);
            logMsg += logMsg.length > 7 ? `, collection to ${getCol.collection_name}` : ` collection to ${getCol.collection_name}`;
        }
        //validate the data
        if (plateNo) {
            if (plateNo.length < 5 || plateNo.length > 15) {
                return helpers_1.default.outputError(res, null, "Plate number must be between 5 and 15 characters");
            }
            //check for invalid characters
            if (!helpers_1.default.isAllowedCharacters(plateNo)) {
                return helpers_1.default.outputError(res, null, "Plate number contains invalid characters");
            }
            qBuilder.plate_number = plateNo.toUpperCase();
            //check if user exist
            let checkvehicle = await opt_vehlists_1.OptVehicleListModel.findOne({
                plate_number: qBuilder.plate_number, operator_id: optID
            }, null, { lean: true }).catch((e) => ({ error: e }));
            //check for error
            if (checkvehicle && checkvehicle.error) {
                console.log("Error checking vehicle unique plate no", checkvehicle.error);
                return helpers_1.default.outputError(res, 500);
            }
            //if not exist
            if (checkvehicle && (!id || String(checkvehicle._id) !== id)) {
                return helpers_1.default.outputError(res, null, "Vehicle already exist with this plate number");
            }
            logMsg += logMsg.length > 7 ? `, plate number to ${qBuilder.plate_number}` : ` plate number to ${qBuilder.plate_number}`;
        }
        if (Object.keys(qBuilder).length === 0)
            return helpers_1.default.outputError(res, null, "No data to process");
        let createVehicle = id ? opt_vehlists_1.OptVehicleListModel.findOneAndUpdate({ _id: id, operator_id: optID }, { $set: qBuilder }, { new: true, lean: true }).catch(e => ({ error: e })) :
            await opt_vehlists_1.OptVehicleListModel.create(qBuilder).catch(e => ({ error: e }));
        //if there's error in creating the account
        if (createVehicle && createVehicle.error) {
            console.log("Error creating operator vehicle", createVehicle.error);
            return helpers_1.default.outputError(res, 500);
        }
        //if query failed
        if (!createVehicle) {
            return helpers_1.default.outputError(res, null, helpers_1.default.errorText.failedToProcess);
        }
        helpers_1.default.logOperatorActivity({
            auth_id: userData.auth_id, operator_id: optID,
            operation: "create-vehicle", data: {
                id: String(createVehicle._id),
                plate_number: (qBuilder.plate_number || createVehicle.plate_number)
            },
            body: id ? logMsg : `Created a new vehicle with plate number ${qBuilder.plate_number}`
        }).catch(e => { });
        return helpers_1.default.outputSuccess(res);
    }
    static async BulkUploadVehicle({ body, res, customData: userData }) {
        const regex = /Content-Type: text\/csv\r?\n\r?\n([\s\S]*?)\r?\n--/i;
        const match = String(body).match(regex);
        //when the csv content is not found
        if (!match || !match[1]) {
            return helpers_1.default.outputError(res, null, 'The file is empty or invalid. It should be a .csv file.');
        }
        const csvContent = match[1];
        //when the csv content is empty
        if (!csvContent || !csvContent.length) {
            return helpers_1.default.outputError(res, null, 'The file is empty! It should contain at least one record.');
        }
        //convert to Object
        const data = helpers_1.default.csvToJsonArray(csvContent);
        let optID = helpers_1.default.getOperatorAuthID(userData);
        if (!data) {
            return helpers_1.default.outputError(res, null, 'Please upload your csv file again');
        }
        if (data.length === 0) {
            return helpers_1.default.outputError(res, null, 'Looks like your file is empty');
        }
        let errorItem = [];
        let newVehicles = [];
        //run validation
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            //if vehicle model is not provided
            if (!item.vehicle_model || item.vehicle_model.length < 2 || item.vehicle_model.length > 45) {
                item.message = item.message ? item.message + ", " : "";
                item.message += "A valid vehicle model is required";
            }
            if (!item.vehicle_oem || item.vehicle_oem.length < 3 || item.vehicle_oem.length > 45) {
                item.message = item.message ? item.message + ", " : "";
                item.message += "A valid vehicle OEM is required";
            }
            //if plate number is not provided
            if (!item.plate_number || !helpers_1.default.isAllowedCharacters(item.plate_number)) {
                item.message = item.message ? item.message + ", " : "";
                item.message += "A valid plate number is required";
            }
            if (item.vehicle_vin) {
                if (item.vehicle_vin.length < 3 || item.vehicle_vin.length > 45) {
                    item.message = item.message ? item.message + ", " : "";
                    item.message += "Vehicle vin is not valid";
                }
            }
            if (item.year_purchase) {
                if (!helpers_1.default.isNumber({ input: item.year_purchase, type: "int", unit: "positive", length: 4 })) {
                    item.message = item.message ? item.message + ", " : "";
                    item.message += "Purchase year is not valid";
                }
            }
            //if there's any error, add to error list
            if (item.message) {
                errorItem.push(item);
                continue;
            }
            let getData = await opt_vehlists_1.OptVehicleListModel.findOne({
                plate_number: item.plate_number.toUpperCase(), operator_id: optID
            }).lean().catch(e => ({ error: e }));
            //check for error
            if (getData && getData.error) {
                console.error('Error while checking if operator vehicle exist - bulkupload', getData.error);
                return helpers_1.default.outputError(res, 500);
            }
            //if vehicle exist
            if (getData) {
                if (getData.plate_number === item.plate_number.toUpperCase()) {
                    item.message = item.message ? item.message + ", " : "";
                    item.message += "vehicle plate number already registered";
                }
                else {
                    item.message = item.message ? item.message + ", " : "";
                    item.message += "vehicle already registered";
                }
                errorItem.push(item);
                continue;
            }
            //if valid, add to new vehicles
            newVehicles.push({
                operator_id: new dbConnector_1.mongoose.Types.ObjectId(optID),
                plate_number: item.plate_number.toUpperCase(),
                vehicle_model: item.vehicle_model || "",
                vehicle_oem: item.vehicle_oem || "",
                vehicle_vin: item.vehicle_vin || "",
                year_purchase: item.year_purchase ? parseInt(item.year_purchase) : null,
            });
        }
        //if there's nothing to process
        if (!newVehicles || newVehicles.length === 0) {
            return res.json({
                message: 'No valid data to process. Please check the errors and try again.',
                error: errorItem
            });
        }
        //save only the valid vehicle
        let saveVehs = await opt_vehlists_1.OptVehicleListModel.insertMany(newVehicles).catch(e => ({ error: e }));
        //if there's an error
        if (saveVehs && saveVehs.error) {
            //if the account already exist
            if (saveVehs.error.code === 11000) {
                return helpers_1.default.outputError(res, null, "Plate number already exist");
            }
            console.error('Error while saving the operator veh - bulkupload', saveVehs.error);
            return helpers_1.default.outputError(res, 500);
        }
        //if failed
        if (!saveVehs)
            return helpers_1.default.outputError(res, null, helpers_1.default.errorText.failedToProcess);
        return res.json({
            message: errorItem.length ? 'Some vehicles were added, some were not. See below errors.' :
                'All vehicles were added successfully.', error: errorItem,
        });
    }
    static async GetVehicles({ query, id, res, customData: userData }) {
        let q = helpers_1.default.getInputValueString(query, "q");
        let deviceAssigned = helpers_1.default.getInputValueString(query, "device_assigned");
        let status = helpers_1.default.getInputValueString(query, "status");
        let startDate = helpers_1.default.getInputValueString(query, "start_date");
        let endDate = helpers_1.default.getInputValueString(query, "end_date");
        let online = helpers_1.default.getInputValueString(query, "online");
        let timezone = helpers_1.default.getInputValueString(query, "timezone");
        let collectionID = helpers_1.default.getInputValueString(query, "collection_id");
        let page = helpers_1.default.getInputValueString(query, "page");
        let itemPerPage = helpers_1.default.getInputValueString(query, "item_per_page");
        let component = helpers_1.default.getInputValueString(query, "component");
        let optID = helpers_1.default.getOperatorAuthID(userData);
        let qBuilder = { operator_id: new dbConnector_1.mongoose.Types.ObjectId(optID) };
        if (id) {
            qBuilder._id = new dbConnector_1.mongoose.Types.ObjectId(id);
        }
        if (collectionID) {
            //if not valid
            if (!helpers_1.default.isInvalidID(collectionID))
                return helpers_1.default.outputError(res, null, "Invalid collection ID");
            qBuilder.collection_id = new dbConnector_1.mongoose.Types.ObjectId(collectionID);
        }
        //chek start date if submitted
        if (startDate) {
            if (helpers_1.default.isDateFormat(startDate)) {
                return helpers_1.default.outputError(res, null, 'Invalid start date. must be in the formate YYYY-MM-DD');
            }
            //if there's no end time
            if (!endDate)
                return helpers_1.default.outputError(res, null, 'end_date is required when using start_date');
        }
        //chek end date if submitted
        if (endDate) {
            //if start date is not submitted
            if (helpers_1.default.isDateFormat(endDate)) {
                return helpers_1.default.outputError(res, null, 'Invalid end date. must be in the formate YYYY-MM-DD');
            }
            if (!startDate)
                return helpers_1.default.outputError(res, null, 'end_date can only be used with start_date');
            //if there's no timezone, return
            if (!timezone)
                return helpers_1.default.outputError(res, null, "Timezone is required when using start_date or end_date");
            //check if the date are wrong
            if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
                return helpers_1.default.outputError(res, null, 'start date can not be greater than end date');
            }
            //valida the timezone
            if (!helpers_1.GlobalTimeZones.includes(timezone))
                return helpers_1.default.outputError(res, null, "Submitted timezone is invalid");
            let getUTCStart = helpers_1.default.convertDateTimeZone({
                dateString: `${startDate}T00:00:00`,
                fromTimeZone: timezone, toTimeZone: "utc"
            });
            let getUTCEnd = helpers_1.default.convertDateTimeZone({
                dateString: `${endDate}T23:59:59`,
                fromTimeZone: timezone, toTimeZone: "utc"
            });
            // @ts-expect-error
            qBuilder.createdAt = { $gte: getUTCStart.dateObj, $lt: getUTCEnd.dateObj };
        }
        if (status) {
            if (!["0", "1", "2"].includes(status)) {
                return helpers_1.default.outputError(res, null, "Invalid status.");
            }
            qBuilder.status = parseInt(status);
        }
        //when online status is provided
        if (online) {
            if (!["0", "1"].includes(online)) {
                return helpers_1.default.outputError(res, null, "Invalid online status.");
            }
        }
        //when online status is provided
        if (deviceAssigned) {
            if (!["0", "1"].includes(deviceAssigned)) {
                return helpers_1.default.outputError(res, null, "Invalid device assigned status.");
            }
            qBuilder.device_assigned = parseInt(deviceAssigned);
        }
        //validate the data one after the other
        if (q) {
            if (helpers_1.default.hasInvalidSearchChar(q)) {
                return helpers_1.default.outputError(res, null, "Special characters not allowed on search.");
            }
            qBuilder.plate_number = { $regex: q, $options: 'i' };
        }
        let pageItem = helpers_1.default.getPageItemPerPage(itemPerPage, page);
        if (!pageItem.status)
            return helpers_1.default.outputError(res, null, pageItem.msg);
        let pipLine = [
            { $match: qBuilder },
            { $addFields: { vehicle_id: "$_id" } },
            ...(online ? [{
                    $lookup: {
                        from: var_config_1.DatabaseTableList.dashcam_devices,
                        let: { deviceID: "$device_id" },
                        pipeline: [{
                                $match: { $expr: { $eq: ["$_id", "$$deviceID"] }, online: online === "1" },
                            }],
                        as: "device_data"
                    }
                },
                { $unwind: "$device_data" },
            ] : []),
            { $sort: { _id: -1 } },
            { $skip: pageItem.data.page },
            { $limit: pageItem.data.item_per_page },
            ...(!online ? [{
                    $lookup: {
                        from: var_config_1.DatabaseTableList.dashcam_devices,
                        let: { deviceID: "$device_id" },
                        pipeline: [{
                                $match: { $expr: { $eq: ["$_id", "$$deviceID"] } },
                            }],
                        as: "device_data"
                    }
                },
                { $unwind: { path: "$device_data", preserveNullAndEmptyArrays: true } },
            ] : []),
            {
                $lookup: {
                    from: var_config_1.DatabaseTableList.collection_lists,
                    let: { collID: "$collection_id" },
                    pipeline: [{
                            $match: { $expr: { $eq: ["$_id", "$$collID"] } },
                        }],
                    as: "collection_data"
                }
            },
            { $unwind: { path: "$collection_data", preserveNullAndEmptyArrays: true } },
            { $addFields: { collection_name: "$collection_data.name" } },
            { $unset: ["__v", "_id", "device_data._id", "device_data.__v", "collection_data", "device_data.operator_id", "device_data.created_by"] },
        ];
        //if there's ID
        if (id) {
            //handle ID fetch later for other component if needed
        }
        if (component) {
            switch (component) {
                case "count":
                    pipLine = [
                        { $match: qBuilder },
                        { $count: "total" },
                        { $unset: "_id" }
                    ];
                    break;
                case "count-status":
                    pipLine = [
                        { $match: qBuilder },
                        {
                            $group: {
                                _id: null,
                                total_count: { $sum: 1 },
                                total_active: { $sum: { $cond: [{ $eq: ["$status", 1] }, 1, 0] } },
                                total_suspended: { $sum: { $cond: [{ $eq: ["$status", 2] }, 1, 0] } },
                                total_with_device: { $sum: { $cond: [{ $ifNull: ["$device_assigned", 1] }, 1, 0] } },
                            }
                        },
                        {
                            $lookup: {
                                from: var_config_1.DatabaseTableList.dashcam_devices,
                                let: { optID: new dbConnector_1.mongoose.Types.ObjectId(optID) },
                                pipeline: [
                                    { $match: { $expr: { $eq: ["$operator_id", "$$optID"] }, online: true } },
                                    { $count: "total" }
                                ],
                                as: "device_data"
                            }
                        },
                        { $unwind: { path: "$device_data", preserveNullAndEmptyArrays: true } },
                        { $addFields: { total_online: "$device_data.total" } },
                        { $unset: ["_id", "device_data"] }
                    ];
                    break;
                case "export":
                    return helpers_1.default.outputError(res, null, "Not Ready Yet!");
                default:
                    return helpers_1.default.outputError(res, null, "invalid component");
            }
        }
        let getData = await opt_vehlists_1.OptVehicleListModel.aggregate(pipLine).catch(e => ({ error: e }));
        //check error
        if (getData && getData.error) {
            console.log("Error getting operator vehicle list", getData.error);
            return helpers_1.default.outputError(res, 500);
        }
        if (component || id) {
            getData = getData.length ? getData[0] : {};
        }
        return helpers_1.default.outputSuccess(res, getData);
    }
    static async DeleteVehicle({ res, body, customData: userData }) {
        let optID = helpers_1.default.getOperatorAuthID(userData);
        let vehicleIDs = helpers_1.default.getInputValueArray(body, "vehicle_ids");
        let isSyncReq = vehicleIDs.length <= 10;
        //if there's no ID or array of IDs
        if (!vehicleIDs || vehicleIDs.length === 0) {
            return helpers_1.default.outputError(res, null, "Vehicle ID is required");
        }
        //if the ID greater than 100
        if (vehicleIDs.length > 100) {
            return helpers_1.default.outputError(res, null, "You can only delete up to 100 vehicles at once");
        }
        //if length request is less than 10, delete as sync, otherwise return and delete in background
        if (!isSyncReq)
            helpers_1.default.outputSuccess(res, { msg: "Vehicle deletion is in progress. Refresh the page to see the updates." });
        //remove duplicates
        vehicleIDs = [...new Set(vehicleIDs)];
        for (let vehID of vehicleIDs) {
            //if the ID is not valid
            if (!helpers_1.default.isInvalidID(vehID)) {
                if (isSyncReq) {
                    return helpers_1.default.outputError(res, null, `Invalid vehicle ID ${vehID}`);
                }
                else {
                    continue;
                }
            }
            //if there's no schedule data
            let getData = await opt_vehlists_1.OptVehicleListModel.findOne({
                _id: vehID, operator_id: optID
            }, null, { lean: true }).catch(e => ({ error: e }));
            //if there's error
            if (getData && getData.error) {
                if (isSyncReq) {
                    return helpers_1.default.outputError(res, 500);
                }
                else {
                    continue;
                }
            }
            if (!getData) {
                if (isSyncReq) {
                    return helpers_1.default.outputError(res, null, "Vehicle not found");
                }
                else {
                    continue;
                }
            }
            let deleteData = await opt_vehlists_1.OptVehicleListModel.findByIdAndDelete(vehID).catch((e) => ({ error: e }));
            //check for error
            if (!deleteData || deleteData.error) {
                if (isSyncReq) {
                    return helpers_1.default.outputError(res, 500);
                }
                else {
                    continue;
                }
            }
            //log activity
            helpers_1.default.logOperatorActivity({
                auth_id: userData.auth_id, operator_id: optID,
                operation: "delete-vehicle", data: { id: String(getData._id), plate_number: getData.plate_number },
                body: `Deleted ${getData.plate_number} vehicle from the system`
            }).catch(e => { });
        }
        if (!res.headersSent)
            return helpers_1.default.outputSuccess(res, { msg: "Vehicle(s) deleted successfully" });
    }
    static async SuspendedVehicles({ body, res, customData: userData }) {
        let status = helpers_1.default.getInputValueString(body, "status");
        let reason = helpers_1.default.getInputValueString(body, "reason");
        let vehicleIDs = helpers_1.default.getInputValueArray(body, "vehicle_ids");
        let optID = helpers_1.default.getOperatorAuthID(userData);
        let qBuilder = {};
        let isSyncReq = vehicleIDs.length <= 10;
        //if there's no ID or array of IDs
        if (!vehicleIDs || vehicleIDs.length === 0) {
            return helpers_1.default.outputError(res, null, "Vehicle ID is required");
        }
        //if the ID greater than 100
        if (vehicleIDs.length > 100) {
            return helpers_1.default.outputError(res, null, "You can only perform this action on up to 100 vehicles at once");
        }
        //if the status is not provided
        if (!status)
            return helpers_1.default.outputError(res, null, "Status is required");
        if (!['1', '2'].includes(status))
            return helpers_1.default.outputError(res, null, "Invalid vehicle status");
        if (status === '2') {
            //if there's no suspend reason
            if (!reason)
                return helpers_1.default.outputError(res, null, "Suspend reason is required when suspending a vehicle");
            qBuilder.status = parseInt(status);
            qBuilder.suspend_date = new Date().toISOString();
        }
        else {
            qBuilder.status = parseInt(status);
        }
        if (reason) {
            if (reason.length < 10 || reason.length > 500) {
                return helpers_1.default.outputError(res, null, reason.length < 10 ? "suspend reason is too short" : "suspend reason is too long");
            }
            qBuilder.suspend_reason = reason;
        }
        //if length request is less than 10, delete as sync, otherwise return and delete in background
        if (!isSyncReq)
            helpers_1.default.outputSuccess(res, { msg: "Action is in progress. Refresh the page to see the updates." });
        //remove duplicates
        vehicleIDs = [...new Set(vehicleIDs)];
        for (let vehID of vehicleIDs) {
            //if the ID is not valid
            if (!helpers_1.default.isInvalidID(vehID)) {
                if (isSyncReq) {
                    return helpers_1.default.outputError(res, null, `Invalid vehicle ID ${vehID}`);
                }
                else {
                    continue;
                }
            }
            let updateStatus = await opt_vehlists_1.OptVehicleListModel.findOneAndUpdate({ _id: vehID, operator_id: optID }, { $set: qBuilder }, { new: true }).catch(e => ({ error: e }));
            //check for error
            if (updateStatus && updateStatus.error) {
                if (isSyncReq) {
                    return helpers_1.default.outputError(res, 500);
                }
                else {
                    continue;
                }
            }
            //if the query does not execute
            if (!updateStatus) {
                if (isSyncReq) {
                    return helpers_1.default.outputError(res, null, helpers_1.default.errorText.failedToProcess);
                }
                else {
                    continue;
                }
            }
            // //log activity
            helpers_1.default.logOperatorActivity({
                auth_id: userData.auth_id, operator_id: optID,
                operation: "update-vehicle", data: { id: String(updateStatus._id), plate_number: updateStatus.plate_number },
                body: `${status === "1" ? "Activated" : "Suspended"} ${updateStatus.plate_number} vehicle`
            }).catch(e => { });
        }
        if (!res.headersSent)
            return helpers_1.default.outputSuccess(res, { msg: "Action completed successfully" });
    }
    //========**************ALARM SECTION***********=========================/
    static async GetAlarmData({ query, id, res, customData: userData }) {
        let q = helpers_1.default.getInputValueString(query, "q");
        let status = helpers_1.default.getInputValueString(query, "status");
        let startDate = helpers_1.default.getInputValueString(query, "start_date");
        let endDate = helpers_1.default.getInputValueString(query, "end_date");
        let timezone = helpers_1.default.getInputValueString(query, "timezone");
        let alarmType = helpers_1.default.getInputValueString(query, "alarm_type");
        let vehicleID = helpers_1.default.getInputValueString(query, "vehicle_id");
        let page = helpers_1.default.getInputValueString(query, "page");
        let itemPerPage = helpers_1.default.getInputValueString(query, "item_per_page");
        let component = helpers_1.default.getInputValueString(query, "component");
        let optID = helpers_1.default.getOperatorAuthID(userData);
        let qBuilder = { operator_id: new dbConnector_1.mongoose.Types.ObjectId(optID) };
        if (id) {
            qBuilder._id = new dbConnector_1.mongoose.Types.ObjectId(id);
        }
        if (vehicleID) {
            if (helpers_1.default.isInvalidID(vehicleID)) {
                return helpers_1.default.outputError(res, null, "Invalid vehicle ID");
            }
            qBuilder.vehicle_id = new dbConnector_1.mongoose.Types.ObjectId(vehicleID);
        }
        if (alarmType) {
            //check if the value is valid
            qBuilder.alarm_type = alarmType;
        }
        //chek start date if submitted
        if (startDate) {
            if (helpers_1.default.isDateFormat(startDate)) {
                return helpers_1.default.outputError(res, null, 'Invalid start date. must be in the formate YYYY-MM-DD');
            }
            //if there's no end time
            if (!endDate)
                return helpers_1.default.outputError(res, null, 'end_date is required when using start_date');
        }
        //chek end date if submitted
        if (endDate) {
            //if start date is not submitted
            if (helpers_1.default.isDateFormat(endDate)) {
                return helpers_1.default.outputError(res, null, 'Invalid end date. must be in the formate YYYY-MM-DD');
            }
            if (!startDate)
                return helpers_1.default.outputError(res, null, 'end_date can only be used with start_date');
            //if there's no timezone, return
            if (!timezone)
                return helpers_1.default.outputError(res, null, "Timezone is required when using start_date or end_date");
            //check if the date are wrong
            if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
                return helpers_1.default.outputError(res, null, 'start date can not be greater than end date');
            }
            //valida the timezone
            if (!helpers_1.GlobalTimeZones.includes(timezone))
                return helpers_1.default.outputError(res, null, "Submitted timezone is invalid");
            let getUTCStart = helpers_1.default.convertDateTimeZone({
                dateString: `${startDate}T00:00:00`,
                fromTimeZone: timezone, toTimeZone: "utc"
            });
            let getUTCEnd = helpers_1.default.convertDateTimeZone({
                dateString: `${endDate}T23:59:59`,
                fromTimeZone: timezone, toTimeZone: "utc"
            });
            // @ts-expect-error
            qBuilder.createdAt = { $gte: getUTCStart.dateObj, $lt: getUTCEnd.dateObj };
        }
        //when online status is provided
        if (status || status === "0") {
            if (isNaN(parseFloat(status))) {
                return helpers_1.default.outputError(res, null, "Invalid vehicle status.");
            }
            qBuilder.status = parseInt(status);
        }
        //validate the data one after the other
        if (q) {
            if (helpers_1.default.hasInvalidSearchChar(q)) {
                return helpers_1.default.outputError(res, null, "Special characters not allowed on search.");
            }
            //get the vehicle with the plate number
            let getVeh = await opt_vehlists_1.OptVehicleListModel.findOne({
                plate_number: q, operator_id: optID
            }, null, { lean: true }).catch(e => ({ error: e }));
            //check for error
            if (getVeh && getVeh.error) {
                console.log("Error getting vehicle for alarm search", getVeh.error);
                return helpers_1.default.outputError(res, 500);
            }
            if (getVeh) {
                qBuilder.vehicle_id = getVeh._id;
            }
            else {
                qBuilder.alarm_ref = q;
            }
        }
        let pageItem = helpers_1.default.getPageItemPerPage(itemPerPage, page);
        if (!pageItem.status)
            return helpers_1.default.outputError(res, null, pageItem.msg);
        let pipLine = [
            { $match: qBuilder },
            { $addFields: { alarm_id: "$_id" } },
            { $sort: { _id: -1 } },
            { $skip: pageItem.data.page },
            { $limit: pageItem.data.item_per_page },
            {
                $lookup: {
                    from: var_config_1.DatabaseTableList.vehicle_lists,
                    let: { vehID: "$vehicle_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$vehID"] } }, },
                        { $project: { plate_number: 1 } }
                    ],
                    as: "vehicle_data"
                }
            },
            { $unwind: { path: "$vehicle_data", preserveNullAndEmptyArrays: true } },
            { $addFields: { plate_number: "$vehicle_data.plate_number" } },
            { $unset: ["__v", "_id", "vehicle_data"] },
        ];
        if (component) {
            switch (component) {
                case "count":
                    pipLine = [
                        { $match: qBuilder },
                        { $count: "total" },
                        { $unset: "_id" }
                    ];
                    break;
                case "count-status":
                    pipLine = [
                        { $match: qBuilder },
                        {
                            $group: {
                                _id: null,
                                total_count: { $sum: 1 },
                                total_resolved: { $sum: { $cond: [{ $eq: ["$status", 1] }, 1, 0] } },
                                total_unresolved: { $sum: { $cond: [{ $ne: ["$status", 0] }, 1, 0] } },
                            }
                        },
                        { $unset: ["_id"] }
                    ];
                    break;
                case "export":
                    return helpers_1.default.outputError(res, null, "Not Ready Yet!");
                default:
                    return helpers_1.default.outputError(res, null, "invalid component");
            }
        }
        let getData = await device_data_1.DashcamAlarmModel.aggregate(pipLine).catch(e => ({ error: e }));
        //check error
        if (getData && getData.error) {
            console.log("Error getting operator alarm list", getData.error);
            return helpers_1.default.outputError(res, 500);
        }
        if (component || id) {
            getData = getData.length ? getData[0] : {};
        }
        return helpers_1.default.outputSuccess(res, getData);
    }
    static async UpdateAlarmStatus({ body, res, id, customData: userData }) {
        let status = helpers_1.default.getInputValueString(body, "status");
        let alarmIDs = helpers_1.default.getInputValueArray(body, "alarm_ids");
        let optID = helpers_1.default.getOperatorAuthID(userData);
        let isSyncReq = alarmIDs.length <= 10;
        //if there's no ID or array of IDs
        if (!alarmIDs || alarmIDs.length === 0) {
            return helpers_1.default.outputError(res, null, "Alarm ID is required");
        }
        //if the ID greater than 100
        if (alarmIDs.length > 100) {
            return helpers_1.default.outputError(res, null, "You can only perform this action on up to 100 alarms at once");
        }
        if (!status)
            return helpers_1.default.outputError(res, null, "Status is required");
        if (!['0', '1'].includes(status))
            return helpers_1.default.outputError(res, null, "Invalid alarm status");
        //if length request is less than 10, delete as sync, otherwise return and delete in background
        if (!isSyncReq)
            helpers_1.default.outputSuccess(res, { msg: "Action is in progress. Refresh the page to see the updates." });
        //remove duplicates
        alarmIDs = [...new Set(alarmIDs)];
        for (let alarmID of alarmIDs) {
            if (!helpers_1.default.isInvalidID(alarmID)) {
                if (isSyncReq) {
                    return helpers_1.default.outputError(res, null, `Invalid alarm ID ${alarmID}`);
                }
                else {
                    continue;
                }
            }
            let updateStatus = await device_data_1.DashcamAlarmModel.findOneAndUpdate({ _id: alarmID, operator_id: optID }, { $set: { status: parseInt(status) } }, { new: true })
                .populate("vehicle_id", "plate_number", opt_vehlists_1.OptVehicleListModel).catch(e => ({ error: e }));
            //check for error
            if (updateStatus && updateStatus.error) {
                if (isSyncReq) {
                    return helpers_1.default.outputError(res, 500);
                }
                else {
                    continue;
                }
            }
            //if the query does not execute
            if (!updateStatus) {
                if (isSyncReq) {
                    return helpers_1.default.outputError(res, null, helpers_1.default.errorText.failedToProcess);
                }
                else {
                    continue;
                }
            }
            // //log activity
            helpers_1.default.logOperatorActivity({
                auth_id: userData.auth_id, operator_id: optID,
                operation: "update-alarmstatus", data: {
                    id: String((updateStatus.vehicle_id || {})._id),
                    plate_number: (updateStatus.vehicle_id || {}).plate_number
                },
                body: `${status === "1" ? "Resolved" : "Reopened"} alarm status for ${(updateStatus.vehicle_id || {}).plate_number} vehicle`
            }).catch(e => { });
        }
        if (!res.headersSent)
            return helpers_1.default.outputSuccess(res, { msg: "Selected alarms have been updated successfully" });
    }
    static async DeleteAlarm({ res, body, customData: userData }) {
        let optID = helpers_1.default.getOperatorAuthID(userData);
        let alarmIDs = helpers_1.default.getInputValueArray(body, "alarm_ids");
        let isSyncReq = alarmIDs.length <= 10;
        //if there's no ID or array of IDs
        if (!alarmIDs || alarmIDs.length === 0) {
            return helpers_1.default.outputError(res, null, "Alarm ID is required");
        }
        //if the ID greater than 100
        if (alarmIDs.length > 100) {
            return helpers_1.default.outputError(res, null, "You can only delete up to 100 alarms at once");
        }
        //if length request is less than 10, delete as sync, otherwise return and delete in background
        if (!isSyncReq)
            helpers_1.default.outputSuccess(res, { msg: "Alarm deletion is in progress. Refresh the page to see the updates." });
        //remove duplicates
        alarmIDs = [...new Set(alarmIDs)];
        for (let alarmID of alarmIDs) {
            //if the ID is not valid
            if (!helpers_1.default.isInvalidID(alarmID)) {
                if (isSyncReq) {
                    return helpers_1.default.outputError(res, null, `Invalid alarm ID ${alarmID}`);
                }
                else {
                    continue;
                }
            }
            let deleteData = await device_data_1.DashcamAlarmModel.findOneAndDelete({ _id: alarmID, operator_id: optID })
                .populate("vehicle_id", "plate_number", opt_vehlists_1.OptVehicleListModel).catch((e) => ({ error: e }));
            //check for error
            if (deleteData && deleteData.error) {
                if (isSyncReq) {
                    return helpers_1.default.outputError(res, 500);
                }
                else {
                    continue;
                }
            }
            if (!deleteData) {
                if (isSyncReq) {
                    return helpers_1.default.outputError(res, null, helpers_1.default.errorText.failedToProcess);
                }
                else {
                    continue;
                }
            }
            // //log activity
            helpers_1.default.logOperatorActivity({
                auth_id: userData.auth_id, operator_id: optID,
                operation: "delete-alarmstatus", data: {
                    id: String((deleteData.vehicle_id || {})._id),
                    plate_number: (deleteData.vehicle_id || {}).plate_number
                },
                body: `Deleted alarm record for ${(deleteData.vehicle_id || {}).plate_number} vehicle`
            }).catch(e => { });
        }
        if (!res.headersSent)
            return helpers_1.default.outputSuccess(res, { msg: "Selected alarms have been deleted successfully" });
    }
}
exports.OperatorAssetService = OperatorAssetService;
