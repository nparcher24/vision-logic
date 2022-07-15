import { Observable } from 'rxjs';
import {
    Exercise, getPoseLandmark, InFrameStatus, Joint,
    LandmarkType, Parameter, ParameterType, PoseLandmark, Position, ReferencePlane, RepRecord
} from './CustomTypes';


export abstract class ExerciseControllerDelegate {
    repWasCompleted: (repRecord: RepRecord[]) => void;
    startPositionDetected: () => void;
    isometricTimer: (totalTime: number, graceTime: number) => void;
    updateIsoStack: (graceStack: Map<Date, Date>, goodStack: Map<Date, Date>) => void;
    inFrameChanged: (inFrameStatus: InFrameStatus) => void;
    sendMessage: (aNumber: string) => void;
}

export class ExerciseController {

    exerciseDelegate: ExerciseControllerDelegate;
    exercise: Exercise;
    parameterArray: Parameter[];
    landmarkArray: LandmarkType[];
    // exerciseController = new ExerciseUtilities();
    time = 0;
    goodReps = 0;
    badReps = 0;

    positionStack: Position[] = [];
    brokenParamStack: Parameter[] = [];
    repStack: RepRecord[] = [];
    // positionStackBuffer: { position: Position; count: number }[] = [];
    positionStackBuffer = new Map<Position, number>();
    // brokenParamStackBuffer: { Parameter: number }[] = [];
    brokenParamStackBuffer = new Map<Parameter, number>();
    positionStackBufferCount = 3;
    brokenParamStackBufferCount = 3;


    isometricGraceStartTime: Date | null;
    isometricGraceStack = new Map<Date, Date>();
    isometricStartTime: Date | null;
    isometricTimeStack = new Map<Date, Date>();
    isometricExerciseHasStarted = false;
    started = false;

    inFrameThreshold = 0.8;
    intermdeiatBufferCount = 3;
    inFrameStatus = InFrameStatus.outOfFrame;

    numberToShow: Observable<any>;


    constructor(exerciseDelegate: ExerciseControllerDelegate, exercise: Exercise) {
        this.exerciseDelegate = exerciseDelegate;
        this.exercise = exercise;
        this.parameterArray = ExerciseUtilities.createListOfParameters(exercise);
        this.landmarkArray = ExerciseUtilities.createListOfLandmarks(this.parameterArray);
    }

    public handlePose = (pose: PoseLandmark[], deviceAngle: number) => {

        // console.log('Parameter Array: ', this.parameterArray);


        //Calculate all required Angles
        const results = ExerciseUtilities.calculateParameterAngles(this.parameterArray, pose, deviceAngle, (text) => {
            // this.exerciseDelegate.sendMessage(text);
            // console.log(text);
        });
        // this.exerciseDelegate.sendMessage(`${this.parameterArray.length}`);

        // this.exerciseDelegate.sendMessage(`${results.get(this.parameterArray[0])}`);


        // console.log('Results: ', results);
        //determine if a global parameter was broken
        for (const aParam of this.exercise.globalParameters) {
            //get param from results dict

            if (results.has(aParam)) {
                const lookupParam = results.get(aParam);
                if (!lookupParam) {

                    //A param was broken
                    this.globalParamBroken(aParam);

                }
            } else {
                console.log('ERROR!!!! in checking global parameters');
            }
        }

        //Determine if all required nodes are in frame
        const inFrameDict = ExerciseUtilities.landmarksInFrame(this.landmarkArray, pose);
        let outOfFrame = 0;

        for (const inFrameProb of inFrameDict.values()) {
            if (inFrameProb < this.inFrameThreshold) {
                outOfFrame += 1;
            }
        }

        if (outOfFrame < 1) {
            this.inFrameStatus = InFrameStatus.inFrame;
        } else if (outOfFrame > 1 && outOfFrame < this.intermdeiatBufferCount) {
            this.inFrameStatus = InFrameStatus.intermediateFrame;
        } else {
            this.inFrameStatus = InFrameStatus.outOfFrame;
        }

        //determine if a pose was detected
        let recognizedPosition: Position | null;
        for (const aPose of this.exercise.positions) {
            let inParams = true;
            for (const poseParam of aPose.positionParameters) {
                if (inParams) {

                    //get param from results dict
                    if (results.has(poseParam)) {
                        const lookup = results.get(poseParam);
                        inParams = lookup;
                    } else {
                        console.log('ERROR!!!! in checking for poses');
                    }
                } else {
                    break;
                }
            }

            if (inParams) {
                //A position was recognized
                console.log('POSITION WAS RECOGNIZED');
                recognizedPosition = aPose;
            } else {
            }
        }
        //            print(recognizedPosition)
        if (this.exercise.isIsometric) {
            this.handlePositionIsometric((recognizedPosition !== null));
        } else if (recognizedPosition) {
            // this.exerciseDelegate.sendMessage(`${recognizedPosition.name}`);
            this.positionWasDetected(recognizedPosition);
        }
    };

    private completedRep(inOrder: boolean, allPositions: boolean) {
        const brokenGlobal = this.brokenParamStack.length > 0;

        let isGoodRep = false;
        if (inOrder && allPositions && !brokenGlobal) {
            console.log('Completed a rep');
            //            print("COMPLETED ALL POSITIONS IN ORDER!!!")
            isGoodRep = true;
        } else {
            //            print("COMPLETED A BAD REP")
        }

        this.repStack.push(new RepRecord(isGoodRep, inOrder, allPositions, this.brokenParamStack, new Date(), null));
        this.exerciseDelegate.repWasCompleted(this.repStack);
        this.positionStack = [];
        this.brokenParamStack = [];
    }

    private handlePositionIsometric(inPosition: boolean) {

        //If in position
        if (inPosition) {

            //Check if started
            if (!this.started) {
                this.exerciseDelegate.startPositionDetected();
                this.started = true;
            }

            if (this.isometricStartTime === null) {
                this.isometricStartTime = new Date();
                //                print("Started timer")
                if (this.isometricTimeStack.size === 0) {
                    this.isometricExerciseHasStarted = true;
                }
                if (this.isometricGraceStartTime !== null) {
                    this.isometricGraceStack.set(this.isometricGraceStartTime, new Date());
                    this.isometricGraceStartTime = null;
                    //                    print("Ended Grace Timer")
                    //Calculate total grace time
                    //                    let totalGrace = calculateTotalTime(timeStack: isometricGraceStack)
                }
            }
        }

        //Out of position
        else {
            if (this.isometricExerciseHasStarted) { //Exercise has officially started
                if (this.isometricGraceStartTime === null) {
                    this.isometricGraceStartTime = new Date();
                    //                    print("Started Grace Timer")
                    if (this.isometricStartTime !== null) {
                        this.isometricTimeStack.set(this.isometricStartTime, new Date());
                        this.isometricStartTime = null;
                        //                        print("Ended Timer")
                    }
                } else {
                    //                    print("Total grace: \(tempTotalGrace)")
                }
            }
        }
        this.brokenParamStack = [];
    }

    private positionWasDetected(position: Position) {
        //Logic for determining the order of positions and whether they constitute a complete rep
        //        print("\(position.name) was detected")

        //Check if it has met its buffer requirement
        if (this.positionStackBuffer.has(position)) {
            const buffCount = this.positionStackBuffer.get(position);
            if (buffCount >= this.positionStackBufferCount) {
                //Meets the buffer
                this.positionStackBuffer.set(position, 0);
            } else {
                this.positionStackBuffer.set(position, buffCount + 1);
                return;
            }
        } else {
            this.positionStackBuffer.set(position, 1);
            return;
        }

        //If position is not index 0, its an intermediate position
        const posIndex = this.exercise.positions.findIndex((value) => value.name === position.name);

        if (posIndex > 0) {
            //Add it to the stack if it doesn't exist
            if (!this.positionStack.includes(position)) {
                this.positionStack.push(position);
            }
        }


        //Position index is 0, i.e. it's the start position
        else if (posIndex === 0) {
            if (!this.started && this.brokenParamStack.length === 0) {

                //Recognize start position
                this.exerciseDelegate.startPositionDetected();
                this.started = true;

            }

            else if (this.started) {
                if (this.positionStack.length === 0) { return; }

                //Check to see if all other positions were completed
                if (this.positionStack.length === (this.exercise.positions.length) - 1) {
                    //All positions were completed

                    //Check to see if they were done in order
                    let inOrder = true;
                    let index = 0;

                    while (this.exercise.positions.length > index + 1 && inOrder) {
                        if (this.exercise.positions[index + 1] === this.positionStack[index] && inOrder) {
                            index = index + 1;
                        } else {
                            inOrder = false;
                        }
                    }

                    this.completedRep(inOrder, true);
                }

                else {
                    //Didn't complete all intermediate positions BUT you are back in the starting position = bad rep
                    this.completedRep(false, false);
                }
            }
        }

        if (!this.started) {
            this.brokenParamStack = [];
        }
    }

    private globalParamBroken(param: Parameter) {

        if (this.brokenParamStack.includes(param)) {
            if (this.brokenParamStackBuffer.has(param)) {
                // if let buffCount = this.brokenParamStackBuffer[param] {
                const buffCount = this.brokenParamStackBuffer.get(param);
                if (buffCount >= this.brokenParamStackBufferCount) {
                    //                    print("BROKEN GLOBAL PARAM")
                    // brokenParamStack.append(param)
                    this.brokenParamStack.push(param);
                    this.brokenParamStackBuffer.set(param, 0);
                } else {
                    this.brokenParamStackBuffer.set(param, buffCount + 1);

                }
            } else {
                this.brokenParamStackBuffer.set(param, 1);
            }
        }
    }
}



export class ExerciseUtilities {

    static defineJointParams(joint: Joint): LandmarkType[] {

        switch (joint) {
            case Joint.leftElbow:
                return [LandmarkType.leftShoulder, LandmarkType.leftElbow, LandmarkType.leftWrist];
            case Joint.rightElbow:
                return [LandmarkType.rightShoulder, LandmarkType.rightElbow, LandmarkType.rightWrist];
            case Joint.leftHip:
                return [LandmarkType.leftKnee, LandmarkType.leftHip, LandmarkType.leftShoulder];
            case Joint.rightHip:
                return [LandmarkType.rightKnee, LandmarkType.rightHip, LandmarkType.rightShoulder];
            case Joint.leftKnee:
                return [LandmarkType.leftAnkle, LandmarkType.leftKnee, LandmarkType.leftHip];
            case Joint.rightKnee:
                return [LandmarkType.rightAnkle, LandmarkType.rightKnee, LandmarkType.leftHip];
            case Joint.leftShoulderHip:
                return [LandmarkType.leftElbow, LandmarkType.leftShoulder, LandmarkType.leftHip];
            case Joint.rightShoulderHip:
                return [LandmarkType.rightElbow, LandmarkType.rightShoulder, LandmarkType.rightHip];
            case Joint.leftShoulderChest:
                return [LandmarkType.leftElbow, LandmarkType.leftShoulder, LandmarkType.rightShoulder];
            case Joint.rightShoulderChest:
                return [LandmarkType.rightElbow, LandmarkType.rightShoulder, LandmarkType.leftShoulder];
        }
    }


    static angle(firstLandmark: PoseLandmark, midLandmark: PoseLandmark, lastLandmark: PoseLandmark): number | null {
        const targetLikelihood = 0.8;
        if (firstLandmark.inFrameLikelihood < targetLikelihood ||
            midLandmark.inFrameLikelihood < targetLikelihood || lastLandmark.inFrameLikelihood < targetLikelihood) {
            return null;
        }
        const radians: number = Math.atan2(lastLandmark.position.y - midLandmark.position.y,
            lastLandmark.position.x - midLandmark.position.x) - Math.atan2(firstLandmark.position.y - midLandmark.position.y,
                firstLandmark.position.x - midLandmark.position.x);
        let degrees = radians * 180.0 / Math.PI;
        degrees = Math.abs(degrees); // Angle should never be negative
        if (degrees > 180.0) {
            degrees = 360.0 - degrees; // Always get the acute representation of the angle
        }
        return degrees;
    }

    static calculatePlaneAngle(startLandmark: PoseLandmark,
        endLandmark: PoseLandmark,
        plane: ReferencePlane, deviceAngle: number) {

        const targetLikelihood = 0.8;

        if (startLandmark.inFrameLikelihood < targetLikelihood || endLandmark.inFrameLikelihood < targetLikelihood) {
            return null;
        }


        const radians: number = Math.atan2(1.0, 0.0) - Math.atan2(startLandmark.position.y - endLandmark.position.y,
            startLandmark.position.x - endLandmark.position.x);

        let degrees = radians * 180.0 / Math.PI;

        if (degrees < 0) {
            degrees = 360 + degrees;
        }

        degrees = degrees - 90;

        if (degrees < 0) {
            degrees = 360 + degrees;
        }

        degrees = degrees + deviceAngle;

        if (degrees > 360) {
            degrees = degrees - 360;
        }

        if (degrees > 180) {
            degrees = 360 - degrees;
        }

        if (plane === ReferencePlane.xAxis) {
            if (degrees <= 90) {
                degrees = 90 - degrees;
            } else {
                degrees = -(degrees - 90);
            }
        }
        //        print("Angle: \(degrees)")
        return degrees;
    }

    static landmarksInFrame(landmarks: LandmarkType[], poses: PoseLandmark[]): Map<LandmarkType, number> {
        // let pose = poses[0]
        const workingDict = new Map<LandmarkType, number>();

        // console.log('Landmarks: ', landmarks);
        for (const landmarkType of landmarks) {
            const landmarkData = getPoseLandmark(landmarkType, poses);
            // console.log('Landmark Data: ', landmarkData);
            const inFrame = landmarkData.inFrameLikelihood;
            workingDict.set(landmarkType, inFrame);

        }

        return workingDict;
    }

    static createListOfLandmarks(parameters: Parameter[]): LandmarkType[] {

        // console.log("Start Parameters: ", parameters)
        //For each parameter
        const joints: LandmarkType[] = [];

        for (const parameter of parameters) {

            if (parameter.isLeftAndRight || parameter.isAverageOfLeftAndRight) {
                //Get both sides

                if (parameter.type === ParameterType.jointAngle) {

                    //Joint Angle has three joints
                    joints.concat(ExerciseUtilities.defineJointParams(parameter.joint));
                    joints.concat(ExerciseUtilities.defineJointParams(Parameter.getCorrespondingJoint(parameter.joint)));

                } else {
                    //Plane Angle has two joints
                    joints.push(parameter.startLandmarkForSegment);
                    joints.push(parameter.endLandmarkForSegment);
                    joints.push(Parameter.getCorrespondingLandmarkType(parameter.startLandmarkForSegment));
                    joints.push(Parameter.getCorrespondingLandmarkType(parameter.endLandmarkForSegment));
                }

            }

            else {
                console.log('ASDF: ', parameter);

                //Get only one side
                if (parameter.type === ParameterType.jointAngle) {
                    //Joint Angle has three joints
                    const calcJoints = ExerciseUtilities.defineJointParams(parameter.joint);
                    // console.log('jointAngle: ', calcJoints);
                    joints.push(...calcJoints);

                } else {
                    // console.log('planeAngles: ',);
                    //Plane Angle has two joints
                    joints.push(parameter.startLandmarkForSegment);
                    joints.push(parameter.endLandmarkForSegment);
                }
            }
        }

        //Remove duplicates
        // console.log('jts', [...new Set(joints)]);
        return [...new Set(joints)];
    }

    static createListOfParameters(exercise: Exercise): Parameter[] {
        const parameterList: Parameter[] = [];
        for (const position of exercise.positions) {
            for (const aparameter of position.positionParameters) {
                //Check if it already exists in array
                if (!parameterList.includes(aparameter)) {
                    parameterList.push(aparameter);
                }
            }
        }

        for (const gparameter of exercise.globalParameters) {
            if (!parameterList.includes(gparameter)) {
                parameterList.push(gparameter);
            }
        }
        return parameterList;
    }

    static calculateParameterAngles(parameters: Parameter[],
        poses: PoseLandmark[],
        deviceYAngle: number,
        log: (text: string) => void): Map<Parameter, boolean> { //{ parameter: Parameter; inParams: boolean }[]

        // var results: { [landmarkType: Parameter]: boolean } = {}
        // let results: { parameter: Parameter; inParams: boolean }[];
        const results = new Map<Parameter, boolean>();

        // let pose = poses[0]

        for (const parameter of parameters) {
            //Parameter is a jointAngle
            if (parameter.type === ParameterType.jointAngle) {
                //Is both joints
                if (parameter.isAverageOfLeftAndRight || parameter.isLeftAndRight) {
                    const params = ExerciseUtilities.defineJointParams(parameter.joint);
                    const angle = ExerciseUtilities.angle(getPoseLandmark(params[0], poses),
                        getPoseLandmark(params[1], poses), getPoseLandmark(params[2], poses));

                    const cparams = ExerciseUtilities.defineJointParams(Parameter.getCorrespondingJoint(parameter.joint));
                    const cangle = ExerciseUtilities.angle(getPoseLandmark(cparams[0], poses),
                        getPoseLandmark(cparams[1], poses), getPoseLandmark(cparams[2], poses));

                    if (angle === null || cangle == null) {

                        // results.push({ parameter, inParams: false });
                        results.set(parameter, false);
                        // results[parameter] = false
                        continue;
                    }

                    //Is average
                    if (parameter.isAverageOfLeftAndRight) {
                        const average = (angle + cangle) / 2;
                        const aResult = (average >= parameter.minimumAngle && average <= parameter.maximumAngle);
                        // results.push({ parameter, inParams: aResult });
                        results.set(parameter, aResult);

                        // results[parameter] = Float(average) >= parameter.minimumAngle && Float(average) <= parameter.maximumAngle
                    }
                    //Is both
                    else if (parameter.isLeftAndRight) {
                        // results[parameter] = Float(angle!) >= parameter.minimumAngle &&
                        // Float(angle!) <= parameter.maximumAngle &&
                        //  Float(cangle!) >= parameter.minimumAngle && Float(cangle!) <= parameter.maximumAngle
                        const aResult = (angle >= parameter.minimumAngle &&
                            angle <= parameter.maximumAngle &&
                            cangle >= parameter.minimumAngle && cangle <= parameter.maximumAngle);

                        // results.push({ parameter, inParams: aResult });
                        results.set(parameter, aResult);


                    } else if (parameter.isLeftOrRight) {
                        // results[parameter] = Float(angle!) >= parameter.minimumAngle &&
                        // Float(angle!) <= parameter.maximumAngle || Float(cangle!) >= parameter.minimumAngle &&
                        //  Float(cangle!) <= parameter.maximumAngle
                        const aResult = (angle >= parameter.minimumAngle &&
                            angle <= parameter.maximumAngle || cangle >= parameter.minimumAngle &&
                            cangle <= parameter.maximumAngle);
                        // results.push({ parameter, inParams: aResult });
                        // this.exerciseDelegate.sendNumber(aResult);
                        results.set(parameter, aResult);

                    }
                }

                //Is single joint
                else {
                    const params = ExerciseUtilities.defineJointParams(parameter.joint);
                    const angle = ExerciseUtilities.angle(getPoseLandmark(params[0], poses),
                        getPoseLandmark(params[1], poses), getPoseLandmark(params[2], poses));

                    if (angle === null) {
                        // results.push({ parameter, inParams: false });
                        results.set(parameter, false);

                        // results[parameter] = false
                        continue;
                    }
                    const aResult = angle >= parameter.minimumAngle && angle <= parameter.maximumAngle;
                    // results.push({ parameter, inParams: aResult });
                    results.set(parameter, aResult);

                    // results[parameter] = Float(angle!) >= parameter.minimumAngle && Float(angle!) <= parameter.maximumAngle
                }
            }

            //Parameter is a planeAngle
            if (parameter.type === ParameterType.planeAngle) {
                //Is both sides

                const firstAngle = ExerciseUtilities.calculatePlaneAngle(getPoseLandmark(parameter.startLandmarkForSegment, poses),
                    getPoseLandmark(parameter.endLandmarkForSegment, poses), parameter.referencePlane, deviceYAngle);
                log(`${firstAngle}`);


                if (firstAngle === null) {
                    // results.push({ parameter, inParams: false });
                    results.set(parameter, false);

                    // results[parameter] = false
                    continue;
                }

                if (parameter.isAverageOfLeftAndRight || parameter.isLeftAndRight) {

                    const secondAngle = ExerciseUtilities.calculatePlaneAngle(
                        getPoseLandmark(Parameter.getCorrespondingLandmarkType(parameter.startLandmarkForSegment), poses),
                        getPoseLandmark(Parameter.getCorrespondingLandmarkType(parameter.endLandmarkForSegment), poses),
                        parameter.referencePlane, deviceYAngle);

                    if (secondAngle === null) {
                        // results.push({ parameter, inParams: false });
                        results.set(parameter, false);

                        // results[parameter] = false
                        continue;
                    }

                    //Is average of left and right
                    if (parameter.isAverageOfLeftAndRight) {
                        const average = (firstAngle + secondAngle) / 2;
                        // results[parameter] = Float(average) >= parameter.minimumAngle && Float(average) <= parameter.maximumAngle
                        const aResult = (average >= parameter.minimumAngle && average <= parameter.maximumAngle);
                        // results.push({ parameter, inParams: aResult });
                        results.set(parameter, aResult);

                    }

                    //Is Both
                    else if (parameter.isLeftAndRight) {
                        // results[parameter] = Float(firstAngle!) >= parameter.minimumAngle &&
                        // Float(firstAngle!) <= parameter.maximumAngle && Float(secondAngle!) >= parameter.minimumAngle &&
                        // Float(secondAngle!) <= parameter.maximumAngle
                        const aResult = (firstAngle >= parameter.minimumAngle &&
                            firstAngle <= parameter.maximumAngle &&
                            secondAngle >= parameter.minimumAngle &&
                            secondAngle <= parameter.maximumAngle);

                        // results.push({ parameter, inParams: aResult });
                        results.set(parameter, aResult);


                    } else if (parameter.isLeftOrRight) {
                        const aResult = (firstAngle >= parameter.minimumAngle &&
                            firstAngle <= parameter.maximumAngle || secondAngle >= parameter.minimumAngle &&
                            secondAngle <= parameter.maximumAngle);

                        // results.push({ parameter, inParams: aResult });
                        results.set(parameter, aResult);

                    }
                }

                //Is only one side
                else {
                    const aResult = (firstAngle >= parameter.minimumAngle && firstAngle <= parameter.maximumAngle);
                    // results.push({ parameter, inParams: aResult });
                    results.set(parameter, aResult);

                }
            }
        }
        return results;
    }
}






