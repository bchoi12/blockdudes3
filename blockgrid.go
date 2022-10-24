package main

import (
	"math/rand"
)

const (
	buildingStartY float64 = -9.0
)

type BuildingAttributes struct {
	gap float64
	blockType BlockType
	color int
	secondaryColor int
	height int
}

type Building struct {
	attributes BuildingAttributes

	pos Vec2
	blocks []*MainBlock
	roof *RoofBlock
}

func (b Building) GetBlock(level int) *MainBlock {
	if level < 0 || level >= len(b.blocks) {
		return nil
	}
	return b.blocks[level]
}

func (b Building) GetRoof() *RoofBlock {
	return b.roof
}

func (b *Building) UpsertToGrid(g *Grid) {
	for _, block := range(b.blocks) {
		block.Load()
		block.UpsertToGrid(g)
	}
}

type BlockGrid struct {
	buildings []*Building

	yOffsets []float64
	curOffset int
}

func NewBlockGrid() BlockGrid {
	bg := BlockGrid {
		buildings: make([]*Building, 0),
	}

	bg.yOffsets = make([]float64, 1)
	bg.yOffsets[0] = 0
	bg.curOffset = 0

	return bg
}

func (bg *BlockGrid) SetYOffsets(offsets ...float64) {
	bg.yOffsets = make([]float64, len(offsets))
	for i, offset := range(offsets) {
		bg.yOffsets[i] = offset
	}
}

func (bg *BlockGrid) AddBuilding(attributes BuildingAttributes) *Building {
	building := &Building {
		attributes: attributes,

		pos: bg.nextPos(attributes),
		blocks: make([]*MainBlock, attributes.height),
	}

	currentPos := building.pos
	for i := 0; i < len(building.blocks); i += 1 {
		block := NewMainBlock(NewInitC(
			Id(mainBlockSpace, 0),
			currentPos,
			blockSizes[mainBlockSpace][attributes.blockType],
			bottomCardinal,
		))
		block.SetBlockType(attributes.blockType)
		block.SetIntAttribute(colorIntAttribute, attributes.color)
		block.SetIntAttribute(secondaryColorIntAttribute, attributes.secondaryColor)
		building.blocks[i] = block

		currentPos.Y += block.Dim().Y

		if i == len(building.blocks) - 1 {
			roof := NewRoofBlock(NewInitC(
				Id(roofBlockSpace, 0),
				currentPos,
				blockSizes[roofBlockSpace][attributes.blockType],
				bottomCardinal,
			))
			roof.SetBlockType(attributes.blockType)
			roof.SetIntAttribute(colorIntAttribute, attributes.color)
			roof.SetIntAttribute(secondaryColorIntAttribute, attributes.secondaryColor)

			building.roof = roof
			block.Append(roof)
		}
	}

	bg.buildings = append(bg.buildings, building)
	return building
}

func (bg *BlockGrid) Connect(r *rand.Rand) {
	for i := 0; i < len(bg.buildings); i += 1 {
		building := bg.buildings[i]
		var prevBuilding, nextBuilding *Building
		if i < len(bg.buildings) - 1 && bg.buildings[i+1].attributes.gap == 0 {
			nextBuilding = bg.buildings[i + 1]
		}
		if i > 0 && building.attributes.gap == 0 {
			prevBuilding = bg.buildings[i - 1]
		}

		for j := 0; j < len(building.blocks); j += 1 {
			block := building.blocks[j]
			var nextBlock Block
			if nextBuilding != nil && len(nextBuilding.blocks) >= len(building.blocks) {
				nextBlock = nextBuilding.blocks[j]
			}

			if block.GetOpening(leftCardinal) && (prevBuilding == nil || j > len(prevBuilding.blocks)) {
				block.AddBalcony(NewVec2(-1, 0))
			}
			if block.GetOpening(rightCardinal) && (nextBuilding == nil || j > len(nextBuilding.blocks)) {
				block.AddBalcony(NewVec2(1, 0))
			}

			if nextBlock != nil && block.GetOpening(leftCardinal) && block.GetOpening(rightCardinal) {
				if !nextBlock.GetOpening(leftCardinal) {
					if len(building.blocks) >= j + 1 && len(nextBuilding.blocks) >= len(building.blocks) && !block.AnyOpenings(bottomLeftCardinal, bottomCardinal, bottomRightCardinal) {
						block.LoadSidedTemplate(stairsSidedBlockTemplate, NewRightCardinal())

						if len(building.blocks) > j + 1 {
							building.blocks[j].AddOpenings(topCardinal)
							building.blocks[j + 1].AddOpenings(bottomRightCardinal)
						} else {
							roof := building.GetRoof()
							roof.AddOpenings(bottomRightCardinal, rightCardinal)
						}

						if len(nextBuilding.blocks) > j + 1 {
							nextBuilding.blocks[j + 1].AddOpenings(leftCardinal, rightCardinal)
						} else {
							roof := nextBuilding.GetRoof()
							roof.AddOpenings(leftCardinal)
						}
					} else {
						nextBlock.AddOpenings(leftCardinal, rightCardinal)
					}
					continue
				} else {
					if len(building.blocks) >= j + 1 && len(nextBuilding.blocks) >= len(building.blocks) && !block.AnyOpenings(bottomLeftCardinal, bottomCardinal, bottomRightCardinal) && r.Intn(100) < 50 {
						block.LoadSidedTemplate(stairsSidedBlockTemplate, NewRightCardinal())
						nextBlock.RemoveOpenings(leftCardinal)

						if len(building.blocks) > j + 1 {
							building.blocks[j].AddOpenings(topCardinal)
							building.blocks[j + 1].AddOpenings(bottomRightCardinal)
						} else {
							roof := building.GetRoof()
							roof.AddOpenings(bottomRightCardinal, rightCardinal)
						}

						if len(nextBuilding.blocks) > j + 1 {
							nextBuilding.blocks[j].RemoveOpenings(leftCardinal, rightCardinal)
							nextBuilding.blocks[j + 1].AddOpenings(leftCardinal, rightCardinal)
						} else {
							roof := nextBuilding.GetRoof()
							roof.AddOpenings(leftCardinal)
						}
					}
					continue
				}
			}
		}

		r := building.GetRoof()
		if prevBuilding != nil && len(prevBuilding.blocks) > len(building.blocks) && prevBuilding.blocks[len(building.blocks)].GetOpening(rightCardinal) {
			r.AddOpenings(leftCardinal)
		}
		if nextBuilding != nil && len(nextBuilding.blocks) > len(building.blocks) && nextBuilding.blocks[len(building.blocks)].GetOpening(leftCardinal) {
			r.AddOpenings(rightCardinal)
		}
	}
}

func (bg *BlockGrid) Randomize(r *rand.Rand) {
	for _, building := range(bg.buildings) {
		for _, block := range(building.blocks) {
			if block.AnyOpenings(leftCardinal, rightCardinal) && !block.AnyOpenings(bottomLeftCardinal, bottomCardinal, bottomRightCardinal) && r.Intn(100) < 20 {
				block.LoadTemplate(tableBlockTemplate)
			}
		}
	}
}

func (bg *BlockGrid) UpsertToGrid(g *Grid) {
	for _, building := range(bg.buildings) {
		building.UpsertToGrid(g)
	}
}

func (bg *BlockGrid) nextPos(attributes BuildingAttributes) Vec2 {
	blockType := attributes.blockType
	gap := attributes.gap

	if len(bg.buildings) == 0 {
		return NewVec2(0, bg.nextY())
	}

	building := bg.buildings[len(bg.buildings) - 1]
	lastPos := building.pos

	lastPos.X += blockSizes[mainBlockSpace][building.attributes.blockType].X / 2
	lastPos.X += gap
	lastPos.X += blockSizes[mainBlockSpace][blockType].X / 2

	if gap > 0 {
		lastPos.Y = bg.nextY()
	}

	return lastPos
}

func (bg *BlockGrid) nextY() float64 {
	y := buildingStartY + bg.yOffsets[bg.curOffset]
	bg.curOffset += 1
	if bg.curOffset >= len(bg.yOffsets) {
		bg.curOffset = 0
	}

	return y
}