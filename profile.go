package main

import (
	"math"
)

const (
	zeroVelEpsilon float64 = 1e-6
	overlapEpsilon float64 = 0.01
)

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
	Grounded() bool
	SetGrounded(grounded bool)

	GetData() Data
	SetData(data Data)

	AddSubProfile(key ProfileKey, subProfile SubProfile)
	GetSubProfile(key ProfileKey) SubProfile

	dimOverlapX(profile Profile) float64
	dimOverlapY(profile Profile) float64
	dimOverlap(profile Profile) float64
	distX(profile Profile) float64
	distY(profile Profile) float64
	distSqr(profile Profile) float64
	dist(profile Profile) float64
}

type BaseProfile struct {
	Init
	vel, extVel, acc, dir Vec2
	solid, guide, grounded *State

	subProfiles map[ProfileKey]SubProfile
	ignoredColliders map[SpacedId]bool
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
		grounded: NewState(false),

		subProfiles: make(map[ProfileKey]SubProfile),
		ignoredColliders: make(map[SpacedId]bool),
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
func (bp *BaseProfile) Grounded() bool { return bp.grounded.Peek().(bool) }
func (bp *BaseProfile) SetGrounded(grounded bool) { bp.grounded.Set(grounded) }

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
		data.Set(solidProp, solid)
	}

	if bp.grounded.Has() {
		data.Set(groundedProp, bp.grounded.Peek())
	}

	return data
}

func (bp *BaseProfile) SetData(data Data) {
	if data.Size() == 0 {
		return
	}

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

	if data.Has(solidProp) {
		bp.SetSolid(data.Get(solidProp).(bool))
	}
	if data.Has(groundedProp) {
		bp.SetGrounded(data.Get(groundedProp).(bool))
	}
}

func (bp *BaseProfile) AddSubProfile(key ProfileKey, subProfile SubProfile) { bp.subProfiles[key] = subProfile }
func (bp BaseProfile) GetSubProfile(key ProfileKey) SubProfile { return bp.subProfiles[key] }

func (bp BaseProfile) dimOverlapX(profile Profile) float64 {
	return Max(0, bp.Dim().X/2 + profile.Dim().X/2 - bp.distX(profile))
}
func (bp BaseProfile) dimOverlapY(profile Profile) float64 {
	return Max(0, bp.Dim().Y/2 + profile.Dim().Y/2 - bp.distY(profile))
}
func (bp BaseProfile) dimOverlap(profile Profile) float64 {
	return bp.dimOverlapX(profile) * bp.dimOverlapY(profile)
}

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
func (bp BaseProfile) getIgnored() map[SpacedId]bool {
	return bp.ignoredColliders
}
func (bp *BaseProfile) resetIgnored() {
	bp.ignoredColliders = make(map[SpacedId]bool, 0)
}
func (bp *BaseProfile) addIgnored(sid SpacedId) {
	bp.ignoredColliders[sid] = true
}

func (bp BaseProfile) Contains(point Vec2) ContainResults {
	results := NewContainResults()
	for _, sp := range(bp.subProfiles) {
		results.Merge(sp.Contains(point))
	}
	return results
}

func (bp BaseProfile) Intersects(line Line) IntersectResults {
	results := NewIntersectResults()
	for _, sp := range(bp.subProfiles) {
		results.Merge(sp.Intersects(line))
	}
	return results
}

func (bp BaseProfile) Overlap(profile Profile) OverlapResults {
	results := NewOverlapResults()
	for _, sp := range(bp.subProfiles) {
		results.Merge(sp.Overlap(profile))
	}
	return results
}

func (bp BaseProfile) Snap(colliders ThingHeap) SnapResults {
	results := NewSnapResults()
	for _, sp := range(bp.subProfiles) {
		results.Merge(sp.Snap(colliders))
	}
	return results
}