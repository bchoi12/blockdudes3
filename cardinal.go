package main

type CardinalType uint8
const (
	unknownCardinal CardinalType = iota
	leftCardinal
	rightCardinal
	bottomCardinal
	topCardinal

	bottomLeftCardinal
	bottomRightCardinal
	topLeftCardinal
	topRightCardinal
)

type Cardinal struct {
	mask uint8
}

func NewCardinal() Cardinal {
	return Cardinal {
		mask: 0,
	}
}

func NewLeftCardinal() Cardinal {
	return Cardinal {
		mask: 0b1,
	}
}

func NewRightCardinal() Cardinal {
	return Cardinal {
		mask: 0b10,
	}
}

func NewSidesCardinal() Cardinal {
	return Cardinal {
		mask: 0b11,
	}
}

func (c *Cardinal) Add(cardinal CardinalType) {
	if cardinal == unknownCardinal {
		return
	}

	c.mask = c.mask | (0b1 << (cardinal - 1))
}

func (c *Cardinal) AddAll(cardinals ...CardinalType) {
	for _, cardinal := range(cardinals) {
		c.Add(cardinal)
	}
}

func (c *Cardinal) Remove(cardinal CardinalType) {
	if cardinal == unknownCardinal {
		return
	}

	c.mask = c.mask & (^(0b1 << (cardinal - 1)))
}

func (c Cardinal) Get(cardinal CardinalType) bool {
	if cardinal == unknownCardinal {
		return false
	}

	return (c.mask >> (cardinal - 1)) & 0b1 == 1
}

func (c Cardinal) Any(cardinals ...CardinalType) bool {
	for _, cardinal := range(cardinals) {
		if c.Get(cardinal) {
			return true
		}
	}
	return false
}

func (c Cardinal) AnyLeft() bool {
	return c.Any(leftCardinal, bottomLeftCardinal, topLeftCardinal)
}

func (c Cardinal) AnyRight() bool {
	return c.Any(rightCardinal, bottomRightCardinal, topRightCardinal)
}

func (c Cardinal) AnyTop() bool {
	return c.Any(topCardinal, topLeftCardinal, topRightCardinal)
}

func (c Cardinal) AnyBottom() bool {
	return c.Any(bottomCardinal, bottomLeftCardinal, bottomRightCardinal)
}

func (c *Cardinal) FromByte(mask uint8) {
	c.mask = mask
}

func (c Cardinal) ToByte() uint8 {
	return c.mask
}