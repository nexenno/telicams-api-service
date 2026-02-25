import { IncomingLocationPacket, TripStateInMemory, TripSummaryOut } from "../typings/gateway"

const SPEED_LIMIT = 80
const CRITICAL_ALARMS = [0, 8, 9]
const MILD_ALARMS = [1, 2, 3]

function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {

  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

function hasAlarm(flag: number, bit: number): boolean {
  return (flag & (1 << bit)) !== 0
}

export class TripProcessor {

  private deviceTrips: Map<string, TripStateInMemory> = new Map()

  async processLocation(packet: IncomingLocationPacket): Promise<TripSummaryOut | null> {

    const {
      deviceId,
      latitude,
      longitude,
      speed,
      accOn,
      gpsTime,
      alarmFlag
    } = packet

    const now = new Date(gpsTime).getTime()

    let trip = this.deviceTrips.get(deviceId)

    // START TRIP
    if (!trip && accOn) {

      this.deviceTrips.set(deviceId, {
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
    if (speed > SPEED_LIMIT) {
      trip.speedViolations++
    }

    // Distance
    const dist = haversine(trip.lastLat, trip.lastLon, latitude, longitude)

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
    CRITICAL_ALARMS.forEach(bit => {
      if (hasAlarm(alarmFlag, bit)) {
        trip.alarms++
        trip.criticalAlarms++
      }
    })

    MILD_ALARMS.forEach(bit => {
      if (hasAlarm(alarmFlag, bit)) {
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

      this.deviceTrips.delete(deviceId)

      return summary
    }

    return null
  }
}