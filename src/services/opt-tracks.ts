import helpers from "../assets/helpers";
import { serviceEndpoint } from "../assets/var-config";
import { GlobalTimeZones } from "../assets/var-param";
import { OptVehicleListModel, OptVehicleListTypes } from "../models/opt-vehlists";
import { ObjectPayload, PrivateMethodProps, SendDBQuery } from "../typings/general";

export class OperatorTrackingService {


  //========**************STREAMING SECTION***********=========================/
  static async StartDeviceStream({ body, id: vehicleID, res, req, customData: userData }: PrivateMethodProps) {
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
      operator_id: optID, _id: vehicleID
    }).populate("device_id", "vehicle_id device_number operator_id").lean().catch((e) => ({ error: e }))

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
    if (!optVehicle.device_id.vehicle_id || String(optVehicle.device_id.vehicle_id) !== vehicleID) {
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
    if (!startStreamReq || !startStreamReq.data || !startStreamReq.data.deviceId) {
      return helpers.outputError(res, null, "Failed to start stream. Please try again")
    }

    return helpers.outputSuccess(res, {
      stream_url: startStreamReq.data.flvUrl,
      session_id: startStreamReq.data.sessionId,
    })
  }

  static async StopDeviceStream({ body, id: vehicleID, res, req, customData: userData }: PrivateMethodProps) {
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
      operator_id: optID, _id: vehicleID
    }).populate("device_id", "vehicle_id device_number operator_id").lean().catch((e) => ({ error: e }))

    //if there's an error, return it
    if (optVehicle && optVehicle.error) return helpers.outputError(res, 500)

    //if there's no device, return an error
    if (!optVehicle) return helpers.outputError(res, null, "Vehicle not found")

    //if the vehicle does not have a device assigned, return an error
    if (!optVehicle.device_id || !optVehicle.device_id._id) {
      return helpers.outputError(res, null, "No device assigned to this vehicle")
    }
    //if there's a mismatch between the device and vehicle, return an error
    if (!optVehicle.device_id.vehicle_id || String(optVehicle.device_id.vehicle_id) !== vehicleID) {
      return helpers.outputError(res, null, "Device and vehicle mismatch. Cannot stop stream")
    }

    //stop the stream and return the result
    let stopStreamReq = await helpers.sendRequestToGateway({
      url: `${serviceEndpoint.stream_endpoint}/stop`,
      method: "POST",
      json: {
        "deviceId": optVehicle.device_id.device_number,
        "channelId": parseInt(channelID),
      }
    })

    //if there's no result or result doesn't have a stream URL, return an error
    if (!stopStreamReq || !stopStreamReq.data || !stopStreamReq.data.deviceId) {
      return helpers.outputError(res, null, "Failed to stop stream. Please try again")
    }

    return helpers.outputSuccess(res)
  }

  static async GetDeviceSignal({ body, id: vehicleID, res, req, customData: userData }: PrivateMethodProps) {
    let optID = helpers.getOperatorAuthID(userData)
    //if there's no vehicle ID
    if (!vehicleID) return helpers.outputError(res, null, "Vehicle ID is required")
    if (helpers.isInvalidID(vehicleID)) return helpers.outputError(res, null, "Invalid vehicle ID")

    //check if the device number belongs to the operator
    let optVehicle: SendDBQuery<OptVehicleListTypes> = await OptVehicleListModel.findOne({
      operator_id: optID, _id: vehicleID
    }).populate("device_id", "vehicle_id device_number operator_id").lean().catch((e) => ({ error: e }))

    //if there's an error, return it
    if (optVehicle && optVehicle.error) return helpers.outputError(res, 500)

    //if there's no device, return an error
    if (!optVehicle) return helpers.outputError(res, null, "Vehicle not found")

    //if the vehicle does not have a device assigned
    if (!optVehicle.device_id || !optVehicle.device_id._id) {
      return helpers.outputError(res, null, "No device assigned to this vehicle")
    }

    //if there's a mismatch between the device and vehicle, return an error
    if (!optVehicle.device_id.vehicle_id || String(optVehicle.device_id.vehicle_id) !== vehicleID) {
      return helpers.outputError(res, null, "Device and vehicle mismatch. Cannot get signal")
    }

    //call the device endpoint and check for signal before starting streaming
    let sendReq = await helpers.sendRequestToGateway({
      url: `${serviceEndpoint.device_endpoint}/${optVehicle.device_id.device_number}/signal`,
      method: "GET",
    })

    //if there's no result or result doesn't have a good signal, return an error
    if (!sendReq || !sendReq.data) {
      return helpers.outputError(res, null, "Failed to get device signal. Please try again")
    }

    //if there's no signal strength, return an error
    if (!sendReq.data.deviceId) return helpers.outputSuccess(res, {})

    return helpers.outputSuccess(res, {
      satellite_count: sendReq.data.satelliteCount || 0,
      acc_status: sendReq.data.accOn || false,
      signal_strength: sendReq.data.signalStrength || 0,
      latitude: sendReq.data.latitude || 0,
      positioned: sendReq.data.positioned || false,
      online_status: sendReq.data.online || false,
      gps_time: sendReq.data.gpsTime || "",
      device_id: sendReq.data.deviceId || "",
      speed: sendReq.data.speed || 0.0,
      timestamp: sendReq.data.timestamp || "",
      longitude: sendReq.data.longitude || 0.0,
      emergency_alarm: sendReq.data.emergencyAlarm || false,
    })
  }

  //========**************MEDIA SECTION***********=========================/
  static async StartPastMedia({ body, id: vehicleID, res, req, customData: userData }: PrivateMethodProps) {
    let optID = helpers.getOperatorAuthID(userData)
    let startTime = helpers.getInputValueString(body, "start_time")
    let endTime = helpers.getInputValueString(body, "end_time")
    let timezone = helpers.getInputValueString(body, "timezone")
    let channelID = helpers.getInputValueString(body, "channel_id")
    let recordDate = helpers.getInputValueString(body, "record_date")
    let mediaType = helpers.getInputValueString(body, "media_type")

    if (!vehicleID) return helpers.outputError(res, null, "Vehicle ID is required")
    if (helpers.isInvalidID(vehicleID)) return helpers.outputError(res, null, "Invalid vehicle ID")

    if (!recordDate || !startTime || !endTime) {
      return helpers.outputError(res, null, "Kindly select the date and time range for the media data you want to retrieve")
    }

    if (channelID) {
      //validate channel ID
      if (!helpers.isNumber({ input: channelID, type: "int", min: 1, max: 4 })) {
        return helpers.outputError(res, null, "Invalid channel ID. Must be a number between 1 and 4")
      }
    }

    //chek end date if submitted
    //if start date is not submitted
    if (!helpers.isDateFormat(recordDate)) {
      return helpers.outputError(res, null, 'Invalid Date. must be in the formate YYYY-MM-DD');
    }

    //validate start and end time
    if (!helpers.isTimeFormat(startTime)) {
      return helpers.outputError(res, null, 'Invalid start time. must be in the formate HH:mm');
    }

    if (!helpers.isTimeFormat(endTime)) {
      return helpers.outputError(res, null, 'Invalid end time. must be in the formate HH:mm');
    }

    //if there's no timezone, return
    if (!timezone) return helpers.outputError(res, null, "Timezone is required when using start_date or end_date")

    //valida the timezone
    if (!GlobalTimeZones.includes(timezone)) return helpers.outputError(res, null, "Submitted timezone is invalid")

    let getUTCStart = helpers.convertDateTimeZone({
      dateString: `${recordDate}T${startTime}:00`,
      fromTimeZone: timezone, toTimeZone: "utc"
    })
    let getUTCEnd = helpers.convertDateTimeZone({
      dateString: `${recordDate}T${endTime}:59`,
      fromTimeZone: timezone, toTimeZone: "utc"
    })

    //if the start time is greater than end time
    if (getUTCStart.dateObj.getTime() > getUTCEnd.dateObj.getTime()) {
      return helpers.outputError(res, null, 'Start time can not be greater than end time');
    }

    //check if the device number belongs to the operator
    let optVehicle = await helpers.checkVehicleBelongsToOperator(vehicleID, optID)
    //if there's an error, return it
    if (!optVehicle || !optVehicle.device_id || !optVehicle.device_id._id) {
      return helpers.outputError(res, null, "Unable to validate the selected vehicle");
    }

    let mediaQuery = {
      deviceId: optVehicle.device_id.device_number,
      channelId: channelID ? parseInt(channelID) : undefined,
      startTime: `${getUTCStart.date} ${getUTCStart.time}`,
      endTime: `${getUTCEnd.date} ${getUTCEnd.time}`,
      mediaType: 0
    }

    let reqMedia: SendDBQuery = await helpers.sendRequestToGateway({
      url: `${serviceEndpoint.device_endpoint}/${optVehicle.device_id.device_number}/files/query${helpers.getRequestParams(mediaQuery)}`,
      method: "POST"
    })

    //if there's no result or result doesn't have a stream URL, return an error
    if (!reqMedia || !reqMedia.data || !reqMedia.data.deviceId || !reqMedia.data.commandId) {
      //log something
      // return helpers.outputError(res, null, "Failed to get media list. Please try again")
    }

    return helpers.outputSuccess(res)

  }

  static async GetPastMedia({ id: vehicleID, res, customData: userData }: PrivateMethodProps) {
    let optID = helpers.getOperatorAuthID(userData)
    if (!vehicleID) return helpers.outputError(res, null, "Vehicle ID is required")
    if (helpers.isInvalidID(vehicleID)) return helpers.outputError(res, null, "Invalid vehicle ID")

    //check if the device number belongs to the operator
    let optVehicle = await helpers.checkVehicleBelongsToOperator(vehicleID, optID)
    //if there's an error, return it
    if (!optVehicle || !optVehicle.device_id || !optVehicle.device_id._id) {
      return helpers.outputError(res, null, "Unable to validate the selected vehicle");
    }

    //get the command ID from the request query
    let reqMedia: SendDBQuery = await helpers.sendRequestToGateway({
      url: `${serviceEndpoint.device_endpoint}/${optVehicle.device_id.device_number}/files`,
      method: "POST"
    })

    //if there's result coming
    if (reqMedia && reqMedia.data && reqMedia.data.files && reqMedia.data.files.length > 0) {
      return helpers.outputSuccess(res, reqMedia.data.files);
    }

    return helpers.outputSuccess(res, [])
  }


}