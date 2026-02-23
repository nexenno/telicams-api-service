"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const simplenodejs_1 = require("@increase21/simplenodejs");
const helpers_1 = __importDefault(require("../../assets/helpers"));
const file_config_1 = require("../../assets/file-config");
const gateway_hooks_1 = require("../../services/gateway-hooks");
class OperatorAccountController extends simplenodejs_1.SimpleNodeJsController {
    __checkContext() {
        //get the authorization header
        let authHeader = this.req.headers['authorization'];
        //check if the header is missing
        if (!authHeader)
            return helpers_1.default.outputError(this.res, null, "Authorization header missing");
        //check if the header is in the correct format
        authHeader = authHeader.replace("Bearer ", "");
        if (authHeader !== file_config_1.fileConfig.config.gatewaySecret)
            return helpers_1.default.outputError(this.res, null, "Unknown gateway call");
    }
    async deviceRegistration() {
        //if method is not post
        if (this.req.method !== "POST")
            return helpers_1.default.outputError(this.res, null, "Invalid request method");
        return gateway_hooks_1.GatewayHookService.RegisterNewDevice({
            req: this.req, res: this.res, query: this.req.query,
            body: this.req.body, customData: {}
        });
    }
    async deviceEvent() {
        //if method is not post
        if (this.req.method !== "POST")
            return helpers_1.default.outputError(this.res, null, "Invalid request method");
        switch (this.req.body.eventType) {
            case "DEVICE_CONNECTED":
                return gateway_hooks_1.GatewayHookService.HandleEventDeviceConnected({
                    req: this.req, res: this.res, query: this.req.query,
                    body: this.req.body, customData: {}
                });
            case "DEVICE_DISCONNECTED":
                return gateway_hooks_1.GatewayHookService.HandleEventDeviceDisconnected({
                    req: this.req, res: this.res, query: this.req.query,
                    body: this.req.body, customData: {}
                });
            case "ALERT":
                return this.res.status(200).json({ message: "Alert event received" }); //for now, just return a success response. We can implement alert handling logic here later.
            // return GatewayHookService.HandleDeviceAlert({
            //   req: this.req, res: this.res, query: this.req.query,
            //   body: this.req.body, customData: {} as any
            // })
            case "ALARM_TRIGGERED":
                return gateway_hooks_1.GatewayHookService.HandleEventDeviceAlarmTriggered({
                    req: this.req, res: this.res, query: this.req.query,
                    body: this.req.body, customData: {}
                });
            case "ALARM_CLEARED":
                return gateway_hooks_1.GatewayHookService.HandleEventDeviceAlarmCleared({
                    req: this.req, res: this.res, query: this.req.query,
                    body: this.req.body, customData: {}
                });
            case "STREAM_STARTED":
            case "STREAM_STOPPED":
                return gateway_hooks_1.GatewayHookService.HandleDeviceStreamStartedAndStopped({
                    req: this.req, res: this.res, query: this.req.query,
                    body: this.req.body, customData: {}
                });
            default:
                return helpers_1.default.outputError(this.res, null, "Unknown event type");
        }
    }
    async deviceLocation() {
        //if method is not post
        if (this.req.method !== "POST")
            return helpers_1.default.outputError(this.res, null, "Invalid request method");
        return gateway_hooks_1.GatewayHookService.HandleDeviceLocationUpdate({
            req: this.req, res: this.res, query: this.req.query,
            body: this.req.body, customData: {}
        });
    }
}
exports.default = OperatorAccountController;
