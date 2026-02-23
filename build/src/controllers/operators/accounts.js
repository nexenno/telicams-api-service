"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const simplenodejs_1 = require("@increase21/simplenodejs");
const opt_account_1 = require("../../services/opt-account");
const helpers_1 = __importDefault(require("../../assets/helpers"));
const opt_others_1 = require("../../services/opt-others");
class OperatorAccountController extends simplenodejs_1.SimpleNodeJsController {
    __checkContext() {
        if (this._custom_data.user_type !== "operator") {
            return helpers_1.default.outputError(this.res, null, "Not allowed to perform this action");
        }
    }
    async index() {
        return this.__run({
            put: opt_account_1.OperatorAccountService.UpdateOperatorAccount,
            get: opt_account_1.OperatorAccountService.GetOperatorAccount,
            delete: opt_account_1.OperatorAccountService.DeleteOperatorUser,
        });
    }
    async changePassword() {
        if (this.method !== "put")
            return helpers_1.default.outputError(this.res, 405);
        return opt_account_1.OperatorAccountService.ChangeAdminPassword({
            customData: this._custom_data, body: this.body,
            req: this.req, res: this.res, query: this.query,
        });
    }
    async teamLists(id) {
        if (id && helpers_1.default.isInvalidID(id))
            return helpers_1.default.outputError(this.res, 404);
        return this.__run({
            post: opt_account_1.OperatorAccountService.CreateTeam,
            put: opt_account_1.OperatorAccountService.CreateTeam,
            patch: opt_account_1.OperatorAccountService.UpdateTeamStatus,
            get: opt_account_1.OperatorAccountService.GetTeam,
            delete: opt_account_1.OperatorAccountService.DeleteTeam,
            id: { get: "optional", delete: "required", put: "required", patch: "required" },
        });
    }
    async activityLogs(id) {
        if (id && helpers_1.default.isInvalidID(id))
            return helpers_1.default.outputError(this.res, 404);
        if (this.method !== "get")
            return helpers_1.default.outputError(this.res, 405);
        return opt_others_1.OperatorOtherService.ActivityLogs({
            customData: this._custom_data, body: this.body,
            req: this.req, res: this.res, query: this.query,
            id,
        });
    }
}
exports.default = OperatorAccountController;
