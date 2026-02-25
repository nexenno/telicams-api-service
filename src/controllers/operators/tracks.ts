import { SimpleNodeJsController } from "@increase21/simplenodejs";
import helpers from "../../assets/helpers";
import { OperatorTrackingService } from "../../services/opt-tracks";

export default class OperatorVehicleController extends SimpleNodeJsController {
  protected __checkContext(): void {
    if (this._custom_data.user_type !== "operator") {
      return helpers.outputError(this.res, null, "Not allowed to perform this action")
    }
  }


  async deviceStreams(id: string | undefined) {
    if (id && helpers.isInvalidID(id)) return helpers.outputError(this.res, 404)
    return this.__run({
      post: this.query.component === "start" ? OperatorTrackingService.StartDeviceStream :
        this.query.component === "stop" ? OperatorTrackingService.StopDeviceStream :
          () => helpers.outputError(this.res, null, "Invalid component"),
      id: { post: "optional", delete: "optional", get: "optional" },
    })
  }

  async deviceSignals(id: string | undefined) {
    if (this.method !== "get") return helpers.outputError(this.res, null, "Method not allowed")
    if (id && helpers.isInvalidID(id)) return helpers.outputError(this.res, 404)
    return OperatorTrackingService.GetDeviceSignal({
      body: this.req.body, id, query: this.req.query,
      res: this.res, req: this.req, customData: this._custom_data
    })
  }


}