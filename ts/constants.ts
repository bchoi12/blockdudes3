const dev : boolean = location.hostname === "localhost" || location.hostname === "127.0.0.1";

/* WASM variables */
declare var frameMillis : number;

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
declare var playerInitType : number;
declare var playerJoinType : number;
declare var levelInitType : number;
declare var objectInitType : number;

declare var playerSpace : number;
declare var wallSpace : number;
declare var bombSpace : number;
declare var explosionSpace : number;

declare var spaceProp : number;
declare var dimProp : number;
declare var keysProp : number;
declare var posProp : number;
declare var velProp : number;
declare var extVelProp : number;
declare var accProp : number;
declare var dirProp : number;
declare var healthProp : number;

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
declare var wasmSetData : any;
declare var wasmLoadLevel : any;
declare var wasmUpdateState : any;