import { TripStateInMemory } from "../typings/gateway"
import { ConnectedDeviceValues } from "../typings/general"

export const SpeedLimit = 80
export const CriticalAlarms = [0, 8, 9]
export const MildAlarms = [1, 2, 3]



export const TemporalLocationLog: Map<string, TripStateInMemory> = new Map()
//for storing connected devices and their auth_id
export const GlobalConnectedDevices: Map<string, ConnectedDeviceValues> = new Map()
//@ts-ignore
export const GlobalTimeZones: string[] = Intl.supportedValuesOf('timeZone')
export const DisconnectedDeviceTimeRef: Map<string, ReturnType<typeof setTimeout>> = new Map()
