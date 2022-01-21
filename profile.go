package main

import (
	"math"
)

const (
	zeroVelEpsilon float64 = 1e-6
	overlapEpsilon float64 = 0.01
)

const (
	unknownCollisionType = iota
	rigidCollisionType
	platformCollisionType
)

type ProfileData struct {
	*BaseData
}

func NewProfileData(solid bool) Data {
	data := ProfileData {
		BaseData: NewBaseData(),
	}
	data.Set(solidProp, solid)
	return data
}

type ProfileMath interface {
	Contains(point Vec2) bool
	Intersects(line Line) (bool, float64)
	Overlap(profile Profile) float64
}

type SnapResults struct {
	snap bool
	ignored bool
	posAdj Vec2
	newVel Vec2
}

type Profile interface {
	ProfileMath

	Dim() Vec2
	SetDim(dim Vec2)

	Pos() Vec2
	SetPos(pos Vec2)
	Vel() Vec2
	SetVel(vel Vec2)
	ExtVel() Vec2
	SetExtVel(vel Vec2)
	TotalVel() Vec2
	Acc() Vec2
	SetAcc(acc Vec2)

	GetData() Data
	SetData(data Data)
	Solid() bool

	Snap(profile Profile) SnapResults

	distX(profile Profile) float64
	distY(profile Profile) float64
	distSqr(profile Profile) float64
	dist(profile Profile) float64
}

type SubProfile interface {
	ProfileMath

	Origin() Vec2
	SetOrigin(origin Vec2)
	Offset() Vec2
	SetOffset(offset Vec2)

	Rotate(dir Vec2)
}

type BaseProfile struct {
	Init
	vel, extVel, acc Vec2
	solid bool
}

func NewBaseProfile(init Init, data Data) BaseProfile {
	bp := BaseProfile {
		Init: init,
		vel: NewVec2(0, 0),
		extVel: NewVec2(0, 0),
		acc: NewVec2(0, 0),
		solid: data.Get(solidProp).(bool),
	}
	return bp
}

func (bp BaseProfile) Vel() Vec2 { return bp.vel }
func (bp *BaseProfile) SetVel(vel Vec2) { bp.vel = vel }
func (bp BaseProfile) ExtVel() Vec2 { return bp.extVel }
func (bp *BaseProfile) SetExtVel(extVel Vec2) { bp.extVel = extVel }
func (bp BaseProfile) TotalVel() Vec2 {
	total := bp.Vel()
	total.Add(bp.ExtVel(), 1)
	return total
}
func (bp BaseProfile) Acc() Vec2 { return bp.acc }
func (bp *BaseProfile) SetAcc(acc Vec2) { bp.acc = acc }

func (bp BaseProfile) GetData() Data {
	data := NewProfileData(bp.solid)
	data.Merge(bp.Init.GetData())

	if !bp.Vel().IsZero() {
		data.Set(velProp, bp.Vel())
	}
	if !bp.ExtVel().IsZero() {
		data.Set(extVelProp, bp.ExtVel())
	}
	if !bp.Acc().IsZero() {
		data.Set(accProp, bp.Acc())
	}
	return data
}

func (bp *BaseProfile) SetData(data Data) {
	bp.Init.SetData(data)

	if data.Has(velProp) {
		bp.SetVel(data.Get(velProp).(Vec2))
	} else {
		bp.SetVel(NewVec2(0, 0))
	}
	if data.Has(extVelProp) {
		bp.SetExtVel(data.Get(extVelProp).(Vec2))
	} else {
		bp.SetExtVel(NewVec2(0, 0))
	}
	if data.Has(accProp) {
		bp.SetAcc(data.Get(accProp).(Vec2))
	} else {
		bp.SetAcc(NewVec2(0, 0))
	}
}

func (bp BaseProfile) Solid() bool { return bp.solid }

func (bp BaseProfile) distX(profile Profile) float64 {
	return Abs(profile.Pos().X - bp.Pos().X)
}
func (bp BaseProfile) distY(profile Profile) float64 {
	return Abs(profile.Pos().Y - bp.Pos().Y)
}
func (bp BaseProfile) distSqr(profile Profile) float64 {
	x := bp.distX(profile)
	y := bp.distY(profile)
	return x * x + y * y
}
func (bp BaseProfile) dist(profile Profile) float64 {
	return math.Sqrt(bp.distSqr(profile))
}

func (bp BaseProfile) Contains(point Vec2) bool {
	pos := bp.Pos()
	dim := bp.Dim()
	if Abs(pos.X - point.X) > dim.X / 2 {
		return false
	}
	if Abs(pos.Y - point.Y) > dim.Y / 2 {
		return false
	}
	return true
}

func (bp BaseProfile) Intersects(line Line) (bool, float64) {
	pos := bp.Pos()
	if Abs(pos.X - line.O.X) > bp.Dim().X / 2 + Abs(line.R.X) {
		return false, 1.0
	}
	if Abs(pos.Y - line.O.Y) > bp.Dim().Y / 2 + Abs(line.R.Y) {
		return false, 1.0
	}
	return true, 1.0
}

func (bp BaseProfile) Overlap(profile Profile) float64 {
	if bp.distX(profile) > (bp.Dim().X + profile.Dim().X) / 2 {
		return 0
	}
	if bp.distY(profile) > (bp.Dim().Y + profile.Dim().Y) / 2 {
		return 0
	}
	return 1.0
}

func (bp *BaseProfile) Snap(profile Profile) SnapResults {
	return SnapResults {
		snap: false,
	}
}