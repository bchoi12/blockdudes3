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

	Pos() Vec2
	SetPos(pos Vec2)
	Vel() Vec2
	SetVel(vel Vec2)
	ExtVel() Vec2
	SetExtVel(vel Vec2)
	TotalVel() Vec2
	Acc() Vec2
	SetAcc(acc Vec2)
	Jerk() Vec2
	SetJerk(jerk Vec2)
	Dir() Vec2
	SetDir(dir Vec2)

	Dim() Vec2
	SetDim(dim Vec2)
	Solid() bool
	SetSolid(solid bool)
	Guide() bool
	SetGuide(guide bool)
	Grounded() bool
	SetGrounded(grounded bool)
	Static() bool
	SetStatic(static bool)

	GetData() Data
	GetUpdates() Data
	SetData(data Data)

	AddSubProfile(key ProfileKey, subProfile SubProfile)
	GetSubProfile(key ProfileKey) SubProfile

	dimOverlapX(other Profile) (float64, float64)
	dimOverlapY(other Profile) (float64, float64)
	dimOverlap(other Profile) float64
	distX(other Profile) float64
	distY(other Profile) float64
	distSqr(other Profile) float64
	dist(other Profile) float64
}

type BaseProfile struct {
	Init
	pos, vel, extVel, acc, jerk, dir Vec2
	dim, solid, guide, grounded *State
	static bool
	// TODO: static state

	subProfiles map[ProfileKey]SubProfile
	ignoredColliders map[SpacedId]bool
}

func NewBaseProfile(init Init, data Data) BaseProfile {
	bp := BaseProfile {
		Init: init,
		pos: init.InitPos(),
		dim: NewBlankState(init.InitDim()),
		vel: NewVec2(0, 0),
		extVel: NewVec2(0, 0),
		acc: NewVec2(0, 0),
		dir: NewVec2(1, 0),
		solid: NewBlankState(false),
		guide: NewBlankState(false),
		grounded: NewBlankState(false),
		static: false,

		subProfiles: make(map[ProfileKey]SubProfile),
		ignoredColliders: make(map[SpacedId]bool),
	}
	bp.SetData(data)

	return bp
}

func (bp BaseProfile) Dim() Vec2 { return bp.dim.Peek().(Vec2) }
func (bp *BaseProfile) SetDim(dim Vec2) {
	bp.dim.Set(dim)
}
func (bp BaseProfile) Pos() Vec2 { return bp.pos }
func (bp *BaseProfile) SetPos(pos Vec2) {
	bp.pos = pos
	for _, sp := range(bp.subProfiles) {
		sp.SetPos(pos)
	}
}
func (bp BaseProfile) Vel() Vec2 { return bp.vel }
func (bp *BaseProfile) SetVel(vel Vec2) {
	if !vel.IsZero() {
		bp.static = false
	}

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
func (bp BaseProfile) Jerk() Vec2 { return bp.jerk }
func (bp *BaseProfile) SetJerk(jerk Vec2) {
	bp.jerk = jerk
	for _, sp := range(bp.subProfiles) {
		sp.SetJerk(jerk)
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
func (bp BaseProfile) Grounded() bool { return bp.grounded.Peek().(bool) }
func (bp *BaseProfile) SetGrounded(grounded bool) { bp.grounded.Set(grounded) }
func (bp BaseProfile) Static() bool { return bp.static }
func (bp *BaseProfile) SetStatic(static bool) { bp.static = static }

func (bp BaseProfile) GetData() Data {
	data := NewData()

	if !bp.static {
		data.Set(posProp, bp.Pos())
	}

	if !bp.Vel().IsZero() {
		data.Set(velProp, bp.Vel())
	}
	if !bp.ExtVel().IsZero() {
		data.Set(extVelProp, bp.ExtVel())
	}
	if !bp.Acc().IsZero() {
		data.Set(accProp, bp.Acc())
	}
	if !bp.Jerk().IsZero() {
		data.Set(jerkProp, bp.Jerk())
	}

	if dim, ok := bp.dim.Pop(); ok {
		data.Set(dimProp, dim)
	}
	if solid, ok := bp.solid.Pop(); ok {
		data.Set(solidProp, solid)
	}
	if grounded, ok := bp.grounded.Pop(); ok {
		data.Set(groundedProp, grounded)
	}

	return data
}

func (bp BaseProfile) GetUpdates() Data {
	data := NewData()
	if dim, ok := bp.dim.GetOnce(); ok {
		data.Set(dimProp, dim)
	}
	if solid, ok := bp.solid.GetOnce(); ok {
		data.Set(solidProp, solid)
	}
	if grounded, ok := bp.grounded.GetOnce(); ok {
		data.Set(groundedProp, grounded)
	}
	return data
}

func (bp *BaseProfile) SetData(data Data) {
	if data.Size() == 0 {
		return
	}

	if data.Has(posProp) {
		bp.SetPos(data.Get(posProp).(Vec2))
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
	if data.Has(jerkProp) {
		bp.SetJerk(data.Get(jerkProp).(Vec2))
	} else {
		bp.SetJerk(NewVec2(0, 0))
	}

	if data.Has(dimProp) {
		bp.SetDim(data.Get(dimProp).(Vec2))
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

func (bp BaseProfile) dimOverlapX(other Profile) (float64, float64) {
	overlap := Max(0, bp.Dim().X/2 + other.Dim().X/2 - bp.distX(other))

	if overlap <= 0 {
		return 0, 0
	}
	return overlap, bp.Dim().X + other.Dim().X - overlap
}
func (bp BaseProfile) dimOverlapY(other Profile) (float64, float64) {
	overlap := Max(0, bp.Dim().Y/2 + other.Dim().Y/2 - bp.distY(other))

	if overlap <= 0 {
		return 0, 0
	}
	return overlap, bp.Dim().Y + other.Dim().Y - overlap
}
func (bp BaseProfile) dimOverlap(other Profile) float64 {
	ox, _ := bp.dimOverlapX(other)
	oy, _ := bp.dimOverlapY(other)
	return ox * oy
}

func (bp BaseProfile) distX(other Profile) float64 {
	return Abs(other.Pos().X - bp.Pos().X)
}
func (bp BaseProfile) distY(other Profile) float64 {
	return Abs(other.Pos().Y - bp.Pos().Y)
}
func (bp BaseProfile) distSqr(other Profile) float64 {
	x := bp.distX(other)
	y := bp.distY(other)
	return x * x + y * y
}
func (bp BaseProfile) dist(other Profile) float64 {
	return math.Sqrt(bp.distSqr(other))
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