package main

type RotPoly struct {
	BaseProfile

	points []Vec2
	sides []Line

}

func NewRotPoly(init Init, data Data, points []Vec2) *RotPoly {
	// TODO: shape needs to be convex
	rotPoly := &RotPoly {
		BaseProfile: NewBaseProfile(init, data),
		points: points,
		sides: make([]Line, len(points)),
	}
	rotPoly.computeSides()

	return rotPoly
}

func (rp *RotPoly) computeSides() {
	angle := rp.Dir().Angle()

	for i, point := range(rp.points) {
		next := (i + 1) % len(rp.points)

		nextPoint := rp.points[next]

		// TODO: skip rotation when possible to speed things up?
		point.Rotate(angle)
		nextPoint.Rotate(angle)
		point.Add(rp.Pos(), 1.0)
		nextPoint.Add(rp.Pos(), 1.0)
		nextPoint.Sub(point, 1.0)

		rp.sides[i].O = point
		rp.sides[i].R = nextPoint
	}
}

func (rp *RotPoly) SetPos(pos Vec2) {
	rp.BaseProfile.SetPos(pos)
	rp.computeSides()
}

func (rp *RotPoly) SetDir(dir Vec2) {
	rp.BaseProfile.SetDir(dir)
	rp.computeSides()
}

func (rp RotPoly) Points() []Vec2 {
	points := make([]Vec2, len(rp.sides))

	for i, side := range(rp.sides) {
		points[i] = side.Point(1.0)
	}
	return points
}

func (rp RotPoly) GetSides() []Line {
	return rp.sides
}

func (rp RotPoly) Contains(point Vec2) bool {
	if rp.subContains(point) {
		return true
	}

	if rp.Guide() {
		return false
	}

	// 0 intersections = false
	// 1 intersection = maybe
	// 2 intersections = false
	testLine := NewLine(point, rp.Dim())
	intersections := 0
	for _, side := range(rp.GetSides()) {
		if intersects, _ := testLine.Intersects(side); intersects {
			intersections += 1
		}

		if intersections > 1 {
			return false
		}
	}

	if intersections == 0 {
		return false
	}

	// Check for exit line
	testLine.O.Add(rp.Dim(), 1.0)
	for _, side := range(rp.GetSides()) {
		if intersects, _ := testLine.Intersects(side); intersects {
			return false
		}
	}
	return true
}

func (rp RotPoly) Intersects(line Line) (bool, float64) {
	collision, closest := rp.subIntersects(line)

	if rp.Guide() {
		return collision, closest
	}

	sides := rp.GetSides()
	for _, side := range(sides) {
		hit, t := line.Intersects(side)

		if hit {
			collision = true
			closest = Min(closest, t)
		}
	}
	return collision, closest
}

func (rp RotPoly) Overlap(profile Profile) float64 {
	if overlap := rp.subOverlap(profile); overlap > 0{
		return overlap
	}

	if profile.Contains(rp.Pos()) || rp.Contains(profile.Pos()) {
		return 1.0
	}
	for _, side := range(rp.GetSides()) {
		if intersects, _ := profile.Intersects(side); intersects {
			return 1.0
		}
	}
	return 0
}