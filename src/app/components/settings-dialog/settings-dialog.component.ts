import {Component, Inject, OnInit} from '@angular/core';
import {DialogRef} from "../../services/dialog-ref";
import {DIALOG_DATA} from "../../services/dialog-tokens";
import {ClockMode, ClockSettings} from "../../interfaces/i-clock";

@Component({
  selector: 'app-settings-dialog',
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.scss']
})
export class SettingsDialogComponent implements OnInit {

  constructor(
    private dialogRef: DialogRef,
    @Inject(DIALOG_DATA) public data: ClockSettings
  ) {
    this.beginningTime = data.beginningTime;
    this.timeAdded = data.timeValue;
    this.clockMode = data.clockMode
  }

  public clockMode: ClockMode = ClockMode.AddAfter
  public beginningTime: number = 0
  public timeAdded: number = 0

  ngOnInit(): void {
  }

  removeBeginningTime() {
    if (this.beginningTime <= 0) return;
    this.beginningTime -= DecideStepMinus(this.beginningTime)
  }

  addBeginningTime() {
    this.beginningTime += DecideStepPlus(this.beginningTime)
  }

  removeTimeAdded() {
    if (this.timeAdded <= 0) return;
    this.timeAdded -= DecideStepMinus(this.timeAdded)
  }

  addTimeAdded() {
    this.timeAdded += DecideStepPlus(this.timeAdded)
  }


  cancel() {
    this.dialogRef.close()
  }

  save() {
    this.dialogRef.close({
      clockMode: this.clockMode,
      beginningTime: this.beginningTime,
      timeValue: this.timeAdded
    })
  }
}

function DecideStepPlus(v: number):number {
  return decideStepPlus(Math.floor(v/1000))*1000
}

function decideStepPlus(v: number): number {
  if (v >= 0 && v < 5) {
    return 1
  }
  if (v >= 5 && v < 30) {
    return 5
  }
  if (v >= 30 && v < 60) {
    return 10
  }
  return 30
}

function DecideStepMinus(v: number):number {
  return decideStepMinus(Math.floor(v/1000))*1000
}

function decideStepMinus(v: number): number {
  if (v >= 0 && v <= 5) {
    return 1
  }
  if (v > 5 && v <= 30) {
    return 5
  }
  if (v > 30 && v <= 60) {
    return 10
  }
  return 30
}
