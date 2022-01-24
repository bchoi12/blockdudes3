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

func (r Rec2) GetSides() []Line {
	bottomLeft := NewVec2(r.Pos().X - r.Dim().X / 2, r.Pos().Y - r.Dim().Y / 2)
	topRight := NewVec2(r.Pos().X + r.Dim().X / 2, r.Pos().Y + r.Dim().Y / 2)

	sides := make([]Line, 4)
	sides[0] = NewLine(bottomLeft, NewVec2(r.Dim().X, 0))
	sides[1] = NewLine(bottomLeft, NewVec2(0, r.Dim().Y))
	sides[2] = NewLine(topRight, NewVec2(-r.Dim().X, 0))
	sides[3] = NewLine(topRight, NewVec2(0, -r.Dim().Y))
	return sides
}

func (r Rec2) Intersects(line Line) (bool, float64) {
	collision, closest := r.subIntersects(line)

	if r.Guide() {
		return collision, closest
	}

	sides := r.GetSides()
	for _, side := range(sides) {
		hit, t := line.Intersects(side)

		if hit {
			collision = true
			closest = Min(closest, t)
		}
	}
	return collision, closest
}

func (r Rec2) OverlapX(profile Profile) float64 {
	return (r.Dim().X/2 + profile.Dim().X/2) - r.distX(profile)
}
func (r Rec2) OverlapY(profile Profile) float64 {
	return (r.Dim().Y/2 + profile.Dim().Y/2) - r.distY(profile)
}

func (r Rec2) Overlap(profile Profile) float64 {
	if overlap := r.subOverlap(profile); overlap > 0 {
		return overlap
	}

	switch other := profile.(type) {
	case *RotPoly:
		return other.Overlap(&r)
	case *Rec2:
		return r.OverlapX(other) * r.OverlapY(other)
	case *Circle:
		ox := r.OverlapX(other)
		if ox <= 0 {
			return 0
		}
		oy := r.OverlapY(other)
		if oy <= 0 { 
			return 0
		}

		if r.distX(other) <= r.Dim().X / 2 || r.distY(other) <= r.Dim().Y / 2 || r.distSqr(other) <= other.RadiusSqr() {
			return ox * oy
		}
		return 0
	default:
		return 0
	}
}

func (r *Rec2) Snap(profile Profile) SnapResults {
	results := SnapResults {
		snap: false,
		ignored: false,
	}

	switch other := profile.(type) {
	case *Rec2:
		if !other.Solid() {
			return results
		}

		ox := r.OverlapX(other)
		if ox <= 0 {
			return results
		}

		oy := r.OverlapY(other)
		if oy <= 0 {
			return results
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
				return results
			}
		}

		// If overlap is small, correct it but don't change velocity.
		if ox < overlapEpsilon || oy < overlapEpsilon {
			results.snap = true
			results.posAdj = NewVec2(0, 0)

			if ox < overlapEpsilon {
				results.posAdj.X = ox * collide.X
			}
			if oy < overlapEpsilon {
				results.posAdj.Y = oy * collide.Y
			}

			results.newVel = r.Vel()
			return results
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
		return results
	default:
		return results
	}
}

func (r *Rec2) Rotate(dir Vec2) {
	panic("Trying to rotate rec2")
}