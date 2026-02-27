import helpers from "../assets/helpers";
import helpProcessor from "../assets/helpproces";
import { DatabaseTableList } from "../assets/var-config";
import { GlobalConnectedDevices } from "../assets/var-param";
import { DashcamAlarmModel, DashcamLocationModel, LocationSummaryModel } from "../models/device-data";
import { DashcamDeviceModel, DashcamDeviceTypes } from "../models/device-lists";
import { OptVehicleListModel } from "../models/opt-vehlists";
import { IncomingLocationPacket } from "../typings/gateway";
import { PrivateMethodProps, SendDBQuery } from "../typings/general";

export class GatewayHookService {

  static async RegisterNewDevice({ res, body }: PrivateMethodProps) {
    let deviceID = String(body.deviceId || "").trim()
    let provinceID = String(body.provinceId || "").trim()
    let cityID = String(body.cityId || "").trim()
    let licensePlate = String(body.licensePlate || "").trim()

    // TODO: 1. Add a bounce check to prevent multiple registration attempts
    //  in a short time frame for the same device ID, which could 
    // indicate an issue with the device or gateway.

    //validate the inputs
    if (!deviceID) return helpers.outputError(res, null, "Device ID is required")
    //register the device in the database
    if (!helpers.isNumber({ input: deviceID, type: "int", minLength: 10, maxLength: 20 })) {
      return helpers.outputError(res, null, "Device ID must be a number between 10 and 20 digits")
    }

    //check if device exists in online device state
    if (GlobalConnectedDevices.has(deviceID)) {
      //stop timer for clearing offline device if it exists
      helpProcessor.stopOfflineDeviceDisconnectTimer(deviceID)
      return res.status(200).json({ approved: true })
    }

    if (provinceID) {
      if (!helpers.isNumber({ input: String(provinceID), type: "int", minLength: 1, maxLength: 10 })) {
        return helpers.outputError(res, null, "Province ID must be a number between 1 and 10 digits")
      }
    }

    if (cityID) {
      if (!helpers.isNumber({ input: String(cityID), type: "int", minLength: 1, maxLength: 10 })) {
        return helpers.outputError(res, null, "City ID must be a number between 1 and 10 digits")
      }
    }

    if (licensePlate) {
      if (licensePlate.length < 2 || licensePlate.length > 20) {
        return helpers.outputError(res, null, "License plate must be between 2 and 20 characters")
      }
    }

    //check if the device is prepared on the system already
    let getDevice: SendDBQuery = await DashcamDeviceModel.aggregate([
      { $match: { device_number: deviceID } },
      {
        $lookup: {
          from: DatabaseTableList.vehicle_lists,
          let: { deviceID: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$device_id", "$$deviceID"] } } },
            { $project: { vehicle_status: 1, operator_id: 1 } },
          ],
          as: "vehicle_data"
        }
      },
      { $unwind: { path: "$vehicle_data", preserveNullAndEmptyArrays: true } },
    ]).catch((e) => ({ error: e }));

    //if there's an error, return it
    if (getDevice && getDevice.error) {
      console.log("Error fetching device for registration ", getDevice.error)
      return helpers.outputError(res, 500)
    }

    getDevice = getDevice[0] as (DashcamDeviceTypes & { vehicle_data?: { vehicle_status: number, operator_id: string } })

    //if the device is not found
    if (!getDevice || !getDevice.vehicle_data) return helpers.outputError(res, 404, "Device not found.")

    //if the device is not active for registration, return an error
    if (getDevice.active_status !== 1 || !getDevice.operator_id || getDevice.vehicle_data.vehicle_status !== 1) {
      return helpers.outputError(res, null, "Device is not active for registration")
    }

    res.status(200).json({ approved: true })

    //if the gateway status already registered
    if (getDevice.gateway_status === 1) return

    //update the device with the new information and set the gateway status to registered
    await DashcamDeviceModel.findOneAndUpdate({ device_number: deviceID }, {
      $set: {
        province_id: provinceID, city_id: cityID,
        license_plate: licensePlate, gateway_status: 1
      }
    }).catch((e) => ({ error: e }))
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
    let deviceID = String(body.deviceId || "").trim()

    if (!deviceID) return helpers.outputError(res, null, "Device ID is required")

    //validate the device ID
    if (!helpers.isNumber({ input: deviceID, type: "int", minLength: 10, maxLength: 20 })) {
      return helpers.outputError(res, null, "Device ID must be a number between 10 and 20 digits")
    }

    //if still connected
    if (GlobalConnectedDevices.has(deviceID)) {
      // console.log("Device Has Key, but received connected event again for device ID ", deviceID)
      //stop timer for clearing offline device if it exists
      helpProcessor.stopOfflineDeviceDisconnectTimer(deviceID)
      return res.status(200).json({ success: true })
    }
    res.status(200).json({ success: true })

    //get the device from the database
    let getDev = await helpers.getConnectedDeviceData(deviceID)

    //if there's result coming
    if (getDev && getDev.device_id && getDev.vehicle_id) {
      await OptVehicleListModel.findByIdAndUpdate(getDev.vehicle_id, {
        $set: { online_status: 1 }
      }).catch(e => ({ error: e }))
    }
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

    //call the disconnect processor to handle the device disconnection after a 
    // certain time frame to allow for temporary network issues
    helpProcessor.startOfflineDeviceOnDisconnect(deviceID)
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
      alarm_type: alarmType, severity: severity, status: severity === "INFO" ? 1 : 0,
      vehicle_id: deviceData.vehicle_id || undefined,
      latitude: latitude, longitude: longitude, speed: speed,
      triggered_at: body.triggeredAt + "Z", alarm_ref: eventId, trigger_detail: body.detail,
      operator_id: deviceData.operator_id, device_id: deviceData.device_id,
      cleared_at: severity === "INFO" ? body.triggeredAt + "Z" : undefined
    }).catch((e) => ({ error: e }));

    //if there's an error, return it
    if (logData && logData.error) {
      console.log("Error logging alarm event ", logData.error)
      return
    }
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
      $set: { status: 1, cleared_at: body.clearedAt + "Z" }
    }, { returnDocument: "after" }).catch((e) => ({ error: e }));

    //if there's an error, return it
    if (updateData && updateData.error) {
      console.log("Error updating alarm event ", updateData.error)
      return
    }

  }

  static async HandleDeviceLocationUpdate({ res, body }: PrivateMethodProps) {
    // {
    //   "deviceId": "628072951915",
    //   "latitude": 6.5244,
    //   "longitude": 3.3792,
    //   "altitude": 15,
    //   "speed": 45.0,
    //   "direction": 180,
    //   "gpsTime": "2026-02-21T10:30:00",
    //   "accOn": true,
    //   "positioned": true,
    //   "alarmFlag": 0,
    //   "statusFlag": 3,
    //   "satelliteCount": 8,
    //   "signalStrength": 24,
    //   "mileage": 12500,
    //   "timestamp": "2026-02-21T10:30:01"
    // }
    let deviceID = String(body.deviceId || "").trim()
    let latitude = body.latitude
    let longitude = body.longitude
    let altitude = body.altitude
    let speed = body.speed
    let heading = body.direction
    let gpsTime = body.gpsTime
    let accOn = body.accOn
    let satelliteCount = body.satelliteCount
    let signalStrength = body.signalStrength
    let positioned = body.positioned

    //if the device is not positioned or has less than 4 satellites, return an error
    if (satelliteCount < 4 || !positioned) {
      return helpers.outputError(res, null, "Insufficient satellite signal for location update")
    }

    //validate the inputs
    if (!deviceID) return helpers.outputError(res, null, "Device ID is required")
    if (!latitude) return helpers.outputError(res, null, "Latitude is required")
    if (!longitude) return helpers.outputError(res, null, "Longitude is required")

    //validate the device ID
    if (!helpers.isNumber({ input: deviceID, type: "int", minLength: 10, maxLength: 20 })) {
      return helpers.outputError(res, null, "Device ID must be a number between 10 and 20 digits")
    }
    //validate latitude and longitude
    if (latitude < -90 || latitude > 90) {
      return helpers.outputError(res, null, "Latitude must be between -90 and 90")
    }
    if (longitude < -180 || longitude > 180) {
      return helpers.outputError(res, null, "Longitude must be between -180 and 180")
    }

    //reply the gateway
    res.status(200).json({ success: true })

    let deviceData = await helpers.getConnectedDeviceData(deviceID)

    //if device data is not found, return
    if (!deviceData || !deviceData.device_id) {
      // console.log("Connected device data not found for device ID ", deviceID)
      return
    }

    let logData: SendDBQuery = await DashcamLocationModel.create({
      device_id: deviceData.device_id, operator_id: deviceData.operator_id,
      latitude, longitude, speed, heading, gps_timestamp: new Date(gpsTime + "Z"),
      acc_status: accOn ? 1 : 0, alarm_flag: body.alarmFlag, mileage: body.mileage,
      vehicle_id: deviceData.vehicle_id || undefined,
      satellite_count: satelliteCount, signal_strength: signalStrength,
    }).catch((e) => ({ error: e }));

    //if there's an error, return it
    if (logData && logData.error) {
      console.log("Error logging location update ", logData.error)
      return
    }

    const summary = await helpProcessor.processLocation(body as IncomingLocationPacket)

    //if there's data, log it
    if (summary && summary.start_time) {
      let logSum: SendDBQuery = await LocationSummaryModel.create({
        device_id: deviceData.device_id, operator_id: deviceData.operator_id,
        vehicle_id: deviceData.vehicle_id, ...summary
      }).catch((e) => ({ error: e }));
      //if there's an error, return it
      if (logSum && logSum.error) {
        console.log("Error logging location summary ", logSum.error)
      }
    }

  }



}