import { DashcamDeviceModel } from "../models/device-lists"
import { OptVehicleListModel } from "../models/opt-vehlists"
import { IncomingLocationPacket, TripSummaryOut } from "../typings/gateway"
import { HasAlarm, Haversine } from "./util-items"
import { CriticalAlarms, DisconnectedDeviceTimeRef, GlobalConnectedDevices, MildAlarms, SpeedLimit, TemporalLocationLog } from "./var-param"


export default class helpProcessor {

  static processLocation(packet: IncomingLocationPacket): TripSummaryOut | null {

    const {
      deviceId, latitude, longitude,
      speed, accOn, gpsTime, alarmFlag
    } = packet

    const now = new Date(gpsTime).getTime()

    let trip = TemporalLocationLog.get(deviceId)

    // START TRIP
    if (!trip && accOn) {

      TemporalLocationLog.set(deviceId, {
        deviceId,
        tripStart: gpsTime,

        lastLat: latitude,
        lastLon: longitude,
        lastTime: now,

        distance: 0,
        maxSpeed: 0,

        drivingTime: 0,
        stationaryTime: 0,
        parkingTime: 0,

        speedViolations: 0,

        alarms: 0,
        mildAlarms: 0,
        criticalAlarms: 0
      })

      return null
    }

    if (!trip) return null
    //get the time since the last update in seconds
    const timeDiff = (now - trip.lastTime) / 1000

    if (timeDiff <= 0) return null

    // Max Speed
    if (speed > trip.maxSpeed) {
      trip.maxSpeed = speed
    }

    // Speed Violation
    if (speed > SpeedLimit) {
      trip.speedViolations++
    }

    // Distance
    const dist = Haversine(trip.lastLat, trip.lastLon, latitude, longitude)

    if (dist < 1) {
      trip.distance += dist
    }

    // Driving
    if (speed > 0) {
      trip.drivingTime += timeDiff
    }

    // Stationary
    if (speed === 0 && accOn) {
      trip.stationaryTime += timeDiff
    }

    // Parking
    if (speed === 0 && !accOn) {
      trip.parkingTime += timeDiff
    }

    // Alarm stats
    CriticalAlarms.forEach(bit => {
      if (HasAlarm(alarmFlag, bit)) {
        trip.alarms++
        trip.criticalAlarms++
      }
    })

    MildAlarms.forEach(bit => {
      if (HasAlarm(alarmFlag, bit)) {
        trip.alarms++
        trip.mildAlarms++
      }
    })

    // Update last position
    trip.lastLat = latitude
    trip.lastLon = longitude
    trip.lastTime = now

    // END TRIP
    if (!accOn) {
      const drivingHours = trip.drivingTime / 3600
      const summary: TripSummaryOut = {
        start_time: new Date(trip.tripStart + "Z"),
        end_time: new Date(gpsTime + "Z"),
        distance: trip.distance,
        max_speed: trip.maxSpeed,
        average_speed:
          drivingHours > 0
            ? trip.distance / drivingHours
            : 0,
        driving_time: trip.drivingTime,
        stationary_time: trip.stationaryTime,
        parking_time: trip.parkingTime,
        speed_violations: trip.speedViolations,
        alarms: trip.alarms,
        mild_alarms: trip.mildAlarms,
        critical_alarms: trip.criticalAlarms
      }

      TemporalLocationLog.delete(deviceId)

      return summary
    }

    return null
  }

  static startOfflineDeviceOnDisconnect(deviceID: string) {
    deviceID = String(deviceID)
    //clear off any one pending
    console.log("Pass stage 1 for device ID ", deviceID)
    clearTimeout(DisconnectedDeviceTimeRef.get(deviceID)!)
    DisconnectedDeviceTimeRef.delete(deviceID)
    console.log("Pass stage 2 for device ID ", deviceID)
    //set a new disconnect
    DisconnectedDeviceTimeRef.set(deviceID, setTimeout(async () => {
      let deviceData = GlobalConnectedDevices.get(deviceID)
      //if the device exists in the global connected list, mark it offline in the database
      if (deviceData && deviceData.device_id) {
        OptVehicleListModel.findOneAndUpdate({ device_id: deviceData.device_id },
          { $set: { online_status: 0 } }).catch(e => ({ error: e }))
      } else {
        //load the device data and disconnect it
        DashcamDeviceModel.findOne({ device_number: deviceID }).lean().then(dev => {
          dev && dev._id && OptVehicleListModel.findOneAndUpdate({ device_id: dev._id },
            { $set: { online_status: 0 } }).catch(e => ({ error: e }))
        })
      }
      GlobalConnectedDevices.delete(deviceID)
      DisconnectedDeviceTimeRef.delete(deviceID)
    }, 1 * 60 * 1000)) //1 minute
  }

  static stopOfflineDeviceDisconnectTimer(deviceID: string) {
    deviceID = String(deviceID)
    clearTimeout(DisconnectedDeviceTimeRef.get(deviceID)!)
    DisconnectedDeviceTimeRef.delete(deviceID)
  }
}