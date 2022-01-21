package main

type MultiProfile struct {
	// Rec2 is used for Snap()
	*Rec2
	subProfiles []Profile
	offsets []Vec2
}

func NewMultiProfile(init Init, data Data, subProfiles []Profile) *MultiProfile {
	offsets := make([]Vec2, len(subProfiles))

	for i, sp := range(subProfiles) {
		offsets[i] = sp.Pos()
	}

	return &MultiProfile {
		Rec2: NewRec2(init, data),
		subProfiles: subProfiles,
		offsets: offsets,
	}
}

func (mp *MultiProfile) Update() {
	for i, sp := range(mp.subProfiles) {
		pos := mp.Pos()
		pos.Add(mp.offsets[i], 1.0)
		sp.SetPos(pos)
	}
}

func (mp *MultiProfile) Contains(point Vec2) bool {
	mp.Update()

	for _, sp := range(mp.subProfiles) {
		if sp.Contains(point) {
			return true
		}
	}
	return false
}

func (mp *MultiProfile) Intersects(line Line) (bool, float64) {
	mp.Update()

	collision := false
	closest := 1.0
	for _, sp := range(mp.subProfiles) {
		c, t := sp.Intersects(line)
		collision = collision || c
		closest = Min(closest, t)
	}
	return collision, closest
}

func (mp *MultiProfile) Overlap(profile Profile) float64 {
	base := mp.Rec2.Overlap(profile)
	if base > 0 {
		return base
	}

	mp.Update()

	overlap := 0.0
	for _, sp := range(mp.subProfiles) {
		overlap = Max(overlap, sp.Overlap(profile))
	}
	return overlap
}