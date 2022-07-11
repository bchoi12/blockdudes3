package main

import (
	"math"
)

const (
	floatEpsilon float64 = 1e-8
	approxEpsilon float64 = 1e-5
)

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

func (l Line) Intersects(o Line) IntersectResults {
	results := NewIntersectResults()

	c := l.R.X * o.R.Y - l.R.Y * o.R.X

    if Abs(c) < floatEpsilon {
    	return results
    } 

    s := (-l.R.Y * (l.O.X - o.O.X) + l.R.X * (l.O.Y - o.O.Y)) / c
    t := ( o.R.X * (l.O.Y - o.O.Y) - o.R.Y * (l.O.X - o.O.X)) / c

    if s >= 0 && s <= 1 && t >= 0 && t <= 1 {
    	results.hit = true
    	results.t = t
    }
    return results
}

func (l Line) Point(scale float64) Vec2 {
	point := l.O
	point.Add(l.R, scale)
	return point
}

func (l Line) Origin() Vec2 {
	return l.O
}

func (l Line) Endpoint() Vec2 {
	return l.Point(1.0)
}

func (l Line) LenSquared() float64 {
	return l.R.LenSquared()
}

func (l *Line) Normalize() {
	l.R.Normalize()
}

func (l *Line) Scale(scale float64) {
	l.R.Scale(scale)
}

func (l *Line) Rotate(angle float64) {
	l.O.Rotate(angle)
	l.R.Rotate(angle)
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

func NewVec2FromAngle(rad float64) Vec2 {
	return Vec2 {
		X: math.Cos(rad),
		Y: math.Sin(rad),
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
	if (v.Len() < floatEpsilon) {
		return
	}

	v.Scale(1.0 / v.Len())
}

func (v *Vec2) Negate() {
	v.X = -v.X
	v.Y = -v.Y
}

func (v *Vec2) Rotate(angle float64) {
	x := math.Cos(angle) * v.X - math.Sin(angle) * v.Y
	y := math.Sin(angle) * v.X + math.Cos(angle) * v.Y

	v.X = x
	v.Y = y
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

func (v *Vec2) AbsMax(other Vec2) {
	v.X = AbsMax(v.X, other.X)
	v.Y = AbsMax(v.Y, other.Y)
}

func (v Vec2) Area() float64 {
	return Abs(v.X * v.Y)
}

func (v Vec2) Angle() float64 {
	if v.IsZero() {
		return 0
	}

	if v.X == 0 {
		return math.Pi - FSign(v.Y) * math.Pi / 2.0
	}

	rad := math.Atan(v.Y / v.X)
	if v.X < 0 {
		rad += math.Pi
	} else if rad < 0 {
		rad += 2.0 * math.Pi
	}
	return rad
}

func (v Vec2) IsZero() bool {
	return Abs(v.X) < floatEpsilon && Abs(v.Y) < floatEpsilon
}

func (v Vec2) ApproxUnit() bool {
	return Abs(v.LenSquared() - 1) <  approxEpsilon
}

func (v Vec2) Len() float64 {
	return math.Sqrt(v.LenSquared())
}

func (v Vec2) LenSquared() float64 {
	return v.X * v.X + v.Y * v.Y
}

func (v Vec2) Dot(other Vec2) float64 {
	return v.X * other.X + v.Y * other.Y
}

func (v Vec2) Cross(other Vec2) float64 {
	return v.X * other.Y - v.Y * other.X
}