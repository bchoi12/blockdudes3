/* WASM variables */
declare var frameMillis : number;
declare var wasmVersion : number;

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

declare var objectDataType : number;
declare var objectUpdateType : number;
declare var playerInitType : number;
declare var levelInitType : number;

declare var playerSpace : number;
declare var blockSpace : number;
declare var wallSpace : number;
declare var lightSpace : number;
declare var explosionSpace : number;
declare var weaponSpace : number;
declare var bombSpace : number;
declare var pelletSpace : number;
declare var boltSpace : number;
declare var rocketSpace : number;
declare var starSpace : number;
declare var grapplingHookSpace : number;
declare var pickupSpace : number;

declare var initializedProp : number;
declare var deletedProp : number;

declare var attributesProp : number;
declare var byteAttributesProp : number;
declare var intAttributesProp : number;
declare var floatAttributesProp : number;
declare var nameProp : number;

declare var dimProp : number;
declare var posProp : number;
declare var velProp : number;
declare var accProp : number;
declare var jerkProp : number;
declare var dirProp : number;

declare var keysProp : number;

declare var ownerProp : number;
declare var targetProp : number;
declare var hitsProp : number;

declare var killProp : number;
declare var deathProp : number;

declare var solidAttribute : number;
declare var stairAttribute : number;
declare var platformAttribute : number;
declare var attachedAttribute : number;
declare var chargingAttribute : number;
declare var chargedAttribute : number;
declare var groundedAttribute : number;
declare var doubleJumpAttribute : number;
declare var deadAttribute : number;

declare var typeByteAttribute : number;
declare var openingByteAttribute : number;
declare var healthByteAttribute : number;
declare var juiceByteAttribute : number;

declare var colorIntAttribute : number;
declare var secondaryColorIntAttribute : number;

declare var posZFloatAttribute : number;
declare var dimZFloatAttribute : number;
declare var intensityFloatAttribute : number;
declare var distanceFloatAttribute : number;
declare var fovFloatAttribute : number;

declare var spotLight : number;
declare var pointLight : number;
declare var floorLight : number;

declare var uziWeapon : number;
declare var bazookaWeapon : number;
declare var sniperWeapon : number;
declare var starWeapon : number;

declare var testBlock : number;
declare var archBlock : number;
declare var archBlockRoof : number;

declare var upKey : number;
declare var downKey : number;
declare var leftKey : number;
declare var rightKey : number;
declare var jumpKey : number;
declare var interactKey : number;
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
declare var wasmReset : any;
declare var wasmGetStats : any;