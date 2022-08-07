import {IGunSchema} from "gun";
import {ClockStatus} from "../clock";

export interface IClock extends IGunSchema, ClockSettings {
  clockId: string
  users: {
    [key: string]: UserClock
  }

}

export enum ClockMode {
  AddAfter
}

export interface UserClock extends IGunSchema {
  pausedAt: number
  target: number
  ticking: boolean
  clockStatus: ClockStatus
  order: number|null
}

export interface ClockSettings extends IGunSchema{
  clockMode: ClockMode
  timeValue: number
  beginningTime: number
}
