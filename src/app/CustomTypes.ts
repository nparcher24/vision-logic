
export interface PoseLandmark {
    type: LandmarkType;
    position: {
        x: number;
        y: number;
        z: number;
    };
    inFrameLikelihood: number;
}

export const getPoseLandmark = (type: LandmarkType, pose: PoseLandmark[]) => {
    const found = pose.find(landmark => (landmark.type === type));
    return found;
};

export enum LandmarkType {
    nose = 'Nose',
    mouthLeft = 'MouthLeft',
    rightAnkle = 'RightAnkle',
    rightKnee = 'RightKnee',
    leftKnee = 'LeftKnee',
    rightWrist = 'RightWrist',
    leftEyeOuter = 'LeftEyeOuter',
    leftElbow = 'LeftElbow',
    leftHeel = 'LeftHeel',
    rightElbow = 'RightElbow',
    leftAnkle = 'LeftAnkle',
    rightIndexFinger = 'RightIndexFinger',
    leftEar = 'LeftEar',
    leftEye = 'LeftEye',
    leftPinkyFinger = 'LeftPinkyFinger',
    leftEyeInner = 'LeftEyeInner',
    rightEar = 'RightEar',
    rightEyeOuter = 'RightEyeOuter',
    rightEyeInner = 'RightEyeInner',
    rightThumb = 'RightThumb',
    leftIndexFinger = 'LeftIndexFinger',
    leftThumb = 'LeftThumb',
    rightHip = 'RightHip',
    rightPinkyFinger = 'RightPinkyFinger',
    leftToe = 'LeftToe',
    rightToe = 'RightToe',
    leftHip = 'LeftHip',
    rightEye = 'RightEye',
    mouthRight = 'MouthRight',
    leftWrist = 'LeftWrist',
    leftShoulder = 'LeftShoulder',
    rightHeel = 'RightHeel',
    rightShoulder = 'RightShoulder'
}

export class Position {
    name: string;
    positionParameters: Parameter[];

    constructor(name: string, params: Parameter[]) {
        this.name = name;
        this.positionParameters = params;
    }
}


export class Parameter {
    type: ParameterType;
    isAverageOfLeftAndRight = false;
    isLeftAndRight = false;
    isLeftOrRight = false;
    joint?: Joint;
    startLandmarkForSegment?: LandmarkType;
    endLandmarkForSegment?: LandmarkType;
    minimumAngle: number;
    maximumAngle: number;
    angleInPlane?: [string, number];
    referencePlane?: ReferencePlane;
    isGlobalParameter = false;
    side?: SideOfBody;
    audioDescription: string;

    constructor(type: ParameterType, minAngle: number, maxAngle: number, audioDescription: string) {
        this.type = type;
        this.minimumAngle = minAngle;
        this.maximumAngle = maxAngle;
        this.audioDescription = audioDescription;
    }

    static getCorrespondingJoint(aJoint: Joint): Joint {
        switch (aJoint) {
            case Joint.rightElbow: return Joint.leftElbow;
            case Joint.leftElbow: return Joint.rightElbow;
            case Joint.rightShoulderChest: return Joint.leftShoulderChest;
            case Joint.leftShoulderChest: return Joint.rightShoulderChest;
            case Joint.rightShoulderHip: return Joint.leftShoulderHip;
            case Joint.leftShoulderHip: return Joint.rightShoulderHip;
            case Joint.rightHip: return Joint.leftHip;
            case Joint.leftHip: return Joint.rightHip;
            case Joint.rightKnee: return Joint.leftKnee;
            case Joint.leftKnee: return Joint.rightKnee;
        }
    }

    static getCorrespondingJointAngle(jointAngle: Joint): LandmarkType {
        switch (jointAngle) {
            case Joint.rightElbow: return LandmarkType.rightElbow;
            case Joint.leftElbow: return LandmarkType.leftElbow;
            case Joint.leftShoulderChest: return LandmarkType.leftShoulder;
            case Joint.rightShoulderChest: return LandmarkType.rightShoulder;
            case Joint.leftShoulderHip: return LandmarkType.leftShoulder;
            case Joint.rightShoulderHip: return LandmarkType.rightShoulder;
            case Joint.rightHip: return LandmarkType.rightHip;
            case Joint.leftHip: return LandmarkType.leftHip;
            case Joint.rightKnee: return LandmarkType.rightKnee;
            case Joint.leftKnee: return LandmarkType.leftKnee;
            case Joint.leftKnuckle: return LandmarkType.leftIndexFinger;
            case Joint.rightKnuckle: return LandmarkType.rightIndexFinger;
        }
    }

    static getCorrespondingLandmarkType(landmark: LandmarkType): LandmarkType {
        switch (landmark) {
            case LandmarkType.leftWrist: return LandmarkType.rightWrist;
            case LandmarkType.rightWrist: return LandmarkType.leftWrist;
            case LandmarkType.rightElbow: return LandmarkType.leftElbow;
            case LandmarkType.leftElbow: return LandmarkType.rightElbow;
            case LandmarkType.leftShoulder: return LandmarkType.rightShoulder;
            case LandmarkType.rightShoulder: return LandmarkType.leftShoulder;
            case LandmarkType.leftHip: return LandmarkType.rightHip;
            case LandmarkType.rightHip: return LandmarkType.leftHip;
            case LandmarkType.leftKnee: return LandmarkType.rightKnee;
            case LandmarkType.rightKnee: return LandmarkType.leftKnee;
            case LandmarkType.leftAnkle: return LandmarkType.rightAnkle;
            case LandmarkType.rightAnkle: return LandmarkType.leftAnkle;
            case LandmarkType.leftIndexFinger: return LandmarkType.rightIndexFinger;
            case LandmarkType.rightIndexFinger: return LandmarkType.leftIndexFinger;
            case LandmarkType.leftToe: return LandmarkType.rightToe;
            case LandmarkType.rightToe: return LandmarkType.leftToe;
            case LandmarkType.rightHeel: return LandmarkType.leftHeel;
            case LandmarkType.leftHeel: return LandmarkType.rightHeel;
        }
    }
}


export class Exercise {

    name: string;
    description: string;
    isIsometric = false;
    isometricGraceTime = 0;
    timeLimit?: number;
    positions: Position[];
    globalParameters: Parameter[];
    imageAssetName: string;
    pictureName: string;
    isRun = false;
    runDistance?: number;
    tips?: string[];
    gifURL?: string;

    constructor(name: string, description: string,
        positions: Position[], globalParameters: Parameter[],
        imageAssetName: string, pictureName: string) {
        this.name = name;
        this.description = description;
        this.positions = positions;
        this.globalParameters = globalParameters;
        this.imageAssetName = imageAssetName;
        this.pictureName = pictureName;
    }
}


export enum ReferencePlane {
    xAxis = 'X',
    yAxis = 'Y'
}

export enum SideOfBody {
    left = 'Left',
    right = 'Right'
}

export enum ParameterType {
    jointAngle = 'jointAngle',
    planeAngle = 'planeAngle'
}

export enum Joint {
    rightElbow = 'RightElbow',
    leftElbow = 'LeftElbow',
    rightShoulderChest = 'RightShoulderChest',
    leftShoulderChest = 'LeftShoulderChest',
    rightShoulderHip = 'RightShoulderHip',
    leftShoulderHip = 'LeftShoulderHip',
    rightHip = 'RightHip',
    leftHip = 'LeftHip',
    rightKnee = 'RightKnee',
    leftKnee = 'LeftKnee',
    leftKnuckle = 'LeftKnuckle',
    rightKnuckle = 'RightKnuckle'
}





