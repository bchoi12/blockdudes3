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
	blockGrid BlockGrid
	teamSpawn map[uint8]Vec2
}

func NewLevel() *Level {
	return &Level {
		id: unknownLevel,
		teamSpawn: make(map[uint8]Vec2),
	}
}

func (l Level) GetId() LevelIdType {
	return l.id
}

func (l Level) GetRespawn(team uint8) Vec2 {
	if pos, ok := l.teamSpawn[team]; ok {
		return pos
	}
	return NewVec2(0, 0)
}

// TODO: currently loading is done via WASM then sent redundantly over network & skipped
func (l *Level) LoadLevel(id LevelIdType, grid *Grid) {
	l.id = id

	switch id {
	case testLevel:
		l.loadTestLevel(grid)
	default:
		Log(fmt.Sprintf("Unknown map: %d", id))
	}
}

func (l *Level) loadTestLevel(grid *Grid) {
	l.blockGrid = NewBlockGrid()
	l.blockGrid.SetYOffsets(1, 0)
	var b *Block

	{
		blockType := archBlock
		pos := l.blockGrid.GetNextPos(blockType, 0)
		color := 0x0ffc89

		building := NewBuilding(BuildingAttributes{
			pos: pos,
			blockType: blockType,
			color: color,
		})

		building.AddBlock(baseBlockSubtype)
		b = building.AddBlock(baseBlockSubtype)
		b.AddOpenings(rightCardinal)
		b = building.AddBlock(balconyBlockSubtype)
		b.AddOpenings(leftCardinal)
		b = building.AddBlock(roofBlockSubtype)
		b.LoadTemplate(weaponsBlockTemplate)

		spawn := b.Pos()
		spawn.Y += 4
		l.teamSpawn[0] = spawn

		l.blockGrid.AddBuilding(building)
	}

	{
		blockType := archBlock
		pos := l.blockGrid.GetNextPos(blockType, 8.0)
		color := 0xfc1f0f

		building := NewBuilding(BuildingAttributes{
			pos: pos,
			blockType: blockType,
			color: color,
		})

		building.AddBlock(baseBlockSubtype)
		b = building.AddBlock(baseBlockSubtype)
		b.AddOpenings(leftCardinal, rightCardinal)
		b = building.AddBlock(balconyBlockSubtype)
		b.AddOpenings(rightCardinal)
		b = building.AddBlock(baseBlockSubtype)
		b.AddOpenings(leftCardinal, rightCardinal)
		b = building.AddBlock(balconyBlockSubtype)
		b.AddOpenings(rightCardinal)
		b = building.AddBlock(roofBlockSubtype)
		b.LoadTemplate(stairsBlockTemplate)

		l.blockGrid.AddBuilding(building)
	}

	{
		blockType := archBlock
		pos := l.blockGrid.GetNextPos(blockType, 0)
		color := 0x0fdcfc

		building := NewBuilding(BuildingAttributes{
			pos: pos,
			blockType: blockType,
			color: color,
		})

		building.AddBlock(baseBlockSubtype)
		b = building.AddBlock(baseBlockSubtype)
		b.AddOpenings(leftCardinal, rightCardinal)
		b = building.AddBlock(baseBlockSubtype)
		b.AddOpenings(leftCardinal, rightCardinal)
		b.LoadTemplate(middlePlatformBlockTemplate)
		b = building.AddBlock(baseBlockSubtype)
		b.AddOpenings(rightCardinal, bottomCardinal)
		b.LoadTemplate(middlePlatformBlockTemplate)
		b = building.AddBlock(balconyBlockSubtype)
		b.AddOpenings(leftCardinal)
		b = building.AddBlock(roofBlockSubtype)
		b.AddOpenings(leftCardinal)

		l.blockGrid.AddBuilding(building)
	}

	{
		blockType := archBlock
		pos := l.blockGrid.GetNextPos(blockType, 0)
		color := 0xb50ffc

		building := NewBuilding(BuildingAttributes{
			pos: pos,
			blockType: blockType,
			color: color,
		})

		building.AddBlock(baseBlockSubtype)
		b = building.AddBlock(baseBlockSubtype)
		b.AddOpenings(leftCardinal, rightCardinal)
		b = building.AddBlock(balconyBlockSubtype)
		b.AddOpenings(leftCardinal)
		b = building.AddBlock(roofBlockSubtype)
		b.AddOpenings(leftCardinal)

		l.blockGrid.AddBuilding(building)
	}

	{
		blockType := archBlock
		pos := l.blockGrid.GetNextPos(blockType, 8)
		color := 0x0ffc89

		building := NewBuilding(BuildingAttributes{
			pos: pos,
			blockType: blockType,
			color: color,
		})

		building.AddBlock(baseBlockSubtype)
		b = building.AddBlock(baseBlockSubtype)
		b.AddOpenings(leftCardinal)
		b = building.AddBlock(balconyBlockSubtype)
		b.AddOpenings(rightCardinal)
		b = building.AddBlock(roofBlockSubtype)
		b.LoadTemplate(weaponsBlockTemplate)

		spawn := b.Pos()
		spawn.Y += 4
		l.teamSpawn[1] = spawn

		l.blockGrid.AddBuilding(building)
	}

	l.blockGrid.UpsertToGrid(grid)
}