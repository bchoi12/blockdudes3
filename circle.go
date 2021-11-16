package main

type Circle struct {
	Shape
}

func CircleProfileOptions() ProfileOptions {
	return ProfileOptions {
		solid: false,
	}
}

func NewCircle(pos Vec2, dim Vec2) *Circle {
	return &Circle {
		Shape {
			options: CircleProfileOptions(),
			pos: pos,
			dim: dim,
			vel: NewVec2(0, 0),
			evel: NewVec2(0, 0),
			acc: NewVec2(0, 0),
		},
	}
}

func (c Circle) Radius() float64 {
	return c.Shape.dim.X
}

func (c Circle) Intersects(line Line) (bool, float64) {
	return false, 1.0
}

func (c Circle) OverlapX(profile Profile) float64 {
	switch other := profile.(type) {
	case *Rec2:
		return other.OverlapX(&c)
	case *Circle:
		return 0
	default:
		return 0
	}
}

func (c Circle) OverlapY(profile Profile) float64 {
	switch other := profile.(type) {
	case *Rec2:
		return other.OverlapY(&c)
	case *Circle:
		return 0
	default:
		return 0
	}
}

func (c Circle) Overlap(profile Profile) bool {
	switch other := profile.(type) {
	case *Rec2:
		return other.Overlap(&c)
	case *Circle:
		return false
	default:
		return false
	}
}

func (c *Circle) Snap(profile Profile, lastPos Vec2) (float64, float64) {
	switch other := profile.(type) {
	case *Rec2:
		return other.Snap(c, lastPos)
	case *Circle:
		return 0, 0
	default:
		return 0, 0
	}
}