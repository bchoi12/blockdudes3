package main

type Rec2 struct {
	BaseProfile
}

func NewRec2(init Init, data Data) *Rec2 {
	rec2 := &Rec2 {
		BaseProfile: NewBaseProfile(init, data),
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

func (r Rec2) Overlap(profile Profile) OverlapResults {
	results := r.BaseProfile.Overlap(profile)

	switch other := profile.(type) {
	case *RotPoly:
		results.Merge(other.Overlap(&r))
	case *Rec2:
		recResults := NewOverlapResults()
		if do := r.dimOverlap(other); do > 0 {
			recResults.overlap = true
			recResults.amount = do
		}
		results.Merge(recResults)
	case *Circle:
		do := r.dimOverlap(other)
		if do <= 0 {
			break
		}

		circResults := NewOverlapResults()
		if r.distX(other) <= r.Dim().X / 2 || r.distY(other) <= r.Dim().Y / 2 || r.distSqr(other) <= other.RadiusSqr() {
			circResults.overlap = true
			circResults.amount = do
		}
		results.Merge(circResults)
	}
	return results
}

func (r *Rec2) Snap(colliders ThingHeap) SnapResults {
	ignored := r.getIgnored()
	results := r.BaseProfile.Snap(colliders)

	r.resetIgnored()
	for len(colliders) > 0 {
		thing := PopThing(&colliders)
		results.Merge(r.snapThing(thing, ignored))
	}

	if results.snap {
		pos := r.Pos()
		pos.Add(results.posAdj, 1.0)
		r.SetPos(pos)

		vel := r.Vel()

		if results.posAdj.X > 0 {
			vel.X = Max(0, vel.X)
		} else if results.posAdj.X < 0 {
			vel.X = Min(0, vel.X)
		}
		if results.posAdj.Y > 0 {
			vel.Y = Max(0, vel.Y)
		} else if results.posAdj.Y < 0 {
			vel.Y = Min(0, vel.Y)
		}
		r.SetVel(vel)

		if results.posAdj.Y > 0 {
			r.SetExtVel(results.extVel)
		}	
	}

	// Only set this once
	r.SetGrounded(results.posAdj.Y > 0)
	return results
}

func (r *Rec2) snapThing(other Thing, ignored map[SpacedId]bool) SnapResults {
	results := NewSnapResults()
	ox := r.dimOverlapX(other)
	if ox <= 0 {
		return results
	}
	oy := r.dimOverlapY(other)
	if oy <= 0 {
		return results
	}
	if _, ok := ignored[other.GetSpacedId()]; ok {
		r.addIgnored(other.GetSpacedId())
		return results
	}
	if !other.Solid() {
		return results
	}

	// Figure out collision direction
	relativePos := NewVec2(r.Pos().X - other.Pos().X, r.Pos().Y - other.Pos().Y)
	adjSign := NewVec2(FSign(relativePos.X), FSign(relativePos.Y))
	relativeVel := NewVec2(r.TotalVel().X - other.TotalVel().X, r.TotalVel().Y - other.TotalVel().Y)

	// Zero out adjustments according to relative velocity.
	if !adjSign.IsZero() {
		if Sign(adjSign.X) == Sign(relativeVel.X) || Abs(relativeVel.X) < zeroVelEpsilon {
			adjSign.X = 0
		}
		if Sign(adjSign.Y) == Sign(relativeVel.Y) || Abs(relativeVel.Y) < zeroVelEpsilon {
			adjSign.Y = 0
		}
	}

	// Check for tiny collisions that we can ignore
	if adjSign.X != 0 && adjSign.Y != 0 {
		if Sign(adjSign.X) != Sign(relativeVel.X) && oy < overlapEpsilon {
			adjSign.X = 0
		} else if Sign(adjSign.Y) != Sign(relativeVel.Y) && ox < overlapEpsilon {
			adjSign.Y = 0
		}
	}

	// If collision happens in both X, Y compute which overlap is greater based on velocity.
	if adjSign.X != 0 && adjSign.Y != 0 {
		tx := Abs(ox / relativeVel.X)
		ty := Abs(oy / relativeVel.Y)

		if tx > ty {
			adjSign.X = 0
		} else if ty > tx {
			adjSign.Y = 0
		}
	}

	// Special treatment for platform.
	if !adjSign.IsZero() && other.GetSpace() == platformSpace {
		adjSign.X = 0
		if adjSign.Y < 0 {
			adjSign.Y = 0
		}
	}

	// Have overlap, but no pos adjustment for some reason.
	if adjSign.IsZero() {
		r.addIgnored(other.GetSpacedId())
		return results
	}

	// Collision
	posAdj := NewVec2(ox * adjSign.X, oy * adjSign.Y)
	if !posAdj.IsZero() {
		results.snap = true
	}

	results.posAdj = posAdj
	if results.posAdj.Y > 0 {
		results.extVel = other.TotalVel()
	}
	return results
}