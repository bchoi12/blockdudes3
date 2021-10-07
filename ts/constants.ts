const dev : boolean = location.hostname === "localhost" || location.hostname === "127.0.0.1";

/* WASM variables */
declare var frameMillis : number;

declare var pingType: number;
declare var candidateType : number;
declare var offerType : number;
declare var answerType : number;
declare var initType : number;

declare var joinType : number;
declare var leftType : number;
declare var chatType : number;
declare var keyType : number;
declare var playerInitType : number;

declare var playerStateType : number;
declare var objectInitType : number;

declare var upKey : number;
declare var downKey : number;
declare var leftKey : number;
declare var rightKey : number;
declare var mouseClick : number;

/* WASM API */
declare var wasmAddPlayer : any;
declare var wasmHasPlayer : any;
declare var wasmSetPlayerData : any;
declare var wasmDeletePlayer : any;
declare var wasmPressKey : any;
declare var wasmReleaseKey : any;
declare var wasmUpdateState : any;