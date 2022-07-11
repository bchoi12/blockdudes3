package main

type Rec2 struct {
	BaseProfile
}

func NewRec2(init Init) *Rec2 {
	rec2 := &Rec2 {
		BaseProfile: NewBaseProfile(init),
	}
	return rec2
}

func (r Rec2) getSides() []Line {
	bottomLeft := NewVec2(r.Pos().X - r.Dim().X / 2, r.Pos().Y - r.Dim().Y / 2)
	topRight := NewVec2(r.Pos().X + r.Dim().X / 2, r.Pos().Y + r.Dim().Y / 2)

	sides := make([]Line, 4)
	sides[0] = NewLine(bottomLeft, NewVec2(r.Dim().X, 0))
	sides[1] = NewLine(bottomLeft, NewVec2(0, r.Dim().Y))
	sides[2] = NewLine(topRight, NewVec2(-r.Dim().X, 0))
	sides[3] = NewLine(topRight, NewVec2(0, -r.Dim().Y))
	return sides
}

func (r Rec2) Contains(point Vec2) ContainResults {
	results := r.BaseProfile.Contains(point)

	if results.contains {
		return results
	}

	selfResults := NewContainResults()
	pos := r.Pos()
	dim := r.Dim()
	if Abs(pos.X - point.X) <= dim.X / 2 && Abs(pos.Y - point.Y) <= dim.Y / 2 {
		selfResults.contains = true
	}

	results.Merge(selfResults)
	return results
}

func (r Rec2) Intersects(line Line) IntersectResults {
	results := r.BaseProfile.Intersects(line)

	sides := r.getSides()
	for _, side := range(sides) {
		results.Merge(line.Intersects(side))
	}
	return results
}

func (r Rec2) OverlapProfile(profile Profile) CollideResult {
	result := r.BaseProfile.OverlapProfile(profile)

	switch other := profile.(type) {
	case *RotPoly:
		result.Merge(other.OverlapProfile(&r))
	case *Rec2:
		if do := r.PosAdjustment(other); do.Area() > 0 {
			result.SetHit(true)
		}
	case *Circle:
		do := r.PosAdjustment(other)
		if do.Area() <= 0 {
			break
		}

		// Distance to outside of rectangle
		dist := NewVec2(r.DistX(other) - r.Dim().X / 2, r.DistY(other) - r.Dim().Y / 2)
		dist.X = Max(dist.X, 0)
		dist.Y = Max(dist.Y, 0)

		if dist.X * dist.X + dist.Y * dist.Y <= other.RadiusSqr() {
			result.SetHit(true)
		}
	}

	result.SetPosAdjustment(r.PosAdjustment(profile))
	return result
}