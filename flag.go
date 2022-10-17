package main

const (
	flagDefaultTTL int = 3
)

type Flag struct {
	flag *Optional
	changed bool
	ttl int
	defaultTTL int
}

func NewFlag() *Flag {
	return NewFlagTTL(flagDefaultTTL)
}

func NewFlagTTL(ttl int) *Flag {
	return &Flag {
		flag: NewOptional(),
		changed: false,
		ttl: 0,
		defaultTTL: ttl,
	}
}

func (f Flag) Has() bool {
	return f.flag.Has()
}

func (f *Flag) Set(flag bool) {
	if f.flag.Has() && f.flag.Value() == flag {
		return
	}

	f.Reset(flag)
}

func (f *Flag) Reset(flag bool) {
	f.flag.Set(flag)
	f.changed = true
	f.ttl = f.defaultTTL
}

func (f *Flag) GetOnce() (bool, bool) {
	if !f.changed || !f.flag.Has() {
		return false, false
	}

	f.changed = false
	return f.flag.Value(), true
}

func (f *Flag) Pop() (bool, bool) {
	if f.ttl <= 0 || !f.flag.Has() {
		return false, false
	}

	f.ttl -= 1
	return f.flag.Value(), true
}

func (f Flag) Peek() bool {
	return f.flag.Value()
}