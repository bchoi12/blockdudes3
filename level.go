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

// TODO: currently loading is done via WASM then sent redundantly over network & skipped
func (l *Level) loadTestLevel() {
	g := l.grid

	blockGrid := NewBlockGrid()
	blockGrid.SetYOffsets(1, 0, 1)
	var b *Block

	{
		blockType := archBlock
		pos := blockGrid.GetNextPos(blockType, 0)
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

		blockGrid.AddBuilding(building)
	}

	{
		blockType := archBlock
		pos := blockGrid.GetNextPos(blockType, 8.0)
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
		b.AddOpenings(rightCardinal)

		blockGrid.AddBuilding(building)
	}

	{
		blockType := archBlock
		pos := blockGrid.GetNextPos(blockType, 0)
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
		b.AddOpenings(leftCardinal, rightCardinal, downCardinal)
		b.LoadTemplate(middlePlatformBlockTemplate)
		b = building.AddBlock(balconyBlockSubtype)
		b.AddOpenings(leftCardinal)
		b = building.AddBlock(roofBlockSubtype)

		blockGrid.AddBuilding(building)
	}

	{
		blockType := archBlock
		pos := blockGrid.GetNextPos(blockType, 0)
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

		blockGrid.AddBuilding(building)
	}

	{
		blockType := archBlock
		pos := blockGrid.GetNextPos(blockType, 8)
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

		blockGrid.AddBuilding(building)
	}

	blockGrid.UpsertToGrid(g)
}