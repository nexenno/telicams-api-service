import { TripStateInMemory } from "../typings/gateway"
import { ConnectedDeviceValues } from "../typings/general"

export const SpeedLimit = 80
export const CriticalAlarms = [0, 8, 9, 18, 19, 27, -20, -26, -32, -37, -42]
export const MildAlarms = [1, 2, 3, 7, 3, 14, 20, 21, 22, 23, 26, 28, 29, 30, 31, -10, -11, -12, -14, -15, -21, -22, -23, -24, -25, -27, -31, -33, -34, -35, -40, -41, -43, -44, -50, -51, -52,]



export const TemporalLocationLog: Map<string, TripStateInMemory> = new Map()
//for storing connected devices and their auth_id
export const GlobalConnectedDevices: Map<string, ConnectedDeviceValues> = new Map()
//@ts-ignore
export const GlobalTimeZones: string[] = Intl.supportedValuesOf('timeZone')
export const DisconnectedDeviceTimeRef: Map<string, ReturnType<typeof setTimeout>> = new Map()
