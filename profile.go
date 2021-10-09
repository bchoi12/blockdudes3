package main

const (
	collisionEpsilon float64 = 0.00000001
)

type Profile interface {
	Pos() Vec2
	AddPos(add Vec2)
	SetPos(pos Vec2)
	Vel() Vec2
	SetVel(vel Vec2)
	Acc() Vec2
	SetAcc(acc Vec2)

	Dim() Vec2
	Width() float64
	Height() float64
	Intersects(line Line) (bool, float64)
	OverlapX(profile Profile) float64
	OverlapY(profile Profile) float64
	Overlap(profile Profile) bool
	Snap(profile Profile) (float64, float64)
}

type Rec2 struct { 
	pos, vel, acc, dim Vec2
}

func NewRec2(pos Vec2, dim Vec2) *Rec2 {
	return &Rec2 {
		pos: pos,
		dim: dim,
		vel: NewVec2(0, 0),
		acc: NewVec2(0, 0),
	}
}

func (r Rec2) Pos() Vec2 { return r.pos }
func (r *Rec2) AddPos(add Vec2) { r.pos.Add(add, 1) }
func (r *Rec2) SetPos(pos Vec2) { r.pos = pos }

func (r Rec2) Vel() Vec2 { return r.vel }
func (r *Rec2) SetVel(vel Vec2) { r.vel = vel }

func (r Rec2) Acc() Vec2 { return r.acc }
func (r *Rec2) SetAcc(acc Vec2) { r.acc = acc }

func (r Rec2) Dim() Vec2 { return r.dim }
func (r Rec2) Width() float64 { return r.dim.X }
func (r Rec2) Height() float64 { return r.dim.Y }

func (r Rec2) Intersects(line Line) (bool, float64) {
	bottomLeft := NewVec2(r.Pos().X - r.Dim().X / 2, r.Pos().Y - r.Dim().Y / 2)
	topRight := NewVec2(r.Pos().X + r.Dim().X / 2, r.Pos().Y + r.Dim().Y / 2)

	sides := make([]Line, 4)
	sides[0] = NewLine(bottomLeft, NewVec2(r.Dim().X, 0))
	sides[1] = NewLine(bottomLeft, NewVec2(0, r.Dim().Y))
	sides[2] = NewLine(topRight, NewVec2(-r.Dim().X, 0))
	sides[3] = NewLine(topRight, NewVec2(0, -r.Dim().Y))

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
	default:
		return 0
	}
}

func (r Rec2) OverlapY(profile Profile) float64 {
	switch other := profile.(type) {
	case *Rec2:
		return (r.Height()/2 + other.Height()/2) - Abs(r.Pos().Y - other.Pos().Y)
	default:
		return 0
	}
}

func (r Rec2) Overlap(profile Profile) bool {
	switch other := profile.(type) {
	case *Rec2:
		return r.OverlapX(other) > collisionEpsilon && r.OverlapY(other) > collisionEpsilon
	default:
		return false
	}
}

func (r *Rec2) Snap(profile Profile) (float64, float64) {
	switch other := profile.(type) {
	case *Rec2:
		ox := r.OverlapX(other)
		oy := r.OverlapY(other)

		vel := r.Vel()

		xcollision, ycollision := false, false
		if Abs(vel.X) < collisionEpsilon && Abs(vel.Y) > collisionEpsilon {
			ycollision = true
		} else if Abs(vel.X) > collisionEpsilon && Abs(vel.Y) < collisionEpsilon {
			xcollision = true
		} else if Abs(vel.X) > collisionEpsilon && Abs(vel.Y) > collisionEpsilon {
			xcollision = Abs(ox / vel.X) <= Abs(oy / vel.Y) && Sign(vel.X) == Sign(other.Pos().X - r.Pos().X)
			ycollision = Abs(ox / vel.X) >= Abs(oy / vel.Y) && Sign(vel.Y) == Sign(other.Pos().Y - r.Pos().Y)
		}

		xadj, yadj := 0.0, 0.0
		if xcollision  {
			xadj = float64(Sign(r.Pos().X - other.Pos().X)) * ox
			r.AddPos(NewVec2(xadj, 0))
			r.SetVel(NewVec2(0, r.Vel().Y))
		}
		if ycollision {
			yadj = float64(Sign(r.Pos().Y - other.Pos().Y)) * oy
			r.AddPos(NewVec2(0, yadj))
			r.SetVel(NewVec2(r.Vel().X, 0))
		}
		return xadj, yadj
	default:
		return 0, 0
	}
}