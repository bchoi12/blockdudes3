package main

import (
	"fmt"
	"math/rand"
)

var levelSpaces = map[SpaceType]bool {
	mainBlockSpace: true,
	roofBlockSpace: true,
	balconyBlockSpace: true,
	wallSpace: true,
	pickupSpace: true,
	portalSpace: true,
	goalSpace: true,
	spawnSpace: true,
}

type LevelIdType uint8
const (
	unknownLevel LevelIdType = iota
	lobbyLevel
	birdTownLevel
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
	l.Clear(grid)

	l.id = id
	l.seed = seed

	switch id {
	case lobbyLevel:
		l.loadLobby(grid)
	case birdTownLevel:
		l.loadBirdTown(seed, grid)
	default:
		Log(fmt.Sprintf("Unknown map: %d", id))
		return
	}

	l.blockGrid.UpsertToGrid(grid)
}

func (l *Level) Clear(grid *Grid) {
	l.blockGrid = NewBlockGrid()
	for space, _ := range(levelSpaces) {
		for _, object := range(grid.GetObjects(space)) {
			grid.Delete(object.GetSpacedId())
		}
	} 
}

func (l *Level) loadLobby(grid *Grid) {
	var b *MainBlock
	var r *RoofBlock

	{
		building := l.blockGrid.AddBuilding(BuildingAttributes{
			gap: 0,
			blockType: archBlock,
			color: 0x444444,
			secondaryColor: archWhite,
			height: 3,
		})

		b = building.GetBlock(2)
		b.AddOpenings(leftCardinal, rightCardinal)
		b.AddBalcony(NewVec2(-1, 0))
		r = building.GetRoof()
		r.AddOpenings(rightCardinal)

		portal := NewPortal(NewInitC(
			grid.NextSpacedId(portalSpace),
			NewVec2(b.Pos().X, b.Pos().Y + b.GetThickness()),
			NewVec2(b.Dim().X / 2, 2),
			bottomCardinal))
		portal.SetFloatAttribute(dimZFloatAttribute, blockDimZs[archBlock] / 2)
		portal.SetTeam(1)
		grid.Upsert(portal)
	}

	{
		building := l.blockGrid.AddBuilding(BuildingAttributes{
			gap: 0,
			blockType: archBlock,
			color: 0x444444,
			secondaryColor: archWhite,
			height: 4,
		})

		b = building.GetBlock(2)
		b.AddOpenings(leftCardinal, rightCardinal)
		b.LoadTemplate(weaponsBlockTemplate)

		spawn := NewSpawn(NewInit(
			Id(spawnSpace, 0),
			NewVec2(b.Pos().X, b.Pos().Y + b.Dim().Y / 2),
			NewVec2(1, 1),
		))
		grid.Upsert(spawn)

		b = building.GetBlock(3)
		b.AddOpenings(leftCardinal, rightCardinal)
	}

	{
		building := l.blockGrid.AddBuilding(BuildingAttributes{
			gap: 0,
			blockType: archBlock,
			color: 0x444444,
			secondaryColor: archWhite,
			height: 3,
		})

		b = building.GetBlock(2)
		b.AddOpenings(leftCardinal, rightCardinal)
		b.AddBalcony(NewVec2(1, 0))
		r = building.GetRoof()
		r.AddOpenings(leftCardinal)

		portal := NewPortal(NewInitC(
			grid.NextSpacedId(portalSpace),
			NewVec2(b.Pos().X, b.Pos().Y + b.GetThickness()),
			NewVec2(b.Dim().X / 2, 2),
			bottomCardinal))
		portal.SetFloatAttribute(dimZFloatAttribute, blockDimZs[archBlock] / 2)
		portal.SetTeam(2)
		grid.Upsert(portal)
	}
}

func (l *Level) loadBirdTown(seed LevelSeedType, grid *Grid) {
	colors := [...]int {archRed, archOrange, archYellow, archGreen, archBlue, archPurple}
	r := rand.New(rand.NewSource(int64(seed)))
	r.Shuffle(len(colors), func(i, j int) { colors[i], colors[j] = colors[j], colors[i] })

	var b *MainBlock

	defaultGap := 9.0
	gapChance := NewGrowingChance(r, 15, 15)

	currentHeight := 1
	heightChance := NewGrowingChance(r, 50, 30)

	growChance := NewGrowingChance(r, 70, 20)

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

		color := colors[i % len(colors)]
		height := currentHeight
		if growChance.Roll() {
			height += 1
		}

		building := l.blockGrid.AddBuilding(BuildingAttributes{
			gap: gap,
			blockType: archBlock,
			color: color,
			secondaryColor: archWhite,
			height: height,
		})

		for j := IntMax(1, height - 2); j < height; j += 1 {
			b = building.GetBlock(j)

			if i > 0 {
				b.AddOpenings(leftCardinal)
			}
			if i < numBuildings - 1 {
				b.AddOpenings(rightCardinal)
			}
		}

		if i == 0 {
			r := building.GetRoof()
			spawn := NewSpawn(NewInit(
				Id(spawnSpace, 1),
				NewVec2(r.Pos().X, r.Pos().Y + 2),
				NewVec2(1, 1),
			))
			grid.Upsert(spawn)
		}

		if i == numBuildings - 1 {
			r := building.GetRoof()
			spawn := NewSpawn(NewInit(
				Id(spawnSpace, 2),
				NewVec2(r.Pos().X, r.Pos().Y + r.Dim().Y + 2),
				NewVec2(1, 1),
			))
			grid.Upsert(spawn)

			goal := NewGoal(NewInitC(
				grid.NextSpacedId(goalSpace),
				NewVec2(r.Pos().X, r.Pos().Y + r.GetThickness()),
				NewVec2(r.Dim().X / 2, 2),
				bottomCardinal))
			goal.SetFloatAttribute(dimZFloatAttribute, blockDimZs[archBlock] / 2)
			goal.SetTeam(1)
			grid.Upsert(goal)
		}
	}

	l.blockGrid.Connect()
	l.blockGrid.Randomize(r)
	l.blockGrid.UpsertToGrid(grid)
}