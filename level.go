package main

import (
	"fmt"
)

type LevelIdType uint8
const (
	unknownLevel LevelIdType = iota
	testLevel
)
type LevelSeedType uint32

type Level struct {
	id LevelIdType
	blockGrid BlockGrid
}

func NewLevel() *Level {
	return &Level {
		id: unknownLevel,
	}
}

func (l Level) GetId() LevelIdType {
	return l.id
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
	var b *Block

	{
		blockType := archBlock
		pos := l.blockGrid.GetNextPos(blockType, 0)
		color := teamColors[1]

		building := NewBuilding(BuildingAttributes{
			pos: pos,
			blockType: blockType,
			color: color,
		})

		building.AddBlock(baseBlockSubtype)
		building.AddBlock(baseBlockSubtype)
		b = building.AddBlock(baseBlockSubtype)
		b.AddOpenings(rightCardinal)

		portal := NewPortal(NewInitC(
			grid.NextSpacedId(portalSpace),
			NewVec2(b.Pos().X, b.Pos().Y + b.Thickness()),
			NewVec2(b.Dim().X / 2, 2),
			bottomCardinal))
		portal.SetFloatAttribute(dimZFloatAttribute, blockDimZs[blockType] / 2)
		portal.SetTeam(1)
		grid.Upsert(portal)

		b = building.AddBlock(roofBlockSubtype)
		b.AddOpenings(rightCardinal)

		l.blockGrid.AddBuilding(building)
	}

	{
		blockType := archBlock
		pos := l.blockGrid.GetNextPos(blockType, 0)
		color := teamColors[0]

		building := NewBuilding(BuildingAttributes{
			pos: pos,
			blockType: blockType,
			color: color,
		})

		building.AddBlock(baseBlockSubtype)
		building.AddBlock(baseBlockSubtype)
		b = building.AddBlock(baseBlockSubtype)
		b.AddOpenings(leftCardinal, rightCardinal)
		b.LoadTemplate(weaponsBlockTemplate)

		spawn := NewSpawn(NewInit(
			Id(spawnSpace, 0),
			NewVec2(b.Pos().X, b.Pos().Y + b.Dim().Y / 2),
			NewVec2(1, 1),
		))
		grid.Upsert(spawn)

		b = building.AddBlock(roofBlockSubtype)
		b.AddOpenings(leftCardinal, rightCardinal)

		l.blockGrid.AddBuilding(building)
	}

	{
		blockType := archBlock
		pos := l.blockGrid.GetNextPos(blockType, 0)
		color := teamColors[2]

		building := NewBuilding(BuildingAttributes{
			pos: pos,
			blockType: blockType,
			color: color,
		})

		building.AddBlock(baseBlockSubtype)
		building.AddBlock(baseBlockSubtype)
		b = building.AddBlock(baseBlockSubtype)
		b.AddOpenings(leftCardinal)

		portal := NewPortal(NewInitC(
			grid.NextSpacedId(portalSpace),
			NewVec2(b.Pos().X, b.Pos().Y + b.Thickness()),
			NewVec2(b.Dim().X / 2, 2),
			bottomCardinal))
		portal.SetFloatAttribute(dimZFloatAttribute, blockDimZs[blockType] / 2)
		portal.SetTeam(2)
		grid.Upsert(portal)

		b = building.AddBlock(roofBlockSubtype)
		b.AddOpenings(leftCardinal)

		l.blockGrid.AddBuilding(building)
	}

	l.blockGrid.SetYOffsets(2, 0)

	{
		blockType := archBlock
		pos := l.blockGrid.GetNextPos(blockType, 20)
		color := archGreen

		building := NewBuilding(BuildingAttributes{
			pos: pos,
			blockType: blockType,
			color: color,
		})

		building.AddBlock(baseBlockSubtype)
		b = building.AddBlock(baseBlockSubtype)
		b.AddOpenings(rightCardinal)
		b = building.AddBlock(balconyBlockSubtype)
		b.SetInitDir(NewVec2(1, 0))
		b = building.AddBlock(roofBlockSubtype)

		goal := NewGoal(NewInitC(
			grid.NextSpacedId(goalSpace),
			NewVec2(b.Pos().X, b.Pos().Y + b.Thickness()),
			NewVec2(b.Dim().X / 2, 2),
			bottomCardinal))
		goal.SetFloatAttribute(dimZFloatAttribute, blockDimZs[blockType] / 2)
		goal.SetTeam(2)
		grid.Upsert(goal)

		spawn := NewSpawn(NewInit(
			Id(spawnSpace, 1),
			NewVec2(b.Pos().X, b.Pos().Y + b.Dim().Y / 2),
			NewVec2(1, 1),
		))
		grid.Upsert(spawn)

		l.blockGrid.AddBuilding(building)
	}

	{
		blockType := archBlock
		pos := l.blockGrid.GetNextPos(blockType, 9.0)
		color := archRed

		building := NewBuilding(BuildingAttributes{
			pos: pos,
			blockType: blockType,
			color: color,
		})

		building.AddBlock(baseBlockSubtype)
		b = building.AddBlock(baseBlockSubtype)
		b.AddOpenings(leftCardinal, rightCardinal)
		b = building.AddBlock(balconyBlockSubtype)
		b.SetInitDir(NewVec2(-1, 0))
		b = building.AddBlock(baseBlockSubtype)
		b.AddOpenings(leftCardinal, rightCardinal)
		b = building.AddBlock(balconyBlockSubtype)
		b.SetInitDir(NewVec2(-1, 0))
		b = building.AddBlock(roofBlockSubtype)
		b.AddOpenings(rightCardinal)

		l.blockGrid.AddBuilding(building)
	}

	{
		blockType := archBlock
		pos := l.blockGrid.GetNextPos(blockType, 0)
		color := archBlue

		building := NewBuilding(BuildingAttributes{
			pos: pos,
			blockType: blockType,
			color: color,
		})

		building.AddBlock(baseBlockSubtype)
		b = building.AddBlock(baseBlockSubtype)
		b.AddOpenings(leftCardinal, rightCardinal)
		b.LoadTemplate(tableBlockTemplate)
		b = building.AddBlock(baseBlockSubtype)
		b.AddOpenings(leftCardinal)
		b.LoadSidedTemplate(stairsSidedBlockTemplate, NewRightCardinal())
		b = building.AddBlock(baseBlockSubtype)
		b.AddOpenings(leftCardinal, bottomRightCardinal, rightCardinal)
		b = building.AddBlock(balconyBlockSubtype)
		b.SetInitDir(NewVec2(1, 0))
		b = building.AddBlock(roofBlockSubtype)

		l.blockGrid.AddBuilding(building)
	}

	{
		blockType := archBlock
		pos := l.blockGrid.GetNextPos(blockType, 0)
		color := archPurple

		building := NewBuilding(BuildingAttributes{
			pos: pos,
			blockType: blockType,
			color: color,
		})

		building.AddBlock(baseBlockSubtype)
		b = building.AddBlock(baseBlockSubtype)
		b.AddOpenings(leftCardinal, rightCardinal)
		b = building.AddBlock(balconyBlockSubtype)
		b.SetInitDir(NewVec2(1, 0))
		b = building.AddBlock(roofBlockSubtype)
		b.AddOpenings(leftCardinal)
		b.LoadTemplate(middlePlatformBlockTemplate)

		l.blockGrid.AddBuilding(building)
	}

	{
		blockType := archBlock
		pos := l.blockGrid.GetNextPos(blockType, 9.0)
		color := archGreen

		building := NewBuilding(BuildingAttributes{
			pos: pos,
			blockType: blockType,
			color: color,
		})

		building.AddBlock(baseBlockSubtype)
		b = building.AddBlock(baseBlockSubtype)
		b.AddOpenings(leftCardinal)
		b = building.AddBlock(balconyBlockSubtype)
		b.SetInitDir(NewVec2(-1, 0))
		b = building.AddBlock(roofBlockSubtype)

		goal := NewGoal(NewInitC(
			grid.NextSpacedId(goalSpace),
			NewVec2(b.Pos().X, b.Pos().Y + b.Thickness()),
			NewVec2(b.Dim().X / 2, 2),
			bottomCardinal))
		goal.SetFloatAttribute(dimZFloatAttribute, blockDimZs[blockType] / 2)
		goal.SetTeam(1)
		grid.Upsert(goal)

		spawn := NewSpawn(NewInit(
			Id(spawnSpace, 2),
			NewVec2(b.Pos().X, b.Pos().Y + b.Dim().Y / 2),
			NewVec2(1, 1),
		))
		grid.Upsert(spawn)

		l.blockGrid.AddBuilding(building)
	}

	l.blockGrid.UpsertToGrid(grid)
}