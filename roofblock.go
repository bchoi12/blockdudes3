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

func (rb *RoofBlock) Load() {
	rb.BaseBlock.Load()

	pos := rb.InitPos()
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