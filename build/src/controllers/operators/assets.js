"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const simplenodejs_1 = require("@increase21/simplenodejs");
const helpers_1 = __importDefault(require("../../assets/helpers"));
const opt_assets_1 = require("../../services/opt-assets");
const opt_others_1 = require("../../services/opt-others");
class OperatorVehicleController extends simplenodejs_1.SimpleNodeJsController {
    __checkContext() {
        if (this._custom_data.user_type !== "operator") {
            return helpers_1.default.outputError(this.res, null, "Not allowed to perform this action");
        }
    }
    async deviceLists(id) {
        if (id && helpers_1.default.isInvalidID(id))
            return helpers_1.default.outputError(this.res, 404);
        return this.__run({
            post: opt_assets_1.OperatorAssetService.RegisterDevice,
            put: opt_assets_1.OperatorAssetService.RegisterDevice,
            get: opt_assets_1.OperatorAssetService.GetDevices,
            patch: this.query.component === "assign" ? opt_assets_1.OperatorAssetService.AssignDeviceToVehicle :
                this.query.component === "unassign" ? opt_assets_1.OperatorAssetService.UnassignDeviceFromVehicle :
                    () => helpers_1.default.outputError(this.res, null, "Invalid component"),
            delete: opt_assets_1.OperatorAssetService.DeleteDevice,
            id: { put: "required", get: "optional", patch: "required", delete: "required" },
        });
    }
    async vehicleLists(id) {
        if (id && helpers_1.default.isInvalidID(id))
            return helpers_1.default.outputError(this.res, 404);
        return this.__run({
            post: opt_assets_1.OperatorAssetService.AddVehicles,
            put: opt_assets_1.OperatorAssetService.SuspendedVehicles,
            get: opt_assets_1.OperatorAssetService.GetVehicles,
            patch: opt_assets_1.OperatorAssetService.DeleteVehicle,
            id: { post: "optional", get: "optional" },
        });
    }
    async collectionLists(id) {
        if (id && helpers_1.default.isInvalidID(id))
            return helpers_1.default.outputError(this.res, 404);
        return this.__run({
            post: opt_others_1.OperatorOtherService.CreateCollection,
            put: opt_others_1.OperatorOtherService.CreateCollection,
            get: opt_others_1.OperatorOtherService.GetCollections,
            patch: opt_others_1.OperatorOtherService.UpdateCollection,
            delete: opt_others_1.OperatorOtherService.DeleteCollection,
            id: { get: "optional", delete: "required", put: "required", patch: "required" },
        });
    }
    async assignCollections(id) {
        if (id && helpers_1.default.isInvalidID(id))
            return helpers_1.default.outputError(this.res, 404);
        return this.__run({
            put: opt_others_1.OperatorOtherService.AssignVehicleToCollection,
            patch: opt_others_1.OperatorOtherService.AssignCollectionToPersonnel,
            id: { put: "required", patch: "required" },
        });
    }
    async alarmLists(id) {
        if (id && helpers_1.default.isInvalidID(id))
            return helpers_1.default.outputError(this.res, 404);
        return this.__run({
            get: opt_assets_1.OperatorAssetService.GetAlarmData,
            put: opt_assets_1.OperatorAssetService.UpdateAlarmStatus,
            patch: opt_assets_1.OperatorAssetService.DeleteAlarm,
            id: { get: "optional" },
        });
    }
}
exports.default = OperatorVehicleController;
