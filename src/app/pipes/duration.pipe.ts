import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duration'
})
export class DurationPipe implements PipeTransform {

  transform(value: number, ...args: unknown[]): string {
    return renderTime(value)
  }

}

function renderTime(duration:number ){
    let seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor(duration / (1000 * 60));

  let m = (minutes < 10) ? "0" + minutes : minutes;
  let s = (seconds < 10) ? "0" + seconds : seconds;
  return  m + ":" + s;
}
