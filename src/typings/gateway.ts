export interface IncomingLocationPacket {
  deviceId: string
  latitude: number
  longitude: number
  altitude: number
  speed: number
  direction: number
  gpsTime: string
  accOn: boolean
  positioned: boolean
  alarmFlag: number
  statusFlag: number
  satelliteCount: number
  signalStrength: number
  mileage: number
  timestamp: string
}

export interface TripStateInMemory {
  deviceId: string
  tripStart: string
  lastLat: number
  lastLon: number
  lastTime: number
  distance: number
  maxSpeed: number
  drivingTime: number
  stationaryTime: number
  parkingTime: number
  speedViolations: number
  alarms: number
  mildAlarms: number
  criticalAlarms: number
}

export interface TripSummaryOut {
  start_time: Date
  end_time: Date
  distance: number
  max_speed: number
  average_speed: number
  driving_time: number
  stationary_time: number
  parking_time: number
  speed_violations: number
  alarms: number
  mild_alarms: number
  critical_alarms: number
}