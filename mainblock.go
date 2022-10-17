package main

type MainBlock struct {
	BaseBlock
}

func NewMainBlock(init Init) *MainBlock {
	mb := &MainBlock {
		BaseBlock: NewBaseBlock(init),
	}
	return mb
}

func (mb *MainBlock) AddBalcony(dir Vec2) {
	pos := mb.PosC(bottomCardinal)
	pos.X += FSign(dir.X) * mb.Dim().X / 2
	pos.Y += blockSizes[balconyBlockSpace][mb.GetBlockType()].Y / 2

	balc := NewBalconyBlock(NewInit(
		Id(balconyBlockSpace, 0),
		pos,
		blockSizes[balconyBlockSpace][mb.GetBlockType()],
	))
	balc.SetBlockType(mb.GetBlockType())
	balc.SetInitDir(dir)

	if color, ok := mb.GetIntAttribute(colorIntAttribute); ok {
		balc.SetIntAttribute(colorIntAttribute, color)
	}
	if color, ok := mb.GetIntAttribute(secondaryColorIntAttribute); ok {
		balc.SetIntAttribute(secondaryColorIntAttribute, color)
	}

	mb.Append(balc)
}

func (mb *MainBlock) LoadTemplate(template BlockTemplate) {
	pos := mb.PosC(bottomCardinal)
	x := pos.X
	y := pos.Y
	dim := mb.Dim()
	width := dim.X

	switch (template) {
	case weaponsBlockTemplate:
		uzi := NewPickup(NewInitC(Id(pickupSpace, 0), NewVec2(x - width / 3, y + mb.thick), NewVec2(1.2, 1.2), bottomCardinal))
		uzi.SetByteAttribute(typeByteAttribute, uint8(uziWeapon))
		uzi.SetByteAttribute(subtypeByteAttribute, uint8(grapplingHookWeapon))
		mb.objects = append(mb.objects, uzi)

		star := NewPickup(NewInitC(Id(pickupSpace, 0), NewVec2(x - width / 9, y + mb.thick), NewVec2(1.2, 1.2), bottomCardinal))
		star.SetByteAttribute(typeByteAttribute, uint8(starWeapon))
		star.SetByteAttribute(subtypeByteAttribute, uint8(boosterEquip))
		mb.objects = append(mb.objects, star)

		bazooka := NewPickup(NewInitC(Id(pickupSpace, 0), NewVec2(x + width / 9, y + mb.thick), NewVec2(1.2, 1.2), bottomCardinal))
		bazooka.SetByteAttribute(typeByteAttribute, uint8(bazookaWeapon))
		bazooka.SetByteAttribute(subtypeByteAttribute, uint8(jetpackEquip))
		mb.objects = append(mb.objects, bazooka)

		sniper := NewPickup(NewInitC(Id(pickupSpace, 0), NewVec2(x + width / 3, y + mb.thick), NewVec2(1.2, 1.2), bottomCardinal))
		sniper.SetByteAttribute(typeByteAttribute, uint8(sniperWeapon))
		sniper.SetByteAttribute(subtypeByteAttribute, uint8(chargerEquip))
		mb.objects = append(mb.objects, sniper)

	case tableBlockTemplate:
		table := NewWall(NewInitC(Id(wallSpace, 0), NewVec2(x, y + mb.thick), NewVec2(3, 1), bottomCardinal))
		table.SetByteAttribute(subtypeByteAttribute, uint8(tableWallSubtype))
		table.AddAttribute(visibleAttribute)
		table.SetIntAttribute(colorIntAttribute, tableColor)
		mb.objects = append(mb.objects, table)
	}
}

func (mb *MainBlock) LoadSidedTemplate(template SidedBlockTemplate, cardinal Cardinal) {
	pos := mb.PosC(bottomCardinal)
	x := pos.X
	y := pos.Y
	dim := mb.Dim()
	width := dim.X

	baseDim := blockSizes[mainBlockSpace][mb.blockType]
	baseHeight := baseDim.Y

	dir := 1.0
	origin := bottomRightCardinal
	innerDimZ := blockDimZs[mb.blockType] - 2 * mb.thick
	if cardinal.AnyLeft() {
		dir = -1
		origin = bottomLeftCardinal
	}

	switch (template) {
	case stairsSidedBlockTemplate:
		wall := NewWall(NewInitC(Id(wallSpace, 0),
			NewVec2(x + dir * width / 2, y + mb.thick),
			NewVec2(mb.thick, baseHeight), origin))
		wall.AddAttribute(visibleAttribute)
		wall.SetFloatAttribute(dimZFloatAttribute, innerDimZ / 2)
		if color, ok := mb.GetIntAttribute(secondaryColorIntAttribute); ok {
			wall.SetIntAttribute(colorIntAttribute, color)
		}
		mb.objects = append(mb.objects, wall)

		numStairs := 8.0
		stairWidth := baseHeight / numStairs
		stairHeight := stairWidth
		for i := 0.0; i < numStairs; i += 1 {
			stairInit := NewInitC(Id(wallSpace, 0),
				NewVec2(x + dir * (width / 2 - i * stairWidth - mb.thick), y + mb.thick),
				NewVec2(stairWidth, baseHeight - i * stairHeight), origin)
			stairInit.SetInitDir(NewVec2(-dir, 0))
			stair := NewWall(stairInit)
			stair.SetByteAttribute(typeByteAttribute, uint8(stairWall))
			stair.AddAttribute(visibleAttribute)
			stair.SetFloatAttribute(dimZFloatAttribute, innerDimZ / 2)

			if color, ok := mb.GetIntAttribute(secondaryColorIntAttribute); ok {
				stair.SetIntAttribute(colorIntAttribute, color)
			}

			mb.objects = append(mb.objects, stair)
		}
	}
}

func (mb *MainBlock) Load() {
	mb.BaseBlock.Load()

	pos := mb.PosC(bottomCardinal)
	x := pos.X
	y := pos.Y
	dim := mb.Dim()
	width := dim.X
	height := dim.Y

	switch (mb.GetBlockType()) {
	case archBlock:
		if mb.openings.AnyBottom() {
			if !mb.openings.Get(bottomLeftCardinal) {
				left := NewInitC(Id(wallSpace, 0), NewVec2(x - width / 2, y), NewVec2(width / 2, mb.thick), bottomLeftCardinal)
				mb.objects = append(mb.objects, NewWall(left))
			}

			if !mb.openings.Get(bottomRightCardinal) {
				right := NewInitC(Id(wallSpace, 0), NewVec2(x + width / 2, y), NewVec2(width / 2, mb.thick), bottomRightCardinal)
				mb.objects = append(mb.objects, NewWall(right))
			}
		} else {
			floor := NewInitC(Id(wallSpace, 0), pos, NewVec2(width, mb.thick), bottomCardinal)
			mb.objects = append(mb.objects, NewWall(floor))
		}

		leftOpening := 0.0
		if mb.openings.Get(leftCardinal) {
			leftOpening = mb.sideOpening
		}
		left := NewInitC(Id(wallSpace, 0), NewVec2(x - width / 2, y + leftOpening * height), NewVec2(mb.thick, (1.0 - leftOpening) * height), bottomLeftCardinal)
		mb.objects = append(mb.objects, NewWall(left))

		rightOpening := 0.0
		if mb.openings.Get(rightCardinal) {
			rightOpening = mb.sideOpening
		}
		right := NewInitC(Id(wallSpace, 0), NewVec2(x + width / 2, y + rightOpening * height), NewVec2(mb.thick, (1.0 - rightOpening) * height), bottomRightCardinal)
		mb.objects = append(mb.objects, NewWall(right))
	}
}