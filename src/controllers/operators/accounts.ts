import { SimpleNodeJsController } from "@increase21/simplenodejs";
import { OperatorAccountService } from "../../services/opt-account";
import helpers from "../../assets/helpers";
import { OperatorOtherService } from "../../services/opt-others";

export default class OperatorAccountController extends SimpleNodeJsController {
  protected __checkContext(): void {
    if (this._custom_data.user_type !== "operator") {
      return helpers.outputError(this.res, null, "Not allowed to perform this action")
    }
  }

  async index() {
    return this.__run({
      put: OperatorAccountService.UpdateOperatorAccount,
      get: OperatorAccountService.GetOperatorAccount,
      delete: OperatorAccountService.DeleteOperatorUser,
    })
  }
  async changePassword() {
    if (this.method !== "put") return helpers.outputError(this.res, 405)
    return OperatorAccountService.ChangeAdminPassword({
      customData: this._custom_data, body: this.body,
      req: this.req, res: this.res, query: this.query,
    })
  }

  async teamLists(id: string | undefined) {
    if (id && helpers.isInvalidID(id)) return helpers.outputError(this.res, 404)
    return this.__run({
      post: OperatorAccountService.CreateTeam,
      put: OperatorAccountService.CreateTeam,
      patch: OperatorAccountService.UpdateTeamStatus,
      get: OperatorAccountService.GetTeam,
      delete: OperatorAccountService.DeleteTeam,
      id: { get: "optional", delete: "required", put: "required", patch: "required" },
    })
  }


  async activityLogs(id: string | undefined) {
    if (id && helpers.isInvalidID(id)) return helpers.outputError(this.res, 404)
    if (this.method !== "get") return helpers.outputError(this.res, 405)
    return OperatorOtherService.ActivityLogs({
      customData: this._custom_data, body: this.body,
      req: this.req, res: this.res, query: this.query,
      id,
    })
  }
}