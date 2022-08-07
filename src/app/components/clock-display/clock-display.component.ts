import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Route, Router} from "@angular/router";
import Clock from "../../clock";
import {SettingsDialogComponent} from "../settings-dialog/settings-dialog.component";
import {DialogService} from "../../services/dialog.service";
import {ClockSettings} from "../../interfaces/i-clock";

@Component({
  selector: 'app-clock-display',
  templateUrl: './clock-display.component.html',
  styleUrls: ['./clock-display.component.scss']
})
export class ClockDisplayComponent implements OnInit {

  constructor(private route: ActivatedRoute, private router: Router, private dialog: DialogService) {
  }

  public clock!: Clock;
  public display: string = "";
  public askForOrder: boolean = false;
  private dialogRef: any;

  ngOnInit(): void {
    this.route.params.subscribe(async (data: any) => {
      if (!data.id || data.id.length != 6) {
        this.router.navigate(["/"]).then()
        return
      }
      try {
        this.clock = await Clock.JoinClock(data.id.toLowerCase())
        this.clock.OnTick((a: number) => this.RenderTick(a))
        this.clock.OnSetOrder(() => this.RenderSetOrder())
        this.clock.OnLost(() => this.RenderLost())
        this.clock.OnWin(() => this.RenderWin())
        await this.clock.BeginSync()
      } catch {
        this.router.navigate(["/"]).then()
        return
      }
    })
  }

  public RenderSetOrder() {
    this.display = "ORDER"
  }

  public RenderLost() {
    this.display = "lost"
  }

  public RenderWin() {
    this.display = "won"
    console.log(this.display)
  }

  public RenderTick(duration: number) {
    let milliseconds = Math.floor((duration % 1000) / 100),
      seconds = Math.floor((duration / 1000) % 60),
      minutes = Math.floor(duration / (1000 * 60));

    let m = (minutes < 10) ? "0" + minutes : minutes;
    let s = (seconds < 10) ? "0" + seconds : seconds;
    this.display = m + ":" + s;
  }

  public Pause() {
    this.clock.PauseAll()
  }

  public async Next() {
    if (this.display == "ORDER") {
      await this.clock.SetOrder()
      return
    }
    this.clock.Next()
  }

  public OpenSettings() {
    if (this.dialogRef != undefined) return
    this.dialogRef = this.dialog.open(SettingsDialogComponent, {
      data: this.clock.settings,
    });
    this.dialogRef.afterClosed().subscribe((data: ClockSettings | undefined) => {
      this.dialogRef = undefined;
      if (data == undefined) return;
      this.clock.settings = data;
    })
  }

  async ResetClock() {
    await this.clock.Reset()
  }
}
