import helpers, { GlobalConnectedDevices } from "../assets/helpers";
import { DashcamAlarmModel } from "../models/device-data";
import { DashcamDeviceModel, DashcamDeviceTypes } from "../models/device-lists";
import { PrivateMethodProps, SendDBQuery } from "../typings/general";

export class GatewayHookService {

  static async RegisterNewDevice({ res, body }: PrivateMethodProps) {
    let deviceID = body.deviceId
    let manufacturer = body.manufacturer
    let model = body.model
    let provinceID = body.provinceId
    let cityID = body.cityId
    let licensePlate = body.licensePlate

    //validate the inputs
    if (!deviceID) return helpers.outputError(res, null, "Device ID is required")
    if (!manufacturer) return helpers.outputError(res, null, "Manufacturer is required")
    if (!model) return helpers.outputError(res, null, "Model is required")
    if (!provinceID) return helpers.outputError(res, null, "Province ID is required")
    if (!cityID) return helpers.outputError(res, null, "City ID is required")

    //register the device in the database
    if (!helpers.isNumber({ input: deviceID, type: "int", minLength: 10, maxLength: 20 })) {
      return helpers.outputError(res, null, "Device ID must be a number between 10 and 20 digits")
    }
    //if there's no manufacturer, model, province ID, city ID or license plate, return an error
    if (manufacturer.length < 2 || manufacturer.length > 50) {
      return helpers.outputError(res, null, "Manufacturer must be between 2 and 50 characters")
    }
    if (model.length < 2 || model.length > 50) {
      return helpers.outputError(res, null, "Model must be between 2 and 50 characters")
    }
    if (!helpers.isNumber({ input: String(provinceID), type: "int", minLength: 1, maxLength: 10 })) {
      return helpers.outputError(res, null, "Province ID must be a number between 1 and 10 digits")
    }
    if (!helpers.isNumber({ input: String(cityID), type: "int", minLength: 1, maxLength: 10 })) {
      return helpers.outputError(res, null, "City ID must be a number between 1 and 10 digits")
    }

    if (licensePlate) {
      if (licensePlate.length < 2 || licensePlate.length > 20) {
        return helpers.outputError(res, null, "License plate must be between 2 and 20 characters")
      }
    }

    //check if the device is prepared on the system already
    let getDevice: SendDBQuery<DashcamDeviceTypes> = await DashcamDeviceModel.findOne({
      device_number: deviceID
    }).lean().catch((e) => ({ error: e }));

    //if there's an error, return it
    if (getDevice && getDevice.error) {
      console.log("Error fetching device for registration ", getDevice.error)
      return helpers.outputError(res, 500)
    }
    //if the device is not found
    if (!getDevice) return helpers.outputError(res, 404, "Device not found.")

    //if the device is not active for registration, return an error
    if (getDevice.active_status !== 1) return helpers.outputError(res, null, "Device is not active for registration")

    //if the gateway status already registered
    if (getDevice.gateway_status === 1) return res.status(200).json({ approved: true })

    //update the device with the new information and set the gateway status to registered
    let updateDevice: SendDBQuery<DashcamDeviceTypes> = await DashcamDeviceModel.findOneAndUpdate({ device_number: deviceID }, {
      $set: {
        device_oem: manufacturer, device_model: model, province_id: provinceID,
        city_id: cityID, license_plate: licensePlate, gateway_status: 1
      }
    }, { new: true }).lean().catch((e) => ({ error: e }));

    //if there's an error, return it
    if (updateDevice && updateDevice.error) {
      console.log("Error updating device for registration ", updateDevice.error)
      return helpers.outputError(res, 500)
    }
    //if the device is not found after update, return an error
    if (!updateDevice) return helpers.outputError(res, 404, "Device not found after update.")

    //log the registration activity
    await helpers.logDashcamActivity({
      device_id: String(updateDevice._id), operator_id: updateDevice.operator_id,
      activity_type: "DEVICE_REGISTRATION", activity_detail: { deviceID, manufacturer, model, provinceID, cityID, licensePlate },
      message: `Device ${deviceID} registered successfully.`
    })

    //return success response
    return res.status(200).json({ approved: true })
  }

  static async HandleEventDeviceConnected({ res, body }: PrivateMethodProps) {
    //     {
    //   "eventType": "DEVICE_CONNECTED",
    //   "deviceId": "628072951915",
    //   "manufacturer": "VENDOR",
    //   "model": "MODEL_X",
    //   "firmwareVersion": "v2.1.0",
    //   "provinceId": 12,
    //   "cityId": 34,
    //   "reconnectCount": 0,
    //   "connectedAt": "2026-02-21T10:30:00",
    //   "timestamp": "2026-02-21T10:30:00"
    // }
    let deviceID = body.deviceId
    let manufacturer = body.manufacturer
    let model = body.model
    let reconnectCount = body.reconnectCount
    let connectedAt = body.connectedAt

    //validate the inputs
    if (!deviceID) return helpers.outputError(res, null, "Device ID is required")
    if (!manufacturer) return helpers.outputError(res, null, "Manufacturer is required")
    if (!model) return helpers.outputError(res, null, "Model is required")

    //validate the device ID
    if (!helpers.isNumber({ input: deviceID, type: "int", minLength: 10, maxLength: 20 })) {
      return helpers.outputError(res, null, "Device ID must be a number between 10 and 20 digits")
    }
    //validate the manufacturer and model
    if (manufacturer.length < 2 || manufacturer.length > 50) {
      return helpers.outputError(res, null, "Manufacturer must be between 2 and 50 characters")
    }
    if (model.length < 2 || model.length > 50) {
      return helpers.outputError(res, null, "Model must be between 2 and 50 characters")
    }
    //reply the gateway
    res.status(200).json({ success: true })

    //update the device online status to true
    let updateDevice: SendDBQuery<DashcamDeviceTypes> = await DashcamDeviceModel.findOneAndUpdate({ device_number: deviceID }, {
      $set: { online: true }
    }, { new: true }).lean().catch((e) => ({ error: e }));

    //if there's an error, return it
    if (updateDevice && updateDevice.error) {
      console.log("Error updating device for connection event ", updateDevice.error)
      return
    }
    //if the device is not found after update, return an error
    if (!updateDevice) return

    //set global connected 
    GlobalConnectedDevices.set(deviceID, { device_id: String(updateDevice._id), operator_id: updateDevice.operator_id || "" })

    // log the connection event in the database for analytics and monitoring
    helpers.logDashcamActivity({
      device_id: String(updateDevice._id), operator_id: updateDevice.operator_id,
      activity_type: "DEVICE_CONNECTED", activity_detail: { deviceID, manufacturer, model, reconnectCount, connectedAt },
      message: `Device ${deviceID} connected successfully.`
    })
  }

  static async HandleEventDeviceDisconnected({ res, body }: PrivateMethodProps) {
    //     {
    //   "eventType": "DEVICE_DISCONNECTED",
    //   "deviceId": "628072951915",
    //   "reason": "tcp_close",
    //   "manufacturer": "VENDOR",
    //   "model": "MODEL_X",
    //   "reconnectCount": 2,
    //   "connectedAt": "2026-02-21T08:00:00",
    //   "lastActivityAt": "2026-02-21T10:29:55",
    //   "timestamp": "2026-02-21T10:30:00"
    // }
    let deviceID = body.deviceId

    //validate the input
    if (!deviceID) return helpers.outputError(res, null, "Device ID is required")

    //validate the device ID
    if (!helpers.isNumber({ input: deviceID, type: "int", minLength: 10, maxLength: 20 })) {
      return helpers.outputError(res, null, "Device ID must be a number between 10 and 20 digits")
    }
    //reply the gateway
    res.status(200).json({ success: true })

    //update the device online status to false
    let updateDevice: SendDBQuery = await DashcamDeviceModel.findOneAndUpdate({ device_number: deviceID }, {
      $set: { online: false }
    }, { new: true }).lean().catch((e) => ({ error: e }));

    //if there's an error, return it
    if (updateDevice && updateDevice.error) {
      console.log("Error updating device for disconnection event ", updateDevice.error)
      return
    }
    //if the device is not found after update, return an error
    if (!updateDevice) return

    //remove from global connected
    GlobalConnectedDevices.delete(deviceID)

    // log the disconnection event in the database for analytics and monitoring
    helpers.logDashcamActivity({
      device_id: String(updateDevice._id), operator_id: updateDevice.operator_id,
      activity_type: "DEVICE_DISCONNECTED", activity_detail: {},
      message: `Device ${deviceID} disconnected successfully.`
    })
  }

  static async HandleEventDeviceAlarmTriggered({ res, body }: PrivateMethodProps) {
    //     {
    //   "eventType": "ALARM_TRIGGERED",
    //   "eventId": "uuid",
    //   "deviceId": "628072951915",
    //   "alarmType": "OVERSPEED",
    //   "severity": "WARNING",
    //   "latitude": 6.5244,
    //   "longitude": 3.3792,
    //   "speed": 85.0,
    //   "triggeredAt": "2026-02-21T10:30:00",
    //   "detail": null,
    //   "timestamp": "2026-02-21T10:30:00"
    // }
    let deviceID = body.deviceId
    let alarmType = body.alarmType
    let severity = body.severity
    let latitude = body.latitude
    let longitude = body.longitude
    let speed = body.speed
    let eventId = body.eventId

    //validate the inputs
    if (!deviceID) return helpers.outputError(res, null, "Device ID is required")
    if (!alarmType) return helpers.outputError(res, null, "Alarm type is required")
    if (!severity) return helpers.outputError(res, null, "Severity is required")

    //validate the device ID
    if (!helpers.isNumber({ input: deviceID, type: "int", minLength: 10, maxLength: 20 })) {
      return helpers.outputError(res, null, "Device ID must be a number between 10 and 20 digits")
    }
    //validate the alarm type and severity
    if (alarmType.length < 2 || alarmType.length > 50) {
      return helpers.outputError(res, null, "Alarm type must be between 2 and 50 characters")
    }
    if (severity.length < 2 || severity.length > 50) {
      return helpers.outputError(res, null, "Severity must be between 2 and 50 characters")
    }
    //reply the gateway
    res.status(200).json({ success: true })

    let deviceData = await helpers.getConnectedDeviceData(deviceID)

    //if device data is not found, return
    if (!deviceData || !deviceData.device_id) {
      // console.log("Connected device data not found for device ID ", deviceID)
      return
    }

    //log the alarm event in the database
    let logData: SendDBQuery = await DashcamAlarmModel.create({
      alarm_type: alarmType, severity: severity, status: 0,
      latitude: latitude, longitude: longitude, speed: speed,
      triggered_at: new Date(), alarm_ref: eventId, trigger_detail: body.detail,
      operator_id: deviceData.operator_id || undefined, device_id: deviceData.device_id
    }).catch((e) => ({ error: e }));

    //if there's an error, return it
    if (logData && logData.error) {
      console.log("Error logging alarm event ", logData.error)
      return
    }
    // log the alarm event in the database for analytics and monitoring
    helpers.logDashcamActivity({
      device_id: String(deviceData.device_id), operator_id: deviceData.operator_id,
      activity_type: "ALARM_TRIGGERED", activity_detail: { alarmType, severity, latitude, longitude, speed, eventId },
      message: `Alarm ${alarmType} triggered on device ${deviceID} with severity ${severity}.`
    })
  }

  static async HandleEventDeviceAlarmCleared({ res, body }: PrivateMethodProps) {
    //     {
    //   "eventType": "ALARM_CLEARED",
    //   "eventId": "uuid",
    //   "deviceId": "628072951915",
    //   "alarmType": "OVERSPEED",
    //   "severity": "WARNING",
    //   "latitude": 6.5244,
    //   "longitude": 3.3792,
    //   "speed": 60.0,
    //   "triggeredAt": "2026-02-21T10:28:00",
    //   "clearedAt": "2026-02-21T10:30:00",
    //   "active": false,
    //   "detail": null,
    //   "timestamp": "2026-02-21T10:30:00"
    // }
    let deviceID = body.deviceId
    let alarmType = body.alarmType
    let eventId = body.eventId

    //validate the inputs
    if (!deviceID) return helpers.outputError(res, null, "Device ID is required")
    if (!alarmType) return helpers.outputError(res, null, "Alarm type is required")

    //validate the device ID
    if (!helpers.isNumber({ input: deviceID, type: "int", minLength: 10, maxLength: 20 })) {
      return helpers.outputError(res, null, "Device ID must be a number between 10 and 20 digits")
    }
    //validate the alarm type
    if (alarmType.length < 2 || alarmType.length > 50) {
      return helpers.outputError(res, null, "Alarm type must be between 2 and 50 characters")
    }
    //reply the gateway
    res.status(200).json({ success: true })

    let deviceData = await helpers.getConnectedDeviceData(deviceID)
    //if device data is not found, return
    if (!deviceData || !deviceData.device_id) {
      // console.log("Connected device data not found for device ID ", deviceID)
      return
    }

    //update the alarm event in the database to set it as cleared
    let updateData: SendDBQuery = await DashcamAlarmModel.findOneAndUpdate({
      device_id: deviceData.device_id, alarm_ref: eventId
    }, {
      $set: { status: 1, cleared_at: new Date() }
    }, { new: true }).catch((e) => ({ error: e }));

    //if there's an error, return it
    if (updateData && updateData.error) {
      console.log("Error updating alarm event ", updateData.error)
      return
    }

    // log the alarm cleared event in the database for analytics and monitoring
    helpers.logDashcamActivity({
      device_id: String(deviceData.device_id), operator_id: deviceData.operator_id,
      activity_type: "ALARM_CLEARED", activity_detail: { alarmType, eventId },
      message: `Alarm ${alarmType} cleared on device ${deviceID}.`
    })

  }

  static async HandleStreamStartedAndStopped({ res, body }: PrivateMethodProps) {
    let deviceID = body.deviceId
    //     {
    //   "eventType": "STREAM_STARTED",
    //   "deviceId": "628072951915",
    //   "sessionId": "uuid",
    //   "channelId": 1,
    //   "streamType": "MAIN",
    //   "dataType": "AUDIO_VIDEO",
    //   "startedAt": "2026-02-21T10:30:00",
    //   "status": "PENDING",
    //   "timestamp": "2026-02-21T10:30:00"
    //     }
    //     {
    //   "eventType": "STREAM_STOPPED",
    //   "deviceId": "628072951915",
    //   "sessionId": "uuid",
    //   "channelId": 1,
    //   "streamType": "MAIN",
    //   "dataType": "AUDIO_VIDEO",
    //   "startedAt": "2026-02-21T10:28:00",
    //   "durationSeconds": 142,
    //   "bytesReceived": 2097152,
    //   "framesReceived": 3540,
    //   "timestamp": "2026-02-21T10:30:22"
    //     }
    //reply the gateway
    res.status(200).json({ success: true })

    //check if the device is online
    let deviceData = await helpers.getConnectedDeviceData(deviceID)
    //if device data is not found, return
    if (!deviceData || !deviceData.device_id) {
      // console.log("Connected device data not found for device ID ", deviceID)
      return
    }

    //log the stream event in the database for analytics and monitoring
    helpers.logDashcamActivity({
      device_id: String(deviceData.device_id), operator_id: deviceData.operator_id,
      activity_type: body.eventType, activity_detail: body,
      message: `Stream event ${body.eventType} received for device ${deviceID}.`
    })
  }


}