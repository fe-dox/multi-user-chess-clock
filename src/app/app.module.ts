import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {RouterModule} from "@angular/router";
import {HomeComponent} from './components/home/home.component';
import {ClockDisplayComponent} from './components/clock-display/clock-display.component';
import {AvatarComponent} from './components/avatar/avatar.component';
import {JoinClockComponent} from './components/join-clock/join-clock.component';
import {ReactiveFormsModule} from "@angular/forms";
import {NgOtpInputModule} from "ng-otp-input";
import {DialogModule} from '@angular/cdk/dialog';
import { OverlayModule } from '@angular/cdk/overlay';
import { SettingsDialogComponent } from './components/settings-dialog/settings-dialog.component';
import { DurationPipe } from './pipes/duration.pipe';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ClockDisplayComponent,
    AvatarComponent,
    JoinClockComponent,
    SettingsDialogComponent,
    DurationPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    NgOtpInputModule,
    DialogModule,
    OverlayModule,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
