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
	Component

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

	Stop()

	AddSubProfile(key ProfileKey, subProfile SubProfile)
	GetSubProfile(key ProfileKey) SubProfile

	// TODO: change params to objects?
	Offset(other Profile) Vec2
	DistSqr(other Profile) float64
	Dist(other Profile) float64
	DistX(other Profile) float64
	DistY(other Profile) float64

	DimOverlap(other Profile) Vec2
	dimOverlapX(other Profile) (float64, float64)
	dimOverlapY(other Profile) (float64, float64)
}

type BaseProfile struct {
	Init
	pos, vel, extVel, acc, jerk, dir Vec2
	dim *State
	static bool

	subProfiles map[ProfileKey]SubProfile
	ignoredColliders map[SpacedId]bool
	overlapOptions, snapOptions ColliderOptions
}

func NewBaseProfile(init Init) BaseProfile {
	bp := BaseProfile {
		Init: init,
		pos: init.Pos(),
		dim: NewState(init.Dim()),
		vel: NewVec2(0, 0),
		extVel: NewVec2(0, 0),
		acc: NewVec2(0, 0),
		dir: NewVec2(1, 0),

		subProfiles: make(map[ProfileKey]SubProfile),
		ignoredColliders: make(map[SpacedId]bool),
		overlapOptions: NewColliderOptions(),
		snapOptions: NewColliderOptions(),
	}
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

func (bp *BaseProfile) Stop() {
	bp.SetVel(NewVec2(0, 0))
	bp.SetAcc(NewVec2(0, 0))
	bp.SetJerk(NewVec2(0, 0))
}

func (bp BaseProfile) GetData() Data {
	data := NewData()

	if dim, ok := bp.dim.Pop(); ok {
		data.Set(dimProp, dim)
	}

	if bp.static {
		return data
	}

	// TODO: track change and only publish when changed
	data.Set(posProp, bp.Pos())

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

	return data
}

func (bp BaseProfile) GetInitData() Data {
	data := NewData()
	data.Set(posProp, bp.Pos())
	data.Set(dimProp, bp.dim.Peek())
	return data
}

func (bp BaseProfile) GetUpdates() Data {
	data := NewData()
	if dim, ok := bp.dim.GetOnce(); ok {
		data.Set(dimProp, dim)
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
}

func (bp *BaseProfile) AddSubProfile(key ProfileKey, subProfile SubProfile) { bp.subProfiles[key] = subProfile }
func (bp BaseProfile) GetSubProfile(key ProfileKey) SubProfile { return bp.subProfiles[key] }

func (bp BaseProfile) DimOverlap(other Profile) Vec2 {
	oxSmall, oxLarge := bp.dimOverlapX(other)
	oySmall, oyLarge := bp.dimOverlapY(other)

	relativePos := NewVec2(bp.Pos().X - other.Pos().X, bp.Pos().Y - other.Pos().Y)
	relativeVel := NewVec2(bp.TotalVel().X - other.TotalVel().X, bp.TotalVel().Y - other.TotalVel().Y)

	// Check if we somehow got past the midpoint of the object
	ox := oxSmall
	oy := oySmall
	if relativeVel.X != 0 && Sign(relativePos.X) == Sign(relativeVel.X) {
		ox = oxLarge
	}
	if relativeVel.Y != 0 && Sign(relativePos.Y) == Sign(relativeVel.Y) {
		oy = oyLarge
	}
	return NewVec2(ox, oy)
}

func (bp BaseProfile) dimOverlapX(other Profile) (float64, float64) {
	overlap := Max(0, bp.Dim().X/2 + other.Dim().X/2 - bp.DistX(other))

	if overlap <= 0 {
		return 0, 0
	}
	return overlap, bp.Dim().X + other.Dim().X - overlap
}
func (bp BaseProfile) dimOverlapY(other Profile) (float64, float64) {
	overlap := Max(0, bp.Dim().Y/2 + other.Dim().Y/2 - bp.DistY(other))

	if overlap <= 0 {
		return 0, 0
	}
	return overlap, bp.Dim().Y + other.Dim().Y - overlap
}

func (bp BaseProfile) Offset(other Profile) Vec2 {
	offset := other.Pos()
	offset.Sub(bp.Pos(), 1.0)
	return offset
}

func (bp BaseProfile) DistSqr(other Profile) float64 {
	x := bp.DistX(other)
	y := bp.DistY(other)
	return x * x + y * y
}
func (bp BaseProfile) Dist(other Profile) float64 {
	return math.Sqrt(bp.DistSqr(other))
}
func (bp BaseProfile) DistX(other Profile) float64 {
	return Abs(other.Pos().X - bp.Pos().X)
}
func (bp BaseProfile) DistY(other Profile) float64 {
	return Abs(other.Pos().Y - bp.Pos().Y)
}

func (bp BaseProfile) getIgnored() map[SpacedId]bool {
	return bp.ignoredColliders
}
func (bp *BaseProfile) updateIgnored(ignored map[SpacedId]bool) {
	bp.ignoredColliders = ignored
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

func (bp BaseProfile) GetOverlapOptions() ColliderOptions { return bp.overlapOptions }
func (bp *BaseProfile) SetOverlapOptions(options ColliderOptions) {
	for _, sp := range(bp.subProfiles) {
		sp.SetOverlapOptions(options)
	}
	bp.overlapOptions = options
}

func (bp BaseProfile) OverlapProfile(profile Profile) CollideResult {
	result := NewCollideResult()
	for _, sp := range(bp.subProfiles) {
		result.Merge(sp.OverlapProfile(profile))
	}
	return result
}

func (bp BaseProfile) GetSnapOptions() ColliderOptions { return bp.snapOptions }
func (bp *BaseProfile) SetSnapOptions(options ColliderOptions) {
	for _, sp := range(bp.subProfiles) {
		sp.SetSnapOptions(options)
	}
	bp.snapOptions = options
}

func (bp *BaseProfile) Snap(nearbyObjects ObjectHeap) SnapResults {
	results := NewSnapResults()
	for _, sp := range(bp.subProfiles) {
		results.Merge(sp.Snap(nearbyObjects))
	}
	return results
}