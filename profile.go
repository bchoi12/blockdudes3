package main

import (
	"math"
)

const (
	collisionEpsilon float64 = 1e-8
)

type ProfileOptions struct {
	solid bool
	collideTop, collideBottom, collideLeft, collideRight bool
}

type Profile interface {
	Pos() Vec2
	SetPos(pos Vec2)
	Vel() Vec2
	SetVel(vel Vec2)
	ExtVel() Vec2
	SetExtVel(vel Vec2)
	TotalVel() Vec2
	Acc() Vec2
	SetAcc(acc Vec2)

	SetData(od ObjectData)

	Dim() Vec2
	SetDim(dim Vec2)
	Width() float64
	Height() float64

	GetOptions() ProfileOptions
	SetOptions(options ProfileOptions)

	DistX(profile Profile) float64
	DistY(profile Profile) float64
	DistSqr(profile Profile) float64
	Dist(profile Profile) float64
	OverlapX(profile Profile) float64
	OverlapY(profile Profile) float64

	// Not implemented by shape
	Intersects(line Line) (bool, float64)
	Overlap(profile Profile) float64
	Snap(profile Profile, lastPos Vec2) (float64, float64)
}

type Shape struct {
	options ProfileOptions
	pos, vel, evel, acc, dim Vec2
}

func (s Shape) Pos() Vec2 { return s.pos }
func (s *Shape) SetPos(pos Vec2) { s.pos = pos }
func (s Shape) Vel() Vec2 { return s.vel }
func (s *Shape) SetVel(vel Vec2) { s.vel = vel }
func (s Shape) ExtVel() Vec2 { return s.evel }
func (s *Shape) SetExtVel(evel Vec2) { s.evel = evel }
func (s Shape) TotalVel() Vec2 {
	total := s.vel
	total.Add(s.evel, 1)
	return total
}
func (s Shape) Acc() Vec2 { return s.acc }
func (s *Shape) SetAcc(acc Vec2) { s.acc = acc }

func (s *Shape) SetData(od ObjectData) {
	if od.Has(dimProp) {
		s.SetDim(od.Get(dimProp).(Vec2))
	}
	if od.Has(posProp) {
		s.SetPos(od.Get(posProp).(Vec2))
	}
	if od.Has(velProp) {
		s.SetVel(od.Get(velProp).(Vec2))
	}
	if od.Has(extVelProp) {
		s.SetExtVel(od.Get(extVelProp).(Vec2))
	}
	if od.Has(accProp) {
		s.SetAcc(od.Get(accProp).(Vec2))
	}
}

func (s Shape) Dim() Vec2 { return s.dim }
func (s *Shape) SetDim(dim Vec2) { s.dim = dim }
func (s Shape) Width() float64 { return s.dim.X }
func (s Shape) Height() float64 { return s.dim.Y }
func (s Shape) GetOptions() ProfileOptions { return s.options }
func (s *Shape) SetOptions(options ProfileOptions) { s.options = options }

func (s Shape) DistX(profile Profile) float64 {
	return Abs(profile.Pos().X - s.Pos().X)
}
func (s Shape) DistY(profile Profile) float64 {
	return Abs(profile.Pos().Y - s.Pos().Y)
}
func (s Shape) DistSqr(profile Profile) float64 {
	x := s.DistX(profile)
	y := s.DistY(profile)
	return x * x + y * y
}
func (s Shape) Dist(profile Profile) float64 {
	return math.Sqrt(s.DistSqr(profile))
}
func (s Shape) OverlapX(profile Profile) float64 {
	return (s.Width()/2 + profile.Width()/2) - s.DistX(profile)
}
func (s Shape) OverlapY(profile Profile) float64 {
	return (s.Height()/2 + profile.Height()/2) - s.DistY(profile)
}