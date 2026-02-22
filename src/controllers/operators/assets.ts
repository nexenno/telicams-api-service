import { SimpleNodeJsController } from "@increase21/simplenodejs";
import helpers from "../../assets/helpers";
import { OperatorAssetService } from "../../services/opt-assets";
import { OperatorOtherService } from "../../services/opt-others";

export class OperatorVehicleController extends SimpleNodeJsController {
  protected __checkContext(): void {
    if (this._custom_data.user_type !== "operator") {
      return helpers.outputError(this.res, null, "Not allowed to perform this action")
    }
  }



  async deviceLists(id: string | undefined) {
    if (id && helpers.isInvalidID(id)) return helpers.outputError(this.res, 404)
    return OperatorAssetService.GetDevices({
      req: this.req, res: this.res, query: this.req.query,
      body: this.req.body, customData: this._custom_data, id
    })
  }


  async vehicleLists(id: string | undefined) {
    if (id && helpers.isInvalidID(id)) return helpers.outputError(this.res, 404)
    return this.__run({
      post: OperatorAssetService.AddVehicles,
      put: OperatorAssetService.AddVehicles,
      get: OperatorAssetService.GetVehicles,
      patch: OperatorAssetService.SuspendedVehicles,
      delete: OperatorAssetService.DeleteVehicle,
      id: { get: "optional", delete: "required", put: "required", patch: "required" },
    })
  }

  async collectionLists(id: string | undefined) {
    if (id && helpers.isInvalidID(id)) return helpers.outputError(this.res, 404)
    return this.__run({
      post: OperatorOtherService.CreateCollection,
      put: OperatorOtherService.CreateCollection,
      get: OperatorOtherService.GetCollections,
      patch: OperatorOtherService.UpdateCollection,
      delete: OperatorOtherService.DeleteCollection,
      id: { get: "optional", delete: "required", put: "required", patch: "required" },
    })
  }




}