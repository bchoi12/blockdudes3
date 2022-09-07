package main

import (
	"fmt"
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
		Log(fmt.Sprintf("Unknown map: %d", id))
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
	var blocks int

	x = 4
	y = -9
	blocks = 3

	for i := 0; i < blocks; i += 1 {
		roof := i == blocks - 1
		height := 6.0
		if roof {
			height = 2.0
		}

		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(x, y), NewVec2(12, height), defaultOrigin)
		block := NewBlock(init)
		block.SetIntAttribute(colorIntAttribute, 0x0ffc89)
		block.SetIntAttribute(secondaryColorIntAttribute, 0xffffff)

		if roof {
			block.SetByteAttribute(typeByteAttribute, uint8(archBlockRoof))
		} else {
			block.SetByteAttribute(typeByteAttribute, uint8(archBlock))
		}
		block.Load()
		g.Upsert(block)

		for _, obj := range(block.GetObjects()) {
			obj.SetId(g.NextId(obj.GetSpace()))
			g.Upsert(obj)
		}

		if i < blocks - 1 {
			y += 6
		}
	}

	g.Upsert(g.New(l.createInitB(pickupSpace, NewVec2(x - 3, y + 0.5), NewVec2(1.5, 1.2))))
	g.GetLast(pickupSpace).SetByteAttribute(typeByteAttribute, uint8(uziWeapon))

	g.Upsert(g.New(l.createInitB(pickupSpace, NewVec2(x - 1, y + 0.5), NewVec2(1.5, 1.2))))
	g.GetLast(pickupSpace).SetByteAttribute(typeByteAttribute, uint8(starWeapon))

	g.Upsert(g.New(l.createInitB(pickupSpace, NewVec2(x + 1, y + 0.5), NewVec2(1.5, 1.2))))
	g.GetLast(pickupSpace).SetByteAttribute(typeByteAttribute, uint8(bazookaWeapon))

	g.Upsert(g.New(l.createInitB(pickupSpace, NewVec2(x + 3, y + 0.5), NewVec2(1.5, 1.2))))
	g.GetLast(pickupSpace).SetByteAttribute(typeByteAttribute, uint8(sniperWeapon))

	x += 12
	x += 6
	y = -9

	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(x, y), NewVec2(12, 6), defaultOrigin)
		block := NewBlock(init)
		block.SetIntAttribute(colorIntAttribute, 0xfc1f0f)
		block.SetIntAttribute(secondaryColorIntAttribute, 0xffffff)
		block.SetByteAttribute(typeByteAttribute, uint8(archBlock))

		block.Load()
		g.Upsert(block)

		for _, obj := range(block.GetObjects()) {
			obj.SetId(g.NextId(obj.GetSpace()))
			g.Upsert(obj)
		}
	}

	y += 6

	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(x, y), NewVec2(12, 6), defaultOrigin)
		block := NewBlock(init)
		block.SetIntAttribute(colorIntAttribute, 0xfc1f0f)
		block.SetIntAttribute(secondaryColorIntAttribute, 0xffffff)
		block.SetByteAttribute(openingByteAttribute, 0b11)
		block.SetByteAttribute(typeByteAttribute, uint8(archBlock))

		block.Load()
		g.Upsert(block)

		for _, obj := range(block.GetObjects()) {
			obj.SetId(g.NextId(obj.GetSpace()))
			g.Upsert(obj)
		}
	}

	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(x - 6, y), NewVec2(3, 2), defaultOrigin)
		block := NewBlock(init)
		block.SetIntAttribute(colorIntAttribute, 0xfc1f0f)
		block.SetIntAttribute(secondaryColorIntAttribute, 0xffffff)
		block.SetByteAttribute(openingByteAttribute, 0b10)
		block.SetByteAttribute(typeByteAttribute, uint8(archBlockBalcony))

		block.Load()
		g.Upsert(block)

		for _, obj := range(block.GetObjects()) {
			obj.SetId(g.NextId(obj.GetSpace()))
			g.Upsert(obj)
		}
	}

	y += 6

	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(x, y), NewVec2(12, 6), defaultOrigin)
		block := NewBlock(init)
		block.SetIntAttribute(colorIntAttribute, 0xfc1f0f)
		block.SetIntAttribute(secondaryColorIntAttribute, 0xffffff)
		block.SetByteAttribute(openingByteAttribute, 0b11)
		block.SetByteAttribute(typeByteAttribute, uint8(archBlock))

		block.Load()
		g.Upsert(block)

		for _, obj := range(block.GetObjects()) {
			obj.SetId(g.NextId(obj.GetSpace()))
			g.Upsert(obj)
		}
	}

	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(x - 6, y), NewVec2(3, 2), defaultOrigin)
		block := NewBlock(init)
		block.SetIntAttribute(colorIntAttribute, 0xfc1f0f)
		block.SetIntAttribute(secondaryColorIntAttribute, 0xffffff)
		block.SetByteAttribute(openingByteAttribute, 0b10)
		block.SetByteAttribute(typeByteAttribute, uint8(archBlockBalcony))

		block.Load()
		g.Upsert(block)

		for _, obj := range(block.GetObjects()) {
			obj.SetId(g.NextId(obj.GetSpace()))
			g.Upsert(obj)
		}
	}

	y += 6

	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(x, y), NewVec2(12, 2), defaultOrigin)
		block := NewBlock(init)
		block.SetIntAttribute(colorIntAttribute, 0xfc1f0f)
		block.SetIntAttribute(secondaryColorIntAttribute, 0xffffff)
		block.SetByteAttribute(openingByteAttribute, 0b10)
		block.SetByteAttribute(typeByteAttribute, uint8(archBlockRoof))

		block.Load()
		g.Upsert(block)

		for _, obj := range(block.GetObjects()) {
			obj.SetId(g.NextId(obj.GetSpace()))
			g.Upsert(obj)
		}
	}

	x += 12
	y = -9

	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(x, y), NewVec2(12, 6), defaultOrigin)
		block := NewBlock(init)
		block.SetIntAttribute(colorIntAttribute, 0x0fdcfc)
		block.SetIntAttribute(secondaryColorIntAttribute, 0xffffff)
		block.SetByteAttribute(typeByteAttribute, uint8(archBlock))

		block.Load()
		g.Upsert(block)

		for _, obj := range(block.GetObjects()) {
			obj.SetId(g.NextId(obj.GetSpace()))
			g.Upsert(obj)
		}
	}

	y += 6

	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(x, y), NewVec2(12, 6), defaultOrigin)
		block := NewBlock(init)
		block.SetIntAttribute(colorIntAttribute, 0x0fdcfc)
		block.SetIntAttribute(secondaryColorIntAttribute, 0xffffff)
		block.SetByteAttribute(openingByteAttribute, 0b11)
		block.SetByteAttribute(typeByteAttribute, uint8(archBlock))

		block.Load()
		g.Upsert(block)

		for _, obj := range(block.GetObjects()) {
			obj.SetId(g.NextId(obj.GetSpace()))
			g.Upsert(obj)
		}
	}

	y += 6

	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(x, y), NewVec2(12, 6), defaultOrigin)
		block := NewBlock(init)
		block.SetIntAttribute(colorIntAttribute, 0x0fdcfc)
		block.SetIntAttribute(secondaryColorIntAttribute, 0xffffff)
		block.SetByteAttribute(openingByteAttribute, 0b11)
		block.SetByteAttribute(typeByteAttribute, uint8(archBlock))

		block.Load()
		g.Upsert(block)

		for _, obj := range(block.GetObjects()) {
			obj.SetId(g.NextId(obj.GetSpace()))
			g.Upsert(obj)
		}
	}

	y += 6

	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(x, y), NewVec2(12, 6), defaultOrigin)
		block := NewBlock(init)
		block.SetIntAttribute(colorIntAttribute, 0x0fdcfc)
		block.SetIntAttribute(secondaryColorIntAttribute, 0xffffff)
		block.SetByteAttribute(openingByteAttribute, 0b111)
		block.SetByteAttribute(typeByteAttribute, uint8(archBlock))

		block.Load()
		g.Upsert(block)

		for _, obj := range(block.GetObjects()) {
			obj.SetId(g.NextId(obj.GetSpace()))
			g.Upsert(obj)
		}
	}

	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(x + 6, y), NewVec2(3, 2), defaultOrigin)
		block := NewBlock(init)
		block.SetIntAttribute(colorIntAttribute, 0x0fdcfc)
		block.SetIntAttribute(secondaryColorIntAttribute, 0xffffff)
		block.SetByteAttribute(openingByteAttribute, 0b1)
		block.SetByteAttribute(typeByteAttribute, uint8(archBlockBalcony))

		block.Load()
		g.Upsert(block)

		for _, obj := range(block.GetObjects()) {
			obj.SetId(g.NextId(obj.GetSpace()))
			g.Upsert(obj)
		}
	}

	y += 6
	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(x, y), NewVec2(12, 2), defaultOrigin)
		block := NewBlock(init)
		block.SetIntAttribute(colorIntAttribute, 0x0fdcfc)
		block.SetIntAttribute(secondaryColorIntAttribute, 0xffffff)
		block.SetByteAttribute(typeByteAttribute, uint8(archBlockRoof))

		block.Load()
		g.Upsert(block)

		for _, obj := range(block.GetObjects()) {
			obj.SetId(g.NextId(obj.GetSpace()))
			g.Upsert(obj)
		}
	}

	x += 12
	y = -9

	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(x, y), NewVec2(12, 6), defaultOrigin)
		block := NewBlock(init)
		block.SetIntAttribute(colorIntAttribute, 0xb50ffc)
		block.SetIntAttribute(secondaryColorIntAttribute, 0xffffff)
		block.SetByteAttribute(typeByteAttribute, uint8(archBlock))

		block.Load()
		g.Upsert(block)

		for _, obj := range(block.GetObjects()) {
			obj.SetId(g.NextId(obj.GetSpace()))
			g.Upsert(obj)
		}
	}

	y += 6

	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(x, y), NewVec2(12, 6), defaultOrigin)
		block := NewBlock(init)
		block.SetIntAttribute(colorIntAttribute, 0xb50ffc)
		block.SetIntAttribute(secondaryColorIntAttribute, 0xffffff)
		block.SetByteAttribute(openingByteAttribute, 0b11)
		block.SetByteAttribute(typeByteAttribute, uint8(archBlock))

		block.Load()
		g.Upsert(block)

		for _, obj := range(block.GetObjects()) {
			obj.SetId(g.NextId(obj.GetSpace()))
			g.Upsert(obj)
		}
	}

	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(x + 6, y), NewVec2(3, 2), defaultOrigin)
		block := NewBlock(init)
		block.SetIntAttribute(colorIntAttribute, 0xb50ffc)
		block.SetIntAttribute(secondaryColorIntAttribute, 0xffffff)
		block.SetByteAttribute(openingByteAttribute, 0b1)
		block.SetByteAttribute(typeByteAttribute, uint8(archBlockBalcony))

		block.Load()
		g.Upsert(block)

		for _, obj := range(block.GetObjects()) {
			obj.SetId(g.NextId(obj.GetSpace()))
			g.Upsert(obj)
		}
	}


	y += 6

	{
		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(x, y), NewVec2(12, 2), defaultOrigin)
		block := NewBlock(init)
		block.SetIntAttribute(colorIntAttribute, 0xb50ffc)
		block.SetIntAttribute(secondaryColorIntAttribute, 0xffffff)
		block.SetByteAttribute(openingByteAttribute, 0b1)
		block.SetByteAttribute(typeByteAttribute, uint8(archBlockRoof))

		block.Load()
		g.Upsert(block)

		for _, obj := range(block.GetObjects()) {
			obj.SetId(g.NextId(obj.GetSpace()))
			g.Upsert(obj)
		}
	}

	x += 6
	x += 12
	y = -9

	for i := 0; i < blocks; i += 1 {
		roof := i == blocks - 1
		height := 6.0
		if roof {
			height = 2.0
		}

		init := NewInitC(g.NextSpacedId(blockSpace), NewVec2(x, y), NewVec2(12, height), defaultOrigin)
		block := NewBlock(init)
		block.SetIntAttribute(colorIntAttribute, 0x0ffc89)
		block.SetIntAttribute(secondaryColorIntAttribute, 0xffffff)

		if roof {
			block.SetByteAttribute(typeByteAttribute, uint8(archBlockRoof))
		} else {
			block.SetByteAttribute(typeByteAttribute, uint8(archBlock))
		}
		block.Load()
		g.Upsert(block)

		for _, obj := range(block.GetObjects()) {
			obj.SetId(g.NextId(obj.GetSpace()))
			g.Upsert(obj)
		}

		if i < blocks - 1 {
			y += 6
		}
	}

	g.Upsert(g.New(l.createInitB(pickupSpace, NewVec2(x - 3, y + 0.5), NewVec2(1.5, 1.2))))
	g.GetLast(pickupSpace).SetByteAttribute(typeByteAttribute, uint8(uziWeapon))

	g.Upsert(g.New(l.createInitB(pickupSpace, NewVec2(x - 1, y + 0.5), NewVec2(1.5, 1.2))))
	g.GetLast(pickupSpace).SetByteAttribute(typeByteAttribute, uint8(starWeapon))

	g.Upsert(g.New(l.createInitB(pickupSpace, NewVec2(x + 1, y + 0.5), NewVec2(1.5, 1.2))))
	g.GetLast(pickupSpace).SetByteAttribute(typeByteAttribute, uint8(bazookaWeapon))

	g.Upsert(g.New(l.createInitB(pickupSpace, NewVec2(x + 3, y + 0.5), NewVec2(1.5, 1.2))))
	g.GetLast(pickupSpace).SetByteAttribute(typeByteAttribute, uint8(sniperWeapon))

}