import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CountdownCircleComponent } from './countdown-circle.component';

@NgModule({
  imports: [ CommonModule, FormsModule, IonicModule,],
  declarations: [CountdownCircleComponent],
  exports: [CountdownCircleComponent]
})
export class CountdownCircleComponentModule {}
