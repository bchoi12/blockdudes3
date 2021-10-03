package main

type Profile interface {
	Pos() Vec2
	SetPos(pos Vec2)
	Vel() Vec2
	SetVel(vel Vec2)
	Acc() Vec2
	SetAcc(acc Vec2)

	Dim() Vec2
	Width() float64
	Height() float64
	OverlapX(profile Profile) float64
	OverlapY(profile Profile) float64
	Overlap(profile Profile) bool
	Snap(profile Profile)
}

func abs(f float64) float64 {
	if f < 0 {
		return -f
	}
	return f
}

type Rec2 struct { 
	pos, vel, acc, dim Vec2
}

func (r Rec2) Pos() Vec2 { return r.pos }
func (r *Rec2) SetPos(pos Vec2) { r.pos = pos }

func (r Rec2) Vel() Vec2 { return r.vel }
func (r *Rec2) SetVel(vel Vec2) { r.vel = vel }

func (r Rec2) Acc() Vec2 { return r.acc }
func (r *Rec2) SetAcc(acc Vec2) { r.acc = acc }

func (r Rec2) Dim() Vec2 { return r.dim }
func (r Rec2) Width() float64 { return r.dim.X }
func (r Rec2) Height() float64 { return r.dim.Y }

func (r Rec2) OverlapX(profile Profile) float64 {
	switch other := profile.(type) {
	case *Rec2:
		return (r.Width()/2 + other.Width()/2) - abs(r.Pos().X - other.Pos().X)
	default:
		return 0
	}
}

func (r Rec2) OverlapY(profile Profile) float64 {
	switch other := profile.(type) {
	case *Rec2:
		return (r.Height()/2 + other.Height()/2) - abs(r.Pos().Y - other.Pos().Y)
	default:
		return 0
	}
}

func (r Rec2) Overlap(profile Profile) bool {
	switch other := profile.(type) {
	case *Rec2:
		return r.OverlapX(other) > 0 && r.OverlapY(other) > 0
	default:
		return false
	}
}

func (r *Rec2) Snap(profile Profile) {
	switch other := profile.(type) {
	case *Rec2:
		ox := r.OverlapX(other)
		oy := r.OverlapY(other)

		if ox < oy {
			if r.Pos().X < other.Pos().X {
				r.SetPos(NewVec2(other.Pos().X - other.Width()/2 - r.Width()/2, r.Pos().Y))
			} else {
				r.SetPos(NewVec2(other.Pos().X + other.Width()/2 + r.Width()/2, r.Pos().Y))
			}
			r.SetVel(NewVec2(0, r.Vel().Y))
		} else {
			if r.Pos().Y < other.Pos().Y {
				r.SetPos(NewVec2(r.Pos().X, other.Pos().Y - other.Height()/2 - r.Height()/2))
			} else {
				r.SetPos(NewVec2(r.Pos().X, other.Pos().Y + other.Height()/2 + r.Height()/2))
			}
			r.SetVel(NewVec2(r.Vel().X, 0))
		}
	default:
		return
	}
}