import { SimpleNodeJsController } from "@increase21/simplenodejs";
import helpers from "../../assets/helpers";

export default class OperatorVehicleController extends SimpleNodeJsController {
  protected __checkContext(): void {
    if (this._custom_data.user_type !== "operator") {
      return helpers.outputError(this.res, null, "Not allowed to perform this action")
    }
  }





}