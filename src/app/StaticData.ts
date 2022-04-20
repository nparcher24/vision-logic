import { Exercise, Joint, LandmarkType, Parameter, ParameterType, Position } from './CustomTypes';

export const testExercise = new Exercise('Test', 'description', [new Position('up',
    [new Parameter(ParameterType.planeAngle, 150, 180, '', LandmarkType.leftShoulder, LandmarkType.leftElbow, null)]),
new Position('down', [new Parameter(ParameterType.planeAngle, 0, 90, '', LandmarkType.leftShoulder, LandmarkType.rightShoulder, null)])],
    [new Parameter(ParameterType.jointAngle, 0, 90, '', null, null, Joint.leftElbow)], '', '');
