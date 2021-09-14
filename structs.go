package main

const (
	floatEpsilon float64 = 1e-6
)

func abs(f float64) float64 {
	if f < 0 {
		return -f
	}
	return f
}

type Vec2 struct {
	X float64
	Y float64
}

func (v *Vec2) add(other Vec2, scale float64) {
	v.X += other.X * scale
	v.Y += other.Y * scale
}

func (v *Vec2) scale(scale float64) {
	v.X *= scale
	v.Y *= scale
}

func (v *Vec2) clampX(min float64, max float64) bool {
	if v.X < min {
		v.X = min
		return true
	} 
	if v.X > max {
		v.X = max
		return true
	}
	return false
}

func (v *Vec2) clampY(min float64, max float64) bool {
	if v.Y < min {
		v.Y = min
		return true
	} 
	if v.Y > max {
		v.Y = max
		return true
	}
	return false
}

func (v Vec2) isZero() bool {
	return -floatEpsilon < v.X && v.X < floatEpsilon && -floatEpsilon < v.Y && v.Y < floatEpsilon
}

func (v Vec2) lenSquared() float64 {
	return v.X * v.X + v.Y * v.Y
}

func dot(v1 Vec2, v2 Vec2) float64 {
	return v1.X * v2.X + v1.Y * v2.Y
}

func cross(v1 Vec2, v2 Vec2) float64 {
	return v1.X * v2.Y - v1.Y * v2.X
}


type Rec2 struct {
	Pos Vec2
	W float64
	H float64
}

func (r Rec2) overlapX(other Rec2) float64 {
	return (r.W/2 + other.W/2) - abs(r.Pos.X - other.Pos.X)
}

func (r Rec2) overlapY(other Rec2) float64 {
	return (r.H/2 + other.H/2) - abs(r.Pos.Y - other.Pos.Y)
}

func (r Rec2) overlap(other Rec2) bool {
	return r.overlapX(other) > 0 && r.overlapY(other) > 0
}

func (r *Rec2) snap(other Rec2, v *Vec2) {
	ox := r.overlapX(other)
	oy := r.overlapY(other)

	if ox < oy {
		if r.Pos.X < other.Pos.X {
			r.Pos.X = other.Pos.X - other.W/2 - r.W/2
		} else {
			r.Pos.X = other.Pos.X + other.W/2 + r.W/2
		}
		v.X = 0
	} else {
		if r.Pos.Y < other.Pos.Y {
			r.Pos.Y = other.Pos.Y - other.H/2 - r.H/2
		} else {
			r.Pos.Y = other.Pos.Y + other.H/2 + r.H/2
		}
		v.Y = 0
	}
}