package main

import (
	"math"
)

const (
	zeroVelEpsilon float64 = 1e-6
	overlapEpsilon float64 = 0.01
)

// TODO: remove param
func NewProfileData(solid bool) Data {
	data := NewData()
	data.Set(solidProp, solid)
	return data
}

type ProfileMath interface {
	Contains(point Vec2) bool
	subContains(point Vec2) bool
	Intersects(line Line) (bool, float64)
	subIntersects(line Line) (bool, float64)
	Overlap(profile Profile) float64
	subOverlap(profile Profile) float64
	Snap(profile Profile) SnapResults
}

type SnapResults struct {
	snap bool
	ignored bool
	posAdj Vec2
	newVel Vec2
}

type ProfileKey uint8
type Profile interface {
	InitMethods
	ProfileMath

	Vel() Vec2
	SetVel(vel Vec2)
	ExtVel() Vec2
	SetExtVel(vel Vec2)
	TotalVel() Vec2
	Acc() Vec2
	SetAcc(acc Vec2)

	Dir() Vec2
	SetDir(dir Vec2)
	Solid() bool
	SetSolid(solid bool)
	Guide() bool
	SetGuide(guide bool)

	GetData() Data
	SetData(data Data)

	AddSubProfile(key ProfileKey, subProfile SubProfile)
	GetSubProfile(key ProfileKey) SubProfile

	distX(profile Profile) float64
	distY(profile Profile) float64
	distSqr(profile Profile) float64
	dist(profile Profile) float64
}

type BaseProfile struct {
	Init
	vel, extVel, acc, dir Vec2
	solid, guide State

	subProfiles map[ProfileKey]SubProfile
}

func NewBaseProfile(init Init, data Data) BaseProfile {
	bp := BaseProfile {
		Init: init,
		vel: NewVec2(0, 0),
		extVel: NewVec2(0, 0),
		acc: NewVec2(0, 0),
		dir: NewVec2(1, 0),
		solid: NewState(false),
		guide: NewState(false),

		subProfiles: make(map[ProfileKey]SubProfile),
	}
	bp.SetData(data)

	return bp
}

func (bp *BaseProfile) SetPos(pos Vec2) {
	bp.Init.SetPos(pos)
	for _, sp := range(bp.subProfiles) {
		sp.SetPos(pos)
	}
}
func (bp BaseProfile) Vel() Vec2 { return bp.vel }
func (bp *BaseProfile) SetVel(vel Vec2) {
	bp.vel = vel
	for _, sp := range(bp.subProfiles) {
		sp.SetVel(vel)
	}
}
func (bp BaseProfile) ExtVel() Vec2 { return bp.extVel }
func (bp *BaseProfile) SetExtVel(extVel Vec2) {
	bp.extVel = extVel
	for _, sp := range(bp.subProfiles) {
		sp.SetExtVel(extVel)
	}
}
func (bp BaseProfile) TotalVel() Vec2 {
	total := bp.Vel()
	total.Add(bp.ExtVel(), 1)
	return total
}
func (bp BaseProfile) Acc() Vec2 { return bp.acc }
func (bp *BaseProfile) SetAcc(acc Vec2) {
	bp.acc = acc
	for _, sp := range(bp.subProfiles) {
		sp.SetAcc(acc)
	}
}

func (bp BaseProfile) Dir() Vec2 { return bp.dir }
func (bp *BaseProfile) SetDir(dir Vec2) {
	bp.dir = dir
	for _, sp := range(bp.subProfiles) {
		sp.SetDir(dir)
	}
}
func (bp BaseProfile) Solid() bool { return bp.solid.Peek().(bool) }
func (bp *BaseProfile) SetSolid(solid bool) { bp.solid.Set(solid) }
func (bp BaseProfile) Guide() bool { return bp.guide.Peek().(bool) }
func (bp *BaseProfile) SetGuide(guide bool) { bp.guide.Set(guide) }

func (bp BaseProfile) GetData() Data {
	data := NewData()
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
	if solid, ok := bp.solid.Pop(); ok {
		data.Set(solidProp, solid.(bool))
	}
	if guide, ok := bp.guide.Pop(); ok {
		data.Set(guideProp, guide.(bool))
	}

	return data
}

func (bp *BaseProfile) SetData(data Data) {
	if data.Size() == 0 {
		return
	}

	bp.Init.SetData(data)

	if data.Has(solidProp) {
		bp.solid.Set(data.Get(solidProp).(bool))
	}
	if data.Has(guideProp) {
		bp.guide.Set(data.Get(guideProp).(bool))
	}

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

func (bp *BaseProfile) AddSubProfile(key ProfileKey, subProfile SubProfile) { bp.subProfiles[key] = subProfile }
func (bp BaseProfile) GetSubProfile(key ProfileKey) SubProfile { return bp.subProfiles[key] }

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
	if bp.subContains(point) {
		return true
	}

	if bp.Guide() {
		return false
	}

	pos := bp.Pos()
	dim := bp.Dim()

	if Abs(pos.X - point.X) <= dim.X / 2 && Abs(pos.Y - point.Y) <= dim.Y / 2 {
		return true
	}
	return false
}

func (bp BaseProfile) subContains(point Vec2) bool {
	for _, sp := range(bp.subProfiles) {
		if sp.Contains(point) {
			return true
		}
	}
	return false
}

func (bp BaseProfile) subIntersects(line Line) (bool, float64) {
	for _, sp := range(bp.subProfiles) {
		if collision, t := sp.Intersects(line); collision {
			return collision, t
		}
	}
	return false, 1.0
}

func (bp BaseProfile) Overlap(profile Profile) float64 {
	if overlap := bp.subOverlap(profile); overlap > 0 {
		return overlap
	}

	if bp.Guide() {
		return 0
	}

	if bp.distX(profile) > (bp.Dim().X + profile.Dim().X) / 2 {
		return 0
	}
	if bp.distY(profile) > (bp.Dim().Y + profile.Dim().Y) / 2 {
		return 0
	}
	return 1.0
}

func (bp BaseProfile) subOverlap(profile Profile) float64 {
	for _, sp := range(bp.subProfiles) {
		if overlap := sp.Overlap(profile); overlap > 0 {
			return overlap
		}
	}
	return 0
}

func (bp *BaseProfile) Snap(profile Profile) SnapResults {
	return SnapResults {
		snap: false,
	}
}