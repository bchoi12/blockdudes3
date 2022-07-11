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
	switch other := profile.(type) {
	case *RotPoly:
		return other.OverlapProfile(&r)
	case *Rec2:
		result := NewCollideResult()
		if do := r.DimOverlap(other); do.Area() > 0 {
			result.SetHit(true)
			result.SetPosAdjustment(do)
		}
		return result
	case *Circle:
		result := NewCollideResult()
		do := r.DimOverlap(other)
		if do.Area() <= 0 {
			return result
		}

		// Distance to outside of rectangle
		dist := NewVec2(r.DistX(other) - r.Dim().X / 2, r.DistY(other) - r.Dim().Y / 2)
		dist.X = Max(dist.X, 0)
		dist.Y = Max(dist.Y, 0)

		if dist.X * dist.X + dist.Y * dist.Y <= other.RadiusSqr() {
			result.SetHit(true)
			result.SetPosAdjustment(do)
		}
		return result
	}
	return NewCollideResult()
}

func (r *Rec2) Snap(nearbyObjects ObjectHeap) SnapResults {
	results := r.BaseProfile.Snap(nearbyObjects)
	ignored := make(map[SpacedId]bool)

	for len(nearbyObjects) > 0 {
		object := PopObject(&nearbyObjects)
		collideResult := r.snapObject(object)

		if collideResult.GetIgnored() {
			ignored[object.GetSpacedId()] = true
		} else if collideResult.GetHit() {
			pos := r.Pos()
			pos.Add(collideResult.GetPosAdjustment(), 1.0)
			r.SetPos(pos)
		}

		results.AddCollideResult(object.GetSpacedId(), collideResult)
	}

	if results.snap {
		vel := r.Vel()

		if results.posAdjustment.X > 0 {
			vel.X = Max(0, vel.X)
		} else if results.posAdjustment.X < 0 {
			vel.X = Min(0, vel.X)
		}
		if results.posAdjustment.Y > 0 {
			vel.Y = Max(0, vel.Y)
		} else if results.posAdjustment.Y < 0 {
			vel.Y = Min(0, vel.Y)
		}
		r.SetVel(vel)

		if results.posAdjustment.Y > 0 {
			r.SetExtVel(results.velModifier)
		}
	}

	r.updateIgnored(ignored)
	return results
}

func (r Rec2) snapObject(other Object) CollideResult {
	result := NewCollideResult()
	overlap := r.DimOverlap(other)
	ignored := r.getIgnored()

	if !r.GetSnapOptions().Evaluate(other) || overlap.Area() <= 0 {
		return result
	}

	if _, ok := ignored[other.GetSpacedId()]; ok {
		result.SetIgnored(true)
		return result
	}

	// Figure out collision direction
	relativePos := NewVec2(r.Pos().X - other.Pos().X, r.Pos().Y - other.Pos().Y)
	relativeVel := NewVec2(r.TotalVel().X - other.TotalVel().X, r.TotalVel().Y - other.TotalVel().Y)
	adjSign := NewVec2(-FSign(relativeVel.X), -FSign(relativeVel.Y))

	// Handle edge case where relative velocity is zero & the collision direction is unknown.
	if adjSign.X == 0 {
		adjSign.X = FSign(relativePos.X)
	}
	if adjSign.Y == 0 {
		adjSign.Y = FSign(relativePos.Y)
	}

	// Check for tiny collisions that we can ignore
	if adjSign.X != 0 && adjSign.Y != 0 {
		if Sign(adjSign.X) != Sign(relativeVel.X) && Abs(overlap.Y) < overlapEpsilon {
			adjSign.X = 0
		} else if Sign(adjSign.Y) != Sign(relativeVel.Y) && Abs(overlap.X) < overlapEpsilon {
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
		tx := Abs(overlap.X / relativeVel.X)
		ty := Abs(overlap.Y / relativeVel.Y)

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

		oySmall, oyLarge := r.dimOverlapY(other)
		if relativePos.Y < 0 {
			overlap.Y = oyLarge
		} else {
			overlap.Y = oySmall
		}

		// Smooth ascent
		overlap.Y = Min(overlap.Y, 0.2)
	}

	// Adjust platform collision at the end after we've determined collision direction.
	if other.HasAttribute(platformAttribute) {
		adjSign.X = 0
		if adjSign.Y < 0 {
			adjSign.Y = 0
		}
	}

	// Have overlap, but no pos adjustment for some reason.
	if adjSign.IsZero() {
		if other.HasAttribute(platformAttribute) {
			result.SetIgnored(true)
		}
		return result
	}

	// Collision
	posAdj := NewVec2(overlap.X * adjSign.X, overlap.Y * adjSign.Y)
	if posAdj.IsZero() {
		return result
	}

	result.SetHit(true)
	result.SetPosAdjustment(posAdj)
	if posAdj.Y > 0 {
		result.SetVelModifier(other.TotalVel())
	}
	return result
}