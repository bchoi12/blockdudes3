package main

type Circle struct {
	BaseProfile
}

func NewCircle(init Init, data Data) *Circle {
	return &Circle {
		BaseProfile: NewBaseProfile(init, data),
	}
}

func (c Circle) Radius() float64 {
	return c.Dim().X
}

func (c Circle) RadiusSqr() float64 {
	return c.Radius() * c.Radius()
}

func (c Circle) Contains(point Vec2) bool {
	if c.subContains(point) {
		return true
	}

	if c.Guide() {
		return false
	}

	pos := c.Pos()
	distX := pos.X - point.X
	distY := pos.Y - point.Y

	return distX * distX + distY * distY <= c.RadiusSqr()
}

func (c Circle) Intersects(line Line) (bool, float64) {
	collision, closest := c.subIntersects(line)

	if c.Guide() {
		return collision, closest
	}

	// TODO: circle intersects line
	return collision, closest
}

func (c Circle) Overlap(profile Profile) float64 {
	if overlap := c.subOverlap(profile); overlap > 0 {
		return overlap
	}

	switch other := profile.(type) {
	case *RotPoly:
		return other.Overlap(&c)
	case *Rec2:
		return other.Overlap(&c)
	case *Circle:
		radius := c.Radius() + other.Radius()
		if c.distSqr(other) <= radius * radius {
			return radius - c.dist(other)
		}
		return 0
	default:
		return 0
	}
}