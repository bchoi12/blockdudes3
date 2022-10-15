package main

import (
	"math/rand"
	"time"
)

const (
	vipModeTeams uint8 = 2
)

type VipMode struct {
	BaseGameMode

	random *rand.Rand
	teams map[uint8][]*Player
	restartTimer Timer
}

func NewVipMode() *VipMode {
	mode := &VipMode {
		BaseGameMode: NewBaseGameMode(),

		random: rand.New(rand.NewSource(UnixMilli())),
		teams: make(map[uint8][]*Player),
		restartTimer: NewTimer(5 * time.Second),
	}
	mode.SetState(lobbyGameState)
	return mode
}

func (vm *VipMode) Update(g *Grid) {
	vm.BaseGameMode.Update(g)

	if vm.state == unknownGameState {
		return
	}

	players := g.GetObjects(playerSpace)
	if vm.state == lobbyGameState {
		vm.teams = make(map[uint8][]*Player)
		for _, player := range(players) {
			player.AddInternalAttribute(autoRespawnAttribute)
			team, _ := player.GetByteAttribute(teamByteAttribute)
			vm.teams[team] = append(vm.teams[team], player.(*Player))
		}

		if len(vm.teams[0]) > 0 {
			return
		}
		if len(vm.teams[1]) == 0 || len(vm.teams[2]) == 0 {
			return
		}

		offense := uint8(vm.random.Intn(2) + 1)
		vip := vm.random.Intn(len(vm.teams[offense]))
		vm.teams[offense][vip].AddAttribute(vipAttribute)

		vm.SetState(activeGameState)
	} else if vm.state == activeGameState {
		if vm.firstFrame {
			// Start game
			for _, player := range(players) {
				player.(*Player).SetSpawn(g)
				// TODO: Respawn should be Object method, just reset Pos to InitPos
				player.(*Player).Respawn()
				player.RemoveAttribute(autoRespawnAttribute)
			}
		}

		alive := make(map[uint8]int)
		winningTeam := uint8(0)
		for _, player := range(players) {
			team, _ := player.GetByteAttribute(teamByteAttribute)
			if team == 0 {
				continue
			}

			if !player.HasAttribute(deadAttribute) {
				alive[team] += 1
			} else if player.HasAttribute(vipAttribute) {
				winningTeam = vipModeTeams - team + 1
			}
		}

		if winningTeam == 0 {
			if alive[1] == 0 {
				winningTeam = 2
			}
			if alive[2] == 0 {
				winningTeam = 1
			}
		}

		if winningTeam != 0 {
			vm.SignalVictory(winningTeam)
		}
	} else if vm.state == victoryGameState {
		if vm.restartTimer.On() {
			return
		}

		for _, player := range(players) {
			player.RemoveAttribute(vipAttribute)
		}
		vm.SetState(lobbyGameState)
	}
}

func (vm *VipMode) SignalVictory(team uint8) {
	if vm.state != activeGameState || team == 0 {
		return
	}

	vm.teamScores[team] += 1
	vm.SetState(victoryGameState)
	vm.restartTimer.Start()
}

func (vm VipMode) GetTeamScores() map[uint8]int {
	return vm.teamScores
}