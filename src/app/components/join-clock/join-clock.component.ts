import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl} from "@angular/forms";
import { Router } from '@angular/router';
import Clock from "../../clock";
import {Config} from "ng-otp-input/lib/models/config";
import {debounceTime, filter, Subscription, take} from "rxjs";

@Component({
  selector: 'app-join-clock',
  templateUrl: './join-clock.component.html',
  styleUrls: ['./join-clock.component.scss']
})
export class JoinClockComponent implements OnInit, OnDestroy {

  constructor(private router: Router) { }
  private sub: Subscription|undefined;
  ngOnInit(): void {
    this.sub = this.code.valueChanges.pipe(debounceTime(100), filter((c:string|null) => !!c && c.length === 6)).subscribe(async code =>{
      if(!code || code.length != 6){
        alert("Kod musi mieć 6 znaków")
        return
      }
      let exists = await Clock.Exists(code.toLowerCase())
      if (!exists){
        alert("Ten zegar nie istnieje")
        return
      }
      this.router.navigate([code]).then()
    })
  }

  ngOnDestroy() {
    this.sub?.unsubscribe()
  }

  code = new FormControl("")
  otpInputConfig: Config = {
    length: 6,
    letterCase: "Upper",
  }
}
