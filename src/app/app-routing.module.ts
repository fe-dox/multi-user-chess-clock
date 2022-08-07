import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import {HomeComponent} from "./components/home/home.component";
import {ClockDisplayComponent} from "./components/clock-display/clock-display.component";
import { JoinClockComponent } from './components/join-clock/join-clock.component';


const routes:Routes = [
  {path:"", component:HomeComponent},
  {path:"join", component:JoinClockComponent},
  {path:":id", component:ClockDisplayComponent},
]

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forRoot(routes)
  ],
  exports:[RouterModule]
})
export class AppRoutingModule { }
