package main

const (
	floatEpsilon float64 = 1e-6
)

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