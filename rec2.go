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
		// Distance to outside of rectangle
		dist := NewVec2(r.DistX(other) - r.Dim().X / 2, r.DistY(other) - r.Dim().Y / 2)
		dist.X = Max(dist.X, 0)
		dist.Y = Max(dist.Y, 0)

		if dist.X * dist.X + dist.Y * dist.Y <= other.RadiusSqr() {
			circResults.overlap = true
			circResults.amount = do
		}
		results.Merge(circResults)
	}
	return results
}

func (r *Rec2) Snap(colliders ObjectHeap) SnapResults {
	ignored := r.getIgnored()
	results := r.BaseProfile.Snap(colliders)

	if results.snap {
		pos := r.Pos()
		pos.Add(results.posAdj, 1.0)
		r.SetPos(pos)
	}

	r.resetIgnored()
	for len(colliders) > 0 {
		thing := PopObject(&colliders)
		curResults := r.snapObject(thing, ignored)

		if curResults.snap {
			pos := r.Pos()
			pos.Add(curResults.posAdj, 1.0)
			r.SetPos(pos)
		}

		results.Merge(curResults)
	}

	if results.snap {
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

func (r *Rec2) snapObject(other Object, ignored map[SpacedId]bool) SnapResults {
	results := NewSnapResults()
	oxSmall, oxLarge := r.dimOverlapX(other)
	if oxSmall <= 0 {
		return results
	}
	oySmall, oyLarge := r.dimOverlapY(other)
	if oySmall <= 0 {
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
	relativeVel := NewVec2(r.TotalVel().X - other.TotalVel().X, r.TotalVel().Y - other.TotalVel().Y)
	adjSign := NewVec2(-FSign(relativeVel.X), -FSign(relativeVel.Y))

	// Check if we somehow got past the midpoint of the object
	ox := oxSmall
	oy := oySmall
	if relativeVel.X != 0 && Sign(relativePos.X) == Sign(relativeVel.X) {
		ox = oxLarge
	}
	if relativeVel.Y != 0 && Sign(relativePos.Y) == Sign(relativeVel.Y) {
		oy = oyLarge
	}

	// Handle edge case where relative velocity is zero & the collision direction is unknown.
	if adjSign.X == 0 {
		adjSign.X = FSign(relativePos.X)
	}
	if adjSign.Y == 0 {
		adjSign.Y = FSign(relativePos.Y)
	}

	// Check for tiny collisions that we can ignore
	if adjSign.X != 0 && adjSign.Y != 0 {
		if Sign(adjSign.X) != Sign(relativeVel.X) && oy < overlapEpsilon {
			adjSign.X = 0
		} else if Sign(adjSign.Y) != Sign(relativeVel.Y) && ox < overlapEpsilon {
			adjSign.Y = 0
		}
	}

	// Zero out adjustments according to relative velocity.
	if adjSign.X != 0 && adjSign.Y != 0 {
		if SignPos(relativePos.X) == SignPos(relativeVel.X) || Abs(relativeVel.X) < zeroVelEpsilon && Abs(relativeVel.Y) > zeroVelEpsilon {
			adjSign.X = 0
		} else if SignPos(relativePos.Y) == SignPos(relativeVel.Y) || Abs(relativeVel.Y) < zeroVelEpsilon && Abs(relativeVel.X) > zeroVelEpsilon {
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

	// Special treatment for other object types
	if other.HasAttribute(stairAttribute) && adjSign.X != 0 {
		adjSign.X = 0
		adjSign.Y = 1

		if relativePos.Y < 0 {
			oy = oyLarge
		} else {
			oy = oySmall
		}

		// Smooth ascent
		oy = Min(oy, 0.2)
	}

	// Adjust platform collision at the end after we've determined collision direction.
	if other.GetSpace() == platformSpace {
		adjSign.X = 0
		if adjSign.Y < 0 {
			adjSign.Y = 0
		}
	}

	// Have overlap, but no pos adjustment for some reason.
	if adjSign.IsZero() {
		if other.GetSpace() == platformSpace {
			r.addIgnored(other.GetSpacedId())
		}
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