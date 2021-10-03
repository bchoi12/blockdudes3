const dev : boolean = location.hostname === "localhost" || location.hostname === "127.0.0.1";

/* WASM variables */
declare var pingType: any;
declare var candidateType : any;
declare var offerType : any;
declare var answerType : any;
declare var initType : any;
declare var joinType : any;
declare var leftType : any;
declare var chatType : any;
declare var keyType : any;
declare var playerInitType : any;
declare var playerStateType : any;
declare var objectInitType : any;

declare var upKey : any;
declare var downKey : any;
declare var leftKey : any;
declare var rightKey : any;

/* WASM API */
declare var wasmAddPlayer : any;
declare var wasmSetPlayerData : any;
declare var wasmDeletePlayer : any;
declare var wasmPressKey : any;
declare var wasmReleaseKey : any;
declare var wasmUpdateState : any;