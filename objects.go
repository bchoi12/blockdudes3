package main

import (
	"time"
)

type Bomb struct {
	BaseObject
}

func NewBomb(init Init) *Bomb {
	bomb := &Bomb {
		BaseObject: NewCircleObject(init),
	}
	bomb.SetVariableTTL(1200 * time.Millisecond)
	return bomb
}

func (b *Bomb) Update(grid *Grid, now time.Time) {
	if isWasm {
		return
	}

	b.PrepareUpdate(now)
	b.BaseObject.Update(grid, now)

	if b.Expired() {
		pos := b.Pos()
		dim := b.Dim()
		dim.Scale(3.6)

		init := NewInit(grid.NextSpacedId(explosionSpace), pos, dim)
		explosion := NewExplosion(init)
		
		grid.Upsert(explosion)
		grid.Delete(b.GetSpacedId())
	}
}

type Pickup struct {
	BaseObject
}

func NewPickup(init Init) *Pickup {
	pickup := &Pickup {
		BaseObject: NewRec2Object(init),
	}
	return pickup
}

func (p Pickup) GetType() EquipType {
	typeByte, _ := p.GetByteAttribute(typeByteAttribute)
	return EquipType(typeByte)
}

func (p Pickup) GetSubtype() EquipType {
	typeByte, _ := p.GetByteAttribute(subtypeByteAttribute)
	return EquipType(typeByte)
}

type Portal struct {
	BaseObject
}

func NewPortal(init Init) *Portal {
	return &Portal {
		BaseObject: NewRec2Object(init),
	}
}

func (p *Portal) SetTeam(team uint8) {
	p.SetByteAttribute(teamByteAttribute, team)
	p.SetIntAttribute(colorIntAttribute, teamColors[team])
}

type Goal struct {
	BaseObject
	chargeTimer Timer
}

func NewGoal(init Init) *Goal {
	g := &Goal {
		BaseObject: NewRec2Object(init),
		chargeTimer: NewTimer(3 * time.Second),
	}

	overlapOptions := NewColliderOptions()
	overlapOptions.SetSpaces(playerSpace)
	g.SetOverlapOptions(overlapOptions)

	return g
}

func (g *Goal) SetTeam(team uint8) {
	g.SetByteAttribute(teamByteAttribute, team)
	g.SetIntAttribute(colorIntAttribute, vipColor)
}

func (g *Goal) Update(grid *Grid, now time.Time) {
	if isWasm {
		return
	}

	g.PrepareUpdate(now)
	g.BaseObject.Update(grid, now)

	colliders := grid.GetColliders(g)
	hasPlayer := false
	team, _ := g.GetByteAttribute(teamByteAttribute)
	for len(colliders) > 0 {
		collider := PopObject(&colliders)
		switch object := collider.(type) {
		case *Player:
			if object.HasAttribute(vipAttribute) && object.grounded {
				if playerTeam, ok := object.GetByteAttribute(teamByteAttribute); ok && playerTeam == team {
					hasPlayer = true
				}
			}
		}
	}

	if hasPlayer != g.HasAttribute(chargingAttribute) {
		if hasPlayer {
			g.AddAttribute(chargingAttribute)
			g.chargeTimer.Start()
		} else {
			g.RemoveAttribute(chargingAttribute)
			g.RemoveAttribute(chargedAttribute)
			g.chargeTimer.Stop()
		}
	}

	if g.HasAttribute(chargingAttribute) && g.chargeTimer.Finished() {
		g.AddAttribute(chargedAttribute)
	}

	if g.HasAttribute(chargedAttribute) {
		grid.SetWinningTeam(team)
	}
}

type Spawn struct {
	BaseObject
}

func NewSpawn(init Init) *Spawn {
	return &Spawn {
		BaseObject: NewCircleObject(init),
	}
}