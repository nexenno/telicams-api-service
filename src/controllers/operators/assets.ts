import { SimpleNodeJsController } from "@increase21/simplenodejs";
import helpers from "../../assets/helpers";
import { OperatorAssetService } from "../../services/opt-assets";
import { OperatorOtherService } from "../../services/opt-others";

export default class OperatorVehicleController extends SimpleNodeJsController {
  protected __checkContext(): void {
    if (this._custom_data.user_type !== "operator") {
      return helpers.outputError(this.res, null, "Not allowed to perform this action")
    }
  }


  async deviceLists(id: string | undefined) {
    if (id && helpers.isInvalidID(id)) return helpers.outputError(this.res, 404)
    return this.__run({
      post: OperatorAssetService.RegisterDevice,
      put: OperatorAssetService.RegisterDevice,
      get: OperatorAssetService.GetDevices,
      patch: this.query.component === "assign" ? OperatorAssetService.AssignDeviceToVehicle :
        this.query.component === "unassign" ? OperatorAssetService.UnassignDeviceFromVehicle :
          () => helpers.outputError(this.res, null, "Invalid component"),
      delete: OperatorAssetService.DeleteDevice,
      id: { put: "required", get: "optional", patch: "required", delete: "required" },
    })
  }


  async vehicleLists(id: string | undefined) {
    if (id && helpers.isInvalidID(id)) return helpers.outputError(this.res, 404)
    return this.__run({
      post: OperatorAssetService.AddVehicles,
      put: OperatorAssetService.SuspendedVehicles,
      get: OperatorAssetService.GetVehicles,
      patch: OperatorAssetService.DeleteVehicle,
      id: { post: "optional", get: "optional" },
    })
  }

  async vehicleShutdowns() {
    if (this.method !== "post") return helpers.outputError(this.res, null, "Invalid request method")
    return OperatorAssetService.ShutDownOrActivateEngine({
      customData: this._custom_data, body: this.body,
      req: this.req, res: this.res, query: this.query,
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

  async collectionAssignments(id: string | undefined) {
    if (id && helpers.isInvalidID(id)) return helpers.outputError(this.res, 404)
    return this.__run({
      put: OperatorOtherService.AssignVehicleToCollection,
      patch: OperatorOtherService.AssignCollectionToPersonnel,
      id: { put: "required", patch: "required" },
    })
  }

  async alarmLists(id: string | undefined) {
    if (id && helpers.isInvalidID(id)) return helpers.outputError(this.res, 404)
    return this.__run({
      get: OperatorAssetService.GetAlarmData,
      put: OperatorAssetService.UpdateAlarmStatus,
      patch: OperatorAssetService.DeleteAlarm,
      id: { get: "optional" },
    })
  }

  async locationLists(id: string | undefined) {
    if (!id || helpers.isInvalidID(id)) return helpers.outputError(this.res, 404)
    if (this.method !== "get") return helpers.outputError(this.res, 405)
    return OperatorAssetService.GetLocationData({
      customData: this._custom_data, body: this.body,
      req: this.req, res: this.res, query: this.query,
      id,
    })
  }


  async dashboardStats() {
    if (this.method !== "get") return helpers.outputError(this.res, null, "Invalid request method")
    return OperatorOtherService.DashboardDataStats({
      customData: this._custom_data, body: this.body,
      req: this.req, res: this.res, query: this.query,
    })
  }



}