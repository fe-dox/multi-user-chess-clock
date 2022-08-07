import GUN, {IGunInstance} from "gun";
import "gun/lib/open.js";
import "gun/lib/load.js"
import {ClockMode, ClockSettings, IClock, UserClock} from './interfaces/i-clock';
import {environment} from "../environments/environment";

export default class Clock {
  get clockId(): string {
    return this._clockId;
  }

  private readonly _clockId!: string;
  private _ticking: boolean = false
  private _target!: number;
  private _pausedAt!: number;
  private _timer!: number;
  private _status: ClockStatus = ClockStatus.Ticking;
  private _end: Function | undefined;
  private _won: Function | undefined;
  private _tick: Function | undefined;
  private _order: null | number;
  private static gun: IGunInstance = GUN({peers: environment.peers})
  private internalClockReference;
  private clockReference;
  private _orderManager: OrderManager;
  private _settings: ClockSettings;
  private _tickingList: { [key: string]: boolean } = {}
  private _setOrder: Function | undefined;

  private constructor(clockId: string) {
    this._clockId = clockId;
    this._orderManager = new OrderManager(Clock.GetDeviceId());
    this.internalClockReference = Clock.gun.get(clockId).get("users").get(Clock.GetDeviceId())
    this.clockReference = Clock.gun.get(clockId)
    this._order = null;
    this._settings = {
      beginningTime: 0,
      timeValue: 0,
      clockMode: 0,
    };
  }

  public async BeginSync() {
    this.clockReference.get("beginningTime").on((data) => {
      this._settings.beginningTime = data
    })
    this.clockReference.get("clockMode").on((data) => {
      this._settings.clockMode = data
    })
    this.clockReference.get("timeValue").on((data) => {
      this._settings.timeValue = data
    })
    this.internalClockReference.on((data: UserClock) => {
      this._pausedAt = data.pausedAt
      this._target = data.target
      this._ticking = data.ticking
      this._status = data.clockStatus
      this._order = data.order
      if (data.order == null && data.clockStatus == ClockStatus.Ticking) {
        if (this._setOrder != undefined) {
          this._setOrder();
        }
      }
    })
    this.clockReference.get("users").map().on((data: UserClock, key: string) => {
      if (data.clockStatus == ClockStatus.Won) {
        if (key != Clock.GetDeviceId()) {
          this.Lose()
          return
        }
      }
      if (data.order == null || data.clockStatus != ClockStatus.Ticking) {
        this._orderManager.Remove(key)
      } else {
        this._orderManager.Update(key, data.order)
      }
      this._tickingList[key] = data.ticking;
    })
    this.internalClockReference.get("clockStatus").on((data) => {
      if (data == ClockStatus.Won) {
        this.Win();
      }
    })
    await new Promise(resolve => {
      window.setTimeout(resolve, 100)
    })
    this._timer = window.setInterval(() => {
      if (this.status != ClockStatus.Ticking) return;
      if (!this._ticking) {
        if (this.pausedAt == 0) {
          this.pausedAt = Date.now()
        }
        return
      }
      if (this.pausedAt != 0) {
        this.target = this.target + (Date.now() - this.pausedAt)
        this.pausedAt = 0
      }
      this.Tick()
    }, 400)
    if (this._order != null) {
      this.Tick()
    }
    if (this.status == ClockStatus.Lost) {
      if (this._end != undefined) {
        this._end()
      }
    }
  }

  static GetDeviceId(): string {
    let deviceId = localStorage.getItem("DEVICE_ID")
    if (deviceId == null) {
      deviceId = Date.now().toString(36);
      localStorage.setItem("DEVICE_ID", deviceId);
    }
    return deviceId
  }

  static async JoinClock(clockId: string): Promise<Clock> {
    let clockRef = Clock.gun.get(clockId)
    let clockData = await new Promise(resolve => {
      clockRef.load((data) => {
        resolve(data)
      })
    }) as IClock
    if (clockData == null) {
      throw new Error("Clock doesn't exist")
    }
    if (!clockData.users[Clock.GetDeviceId()]) {
      let myClockStartData = {
        pausedAt: Date.now(),
        target: Date.now() + clockData.beginningTime,
        ticking: false,
        clockStatus: ClockStatus.Ticking,
        order: null,
      }
      clockRef.get("users").get(Clock.GetDeviceId()).put(myClockStartData)
    }
    return new Clock(clockId)
  }

  static async Exists(clockId: string): Promise<boolean> {
    let clockRef = Clock.gun.get(clockId)
    let clockData = await new Promise(resolve => {
      clockRef.once((data) => {
        resolve(data)
      })
    }) as IClock
    return clockData != null;
  }

  static async NewClock(): Promise<string> {
    let clockId = generateClockId()
    let defaultSettings: IClock = {
      clockId: clockId,
      clockMode: ClockMode.AddAfter,
      timeValue: 1000,
      beginningTime: 60 * 1000,
      users: {},
    }
    await new Promise((resolve) => {
      Clock.gun.get(clockId).put(defaultSettings, function (ack) {
        console.log("ACK_ACK_ACK: ", ack)
      })
      window.setTimeout(() => resolve(true), 100)
    })
    return clockId
  }

  public async Reset() {
    let clockData = await new Promise(resolve => {
      this.clockReference.load((data) => {
        resolve(data)
      })
    }) as IClock
    for (let key in clockData.users) {
      if (!clockData.users.hasOwnProperty(key)) continue;
      this.clockReference.get("users").get(key).put({
        pausedAt: Date.now(),
        target: Date.now() + clockData.beginningTime,
        ticking: false,
        clockStatus: ClockStatus.Ticking,
        order: null,
      })
    }
  }

  public PauseAll() {
    this.clockReference.get("users").load(data => {
      for (let key in data) {
        if (!data.hasOwnProperty(key)) continue;
        if (!data[key].ticking) continue;
        this.clockReference.get("users").get(key).get("ticking").put(false)
      }
    })
  }

  private Pause() {
    if (this.status != ClockStatus.Ticking) return;
    this.pausedAt = Date.now();
    this.ticking = false;
  }

  private anyoneElseIsTicking(): boolean {
    let values = JSON.parse(JSON.stringify(this._tickingList))
    delete values[Clock.GetDeviceId()]
    return Object.values(values).filter(v => v == true).length != 0
  }

  public Next() {
    if (this.status != ClockStatus.Ticking) return;
    if (this.anyoneElseIsTicking()) return;
    if (this.ticking) {
      this.Pause()
      this.IncrementSelf()
    }
    this.StartNextPersonClock()
  }

  private StartNextPersonClock() {
    if (this.status != ClockStatus.Ticking) return;
    let nextUserId = this._orderManager.GetNext()
    if (nextUserId == "") {
      this.Win()
      return
    }
    let nextUserRef = this.clockReference.get("users").get(nextUserId).get("ticking").put(true)
    this.Tick()
  }

  public async SetOrder() {
    let nowR = await (await fetch(environment.timeSource)).json()
    let now = !!nowR.now ? nowR.now : Date.now()
    this.clockReference.get("users").get(Clock.GetDeviceId()).get("order").put(now);
    this.Tick()
  }

  public ResetOrder() {
    this.PauseAll()
    this.clockReference.get("users").map().get("order").put(null);
  }

  public IncrementSelf() {
    switch (this._settings?.["clockMode"]) {
      case ClockMode.AddAfter:
        // @ts-ignore
        this.target = this.target + this._settings.timeValue
    }
  }

  private Tick() {
    let diff = this.target - (this.ticking ? Date.now() : this.pausedAt);
    if (diff > 0) {
      this._tick?.call(this, diff)
    } else {
      this.Lose()
    }
  }

  private Win() {
    if (this.status != ClockStatus.Ticking) return;
    this.ticking = false;
    this.status = ClockStatus.Won
    if (this._won != undefined) {
      this._won(true)
    }
  }

  private Lose() {
    if (this.status != ClockStatus.Ticking) return;
    this.Pause()
    this.status = ClockStatus.Lost;
    if (this._end != undefined) {
      this._end();
    }
    this.StartNextPersonClock()
  }


  public OnTick(f: Function) {
    this._tick = f
  }

  public OnLost(f: Function) {
    this._end = f
  }

  public OnWin(f: Function) {
    this._won = f
  }

  public OnSetOrder(f: Function) {
    this._setOrder = f;
  }

  get ticking(): boolean {
    return this._ticking;
  }

  set ticking(value: boolean) {
    this._ticking = value
    this.internalClockReference.put({ticking: value});
  }

  get target(): number {
    return this._target;
  }

  set target(value: number) {
    this._target = value
    this.internalClockReference.put({target: value});
  }

  get pausedAt(): number {
    return this._pausedAt;
  }

  set pausedAt(value: number) {
    this._pausedAt = value;
    this.internalClockReference.put({pausedAt: value})
  }

  get status(): ClockStatus {
    return this._status;
  }

  set status(value: ClockStatus) {
    this._status = value
    this.internalClockReference.put({clockStatus: value})
  }

  get settings(): ClockSettings {
    return this._settings;
  }

  set settings(value: ClockSettings) {
    this._settings = value;
    this.clockReference.get("beginningTime").put(value.beginningTime)
    this.clockReference.get("clockMode").put(value.clockMode)
    this.clockReference.get("timeValue").put(value.timeValue)
  }

}

class OrderManager {
  private readonly _myId: string;
  private _orderToId: { [key: number]: string } = {};
  private _idToOrder: { [key: string]: number } = {};

  constructor(myId: string) {
    this._myId = myId
  }

  get myOrder(): number {
    return this._idToOrder[this._myId]
  }

  public GetNext(): string {
    let nextOrder = Object.keys(this._orderToId).map(v => Number(v)).sort().filter((v: number) => v > this.myOrder)[0]
    if (!nextOrder) {
      nextOrder = Object.keys(this._orderToId).map(v => Number(v)).sort()[0]
    }
    if (nextOrder == this.myOrder) {
      return ""
    }
    return this._orderToId[nextOrder]
  }

  public Update(id: string, order: number) {
    let oldOrder = this._idToOrder[id];
    if (!!oldOrder) {
      delete this._orderToId[oldOrder]
    }
    this._orderToId[order] = id;
    this._idToOrder[id] = order;
  }

  public Remove(id: string) {
    let oldOrder = this._idToOrder[id];
    if (!!oldOrder) {
      delete this._orderToId[oldOrder]
      delete this._idToOrder[id];
    }
  }

  public Reset() {
    this._orderToId = {}
    this._idToOrder = {}
  }
}

export enum ClockStatus {
  Set = 0,
  Ticking = 1,
  Won = 2,
  Lost = 3,
}

function generateClockId() {
  return Date.now().toString(36).slice(2)
}
