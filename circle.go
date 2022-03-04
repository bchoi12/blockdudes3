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
	return c.Dim().X / 2
}

func (c Circle) RadiusSqr() float64 {
	return c.Radius() * c.Radius()
}

func (c Circle) Contains(point Vec2) ContainResults {
	results := c.BaseProfile.Contains(point)
	if results.contains {
		return results
	}

	selfResults := NewContainResults()
	pos := c.Pos()
	distX := pos.X - point.X
	distY := pos.Y - point.Y
	selfResults.contains = distX * distX + distY * distY <= c.RadiusSqr()
	
	results.Merge(selfResults)
	return results
}

func (c Circle) Intersects(line Line) IntersectResults {
	results := c.BaseProfile.Intersects(line)

	// TODO: circle intersects line
	return results
}

func (c Circle) Overlap(profile Profile) OverlapResults {
	results := c.BaseProfile.Overlap(profile)

	switch other := profile.(type) {
	case *RotPoly:
		results.Merge(other.Overlap(&c))
	case *Rec2:
		results.Merge(other.Overlap(&c))
	case *Circle:
		circResults := NewOverlapResults()
		radius := c.Radius() + other.Radius()
		if c.distSqr(other) <= radius * radius {
			circResults.overlap = true
			circResults.amount = c.dimOverlap(other)
		}
		results.Merge(circResults)
	}
	return results
}