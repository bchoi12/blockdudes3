package main

type SubProfile struct {
	Profile
	offset Vec2
	subDir Vec2
}

func NewSubProfile(profile Profile) SubProfile {
	return SubProfile {
		Profile: profile,
		offset: NewVec2(0, 0),
		subDir: NewVec2(1, 0),
	}
}

func (sp *SubProfile) SetPos(pos Vec2) {
	pos.Add(sp.offset, 1.0)
	sp.Profile.SetPos(pos)
}

func (sp *SubProfile) SetDir(dir Vec2) {
	angle := NormalizeAngle(dir.Angle() + sp.subDir.Angle())
	sp.Profile.SetDir(NewVec2FromAngle(angle))
}

func (sp *SubProfile) SetOffset(offset Vec2) { sp.offset = offset } 
func (sp *SubProfile) SetSubDir(subDir Vec2) { sp.subDir = subDir }

func (sp *SubProfile) GetInitData() Data {
	return NewData()
}
func (sp *SubProfile) GetData() Data {
	data := NewData()
	data.Set(dirProp, sp.Profile.Dir())
	return data
}
func (sp *SubProfile) GetUpdates() Data {
	return NewData()
}
func (sp *SubProfile) SetData(data Data) {}