import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MCamera } from 'movement-camera';
import { PluginListenerHandle } from '@capacitor/core';
import { Motion } from '@capacitor/motion';
import { InFrameStatus, Parameter, PoseLandmark, RepRecord } from '../CustomTypes';
import { ExerciseController, ExerciseControllerDelegate } from '../Logic';
import { testExercise } from '../StaticData';
import { AppComponent } from '../app.component';




@Component({
  selector: 'app-test',
  templateUrl: './test.page.html',
  styleUrls: ['./test.page.scss'],
})
export class TestPage extends ExerciseControllerDelegate implements OnInit {

  answer;
  testListener;
  accelHandler: PluginListenerHandle;
  exerciseController = new ExerciseController(this, testExercise);

  repCount = 0;
  goodReps = 0;
  badReps = 0;
  deviceAngle = 0;
  val1Name?: string;
  val1: number;
  val2Name?: string;
  val2: number;
  val3Name?: string;
  val3: number;



  startPosition = false;
  algoRunning = false;
  log = '';

  constructor(public cd: ChangeDetectorRef, private menuController: AppComponent) {
    super();
  }

  ngOnInit() {
    this.testListener = (MCamera as any).addListener('posedetected', (info: any) => {
      // console.log(info);
      //Works with iOS
      const positions: PoseLandmark[] = JSON.parse(info.data);
      const deviceAngle: number = info.angle;
      this.deviceAngle = Math.round(deviceAngle * 100) / 100;
      // console.log(`first-position: ${JSON.stringify(positions[0])}, angle: ${deviceAngle}`);
      this.exerciseController.handlePose(positions, deviceAngle);
    });
  }

  onClick() {
    if (!this.algoRunning) {
      this.menuController.closeMenu();
      MCamera.showCamera({ lineColor: '#22ff00' }); //'#22ff00'
    } else {
      this.menuController.openMenu();
      MCamera.stopCamera();
      this.log = '';
    }

    this.algoRunning = !this.algoRunning;
  }

  updateVal1 = (name: string, val: number) => {
    this.val1Name = name;
    this.val1 = val;
    this.cd.detectChanges();
  };

  updateVal2 = (name: string, val: number) => {
    this.val2Name = name;
    this.val2 = val;
    this.cd.detectChanges();
  };

  updateVal3 = (name: string, val: number) => {
    this.val3Name = name;
    this.val3 = val;
    this.cd.detectChanges();
  };

  // Delegate Methods
  repWasCompleted = (repRecord: RepRecord[]): void => {
    const goodReps = repRecord.filter(rep => rep.isGoodRep === true);
    this.goodReps = goodReps.length;
    this.repCount = repRecord.length;
    this.badReps = this.repCount - this.goodReps;
    console.log('Rep Completed');
    this.cd.detectChanges();
  };

  sendMessage = (aNumber: string) => {
    console.log('sendMessage: ', aNumber);
    this.log = aNumber;
    this.cd.detectChanges();
  };

  startPositionDetected = () => {
    this.log = 'Start Position Detected';
    this.cd.detectChanges();
    // console.log('Start Position Detected');
  };

  isometricTimer = (totalTime: number, graceTime: number) => {
    console.log('Isometric Timer');
  };

  updateIsoStack = (graceStack: Map<Date, Date>, goodStack: Map<Date, Date>) => {
    console.log('Update Iso Stack');
  };

  inFrameChanged = (inFrameStatus: InFrameStatus) => {
    console.log('New InFrameStatus: ', inFrameStatus);
  };
}
