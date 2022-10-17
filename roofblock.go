package main

type RoofBlock struct {
	BaseBlock
}

func NewRoofBlock(init Init) *RoofBlock {
	rb := &RoofBlock {
		BaseBlock: NewBaseBlock(init),
	}
	return rb
}

func (rb *RoofBlock) LoadTemplate(template BlockTemplate) {
	pos := rb.PosC(bottomCardinal)
	x := pos.X
	y := pos.Y
	dim := rb.Dim()
	width := dim.X

	switch (template) {
	case weaponsBlockTemplate:
		uzi := NewPickup(NewInitC(Id(pickupSpace, 0), NewVec2(x - width / 3, y + rb.thick), NewVec2(1.2, 1.2), bottomCardinal))
		uzi.SetByteAttribute(typeByteAttribute, uint8(uziWeapon))
		uzi.SetByteAttribute(subtypeByteAttribute, uint8(grapplingHookWeapon))
		rb.objects = append(rb.objects, uzi)

		star := NewPickup(NewInitC(Id(pickupSpace, 0), NewVec2(x - width / 9, y + rb.thick), NewVec2(1.2, 1.2), bottomCardinal))
		star.SetByteAttribute(typeByteAttribute, uint8(starWeapon))
		star.SetByteAttribute(subtypeByteAttribute, uint8(boosterEquip))
		rb.objects = append(rb.objects, star)

		bazooka := NewPickup(NewInitC(Id(pickupSpace, 0), NewVec2(x + width / 9, y + rb.thick), NewVec2(1.2, 1.2), bottomCardinal))
		bazooka.SetByteAttribute(typeByteAttribute, uint8(bazookaWeapon))
		bazooka.SetByteAttribute(subtypeByteAttribute, uint8(jetpackEquip))
		rb.objects = append(rb.objects, bazooka)

		sniper := NewPickup(NewInitC(Id(pickupSpace, 0), NewVec2(x + width / 3, y + rb.thick), NewVec2(1.2, 1.2), bottomCardinal))
		sniper.SetByteAttribute(typeByteAttribute, uint8(sniperWeapon))
		sniper.SetByteAttribute(subtypeByteAttribute, uint8(chargerEquip))
		rb.objects = append(rb.objects, sniper)
	}
}


func (rb *RoofBlock) Load() {
	rb.BaseBlock.Load()

	pos := rb.PosC(bottomCardinal)
	x := pos.X
	y := pos.Y
	dim := rb.Dim()
	width := dim.X

	switch (rb.GetBlockType()) {
	case archBlock:
		floor := NewInitC(Id(wallSpace, 0), pos, NewVec2(width, rb.GetThickness()), bottomCardinal)
		rb.objects = append(rb.objects, NewWall(floor))

		if !rb.openings.Get(leftCardinal) {
			left := NewInitC(Id(wallSpace, 0), NewVec2(x - width / 2, y), NewVec2(rb.GetThickness(), 1), bottomLeftCardinal)
			rb.objects = append(rb.objects, NewWall(left))
		}

		if !rb.openings.Get(rightCardinal) {
			right := NewInitC(Id(wallSpace, 0), NewVec2(x + width / 2, y), NewVec2(rb.GetThickness(), 1), bottomRightCardinal)
			rb.objects = append(rb.objects, NewWall(right))
		}
	}
}