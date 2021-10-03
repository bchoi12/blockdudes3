package main

import (
	"encoding/json"
	"fmt"
	"syscall/js"
)

var game *Game

func main() {
	fmt.Println("WebAssembly loaded!")

	setGlobals()
	setGameAPI()

	js.Global().Set("helloWebAssembly", helloWebAssembly())

    <-make(chan bool)
}

func setGlobals() {
	js.Global().Set("pingType", pingType)
	js.Global().Set("candidateType", candidateType)
	js.Global().Set("offerType", offerType)
	js.Global().Set("answerType", answerType)

	js.Global().Set("initType", initType)
	js.Global().Set("joinType", joinType)
	js.Global().Set("leftType", leftType)

	js.Global().Set("chatType", chatType)
	js.Global().Set("keyType", keyType)
	js.Global().Set("playerInitType", playerInitType)
	js.Global().Set("playerStateType", playerStateType)
	js.Global().Set("objectInitType", objectInitType)

	js.Global().Set("upKey", upKey)
	js.Global().Set("downKey", downKey)
	js.Global().Set("leftKey", leftKey)
	js.Global().Set("rightKey", rightKey)
}

func setGameAPI() {
	game = newGame()
	js.Global().Set("wasmAddPlayer", addPlayer(game))
	js.Global().Set("wasmSetPlayerData", setPlayerData(game))
	js.Global().Set("wasmDeletePlayer", deletePlayer(game))
	js.Global().Set("wasmPressKey", pressKey(game))
	js.Global().Set("wasmReleaseKey", releaseKey(game))
	js.Global().Set("wasmUpdateState", updateState(game))
}

func addPlayer(g *Game) js.Func {  
    return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) != 1 {
			return fmt.Sprintf("Expected 1 argument(s), got %d", len(args))
		}

		id := args[0].Int()
		g.addPlayer(id)
		return nil
    })
}

func setPlayerData(g *Game) js.Func {  
    return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) != 2 {
			return fmt.Sprintf("Expected 2 argument(s), got %d", len(args))
		}

		id := args[0].Int()
		pos := args[1].Get("Pos")
		vel := args[1].Get("Vel")
		acc := args[1].Get("Acc")

		if !g.hasPlayer(id) {
			return fmt.Sprintf("Player %d does not exist", id)
		}

		pData := PlayerData {
			Pos: parseVec2(pos),
			Vel: parseVec2(vel),
			Acc: parseVec2(acc),
		}
		g.setPlayerData(id, pData)
		return nil
    })
}

func deletePlayer(g *Game) js.Func {  
    return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) != 1 {
			return fmt.Sprintf("Expected 1 argument(s), got %d", len(args))
		}

		id := args[0].Int()
		g.deletePlayer(id)
		return nil
    })
}

func pressKey(g *Game) js.Func {  
    return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) != 2 {
			return fmt.Sprintf("Expected 2 argument(s), got %d", len(args))
		}

		id := args[0].Int()
		key := args[1].Int()
		g.pressKey(id, key)

		return nil
    })
}

func releaseKey(g *Game) js.Func {  
    return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) != 2 {
			return fmt.Sprintf("Expected 2 argument(s), got %d", len(args))
		}

		id := args[0].Int()
		key := args[1].Int()
		g.releaseKey(id, key)

		return nil
    })
}

func updateState(g *Game) js.Func {  
    return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		g.updateState()
		state := g.createPlayerStateMsg()
		b, err := json.Marshal(state)
		if err != nil {
			fmt.Println("wasmUpdateState: %v", err)
		}
		return string(b)
    })
}

func parseVec2(vec js.Value) Vec2 {
	return NewVec2(vec.Get("X").Float(), vec.Get("Y").Float())
}

func helloWebAssembly() js.Func {  
    return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		fmt.Println("hello")
		return nil
    })
}