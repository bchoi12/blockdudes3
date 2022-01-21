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
	pos := c.Pos()
	distX := pos.X - point.X
	distY := pos.Y - point.Y

	return distX * distX + distY * distY <= c.RadiusSqr()
}

func (c Circle) Intersects(line Line) (bool, float64) {
	// TODO: circle intersects line
	return false, 1.0
}

func (c Circle) Overlap(profile Profile) float64 {
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