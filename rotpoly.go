package main

type RotPoly struct {
	BaseProfile
	verts []Vec2

	points []Vec2
	sides []Line
}

func NewRotPoly(init Init, verts []Vec2) *RotPoly {
	rotPoly := &RotPoly {
		BaseProfile: NewBaseProfile(init),
		verts: verts,

		points: make([]Vec2, len(verts)),
		sides: make([]Line, len(verts)),
	}
	rotPoly.computeSides()

	return rotPoly
}

func (rp *RotPoly) computeSides() {
	angle := rp.Dir().Angle()
	for i := range(rp.verts) {
		if i == 0 {
			rp.points[i] = rp.verts[i]
			rp.points[i].Rotate(angle)
			rp.points[i].Add(rp.Pos(), 1.0)			
		}
		j := (i + 1) % len(rp.verts)
		rp.points[j] = rp.verts[j]
		rp.points[j].Rotate(angle)
		rp.points[j].Add(rp.Pos(), 1.0)

		ray := rp.points[j]
		ray.Sub(rp.points[i], 1.0)

		rp.sides[i].O = rp.points[i]
		rp.sides[i].R = ray
	}
}

func (rp RotPoly) getSides() []Line {
	return rp.sides
}

func (rp *RotPoly) SetPos(pos Vec2) {
	if (rp.Pos().ApproxEq(pos)) {
		return
	}

	rp.BaseProfile.SetPos(pos)
	rp.computeSides()
}

func (rp *RotPoly) SetDim(dim Vec2) {
	if rp.Dim().ApproxEq(dim) {
		return
	}

	rp.BaseProfile.SetDim(dim)
	rp.computeSides()
}

func (rp *RotPoly) SetDir(dir Vec2) {
	if rp.Dir().ApproxEq(dir) {
		return
	}

	rp.BaseProfile.SetDir(dir)
	rp.computeSides()
}

func (rp RotPoly) Contains(point Vec2) ContainResults {
	results := rp.BaseProfile.Contains(point)

	if results.contains {
		return results
	}

	// 0 intersections = false
	// 1 intersection = maybe
	// 2 intersections = false
	testLine := NewLine(point, rp.Dim())
	intersections := 0
	for _, side := range(rp.getSides()) {
		if testResults := testLine.Intersects(side); testResults.hit {
			intersections += 1
		}

		if intersections > 1 {
			return results
		}
	}

	if intersections == 0 {
		return results
	}

	// Check for exit line
	testLine.O.Add(rp.Dim(), 1.0)
	for _, side := range(rp.getSides()) {
		if testResults := testLine.Intersects(side); testResults.hit {
			return results
		}
	}

	result := NewContainResults()
	result.contains = true
	results.Merge(result)
	return results
}

func (rp RotPoly) Intersects(line Line) IntersectResults {
	results := rp.BaseProfile.Intersects(line)

	sides := rp.getSides()
	for _, side := range(sides) {
		results.Merge(line.Intersects(side))
	}
	return results
}

func (rp RotPoly) OverlapProfile(other Profile) CollideResult {
	results := rp.BaseProfile.OverlapProfile(other)
	result := NewCollideResult()

	if other.Contains(rp.Pos()).contains || rp.Contains(other.Pos()).contains {
		result.SetHit(true)
		result.SetPosAdjustment(rp.EdgeAdjustment(other))

		results.Merge(result)
		return results
	}

	for _, side := range(rp.getSides()) {
		if testResults := other.Intersects(side); testResults.hit {
			result.SetHit(true)
			result.SetPosAdjustment(rp.EdgeAdjustment(other))
			break
		}
	}

	results.Merge(result)
	return results
}