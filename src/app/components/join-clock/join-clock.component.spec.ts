import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinClockComponent } from './join-clock.component';

describe('JoinClockComponent', () => {
  let component: JoinClockComponent;
  let fixture: ComponentFixture<JoinClockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ JoinClockComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JoinClockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
