/* WASM variables */
declare var frameMillis : number;
declare var debugMode : boolean;

declare var pingType: number;
declare var candidateType : number;
declare var offerType : number;
declare var answerType : number;
declare var voiceCandidateType : number;

declare var voiceOfferType : number;
declare var voiceAnswerType : number;
declare var initType : number;
declare var joinType : number;
declare var leftType : number;

declare var initVoiceType : number;
declare var joinVoiceType : number;
declare var leftVoiceType : number;
declare var chatType : number;
declare var keyType : number;

declare var gameStateType : number;
declare var gameUpdateType : number;
declare var playerInitType : number;
declare var playerJoinType : number;
declare var levelInitType : number;

declare var objectInitType : number;

declare var playerSpace : number;
declare var wallSpace : number;
declare var bombSpace : number;
declare var rocketSpace : number;
declare var explosionSpace : number;

declare var burstShotType : number;
declare var bombShotType : number;
declare var rocketShotType : number;

declare var deletedProp : number;
declare var dimProp : number;
declare var keysProp : number;
declare var posProp : number;
declare var endPosProp : number;
declare var velProp : number;
declare var extVelProp : number;
declare var accProp : number;
declare var dirProp : number;
declare var healthProp : number;
declare var solidProp : number;
declare var groundedProp : number;
declare var hitsProp : number;
declare var weaponDirProp : number;

declare var profileDimProp : number;
declare var profilePosProp : number;
declare var profilePointsProp : number;

declare var upKey : number;
declare var downKey : number;
declare var leftKey : number;
declare var rightKey : number;
declare var dashKey : number;
declare var mouseClick : number;
declare var altMouseClick : number;

/* WASM API */
declare var wasmAdd : any;
declare var wasmHas : any;
declare var wasmDelete : any;
declare var wasmUpdateKeys : any;
declare var wasmGetData : any;
declare var wasmSetData : any;
declare var wasmLoadLevel : any;
declare var wasmUpdateState : any;