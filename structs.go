package main

import (
	"math"
)

const (
	floatEpsilon float64 = 1e-8
)

func Mod(a, b int) int {
    return (a % b + b) % b
}

func Max(a, b float64) float64 {
	if a > b {
		return a
	} 
	return b
}

func Min(a, b float64) float64 {
	if a < b {
		return a
	} 
	return b
}

// Round up when positive, round down when negative
func IntOut(n float64) int {
	if n < 0 {
		return int(math.Floor(n))
	}
	return int(math.Ceil(n))
}

// Round down when positive and negative
func IntLeft(n float64) int {
	if n < 0 {
		return int(n-1)
	}
	return int(n)
}

func Abs(n float64) float64 {
	if n < 0 {
		return -n
	}
	return n
}

func Sign(n float64) int {
	if n == 0 {
		return 0
	} else if n < 0 {
		return -1
	} else {
		return 1
	}
}

type Line struct {
	O Vec2 // origin
	R Vec2 // ray
}

func NewLine(origin Vec2, ray Vec2) Line {
	if ray.X == 0 && ray.Y == 0 {
		ray.X = 1
	}

	return Line {
		O: origin,
		R: ray,
	}
}

func (l Line) Intersects(o Line) (bool, float64) {
	c := l.R.X * o.R.Y - l.R.Y * o.R.X

    if Abs(c) < floatEpsilon {
    	return false, -1
    } 

    s := (-l.R.Y * (l.O.X - o.O.X) + l.R.X * (l.O.Y - o.O.Y)) / c
    t := ( o.R.X * (l.O.Y - o.O.Y) - o.R.Y * (l.O.X - o.O.X)) / c

    if s >= 0 && s <= 1 && t >= 0 && t <= 1 {
    	return true, t
    }
    return false, -1
}

func (l Line) Point(scale float64) Vec2 {
	point := l.O
	point.Add(l.R, scale)
	return point
}

func (l Line) Endpoint() Vec2 {
	return l.Point(1.0)
}

func (l *Line) Normalize() {
	l.R.Normalize()
}

func (l *Line) Scale(scale float64) {
	l.R.Scale(scale)
}

type Vec2 struct {
	X float64
	Y float64
}

func NewVec2(x float64, y float64) Vec2 {
	return Vec2 {
		X: x,
		Y: y,
	}
}

func (v *Vec2) Add(other Vec2, scale float64) {
	v.X += other.X * scale
	v.Y += other.Y * scale
}

func (v *Vec2) Sub(other Vec2, scale float64) {
	v.X -= other.X * scale
	v.Y -= other.Y * scale
}

func (v *Vec2) Scale(scale float64) {
	v.X *= scale
	v.Y *= scale
}

func (v *Vec2) Normalize() {
	v.Scale(1.0 / v.Len())
}

func (v *Vec2) Negate() {
	v.X = -v.X
	v.Y = -v.Y
}

func (v *Vec2) ClampX(min float64, max float64) bool {
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

func (v *Vec2) ClampY(min float64, max float64) bool {
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

func (v Vec2) IsZero() bool {
	return Abs(v.X) < floatEpsilon && Abs(v.Y) < floatEpsilon
}

func (v Vec2) Len() float64 {
	return math.Sqrt(v.LenSquared())
}

func (v Vec2) LenSquared() float64 {
	return v.X * v.X + v.Y * v.Y
}

func Dot(v1 Vec2, v2 Vec2) float64 {
	return v1.X * v2.X + v1.Y * v2.Y
}

func Cross(v1 Vec2, v2 Vec2) float64 {
	return v1.X * v2.Y - v1.Y * v2.X
}