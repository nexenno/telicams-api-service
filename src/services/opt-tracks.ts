import helpers from "../assets/helpers";
import { serviceEndpoint } from "../assets/var-config";
import { OptVehicleListModel, OptVehicleListTypes } from "../models/opt-vehlists";
import { PrivateMethodProps, SendDBQuery } from "../typings/general";

export class OperatorOtherService {


  //========**************COLLECTION SECTION***********=========================/
  static async StartDeviceStream({ body, id, res, req, customData: userData }: PrivateMethodProps) {
    let vehicleID = helpers.getInputValueString(body, "vehicle_id")
    let channelID = helpers.getInputValueString(body, "channel_id")
    let optID = helpers.getOperatorAuthID(userData)
    //if there's no vehicle ID
    if (!vehicleID) return helpers.outputError(res, null, "Vehicle ID is required")
    if (helpers.isInvalidID(vehicleID)) return helpers.outputError(res, null, "Invalid vehicle ID")
    //if there's no channel ID
    if (!channelID) return helpers.outputError(res, null, "Channel ID is required")

    if (!helpers.isNumber({ input: channelID, type: "int", min: 1, max: 4 })) {
      return helpers.outputError(res, null, "Invalid channel ID. Must be a number between 1 and 4")
    }

    //check if the device number belongs to the operator
    let optVehicle: SendDBQuery<OptVehicleListTypes> = await OptVehicleListModel.findOne({
      operator_id: optID, vehicle_id: vehicleID
    }).populate("device_id", "vehicle_id, device_number, operator_id").lean().catch((e) => ({ error: e }))

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

    //call the device endpoint and check for signal before starting streaming
    let sendReq = await helpers.sendRequestToGateway({
      url: `${serviceEndpoint.device_endpoint}/${optVehicle.device_id.device_number}/signal`,
      method: "GET",
    })

    //if there's no result or result doesn't have a good signal, return an error
    if (!sendReq || !sendReq.data) {
      //TODO: log this error for debugging and send a mail
      return helpers.outputError(res, null, "No response from device. Cannot start stream")
    }

    //if the signal strength is less than 2, check varConfig for the signal strength values
    if (sendReq.data.signalStrength < 10) {
      return helpers.outputError(res, null, "Vehicle signal strength is weak. Cannot start stream")
    }

    //if the device is not online and not connected to the gateway, return an error
    if (!sendReq.data.online || sendReq.data.online !== true) {
      return helpers.outputError(res, null, "Device is offline. Cannot start stream")
    }

    //start the stream and return the stream URL
    let startStreamReq = await helpers.sendRequestToGateway({
      url: `${serviceEndpoint.stream_endpoint}/start`,
      method: "POST",
      json: {
        "deviceId": optVehicle.device_id.device_number,
        "channelId": parseInt(channelID),
        "dataType": "AUDIO_VIDEO",
        "streamType": "MAIN"
      }
    })

    //if there's no result or result doesn't have a stream URL, return an error
    if (!startStreamReq || !startStreamReq.data || startStreamReq.data.status !== "ACTIVE") {
      return helpers.outputError(res, null, "Failed to start stream. Please try again")
    }

    return helpers.outputSuccess(res, startStreamReq.data)
  }

}