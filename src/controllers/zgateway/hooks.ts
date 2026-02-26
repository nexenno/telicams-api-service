import { SimpleNodeJsController } from "@increase21/simplenodejs";
import helpers from "../../assets/helpers";
import { fileConfig } from "../../assets/file-config";
import { GatewayHookService } from "../../services/gateway-hooks";

export default class OperatorAccountController extends SimpleNodeJsController {
  protected __checkContext(): void {
    // console.log("Gateway hook called with query:", this.req.query, "and body:", this.req.body)
    //get the authorization header
    let authHeader = this.req.headers['authorization'];
    //check if the header is missing
    if (!authHeader) return helpers.outputError(this.res, null, "Authorization header missing");
    //check if the header is in the correct format
    authHeader = authHeader.replace("Bearer ", "")
    if (authHeader !== fileConfig.config.gatewaySecretIn) return helpers.outputError(this.res, null, "Unknown gateway call")
  }


  async deviceRegistration() {
    //if method is not post
    if (this.req.method !== "POST") return helpers.outputError(this.res, null, "Invalid request method")
    return GatewayHookService.RegisterNewDevice({
      req: this.req, res: this.res, query: this.req.query,
      body: this.req.body, customData: {} as any
    })
  }

  async deviceEvent() {
    //if method is not post
    if (this.req.method !== "POST") return helpers.outputError(this.res, null, "Invalid request method")
    switch (this.req.body.eventType) {
      case "DEVICE_CONNECTED":
        return GatewayHookService.HandleEventDeviceConnected({
          req: this.req, res: this.res, query: this.req.query,
          body: this.req.body, customData: {} as any
        })
      case "DEVICE_DISCONNECTED":
        return GatewayHookService.HandleEventDeviceDisconnected({
          req: this.req, res: this.res, query: this.req.query,
          body: this.req.body, customData: {} as any
        })
      case "ALERT":
        return this.res.status(200).json({ message: "Alert event received" }) //for now, just return a success response. We can implement alert handling logic here later.
      // return GatewayHookService.HandleDeviceAlert({
      //   req: this.req, res: this.res, query: this.req.query,
      //   body: this.req.body, customData: {} as any
      // })
      case "ALARM_TRIGGERED":
        return GatewayHookService.HandleEventDeviceAlarmTriggered({
          req: this.req, res: this.res, query: this.req.query,
          body: this.req.body, customData: {} as any
        })
      case "ALARM_CLEARED":
        return GatewayHookService.HandleEventDeviceAlarmCleared({
          req: this.req, res: this.res, query: this.req.query,
          body: this.req.body, customData: {} as any
        })
      case "STREAM_STARTED":
      case "STREAM_STOPPED":
        return this.res.status(200).json({})
      default:
        return helpers.outputError(this.res, null, "Unknown event type")
    }

  }

  async deviceLocation() {
    //if method is not post
    if (this.req.method !== "POST") return helpers.outputError(this.res, null, "Invalid request method")
    return GatewayHookService.HandleDeviceLocationUpdate({
      req: this.req, res: this.res, query: this.req.query,
      body: this.req.body, customData: {} as any
    })
  }

}