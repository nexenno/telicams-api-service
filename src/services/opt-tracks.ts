import helpers from "../assets/helpers";
import { OptVehicleListModel, OptVehicleListTypes } from "../models/opt-vehlists";
import { PrivateMethodProps, SendDBQuery } from "../typings/general";

export class OperatorOtherService {


  //========**************COLLECTION SECTION***********=========================/
  static async StartDeviceStream({ body, id, res, req, customData: userData }: PrivateMethodProps) {
    let vehicleID = helpers.getInputValueString(body, "vehicle_id")
    let optID = helpers.getOperatorAuthID(userData)
    //if there's no vehicle ID
    if (!vehicleID) return helpers.outputError(res, null, "Vehicle ID is required")
    if (helpers.isInvalidID(vehicleID)) return helpers.outputError(res, null, "Invalid vehicle ID")

    //check if the device number belongs to the operator
    let optVehicle: SendDBQuery<OptVehicleListTypes> = await OptVehicleListModel.findOne({
      operator_id: optID, vehicle_id: vehicleID
    }).populate("device_id", "vehicle_id, operator_id").lean().catch((e) => ({ error: e }))

    //if there's an error, return it
    if (optVehicle && optVehicle.error) return helpers.outputError(res, 500)

    //if there's no device, return an error
    if (!optVehicle) return helpers.outputError(res, null, "Vehicle not found")

    //if the device is not active, return an error
    if (optVehicle.vehicle_status !== 1) return helpers.outputError(res, null, "Only active vehicles can start streaming")

    //if the vehicle does not have a device assigned, return an error
    if (!optVehicle.device_id || !optVehicle.device_id._id) {
      return helpers.outputError(res, null, "No device assigned to this vehicle")
    }
    //if there's a mismatch between the device and vehicle, return an error
    if (!optVehicle.device_id.vehicle_id || optVehicle.device_id.vehicle_id !== vehicleID) {
      return helpers.outputError(res, null, "Device and vehicle mismatch. Cannot start stream")
    }









  }

}