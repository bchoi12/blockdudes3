package main

type Rec2 struct {
	BaseProfile
}

func Rec2ProfileOptions() ProfileOptions {
	return ProfileOptions {
		solid: true,

		collideTop: true,
		collideBottom: true,
		collideLeft: true,
		collideRight: true,
	}
}

func PlatformProfileOptions() ProfileOptions {
	return ProfileOptions {
		solid: true,

		collideTop: true,
		collideBottom: false,
		collideLeft: false,
		collideRight: false,
	}
}

func NewRec2(pos Vec2, dim Vec2) *Rec2 {
	return &Rec2 {
		BaseProfile {
			options: Rec2ProfileOptions(),
			pos: pos,
			dim: dim,
			vel: NewVec2(0, 0),
			evel: NewVec2(0, 0),
			acc: NewVec2(0, 0),
		},
	}
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
	sides := r.GetSides()

	collision := false
	closest := 1.0
	for _, side := range(sides) {
		hit, t := line.Intersects(side)

		if hit {
			collision = true
			closest = Min(closest, t)
		}
	}
	return collision, closest
}

func (r Rec2) Overlap(profile Profile) float64 {
	switch other := profile.(type) {
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

		if r.DistX(other) <= r.Width() / 2 || r.DistY(other) <= r.Height() / 2 || r.DistSqr(other) <= other.RadiusSqr() {
			return ox * oy
		}
		return 0
	default:
		return 0
	}
}

func (r *Rec2) Snap(profile Profile, lastProfile Profile) (float64, float64) {
	switch other := profile.(type) {
	case *Rec2:
		options := other.GetOptions()
		if !options.solid {
			return 0, 0
		}

		ox := r.OverlapX(other)
		if ox <= 0 {
			return 0, 0
		}

		oy := r.OverlapY(other)
		if oy <= 0 {
			return 0, 0
		}

		relativeVel := NewVec2(r.TotalVel().X - other.TotalVel().X, r.TotalVel().Y - other.TotalVel().Y)
		collideTop := options.collideTop && relativeVel.Y <= zeroVelEpsilon && lastProfile.OverlapY(other) <= lastOverlapEpsilon
		collideBottom := options.collideBottom && relativeVel.Y >= zeroVelEpsilon && lastProfile.OverlapY(other) <= lastOverlapEpsilon
		collideLeft := options.collideLeft && relativeVel.X >= zeroVelEpsilon && lastProfile.OverlapX(other) <= lastOverlapEpsilon
		collideRight := options.collideRight && relativeVel.X <= zeroVelEpsilon && lastProfile.OverlapX(other) <= lastOverlapEpsilon

		if !Or(collideTop, collideBottom, collideLeft, collideRight) {
			return 0, 0
		}

		xcollision, ycollision := true, true
		if oy <= overlapEpsilon || Abs(relativeVel.X) < zeroVelEpsilon || !Or(collideLeft, collideRight) {
			xcollision = false
		}
		if ox <= overlapEpsilon || Abs(relativeVel.Y) < zeroVelEpsilon || !Or(collideTop, collideBottom) {
			ycollision = false
		}

		if !xcollision && !ycollision {
			return 0, 0
		}

		if xcollision && ycollision { 
			tx := Abs(ox / relativeVel.X)
			ty := Abs(oy / relativeVel.Y)

			if tx < ty {
				xcollision = false
			}
			if ty < tx {
				ycollision = false
			}
		}

		xadj, yadj := 0.0, 0.0
		pos := r.Pos()
		vel := r.Vel()
		if xcollision {
			xadj = float64(Sign(pos.X - other.Pos().X)) * ox
			if !collideLeft && xadj < 0 || !collideRight && xadj > 0 {
				xadj = 0
			} else {
				pos.Add(NewVec2(xadj, 0), 1.0)

				if xadj > 0 {
					vel.X = Max(0, vel.X)
				} else if xadj < 0 {
					vel.X = Min(0, vel.X)
				}
			}
		}
		if ycollision {
			yadj = float64(Sign(pos.Y - other.Pos().Y)) * oy
			if !collideBottom && yadj < 0 || !collideTop && yadj > 0 {
				yadj = 0
			} else {
				pos.Add(NewVec2(0, yadj), 1.0)
			
				if yadj > 0 {
					vel.Y = Max(0, vel.Y)
				} else if yadj < 0 {
					vel.Y = Min(0, vel.Y)
				}
			}
		}

		r.SetPos(pos)
		r.SetVel(vel)

		return xadj, yadj
	case *Circle:
		return 0, 0
	default:
		return 0, 0
	}
}