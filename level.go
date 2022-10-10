package main

import (
	"fmt"
	"math/rand"
)

type LevelIdType uint8
const (
	unknownLevel LevelIdType = iota
	testLevel
)
type LevelSeedType uint32

type Level struct {
	id LevelIdType
	seed LevelSeedType
	blockGrid BlockGrid
}

func NewLevel() *Level {
	return &Level {
		id: unknownLevel,
		seed: 0,
	}
}

func (l Level) GetId() LevelIdType {
	return l.id
}

func (l Level) GetSeed() LevelSeedType {
	return l.seed
}

// TODO: currently loading is done via WASM then sent redundantly over network & skipped
func (l *Level) LoadLevel(id LevelIdType, seed LevelSeedType, grid *Grid) {
	l.id = id
	l.seed = seed

	switch id {
	case testLevel:
		l.loadTestLevel(seed, grid)
	default:
		Log(fmt.Sprintf("Unknown map: %d", id))
	}
}

func (l *Level) loadTestLevel(seed LevelSeedType, grid *Grid) {
	l.blockGrid = NewBlockGrid()
	var b *Block
	r := rand.New(rand.NewSource(int64(seed)))
	colors := [...]int {archRed, archOrange, archYellow, archGreen, archBlue, archPurple}
	r.Shuffle(len(colors), func(i, j int) { colors[i], colors[j] = colors[j], colors[i] })

	blockType := archBlock

	{
		pos := l.blockGrid.GetNextPos(blockType, 0)
		color := 0x444444

		building := NewBuilding(BuildingAttributes{
			pos: pos,
			blockType: blockType,
			color: color,
		})

		building.AddBlock(baseBlockSubtype)
		building.AddBlock(baseBlockSubtype)
		b = building.AddBlock(baseBlockSubtype)
		b.AddOpenings(leftCardinal, rightCardinal)
		balc := building.AddBlock(balconyBlockSubtype)
		balc.SetInitDir(NewVec2(-1, 0))

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
		pos := l.blockGrid.GetNextPos(blockType, 0)
		color := 0x444444

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
		pos := l.blockGrid.GetNextPos(blockType, 0)
		color := 0x444444

		building := NewBuilding(BuildingAttributes{
			pos: pos,
			blockType: blockType,
			color: color,
		})

		building.AddBlock(baseBlockSubtype)
		building.AddBlock(baseBlockSubtype)
		b = building.AddBlock(baseBlockSubtype)
		b.AddOpenings(leftCardinal, rightCardinal)
		balc := building.AddBlock(balconyBlockSubtype)
		balc.SetInitDir(NewVec2(1, 0))

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

	defaultGap := 9.0
	gapChance := NewGrowingChance(r, 20, 20)

	currentHeight := 1
	heightChance := NewGrowingChance(r, 30, 15)

	growChance := NewGrowingChance(r, 60, 20)

	numBuildings := 8

	l.blockGrid.SetYOffsets(2, 0)

	for i := 0; i < numBuildings; i += 1 {
		r.Seed(int64(seed) + int64(numBuildings * i))

		gap := 0.0
		if i == 0 {
			gap = 20
		} else if gapChance.Roll() {
			gap = defaultGap
		} else if heightChance.Roll() {
			currentHeight += 1
		}

		pos := l.blockGrid.GetNextPos(blockType, gap)
		color := colors[i % len(colors)]

		building := NewBuilding(BuildingAttributes{
			pos: pos,
			blockType: blockType,
			color: color,
		})

		height := currentHeight
		if growChance.Roll() {
			height += 1
		}
		for j := 0; j < height; j += 1 {
			b = building.AddBlock(baseBlockSubtype)
			b.AddOpenings(leftCardinal, rightCardinal)
		}
		b = building.AddBlock(roofBlockSubtype)

		if i == 0 {
			spawn := NewSpawn(NewInit(
				Id(spawnSpace, 1),
				NewVec2(b.Pos().X, b.Pos().Y + b.Dim().Y / 2),
				NewVec2(1, 1),
			))
			grid.Upsert(spawn)
		}
		if i == numBuildings - 1 {
			spawn := NewSpawn(NewInit(
				Id(spawnSpace, 2),
				NewVec2(b.Pos().X, b.Pos().Y + b.Dim().Y / 2),
				NewVec2(1, 1),
			))
			grid.Upsert(spawn)

			goal := NewGoal(NewInitC(
				grid.NextSpacedId(goalSpace),
				NewVec2(b.Pos().X, b.Pos().Y + b.Thickness()),
				NewVec2(b.Dim().X / 2, 2),
				bottomCardinal))
			goal.SetFloatAttribute(dimZFloatAttribute, blockDimZs[blockType] / 2)
			goal.SetTeam(1)
			grid.Upsert(goal)
		}

		l.blockGrid.AddBuilding(building)
	}

	l.blockGrid.UpsertToGrid(grid)
}