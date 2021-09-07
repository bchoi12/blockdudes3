const dev = location.hostname === "localhost" || location.hostname === "127.0.0.1";

const initType = 1
const joinType = 5
const leftType  = 6

const chatType = 2
const keyType = 3
const stateType = 4

const upKey = 1
const downKey = 2
const leftKey = 3
const rightKey = 4

const keyMap = new Map()
keyMap.set(38, 1)
keyMap.set(40, 2)
keyMap.set(37, 3)
keyMap.set(39, 4)