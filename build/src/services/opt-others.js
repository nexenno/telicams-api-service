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
exports.OperatorOtherService = void 0;
const helpers_1 = __importStar(require("../assets/helpers"));
const var_config_1 = require("../assets/var-config");
const activity_logs_1 = require("../models/activity-logs");
const dbConnector_1 = require("../models/dbConnector");
const device_lists_1 = require("../models/device-lists");
const opt_vehlists_1 = require("../models/opt-vehlists");
const user_operators_1 = require("../models/user-operators");
class OperatorOtherService {
    //========**************COLLECTION SECTION***********=========================/
    static async CreateCollection({ body, id, res, req, customData: userData }) {
        let name = helpers_1.default.getInputValueString(body, "name");
        let description = helpers_1.default.getInputValueString(body, "description");
        let optID = helpers_1.default.getOperatorAuthID(userData);
        let qBuilder = {};
        if (!id) {
            if (!name)
                return helpers_1.default.outputError(res, null, "Collection name is required");
            qBuilder.operator_id = new dbConnector_1.mongoose.Types.ObjectId(optID);
        }
        if (name) {
            //if the length is invalid
            if (name.length < 2 || name.length > 45) {
                return helpers_1.default.outputError(res, null, "Collection name must be between 2 and 45 characters");
            }
            //if the characters are invalid
            if (!helpers_1.default.isAllowedCharacters(name)) {
                return helpers_1.default.outputError(res, null, "Collection name contains invalid characters");
            }
            qBuilder.name = name;
        }
        if (description) {
            if (description.length < 5 || description.length > 300) {
                return helpers_1.default.outputError(res, null, "Collection description must be between 5 and 300 characters");
            }
            qBuilder.description = description;
        }
        if (Object.keys(qBuilder).length === 0)
            return helpers_1.default.outputError(res, null, "No data to process");
        let createColl = id ? device_lists_1.CollectionListModel.findOneAndUpdate({ _id: id, operator_id: optID }, { $set: qBuilder }, { new: true, lean: true }).catch(e => ({ error: e })) :
            await device_lists_1.CollectionListModel.create(qBuilder).catch(e => ({ error: e }));
        //if there's error in creating the account
        if (createColl && createColl.error) {
            console.log("Error creating collection", createColl.error);
            return helpers_1.default.outputError(res, 500);
        }
        //if query failed
        if (!createColl) {
            return helpers_1.default.outputError(res, null, helpers_1.default.errorText.failedToProcess);
        }
        helpers_1.default.logOperatorActivity({
            auth_id: userData.auth_id, operator_id: optID,
            operation: "create-collection", data: { id: String(createColl._id), name: createColl.name },
            body: id ? `Updated collection - ${createColl.name}` : `Created a new collection - ${createColl.name}`
        }).catch(e => { });
        return helpers_1.default.outputSuccess(res);
    }
    static async GetCollections({ query, body, id, res, req, customData: userData }) {
        let q = helpers_1.default.getInputValueString(query, "q");
        let page = helpers_1.default.getInputValueString(query, "page");
        let itemPerPage = helpers_1.default.getInputValueString(query, "item_per_page");
        let component = helpers_1.default.getInputValueString(query, "component");
        let optID = helpers_1.default.getOperatorAuthID(userData);
        let qBuilder = { operator_id: new dbConnector_1.mongoose.Types.ObjectId(optID) };
        if (id) {
            qBuilder._id = new dbConnector_1.mongoose.Types.ObjectId(id);
        }
        if (q) {
            if (helpers_1.default.hasInvalidSearchChar(q)) {
                return helpers_1.default.outputError(res, null, "Special characters not allowed on search.");
            }
            qBuilder.name = { $regex: q, $options: 'i' };
        }
        let pageItem = helpers_1.default.getPageItemPerPage(itemPerPage, page);
        if (!pageItem.status)
            return helpers_1.default.outputError(res, null, pageItem.msg);
        let pipLine = [
            { $match: qBuilder },
            { $sort: { _id: -1 } },
            ...(component === "export" ? [
                { $limit: 20000 },
            ] : [
                { $skip: pageItem.data.page },
                { $limit: pageItem.data.item_per_page },
            ]),
            {
                $lookup: {
                    from: var_config_1.DatabaseTableList.vehicle_lists,
                    let: { collID: "$_id" },
                    pipeline: [{
                            $match: { $expr: { $eq: ["$collection_id", "$$collID"] } },
                        }, {
                            $count: "total"
                        }],
                    as: "vehicle_count"
                }
            },
            { $unwind: { path: "$vehicle_count", preserveNullAndEmptyArrays: true } },
            { $addFields: { total_vehicle: { $ifNull: ["$vehicle_count.total", 0] } } },
            { $unset: ["__v", "_id", "vehicle_count"] }
        ];
        let getData = await device_lists_1.CollectionListModel.aggregate(pipLine).catch(e => ({ error: e }));
        //check error
        if (getData && getData.error) {
            console.log("Error getting collection list", getData.error);
            return helpers_1.default.outputError(res, 500);
        }
        if (component || id) {
            getData = getData.length ? getData[0] : {};
        }
        return helpers_1.default.outputSuccess(res, getData);
    }
    static async DeleteCollection({ query, body, id, res, req, customData: userData }) {
        let optID = helpers_1.default.getOperatorAuthID(userData);
        //check if the collection exist
        let getCol = await device_lists_1.CollectionListModel.findOneAndDelete({
            _id: id, operator_id: optID
        }).catch(e => ({ error: e }));
        //check for error
        if (getCol && getCol.error) {
            console.log("Error checking collection for delete", getCol.error);
            return helpers_1.default.outputError(res, 500);
        }
        if (!getCol)
            return helpers_1.default.outputError(res, null, "Collection not found");
        // TODO://remove the collection id from all the vehicles under this collection
        // TODO://remove all users on collection off
        // //log activity
        helpers_1.default.logOperatorActivity({
            auth_id: userData.auth_id, operator_id: optID,
            operation: "delete-collectionstatus", data: {},
            body: `Deleted a collection - ${getCol.name}`
        }).catch(e => { });
        return helpers_1.default.outputSuccess(res);
    }
    static async UpdateCollection({ body, res, req, id, customData: userData }) {
        let status = helpers_1.default.getInputValueString(body, "status");
        let optID = helpers_1.default.getOperatorAuthID(userData);
        if (!status)
            return helpers_1.default.outputError(res, null, "Status is required");
        if (["1", "2"].includes(status))
            return helpers_1.default.outputError(res, null, "Invalid status");
        //if status is 2, check if there's any active vehicle under the collection
        if (status === "2") {
            let activeVeh = await opt_vehlists_1.OptVehicleListModel.findOne({
                collection_id: id, operator_id: optID
            }).catch(e => ({ error: e }));
            if (activeVeh && activeVeh.error) {
                console.log("Error checking active vehicle on collection update", activeVeh.error);
                return helpers_1.default.outputError(res, 500);
            }
            if (activeVeh)
                return helpers_1.default.outputError(res, null, "There are vehicles under this collection. Action Aborted!");
        }
        let updateCol = await device_lists_1.CollectionListModel.findOneAndUpdate({ _id: id, operator_id: optID }, { $set: { status: parseInt(status) } }, { lean: true, new: true }).catch(e => ({ error: e }));
        if (updateCol && updateCol.error) {
            console.log("Error updating collection status", updateCol.error);
            return helpers_1.default.outputError(res, 500);
        }
        if (!updateCol)
            return helpers_1.default.outputError(res, null, helpers_1.default.errorText.failedToProcess);
        // //log activity
        helpers_1.default.logOperatorActivity({
            auth_id: userData.auth_id, operator_id: optID,
            operation: "update-collectionstatus", data: {},
            body: `${status === "1" ? "Activated" : "Archived"} a collection - ${updateCol.name}`
        }).catch(e => { });
        return helpers_1.default.outputSuccess(res);
    }
    //========**************ASSIGNING COLLECTION SECTION***********=========================/
    static async AssignVehicleToCollection({ body, res, req, id, customData: userData }) {
        let vehicleIDs = helpers_1.default.getInputValueArray(body, "vehicle_ids");
        let requestType = helpers_1.default.getInputValueString(body, "request_type");
        let optID = helpers_1.default.getOperatorAuthID(userData);
        let isSyncReq = vehicleIDs.length <= 10;
        if (!requestType)
            return helpers_1.default.outputError(res, null, "Request type is required");
        if (!["1", "2"].includes(requestType))
            return helpers_1.default.outputError(res, null, "Invalid request type");
        //if there's no ID or array of IDs
        if (!vehicleIDs || vehicleIDs.length === 0) {
            return helpers_1.default.outputError(res, null, "Vehicle ID is required");
        }
        //if the ID greater than 100
        if (vehicleIDs.length > 100) {
            return helpers_1.default.outputError(res, null, "You can only perform this action on up to 100 vehicles at once");
        }
        //if length request is less than 10, delete as sync, otherwise return and delete in background
        if (!isSyncReq)
            helpers_1.default.outputSuccess(res, { msg: "Action is in progress. Refresh the page to see the updates." });
        //check if the collection exist
        let getCol = await device_lists_1.CollectionListModel.findOne({ _id: id, operator_id: optID }).lean().catch(e => ({ error: e }));
        //check for error
        if (getCol && getCol.error) {
            console.log("Error checking collection for assign collection", getCol.error);
            return helpers_1.default.outputError(res, 500);
        }
        if (!getCol)
            return helpers_1.default.outputError(res, null, "Collection not found");
        //if the collection is archived, return error
        if (getCol.status === 2)
            return helpers_1.default.outputError(res, null, "Collection is archived. Action aborted!");
        //remove duplicates
        vehicleIDs = [...new Set(vehicleIDs)];
        for (let vehicleID of vehicleIDs) {
            if (!helpers_1.default.isInvalidID(vehicleID)) {
                if (isSyncReq) {
                    return helpers_1.default.outputError(res, null, `Invalid vehicle ID ${vehicleID}`);
                }
                else {
                    continue;
                }
            }
            //check if the vehicle exist and belong to the operator
            let checkVeh = await opt_vehlists_1.OptVehicleListModel.findOneAndUpdate({ _id: vehicleID, operator_id: optID }, requestType === "1" ? { $set: { collection_id: id } } : { $unset: { collection_id: 1 } }, { lean: true, new: true }).catch(e => ({ error: e }));
            //check for error
            if (!checkVeh || checkVeh.error) {
                if (isSyncReq) {
                    return helpers_1.default.outputError(res, null, requestType === "1" ? "Vehicle not found" : "Vehicle not found in collection");
                }
                else {
                    continue;
                }
            }
            // //log activity
            helpers_1.default.logOperatorActivity({
                auth_id: userData.auth_id, operator_id: optID,
                operation: requestType === "1" ? "assign-collection" : "remove-collection",
                data: { id: String(vehicleID), plate_number: checkVeh.plate_number },
                body: requestType === "1" ? `Assigned ${checkVeh.plate_number} vehicle to ${getCol.name} collection` :
                    `Removed ${checkVeh.plate_number} vehicle from ${getCol.name} collection`
            }).catch(e => { });
        }
        if (!isSyncReq)
            return helpers_1.default.outputSuccess(res, { msg: "Action completed successfully!" });
    }
    static async AssignCollectionToPersonnel({ body, res, req, id, customData: userData }) {
        let teamID = helpers_1.default.getInputValueString(body, "team_id");
        let requestType = helpers_1.default.getInputValueString(body, "request_type");
        let optID = helpers_1.default.getOperatorAuthID(userData);
        if (!requestType)
            return helpers_1.default.outputError(res, null, "Request type is required");
        if (!["1", "2"].includes(requestType))
            return helpers_1.default.outputError(res, null, "Invalid request type");
        //if there's no team ID
        if (!teamID)
            return helpers_1.default.outputError(res, null, "Team ID is required");
        //if the team ID is invalid
        if (helpers_1.default.isInvalidID(teamID))
            return helpers_1.default.outputError(res, null, "Invalid team ID");
        //check if the collection exist
        let teamData = await user_operators_1.UserOperatorModel.findOne({
            _id: teamID, operator_id: optID
        }).lean().catch(e => ({ error: e }));
        //check for error
        if (teamData && teamData.error) {
            console.log("Error checking team for assign collection", teamData.error);
            return helpers_1.default.outputError(res, 500);
        }
        if (!teamData)
            return helpers_1.default.outputError(res, null, "Team member not found");
        //check if the team member is active
        if (teamData.account_status !== 1)
            return helpers_1.default.outputError(res, null, "Team member is not active");
        //check if the collection exist
        let getCol = await device_lists_1.CollectionListModel.findOne({ _id: id, operator_id: optID }).lean().catch(e => ({ error: e }));
        //check for error
        if (getCol && getCol.error) {
            console.log("Error checking collection for assign collection personnel", getCol.error);
            return helpers_1.default.outputError(res, 500);
        }
        if (!getCol)
            return helpers_1.default.outputError(res, null, "Collection not found");
        //if the collection is archived, return error
        if (getCol.status === 2)
            return helpers_1.default.outputError(res, null, "Collection is archived. Action aborted!");
        let updateData = await user_operators_1.UserOperatorModel.findOneAndUpdate({ _id: teamID, operator_id: optID }, requestType === "1" ? { $addToSet: { collection_access: id } } : { $pull: { collection_access: id } }, { lean: true, new: true }).catch(e => ({ error: e }));
        if (updateData && updateData.error) {
            console.log("Error updating team collection access", updateData.error);
            return helpers_1.default.outputError(res, 500);
        }
        if (!updateData)
            return helpers_1.default.outputError(res, null, requestType === "1" ? "Team member not found" : "Team member not found in collection access");
        // //log activity
        helpers_1.default.logOperatorActivity({
            auth_id: userData.auth_id, operator_id: optID,
            operation: requestType === "1" ? "assign-collection" : "remove-collection",
            data: { id: String(userData.auth_id) },
            body: requestType === "1" ? `Assigned ${teamData.business_name} to ${getCol.name} collection` :
                `Removed ${teamData.business_name} from ${getCol.name} collection`
        }).catch(e => { });
        return helpers_1.default.outputSuccess(res);
    }
    //========**************ACTIVITY LOGS SECTION***********=========================/
    static async ActivityLogs({ query, res, req, id, customData: userData }) {
        let q = helpers_1.default.getInputValueString(query, "q");
        let startDate = helpers_1.default.getInputValueString(query, "start_date");
        let endDate = helpers_1.default.getInputValueString(query, "end_date");
        let timezone = helpers_1.default.getInputValueString(query, "timezone");
        let page = helpers_1.default.getInputValueString(query, "page");
        let itemPerPage = helpers_1.default.getInputValueString(query, "item_per_page");
        let component = helpers_1.default.getInputValueString(query, "component");
        let optID = helpers_1.default.getOperatorAuthID(userData);
        let queryBuilder = { operator_id: new dbConnector_1.mongoose.Types.ObjectId(optID) };
        let nameQuery = {};
        if (q) {
            if (!helpers_1.default.isAllowedCharacters(q)) {
                return helpers_1.default.outputError(res, null, "Search query has invalid characters");
            }
            nameQuery.first_name = { $regex: q, $options: "i" };
            nameQuery.last_name = { $regex: q, $options: "i" };
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
        if (id) {
            queryBuilder["data.id"] = id;
        }
        let getPage = helpers_1.default.getPageItemPerPage(itemPerPage, page);
        if (getPage.status !== true)
            return helpers_1.default.outputError(res, null, getPage.msg);
        let lookup = [{
                $lookup: {
                    from: var_config_1.DatabaseTableList.user_operators,
                    let: { authID: "$auth_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$authID"] }, ...nameQuery } },
                        { $project: { business_name: 1 } }
                    ],
                    as: "operator_data"
                }
            }, {
                $unwind: "$operator_data"
            }, {
                $addFields: {
                    operator_name: "$operator_data.business_name"
                }
            }];
        let pipeline = [
            { $match: queryBuilder },
            ...(q ? lookup : []),
            { $sort: { _id: -1 } },
            { $skip: getPage.data.page },
            { $limit: getPage.data.item_per_page },
            ...(q ? [] : lookup),
            { $unset: ["_id", "__v", "operator_data"] }
        ];
        if (component) {
            switch (component) {
                case "count":
                    pipeline = [
                        { $match: queryBuilder },
                        { $count: "total" },
                        { $unset: "_id" }
                    ];
                    break;
                default:
                    return helpers_1.default.outputError(res, null, "Invalid component");
            }
        }
        let getLogs = await activity_logs_1.OperatorLogModel.aggregate(pipeline).catch(e => ({ error: e }));
        //if there's an error
        if (getLogs && getLogs.error) {
            console.log("error while fetching operator logs", getLogs.error);
            return helpers_1.default.outputError(res, 500);
        }
        // manual unwind
        if (component) {
            getLogs = getLogs.length ? getLogs[0] : { total: 0 };
        }
        return helpers_1.default.outputSuccess(res, getLogs);
    }
}
exports.OperatorOtherService = OperatorOtherService;
