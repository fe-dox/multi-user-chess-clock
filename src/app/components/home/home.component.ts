import { Component, OnInit } from '@angular/core';
import Clock from "../../clock";
import {Router} from "@angular/router";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  async newClock() {
    let clockId = await Clock.NewClock();
    this.router.navigate([clockId]).then()
  }

  joinClock() {

  }
}
