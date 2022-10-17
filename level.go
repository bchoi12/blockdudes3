package main

import (
	"fmt"
	"math/rand"
)

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
		id: lobbyLevel,
		seed: 0,
	}
}

func (l Level) GetId() LevelIdType {
	return l.id
}

func (l Level) GetSeed() LevelSeedType {
	return l.seed
}

func (l *Level) LoadLevel(id LevelIdType, seed LevelSeedType, grid *Grid) {
	l.id = id
	l.seed = seed
	l.Clear(grid)

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

	for _, object := range(grid.GetAllObjects()) {
		if !object.HasAttribute(fromLevelAttribute) {
			continue
		}
		grid.HardDelete(object.GetSpacedId())
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

		pos := b.PosC(bottomCardinal)
		portal := NewPortal(NewInitC(
			Id(portalSpace, 0),
			NewVec2(pos.X, pos.Y + b.GetThickness()),
			NewVec2(b.Dim().X / 2, 2),
			bottomCardinal))
		portal.SetFloatAttribute(dimZFloatAttribute, blockDimZs[archBlock] / 2)
		portal.SetTeam(1)
		b.AddObject(portal)
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
			b.Pos(),
			NewVec2(6, 1),
		))
		spawn.SetByteAttribute(teamByteAttribute, 0)
		b.AddObject(spawn)

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

		pos := b.PosC(bottomCardinal)
		portal := NewPortal(NewInitC(
			Id(portalSpace, 0),
			NewVec2(pos.X, pos.Y + b.GetThickness()),
			NewVec2(b.Dim().X / 2, 2),
			bottomCardinal))
		portal.SetFloatAttribute(dimZFloatAttribute, blockDimZs[archBlock] / 2)
		portal.SetTeam(2)
		b.AddObject(portal)
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

	numBuildings := 6 + r.Intn(3)

	l.blockGrid.SetYOffsets(2, 0)

	for i := 0; i < numBuildings; i += 1 {
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
			roof := building.GetRoof()
			roof.LoadTemplate(weaponsBlockTemplate)
			spawn := NewSpawn(NewInit(
				Id(spawnSpace, 0),
				NewVec2(roof.Pos().X, roof.Pos().Y + 1),
				NewVec2(6, 1),
			))
			spawn.SetByteAttribute(teamByteAttribute, 1)
			roof.AddObject(spawn)
		}

		if i == numBuildings - 1 {
			roof := building.GetRoof()
			pos := roof.PosC(bottomCardinal)
			goal := NewGoal(NewInitC(
				Id(goalSpace, 0),
				NewVec2(pos.X, pos.Y + roof.GetThickness()),
				NewVec2(roof.Dim().X / 2, 2),
				bottomCardinal))
			goal.SetFloatAttribute(dimZFloatAttribute, blockDimZs[archBlock] / 2)
			goal.SetTeam(1)
			roof.AddObject(goal)

			building := l.blockGrid.AddBuilding(BuildingAttributes{
				gap: defaultGap / 2,
				blockType: archBlock,
				color: colors[numBuildings % len(colors)],
				secondaryColor: archWhite,
				height: height,
			})
			backRoof := building.GetRoof()
			backRoof.LoadTemplate(weaponsBlockTemplate)

			spawn := NewSpawn(NewInit(
				Id(spawnSpace, 0),
				NewVec2(backRoof.Pos().X, backRoof.Pos().Y + 1),
				NewVec2(6, 1),
			))
			spawn.SetByteAttribute(teamByteAttribute, 2)
			backRoof.AddObject(spawn)
		}
	}

	l.blockGrid.Connect()
	l.blockGrid.Randomize(r)
}