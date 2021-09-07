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

func (v *Vec2) clamp(xclamp float64, yclamp float64) {
	if v.X < -xclamp {
		v.X = -xclamp
	} else if v.X > xclamp {
		v.X = xclamp
	}

	if v.Y < -yclamp {
		v.Y = -yclamp
	} else if v.Y > yclamp {
		v.Y = yclamp
	}
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