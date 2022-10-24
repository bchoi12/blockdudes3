package main

import (
	"math/rand"
	"time"
)

const (
	vipModeTeams uint8 = 2
	vipMaxScore int = 7
)

type VipMode struct {
	BaseGameMode
	random *rand.Rand

	vip Object
	nextVip map[uint8]int
	restartTimer Timer
}

func NewVipMode() *VipMode {
	mode := &VipMode {
		BaseGameMode: NewBaseGameMode(),
		random: rand.New(rand.NewSource(UnixMilli())),

		vip: nil,
		nextVip: make(map[uint8]int),
		restartTimer: NewTimer(3 * time.Second),
	}
	mode.SetState(lobbyGameState)
	return mode
}

func (vm *VipMode) Update(g *Grid) {
	vm.BaseGameMode.Update(g)

	if vm.state == unknownGameState {
		return
	}

	if vm.state == lobbyGameState {
		if vm.firstFrame {
			for _, player := range(g.GetObjects(playerSpace)) {
				player.RemoveAttribute(vipAttribute)
				player.AddInternalAttribute(autoRespawnAttribute)
				player.SetByteAttribute(teamByteAttribute, 0)
				player.SetIntAttribute(colorIntAttribute, teamColors[0])
				player.(*Player).SetSpawn(g)
				player.Respawn()
			}
		}

		vm.teams = make(map[uint8][]Object)
		players := g.GetObjects(playerSpace)
		for _, player := range(players) {
			team, _ := player.GetByteAttribute(teamByteAttribute)
			vm.teams[team] = append(vm.teams[team], player)
		}

		if len(vm.teams[0]) > 0 {
			return
		}

		if len(vm.teams[1]) == 0 || len(vm.teams[2]) == 0 {
			return
		}

		vm.players = make(map[SpacedId]Object)
		for _, player := range(players) {
			vm.players[player.GetSpacedId()] = player
		}

		vm.teamScores[1], vm.teamScores[2] = 0, 0
		vm.nextVip[1], vm.nextVip[2] = 0, 0
		vm.vip = nil
		vm.config = GameModeConfig {
			leftTeam: 1,
			rightTeam: 2,
			reverse: false,
			nextState: activeGameState,
			levelId: birdTownLevel,
		}
		vm.SetState(setupGameState)
	} else if vm.state == activeGameState {
		changed, valid := vm.checkChanges(g)

		// TODO: split into helper fn
		if changed {
			vm.teams = make(map[uint8][]Object)
			for _, player := range(vm.players) {
				team, _ := player.GetByteAttribute(teamByteAttribute)
				vm.teams[team] = append(vm.teams[team], player)
			}
		}

		if vm.firstFrame {
			for _, player := range(vm.players) {
				player.RemoveAttribute(vipAttribute)
			}

			vm.winningTeam = 0
			for _, player := range(vm.players) {
				player.(*Player).SetSpawn(g)
				player.Respawn()
				player.RemoveAttribute(autoRespawnAttribute)
			}

			offense := vm.config.leftTeam
			if vm.nextVip[offense] >= len(vm.teams[offense]) {
				vm.nextVip[offense] = 0
			}
			vipIndex := vm.nextVip[offense]
			vm.nextVip[offense] += 1

			// TODO: fix nullptr, vm.teams can be empty
			vm.vip = vm.teams[offense][vipIndex]
			vm.vip.AddAttribute(vipAttribute)
		} else if !valid {
			vm.config.levelId = lobbyLevel
			vm.config.nextState = lobbyGameState
			vm.SetState(setupGameState)
			return
		}

		vm.winningTeam = vm.getWinningTeam()
		if vm.winningTeam != 0 {
			vm.teamScores[vm.winningTeam] += 1
			vm.SetState(victoryGameState)
		}
	} else if vm.state == victoryGameState {
		if vm.firstFrame {
			vm.restartTimer.Start()
			return
		}
		if vm.restartTimer.On() {
			return
		}

		if vm.teamScores[1] >= vipMaxScore || vm.teamScores[2] >= vipMaxScore {
			vm.config.levelId = lobbyLevel
			vm.config.nextState = lobbyGameState
			vm.SetState(setupGameState)
			return
		}

		resetLevel := false
		if vm.config.leftTeam == 1 {
			if vm.config.reverse {
				vm.config.reverse = false
				resetLevel = true
			} else {
				vm.swapSides(g)
			}
		} else if vm.config.leftTeam == 2 {
			if vm.config.reverse {
				vm.swapSides(g)
			} else {
				vm.config.reverse = true
			}
		}

		if resetLevel {
			vm.config.levelId = birdTownLevel
			vm.config.nextState = activeGameState
			vm.SetState(setupGameState)
		} else {
			vm.SetState(activeGameState)
		}
	}
}

func (vm *VipMode) SetWinningTeam(team uint8) {
	if vm.state != activeGameState || team == 0 {
		return
	}

	vm.winningTeam = team
}

func (vm VipMode) GetUpdates() Data {
	data := vm.BaseGameMode.GetUpdates()

	if vm.vip != nil {
		data.Set(vipProp, vm.vip.GetSpacedId())
	}
	return data
}

func (vm VipMode) checkChanges(g *Grid) (bool, bool) {
	changed := false
	for sid, player := range(vm.players) {
		if g.Get(sid) == nil || player.HasAttribute(deletedAttribute) {
			delete(vm.players, sid)
			changed = true
		}
	}

	valid := vm.validGame()
	return changed, valid
}

func (vm VipMode) validGame() bool {
	teams := make(map[uint8]bool)
	hasVip := false
	for _, player := range(vm.players) {
		team, _ := player.GetByteAttribute(teamByteAttribute)
		teams[team] = true
		hasVip = hasVip || player.HasAttribute(vipAttribute)

		if teams[vm.config.leftTeam] && teams[vm.config.rightTeam] && hasVip {
			return true
		}
	}
	return false
}

func (vm VipMode) getWinningTeam() uint8 {
	if vm.winningTeam != 0 {
		return vm.winningTeam
	}

	hasVip := false
	alive := make(map[uint8]int)

	for _, player := range(vm.players) {
		team, _ := player.GetByteAttribute(teamByteAttribute)
		if team == 0 {
			continue
		}

		if player.HasAttribute(vipAttribute) && !player.HasAttribute(deadAttribute) {
			hasVip = true
		}

		if !player.HasAttribute(deadAttribute) {
			alive[team] += 1
		}
	}

	if !hasVip {
		return vm.config.rightTeam
	}

	for i := uint8(1); i <= vipModeTeams; i +=1 {
		if alive[i] == 0 {
			return vm.getEnemyTeam(i)
		}
	}

	return 0
}

func (vm VipMode) getEnemyTeam(team uint8) uint8 {
	if team <= 0 || team > vipModeTeams {
		return 0
	}

	return 3 - team
}

func (vm *VipMode) swapSides(g *Grid) {
	vm.config.leftTeam, vm.config.rightTeam = vm.config.rightTeam, vm.config.leftTeam

	for _, spawn := range(g.GetObjects(spawnSpace)) {
		team, _ := spawn.GetByteAttribute(teamByteAttribute)
		spawn.SetByteAttribute(teamByteAttribute, vm.getEnemyTeam(team))
	}

	for _, goal := range(g.GetObjects(goalSpace)) {
		goal.SetByteAttribute(teamByteAttribute, vm.config.leftTeam)
	}
}