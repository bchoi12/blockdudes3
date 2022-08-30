package main

import (
	"math"
)

type LevelIdType uint8
const (
	unknownLevel LevelIdType = iota
	testLevel
)

type Level struct {
	id LevelIdType
	grid *Grid
}

func NewLevel(grid *Grid) *Level {
	return &Level {
		id: unknownLevel,
		grid: grid,
	}
}

func (l Level) GetId() LevelIdType {
	return l.id
}

func (l *Level) LoadLevel(id LevelIdType) {
	l.id = id

	switch id {
	case testLevel:
		l.loadTestLevel()
	default:
		Debug("Unknown map: %d", id)
	}
}

func (l Level) createInit(space SpaceType, pos Vec2, dim Vec2) Init {
	return NewInit(l.grid.NextSpacedId(space), pos, dim)
}

func (l Level) createInitBL(space SpaceType, pos Vec2, dim Vec2) Init {
	centered := NewVec2(pos.X + dim.X/2, pos.Y + dim.Y/2)
	return l.createInit(space, centered, dim)
}

func (l Level) createInitB(space SpaceType, pos Vec2, dim Vec2) Init {
	centered := NewVec2(pos.X, pos.Y + dim.Y/2)
	return l.createInit(space, centered, dim)
}

func (l Level) createInitBR(space SpaceType, pos Vec2, dim Vec2) Init {
	centered := NewVec2(pos.X - dim.X/2, pos.Y + dim.Y/2)
	return l.createInit(space, centered, dim)
}

func (l Level) createInitT(space SpaceType, pos Vec2, dim Vec2) Init {
	centered := NewVec2(pos.X, pos.Y - dim.Y/2)
	return l.createInit(space, centered, dim)
}

// TODO: currently loading is done via WASM then sent redundantly over network & skipped
func (l *Level) loadTestLevel() {
	g := l.grid
	var x, y float64


	x = 20
	y = 0

	{
		init := NewInitC(g.NextSpacedId(wallSpace), NewVec2(x, y), NewVec2(16, 0.5), bottomCenter)
		g.Upsert(g.New(init))
	}

	{
		init := NewInitC(g.NextSpacedId(wallSpace), NewVec2(x - 8, y + 4.5), NewVec2(0.5, 3.5), bottomLeftCenter)
		g.Upsert(g.New(init))
	}

	{
		init := NewInitC(g.NextSpacedId(wallSpace), NewVec2(x + 8, y + 4.5), NewVec2(0.5, 3.5), bottomRightCenter)
		g.Upsert(g.New(init))
	}

	{
		init := NewInitC(g.NextSpacedId(wallSpace), NewVec2(x, y + 7), NewVec2(16, 1.5), bottomCenter)
		g.Upsert(g.New(init))
	}

	{
		init := NewInitC(g.NextSpacedId(wallSpace), NewVec2(x - 8, y + 8), NewVec2(1, 1), bottomRightCenter)
		g.Upsert(g.New(init))
	}
	{
		init := NewInitC(g.NextSpacedId(wallSpace), NewVec2(x + 8, y + 8), NewVec2(1, 1), bottomLeftCenter)
		g.Upsert(g.New(init))
	}

	{
		init := NewInitC(g.NextSpacedId(lightSpace), NewVec2(x, y + 7), NewVec2(0.2, 0.3), topCenter)
		light := NewLight(init)
		light.SetByteAttribute(typeByteAttribute, spotLight)
		light.SetFloatAttribute(intensityFloatAttribute, 4)
		light.SetFloatAttribute(distanceFloatAttribute, 6)
		light.SetFloatAttribute(fovFloatAttribute, 0.4 * math.Pi)
		light.SetIntAttribute(colorIntAttribute, 0x6666FF)

		g.Upsert(light)
	}

	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(x, y), NewVec2(16, 8.5), defaultCenter)
		block := NewBlock(init)
		block.LoadTemplate(emptyBlockTemplate)
		block.SetInitProp(dimZProp, 7)
		block.SetThickness(0.5)
		g.Upsert(block)
	}
	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(x, y - 8.5), NewVec2(16, 8.5), defaultCenter)
		block := NewBlock(init)
		block.LoadTemplate(emptyBlockTemplate)
		block.SetInitProp(dimZProp, 7)
		block.SetThickness(0.5)
		g.Upsert(block)
	}

	g.Upsert(g.New(l.createInitB(pickupSpace, NewVec2(14, 8.5), NewVec2(1.5, 1.2))))
	g.GetLast(pickupSpace).SetByteAttribute(typeByteAttribute, uint8(uziWeapon))

	g.Upsert(g.New(l.createInitB(pickupSpace, NewVec2(18, 8.5), NewVec2(1.5, 1.2))))
	g.GetLast(pickupSpace).SetByteAttribute(typeByteAttribute, uint8(starWeapon))

	g.Upsert(g.New(l.createInitB(pickupSpace, NewVec2(22, 8.5), NewVec2(1.5, 1.2))))
	g.GetLast(pickupSpace).SetByteAttribute(typeByteAttribute, uint8(bazookaWeapon))

	g.Upsert(g.New(l.createInitB(pickupSpace, NewVec2(26, 8.5), NewVec2(1.5, 1.2))))
	g.GetLast(pickupSpace).SetByteAttribute(typeByteAttribute, uint8(sniperWeapon))

	x = 40
	y = 3

	{
		init := NewInitC(g.NextSpacedId(wallSpace), NewVec2(x, y), NewVec2(16, 0.5), bottomCenter)
		g.Upsert(g.New(init))
	}

	{
		init := NewInitC(g.NextSpacedId(wallSpace), NewVec2(x - 8, y + 4.5), NewVec2(0.5, 3.5), bottomLeftCenter)
		g.Upsert(g.New(init))
	}

	{
		init := NewInitC(g.NextSpacedId(wallSpace), NewVec2(x + 8, y + 4.5), NewVec2(0.5, 3.5), bottomRightCenter)
		g.Upsert(g.New(init))
	}

	{
		init := NewInitC(g.NextSpacedId(wallSpace), NewVec2(x, y + 7), NewVec2(16, 1.5), bottomCenter)
		g.Upsert(g.New(init))
	}

	{
		init := NewInitC(g.NextSpacedId(wallSpace), NewVec2(x - 8, y + 8), NewVec2(1, 1), bottomRightCenter)
		g.Upsert(g.New(init))
	}
	{
		init := NewInitC(g.NextSpacedId(wallSpace), NewVec2(x + 8, y + 8), NewVec2(1, 1), bottomLeftCenter)
		g.Upsert(g.New(init))
	}
	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(x, y), NewVec2(16, 8.5), defaultCenter)
		block := NewBlock(init)
		block.LoadTemplate(emptyBlockTemplate)
		block.SetInitProp(dimZProp, 7)
		block.SetThickness(0.5)
		g.Upsert(block)
	}
	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(x, y - 8.5), NewVec2(16, 8.5), defaultCenter)
		block := NewBlock(init)
		block.LoadTemplate(emptyBlockTemplate)
		block.SetInitProp(dimZProp, 7)
		block.SetThickness(0.5)
		g.Upsert(block)
	}

	x = 60
	y = 6

	{
		init := NewInitC(g.NextSpacedId(wallSpace), NewVec2(x, y), NewVec2(16, 0.5), bottomCenter)
		g.Upsert(g.New(init))
	}

	{
		init := NewInitC(g.NextSpacedId(wallSpace), NewVec2(x - 8, y + 4.5), NewVec2(0.5, 3.5), bottomLeftCenter)
		g.Upsert(g.New(init))
	}

	{
		init := NewInitC(g.NextSpacedId(wallSpace), NewVec2(x + 8, y + 4.5), NewVec2(0.5, 3.5), bottomRightCenter)
		g.Upsert(g.New(init))
	}

	{
		init := NewInitC(g.NextSpacedId(wallSpace), NewVec2(x, y + 7), NewVec2(16, 1.5), bottomCenter)
		g.Upsert(g.New(init))
	}

	{
		init := NewInitC(g.NextSpacedId(wallSpace), NewVec2(x - 8, y + 8), NewVec2(1, 1), bottomRightCenter)
		g.Upsert(g.New(init))
	}
	{
		init := NewInitC(g.NextSpacedId(wallSpace), NewVec2(x + 8, y + 8), NewVec2(1, 1), bottomLeftCenter)
		g.Upsert(g.New(init))
	}

	{
		init := NewInitC(g.NextSpacedId(lightSpace), NewVec2(x, y + 7), NewVec2(0.2, 0.3), topCenter)
		light := NewLight(init)
		light.SetByteAttribute(typeByteAttribute, spotLight)
		light.SetFloatAttribute(intensityFloatAttribute, 4)
		light.SetFloatAttribute(distanceFloatAttribute, 6)
		light.SetFloatAttribute(fovFloatAttribute, 0.4 * math.Pi)
		light.SetIntAttribute(colorIntAttribute, 0x6666FF)

		g.Upsert(light)
	}

	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(x, y), NewVec2(16, 8.5), defaultCenter)
		block := NewBlock(init)
		block.LoadTemplate(emptyBlockTemplate)
		block.SetInitProp(dimZProp, 7)
		block.SetThickness(0.5)
		g.Upsert(block)
	}
	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(x, y - 8.5), NewVec2(16, 8.5), defaultCenter)
		block := NewBlock(init)
		block.LoadTemplate(emptyBlockTemplate)
		block.SetInitProp(dimZProp, 7)
		block.SetThickness(0.5)
		g.Upsert(block)
	}
}