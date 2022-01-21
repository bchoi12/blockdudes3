package main

type RotPoly struct {
	BaseProfile

	points []Vec2
	sides []Line
	dir Vec2
}

func NewRotPoly(init Init, data Data, points []Vec2) *RotPoly {
	// TODO: shape needs to be convex
	rotPoly := &RotPoly {
		BaseProfile: NewBaseProfile(init, data),
		points: points,
		dir: NewVec2(1, 0),
	}

	rotPoly.sides = make([]Line, len(points))
	for i, point := range(points) {
		next := (i + 1) % len(points)
		nextPoint := points[next]

		nextPoint.Sub(point, 1.0)
		rotPoly.sides[i] = NewLine(point, nextPoint)
	}

	return rotPoly
}

func (rp *RotPoly) Rotate(dir Vec2) {
	rp.dir = dir
}

func (rp RotPoly) Dir() Vec2 {
	return rp.dir
}

func (rp RotPoly) GetSides() []Line {
	angle := rp.Dir().Angle()
	sides := rp.sides
	for _, side := range(sides) {
		side.Rotate(angle)
		side.O.Add(rp.Pos(), 1.0)
	}

	return sides
}

func (rp RotPoly) Contains(point Vec2) bool {
	if !rp.BaseProfile.Contains(point) {
		return false
	}

	testLine := NewLine(point, rp.Dim())

	// 0 intersections = false
	// 1 intersection = maybe
	// 2 intersections = false
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
	collision, closest := rp.BaseProfile.Intersects(line)
	if !collision {
		return false, 1.0
	}

	collision = false
	closest = 1.0
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
	if rp.BaseProfile.Overlap(profile) == 0 {
		return 0
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