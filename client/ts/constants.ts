/* WASM variables */
declare var frameMillis : number;
declare var wasmVersion : string;

declare var leftCardinal : number;
declare var rightCardinal : number;
declare var bottomCardinal : number;
declare var topCardinal : number;
declare var bottomLeftCardinal : number;
declare var bottomRightCardinal : number;
declare var topLeftCardinal : number;
declare var topRightCardinal : number;

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

declare var lobbyGameState : number;
declare var activeGameState : number;
declare var victoryGameState : number;

declare var playerSpace : number;
declare var mainBlockSpace : number;
declare var balconyBlockSpace : number;
declare var roofBlockSpace : number;
declare var wallSpace : number;
declare var lightSpace : number;
declare var explosionSpace : number;
declare var equipSpace : number;
declare var weaponSpace : number;
declare var bombSpace : number;
declare var pelletSpace : number;
declare var boltSpace : number;
declare var rocketSpace : number;
declare var starSpace : number;
declare var grapplingHookSpace : number;
declare var pickupSpace : number;
declare var portalSpace : number;
declare var goalSpace : number;
declare var spawnSpace : number;

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

declare var stateProp : number;
declare var scoreProp : number;

declare var deletedAttribute : number;
declare var attachedAttribute : number;
declare var chargingAttribute : number;
declare var chargedAttribute : number;
declare var canJumpAttribute : number;
declare var canDoubleJumpAttribute : number;
declare var dashingAttribute : number;
declare var deadAttribute : number;
declare var visibleAttribute : number;
declare var vipAttribute : number;
declare var fromLevelAttribute : number;

declare var typeByteAttribute : number;
declare var subtypeByteAttribute : number;
declare var stateByteAttribute : number;
declare var teamByteAttribute : number;
declare var openingByteAttribute : number;
declare var healthByteAttribute : number;
declare var juiceByteAttribute : number;

declare var colorIntAttribute : number;
declare var secondaryColorIntAttribute : number;
declare var killIntAttribute : number;
declare var deathIntAttribute : number;

declare var posZFloatAttribute : number;
declare var dimZFloatAttribute : number;
declare var intensityFloatAttribute : number;
declare var distanceFloatAttribute : number;
declare var fovFloatAttribute : number;

declare var redTeam : number;
declare var blueTeam : number;

declare var spotLight : number;
declare var pointLight : number;
declare var floorLight : number;

declare var uziWeapon : number;
declare var grapplingHookWeapon : number;
declare var bazookaWeapon : number;
declare var sniperWeapon : number;
declare var starWeapon : number;
declare var boosterEquip : number;
declare var chargerEquip : number;
declare var jetpackEquip : number;

declare var readyPartState : number;
declare var activePartState : number;
declare var rechargingPartState : number;

declare var platformWall : number;
declare var stairWall : number;
declare var tableWallSubtype : number;

declare var archBlock : number;

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
declare var wasmUpdate : any;
declare var wasmReset : any;
declare var wasmGetStats : any;