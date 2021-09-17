const dev = location.hostname === "localhost" || location.hostname === "127.0.0.1";

const pingType = 9
const initType = 1
const joinType = 5
const leftType  = 6

const chatType = 2
const keyType = 3
const playerInitType = 8
const playerStateType = 4
const objectInitType =7

const upKey = 1
const downKey = 2
const leftKey = 3
const rightKey = 4

const chatKeyCode = 13;

const keyMap = new Map()
keyMap.set(38, upKey)
keyMap.set(87, upKey)
keyMap.set(40, downKey)
keyMap.set(83, downKey)
keyMap.set(37, leftKey)
keyMap.set(65, leftKey)
keyMap.set(39, rightKey)
keyMap.set(68, rightKey)

const invalidId = '';