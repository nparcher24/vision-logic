import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TestPageRoutingModule } from './test-routing.module';

import { TestPage } from './test.page';
import { CountdownCircleComponentModule } from '../countdown-circle/countdown-circle.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TestPageRoutingModule,
    CountdownCircleComponentModule
  ],
  declarations: [TestPage]
})
export class TestPageModule {}
