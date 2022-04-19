import { Exercise, getPoseLandmark, Joint, LandmarkType, Parameter, ParameterType, PoseLandmark, ReferencePlane } from './CustomTypes';

class ExerciseUtilities {
    // var exerciseController: ExerciseController?


    // landmarksInFrame(landmarks: LandmarkType[], poses: PoseLandmark[]): { [landmarkType: LandmarkType]: number } {
    //     let pose = poses[0]
    //     var workingDict: { [landmarkType: LandmarkType]: number } = {};

    //     for (var landmarkType in landmarks) {
    //         let landmarkData = pose.landmark(ofType: landmarkType)
    //         let inFrame = landmarkData.inFrameLikelihood
    //         workingDict[landmarkType] = inFrame
    //     }


    //     return workingDict
    // }


    // let lookupDict: { [Joint]: LandmarkType[] } = [.LeftElbow: [.leftShoulder, .leftElbow, .leftWrist],
    // .RightElbow: [.rightShoulder, .rightElbow, .rightWrist],
    // .LeftHip: [.leftKnee, .leftHip, .leftShoulder],
    // .RightHip: [.rightKnee, .rightHip, .rightShoulder],
    // .LeftKnee: [.leftAnkle, .leftKnee, .leftHip],
    // .RightKnee: [.rightAnkle, .rightKnee, .rightHip],
    // .LeftShoulderHip: [.leftElbow, .leftShoulder, .leftHip],
    // .RightShoulderHip: [.rightElbow, .rightShoulder, .rightHip],
    // .LeftShoulderChest: [.leftElbow, .leftShoulder, .rightShoulder],
    // .RightShoulderChest: [.rightElbow, .rightShoulder, .leftShoulder]]





    static defineJointParams(joint: Joint): LandmarkType[] {

        switch (joint) {
            case Joint.leftElbow:
                return [LandmarkType.rightShoulder, LandmarkType.rightElbow, LandmarkType.rightWrist];
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
        plane: ReferencePlane, deviceAngle: number): number | null {

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



    static createListOfLandmarks(parameters: Parameter[]): LandmarkType[] {
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
                //Get only one side
                if (parameter.type === ParameterType.jointAngle) {
                    //Joint Angle has three joints
                    joints.concat(ExerciseUtilities.defineJointParams(parameter.joint));

                } else {
                    //Plane Angle has two joints
                    joints.push(parameter.startLandmarkForSegment);
                    joints.push(parameter.endLandmarkForSegment);
                }
            }
        }

        //Remove duplicates
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
        rawDeviceAngle: number, poses: PoseLandmark[],
        deviceYAngle: number): { parameter: Parameter; inParams: boolean }[] {

        // var results: { [landmarkType: Parameter]: boolean } = {}
        let results: { parameter: Parameter; inParams: boolean }[];

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

                        results.push({ parameter, inParams: false });
                        // results[parameter] = false
                        continue;
                    }

                    //Is average
                    if (parameter.isAverageOfLeftAndRight) {
                        const average = (angle + cangle) / 2;
                        const aResult = (average >= parameter.minimumAngle && average <= parameter.maximumAngle);
                        results.push({ parameter, inParams: aResult });
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

                        results.push({ parameter, inParams: aResult });

                    } else if (parameter.isLeftOrRight) {
                        // results[parameter] = Float(angle!) >= parameter.minimumAngle &&
                        // Float(angle!) <= parameter.maximumAngle || Float(cangle!) >= parameter.minimumAngle &&
                        //  Float(cangle!) <= parameter.maximumAngle
                        const aResult = (angle >= parameter.minimumAngle &&
                            angle <= parameter.maximumAngle || cangle >= parameter.minimumAngle &&
                            cangle <= parameter.maximumAngle);
                        results.push({ parameter, inParams: aResult });
                    }
                }

                //Is single joint
                else {
                    const params = ExerciseUtilities.defineJointParams(parameter.joint);
                    const angle = ExerciseUtilities.angle(getPoseLandmark(params[0], poses),
                        getPoseLandmark(params[1], poses), getPoseLandmark(params[2], poses));

                    if (angle === null) {
                        results.push({ parameter, inParams: false });
                        // results[parameter] = false
                        continue;
                    }
                    const aResult = angle >= parameter.minimumAngle && angle <= parameter.maximumAngle;
                    results.push({ parameter, inParams: aResult });
                    // results[parameter] = Float(angle!) >= parameter.minimumAngle && Float(angle!) <= parameter.maximumAngle
                }
            }

            //Parameter is a planeAngle
            if (parameter.type === ParameterType.planeAngle) {
                //Is both sides

                const firstAngle = ExerciseUtilities.calculatePlaneAngle(getPoseLandmark(parameter.startLandmarkForSegment, poses),
                    getPoseLandmark(parameter.endLandmarkForSegment, poses), parameter.referencePlane, deviceYAngle);

                if (firstAngle === null) {
                    results.push({ parameter, inParams: false });
                    // results[parameter] = false
                    continue;
                }

                if (parameter.isAverageOfLeftAndRight || parameter.isLeftAndRight) {

                    const secondAngle = ExerciseUtilities.calculatePlaneAngle(
                        getPoseLandmark(Parameter.getCorrespondingLandmarkType(parameter.startLandmarkForSegment), poses),
                        getPoseLandmark(Parameter.getCorrespondingLandmarkType(parameter.endLandmarkForSegment), poses),
                        parameter.referencePlane, deviceYAngle);

                    if (secondAngle === null) {
                        results.push({ parameter, inParams: false });
                        // results[parameter] = false
                        continue;
                    }

                    //Is average of left and right
                    if (parameter.isAverageOfLeftAndRight) {
                        const average = (firstAngle + secondAngle) / 2;
                        // results[parameter] = Float(average) >= parameter.minimumAngle && Float(average) <= parameter.maximumAngle
                        const aResult = (average >= parameter.minimumAngle && average <= parameter.maximumAngle);
                        results.push({ parameter, inParams: aResult });
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

                        results.push({ parameter, inParams: aResult });

                    } else if (parameter.isLeftOrRight) {
                        const aResult = (firstAngle >= parameter.minimumAngle &&
                            firstAngle <= parameter.maximumAngle || secondAngle >= parameter.minimumAngle &&
                            secondAngle <= parameter.maximumAngle);

                        results.push({ parameter, inParams: aResult });
                    }
                }

                //Is only one side
                else {
                    const aResult = (firstAngle >= parameter.minimumAngle && firstAngle <= parameter.maximumAngle);
                    results.push({ parameter, inParams: aResult });
                }
            }
        }
        return results;
    }
}






