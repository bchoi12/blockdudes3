package main

type Optional struct {
	has bool
	value bool
}

func NewOptional() *Optional {
	return &Optional {
		has: false,
		value: false,
	}
}

func (o Optional) Has() bool {
	return o.has
}

func (o Optional) ValueOr(or bool) bool {
	if o.Has() {
		return o.value
	}
	return or
}

func (o Optional) Value() bool {
	return o.value
}

func (o *Optional) Set(value bool) {
	o.has = true
	o.value = value
}

func (o *Optional) Clear() {
	o.has = false
}