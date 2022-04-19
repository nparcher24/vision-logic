import { Component, OnInit } from '@angular/core';
import { MCamera } from 'movement-camera';
import { PluginListenerHandle } from '@capacitor/core';
import { Motion } from '@capacitor/motion';
import { PoseLandmark } from '../CustomTypes';




@Component({
  selector: 'app-test',
  templateUrl: './test.page.html',
  styleUrls: ['./test.page.scss'],
})
export class TestPage implements OnInit {

  answer;
  testListener;
  accelHandler: PluginListenerHandle;

  constructor() { }

  ngOnInit() {


    this.testListener = (MCamera as any).addListener('posedetected', (info: any) => {
      // console.log(JSON.stringify(info));
      const rawData = info.data;
      const deviceAngle = info.angle as number;
      const parsedData = JSON.parse(rawData) as PoseLandmark[];
      
      console.log(`Device Angle: ${deviceAngle}`);
    });
  }

  onClick() {
    MCamera.showCamera({ testValue: 'I HOPE THIS WORKS' });

  }
}
