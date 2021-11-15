package main

type Rec2 struct {
	Shape
}

func NewRec2(pos Vec2, dim Vec2) *Rec2 {
	return &Rec2 {
		Shape {
			options: DefaultProfileOptions(),
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


func (r Rec2) OverlapX(profile Profile) float64 {
	switch other := profile.(type) {
	case *Rec2:
		return (r.Width()/2 + other.Width()/2) - Abs(r.Pos().X - other.Pos().X)
	case *Circle:
		return 0
	default:
		return 0
	}
}

func (r Rec2) OverlapY(profile Profile) float64 {
	switch other := profile.(type) {
	case *Rec2:
		return (r.Height()/2 + other.Height()/2) - Abs(r.Pos().Y - other.Pos().Y)
	case *Circle:
		return 0
	default:
		return 0
	}
}

func (r Rec2) Overlap(profile Profile) bool {
	switch other := profile.(type) {
	case *Rec2:
		return r.OverlapX(other) > collisionEpsilon && r.OverlapY(other) > collisionEpsilon
	case *Circle:
		return false
	default:
		return false
	}
}

func (r *Rec2) Snap(profile Profile, lastPos Vec2) (float64, float64) {
	switch other := profile.(type) {
	case *Rec2:
		ox := r.OverlapX(other)
		if ox <= 0 {
			return 0, 0
		}

		oy := r.OverlapY(other)
		if oy <= 0 {
			return 0, 0
		}

		pos := r.Pos()
		tvel := r.TotalVel()
		xcollision, ycollision := false, false
		relativeVel := NewVec2(tvel.X - other.TotalVel().X, tvel.Y - other.TotalVel().Y)
		if Abs(relativeVel.X) < collisionEpsilon && Abs(relativeVel.Y) > collisionEpsilon {
			ycollision = Sign(relativeVel.Y) == Sign(other.Pos().Y - pos.Y)
		} else if Abs(relativeVel.X) > collisionEpsilon && Abs(relativeVel.Y) < collisionEpsilon {
			xcollision = Sign(relativeVel.X) == Sign(other.Pos().X - pos.X)
		} else if Abs(relativeVel.X) > collisionEpsilon && Abs(relativeVel.Y) > collisionEpsilon {
			xcollision = Abs(ox / relativeVel.X) <= Abs(oy / relativeVel.Y) && Sign(relativeVel.X) == Sign(other.Pos().X - pos.X)
			ycollision = Abs(ox / relativeVel.X) >= Abs(oy / relativeVel.Y) && Sign(relativeVel.Y) == Sign(other.Pos().Y - pos.Y)
		}

		xadj, yadj := 0.0, 0.0
		options := other.GetOptions()
		vel := r.Vel()
		if xcollision {
			xadj = float64(Sign(pos.X - other.Pos().X)) * ox
			if !options.collideLeft && xadj > 0 || !options.collideRight && xadj < 0 {
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
			if !options.collideTop && yadj > 0 || !options.collideBottom && yadj < 0 {
				yadj = 0
			} else if options.collideTop && !options.collideBottom && lastPos.Y - r.Dim().Y / 2 < other.Pos().Y {
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