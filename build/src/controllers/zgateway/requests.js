"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const simplenodejs_1 = require("@increase21/simplenodejs");
const helpers_1 = __importDefault(require("../../assets/helpers"));
const country_list_1 = __importDefault(require("../../assets/country-list"));
class ZGateWayRequestController extends simplenodejs_1.SimpleNodeJsController {
    async countryLists() {
        return helpers_1.default.outputSuccess(this.res, country_list_1.default);
    }
}
exports.default = ZGateWayRequestController;
