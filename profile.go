package main

import (
	"math"
)

const (
	zeroVelEpsilon float64 = 1e-6
	overlapEpsilon float64 = 1e-3
	lastOverlapEpsilon float64 = 0.1
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
	Solid() bool

	DistX(profile Profile) float64
	DistY(profile Profile) float64
	DistSqr(profile Profile) float64
	Dist(profile Profile) float64
	OverlapX(profile Profile) float64
	OverlapY(profile Profile) float64

	// Not implemented by BaseProfile
	Intersects(line Line) (bool, float64)
	Overlap(profile Profile) float64
	Snap(profile Profile, lastProfile Profile) (float64, float64)
}

type BaseProfile struct {
	options ProfileOptions
	pos, vel, evel, acc, dim Vec2
}

func (bp BaseProfile) Pos() Vec2 { return bp.pos }
func (bp *BaseProfile) SetPos(pos Vec2) { bp.pos = pos }
func (bp BaseProfile) Vel() Vec2 { return bp.vel }
func (bp *BaseProfile) SetVel(vel Vec2) { bp.vel = vel }
func (bp BaseProfile) ExtVel() Vec2 { return bp.evel }
func (bp *BaseProfile) SetExtVel(evel Vec2) { bp.evel = evel }
func (bp BaseProfile) TotalVel() Vec2 {
	total := bp.vel
	total.Add(bp.evel, 1)
	return total
}
func (bp BaseProfile) Acc() Vec2 { return bp.acc }
func (bp *BaseProfile) SetAcc(acc Vec2) { bp.acc = acc }

func (bp *BaseProfile) SetData(od ObjectData) {
	if od.Has(dimProp) {
		bp.SetDim(od.Get(dimProp).(Vec2))
	}
	if od.Has(posProp) {
		bp.SetPos(od.Get(posProp).(Vec2))
	}
	if od.Has(velProp) {
		bp.SetVel(od.Get(velProp).(Vec2))
	}
	if od.Has(extVelProp) {
		bp.SetExtVel(od.Get(extVelProp).(Vec2))
	}
	if od.Has(accProp) {
		bp.SetAcc(od.Get(accProp).(Vec2))
	}
}

func (bp BaseProfile) Dim() Vec2 { return bp.dim }
func (bp *BaseProfile) SetDim(dim Vec2) { bp.dim = dim }
func (bp BaseProfile) Width() float64 { return bp.dim.X }
func (bp BaseProfile) Height() float64 { return bp.dim.Y }
func (bp BaseProfile) GetOptions() ProfileOptions { return bp.options }
func (bp *BaseProfile) SetOptions(options ProfileOptions) { bp.options = options }
func (bp BaseProfile) Solid() bool { return bp.options.solid }

func (bp BaseProfile) DistX(profile Profile) float64 {
	return Abs(profile.Pos().X - bp.Pos().X)
}
func (bp BaseProfile) DistY(profile Profile) float64 {
	return Abs(profile.Pos().Y - bp.Pos().Y)
}
func (bp BaseProfile) DistSqr(profile Profile) float64 {
	x := bp.DistX(profile)
	y := bp.DistY(profile)
	return x * x + y * y
}
func (bp BaseProfile) Dist(profile Profile) float64 {
	return math.Sqrt(bp.DistSqr(profile))
}
func (bp BaseProfile) OverlapX(profile Profile) float64 {
	return (bp.Width()/2 + profile.Width()/2) - bp.DistX(profile)
}
func (bp BaseProfile) OverlapY(profile Profile) float64 {
	return (bp.Height()/2 + profile.Height()/2) - bp.DistY(profile)
}