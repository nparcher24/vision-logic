import { Exercise, Joint, LandmarkType, Parameter, ParameterType, Position, ReferencePlane } from './CustomTypes';

export const testExercise = new Exercise('Test',
    'description', [
    new Position('up',
        [
            new Parameter(ParameterType.planeAngle, false, false, true, false, '', 90, 180, null, null, LandmarkType.leftShoulder,
                LandmarkType.leftElbow, ReferencePlane.yAxis, null)
        ]),
    new Position('down',
        [
            new Parameter(ParameterType.planeAngle, false, false, true, false, '', 0, 60, null, null, LandmarkType.leftShoulder,
                LandmarkType.leftElbow, ReferencePlane.yAxis, null)
            //new Parameter(ParameterType.planeAngle, 0, 90, '', LandmarkType.leftShoulder, LandmarkType.rightShoulder, null)
        ])],
    [
        new Parameter(ParameterType.jointAngle, false, false, true, true, 'left elbow angle'
            , 0, 90, null, Joint.leftElbow, null, null, null, null)
        //new Parameter(ParameterType.jointAngle, 0, 90, '', null, null, Joint.leftElbow)
    ],
    '',
    '');
