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
		if do < 0 {
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

func (r *Rec2) Snap(profile Profile) SnapResults {
	results := r.BaseProfile.Snap(profile)

	switch other := profile.(type) {
	case *Rec2:
		if !other.Solid() {
			break
		}
		ox := r.dimOverlapX(other)
		if ox <= 0 {
			break
		}
		oy := r.dimOverlapY(other)
		if oy <= 0 {
			break
		}

		// Figure out collision direction
		relativeVel := NewVec2(r.TotalVel().X - other.TotalVel().X, r.TotalVel().Y - other.TotalVel().Y)
		collide := NewVec2(1, 1)
		if relativeVel.X > 0 {
			collide.X = -1
		}
		if relativeVel.Y > 0 {
			collide.Y = -1
		}

		relativePos := NewVec2(r.Pos().X - other.Pos().X, r.Pos().Y - other.Pos().Y)
		if Sign(collide.X) != Sign(relativePos.X) {
			collide.X = 0
		}
		if Sign(collide.Y) != Sign(relativePos.Y) {
			collide.Y = 0
		}

		// Check that relative velocity is nonzero.
		// Skip small overlap since we should always correct that.
		if ox > overlapEpsilon && Abs(relativeVel.X) < zeroVelEpsilon  {
			collide.X = 0
		}
		if oy > overlapEpsilon && Abs(relativeVel.Y) < zeroVelEpsilon {
			collide.Y = 0
		}

		// If collision happens in both X, Y compute which overlap is greater based on velocity.
		// NOTE: needs to happen early
		// TODO: do we need to check for nonzero velocity here?
		if collide.X != 0 && collide.Y != 0 {
			tx := Abs(ox / relativeVel.X)
			ty := Abs(oy / relativeVel.Y)

			if tx > ty {
				collide.X = 0
			}
			if ty > tx {
				collide.Y = 0
			}
		}

		// Special treatment for platform.
		if !collide.IsZero() && other.GetSpace() == platformSpace {
			collide.X = 0
			if collide.Y < 0 {
				collide.Y = 0
			}

			if collide.IsZero() {
				results.ignored = true
				break
			}
		}

		// If overlap is small, correct it but don't change velocity.
		if ox < overlapEpsilon || oy < overlapEpsilon {
			results.snap = true
			results.posAdj = NewVec2(ox * collide.X, oy * collide.Y)
			results.newVel = r.Vel()		
			break
		}

		// Compile the results.
		posAdj := NewVec2(0, 0)
		newVel := r.Vel()
		if collide.X != 0 {
			results.snap = true
			posAdj.X = ox * collide.X

			if posAdj.X > 0 {
				newVel.X = Max(0, newVel.X)
			} else if posAdj.X < 0 {
				newVel.X = Min(0, newVel.X)
			}
		}
		if collide.Y != 0 {
			results.snap = true
			posAdj.Y = oy * collide.Y
		
			if posAdj.Y > 0 {
				newVel.Y = Max(0, newVel.Y)
			} else if posAdj.Y < 0 {
				newVel.Y = Min(0, newVel.Y)
			}
		}

		results.posAdj = posAdj
		results.newVel = newVel
	}
	return results
}