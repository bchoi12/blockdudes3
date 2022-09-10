package main

type ContainResults struct {
	contains bool
	ignored bool
}

func NewContainResults() ContainResults {
	return ContainResults {
		contains: false,
		ignored: false,
	}
}

func (cr *ContainResults) Merge(other ContainResults) {
	cr.contains = cr.contains || other.contains
	cr.ignored = cr.ignored && other.ignored
}

type IntersectResults struct {
	hit bool
	ignored bool
	t float64
	tmax float64
}

func NewIntersectResults() IntersectResults {
	return IntersectResults {
		hit: false,
		ignored: false,
		t: 1.0,
		tmax: 0,
	}
}

func (ir *IntersectResults) Merge(other IntersectResults) {
	ir.hit = ir.hit || other.hit

	if other.hit {
		ir.t = Min(ir.t, other.t)
		ir.tmax = Max(ir.tmax, other.t)
	}
}

type CollideResult struct {
	hit bool
	ignored bool
	posAdjustment Vec2
	force Vec2
}

func NewCollideResult() CollideResult {
	return CollideResult {
		hit: false,
		ignored: false,
		posAdjustment: NewVec2(0, 0),
		force: NewVec2(0, 0),
	}
}

func (cr CollideResult) GetHit() bool { return cr.hit }
func (cr CollideResult) GetIgnored() bool { return cr.ignored }
func (cr CollideResult) GetPosAdjustment() Vec2 { return cr.posAdjustment }
func (cr CollideResult) GetForce() Vec2 { return cr.force }
func (cr *CollideResult) SetHit(hit bool) { cr.hit = hit }
func (cr *CollideResult) SetIgnored(ignored bool) { cr.ignored = ignored }
func (cr *CollideResult) SetPosAdjustment(posAdj Vec2) { cr.posAdjustment = posAdj }
func (cr *CollideResult) SetForce(force Vec2) { cr.force = force }

func (cr *CollideResult) Merge(other CollideResult) {
	cr.hit = cr.hit || other.hit
	cr.ignored = cr.ignored && other.ignored

	posAdj := &cr.posAdjustment
	force := &cr.force
	posAdj.AbsMax(other.GetPosAdjustment())
	force.AbsMax(other.GetForce())
}

type SnapResults struct {
	snap bool

	posAdjustment Vec2
	force Vec2
	collideResults map[SpacedId]CollideResult
}

func NewSnapResults() SnapResults {
	return SnapResults {
		snap: false,
		posAdjustment: NewVec2(0, 0),
		force: NewVec2(0, 0),
		collideResults: make(map[SpacedId]CollideResult),
	}
}

func (sr *SnapResults) AddCollideResult(sid SpacedId, result CollideResult) {
	if _, ok := sr.collideResults[sid]; ok {
		return
	}

	sr.collideResults[sid] = result
	sr.snap = sr.snap || (result.hit && !result.ignored)

	posAdj := &sr.posAdjustment
	force := &sr.force
	posAdj.AbsMax(result.GetPosAdjustment())
	force.AbsMax(result.GetForce())
}

func (sr *SnapResults) Merge(other SnapResults) {
	for sid, result := range(other.collideResults) {
		sr.AddCollideResult(sid, result)	
	}
}