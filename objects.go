package main

func NewRec2Object(init Init) *Object {
	return &Object {
		Init: init,
		Profile: NewRec2(init.Pos, init.Dim),
	}
}

func NewCircleObject(init Init) *Object {
	return &Object {
		Init: init,
		Profile: NewCircle(init.Pos, init.Dim),
	}
}

func NewWall(init Init) *Object {
	object := NewRec2Object(init)
	return object
}

func NewBomb(init Init) *Object {
	object := NewCircleObject(init)
	object.health = 1200
	object.update = updateBomb
	return object
}

func updateBomb(o *Object, grid *Grid, buffer *UpdateBuffer, ts float64) {
	if isWasm {
		return
	}

	o.health -= int(1000 * ts)

	if o.health <= 0 {
		pos := o.GetInit().Pos
		dim := o.GetInit().Dim
		dim.Scale(2.0)

		init := NewInit(grid.NextSpacedId(objectIdSpace), explosionObjectClass, pos, dim)
		explosion := NewExplosion(init)
		
		grid.Upsert(explosion)
		grid.Delete(o.GetSpacedId())
	}
}

func NewExplosion(init Init) *Object {
	object := NewCircleObject(init)
	object.health = 300
	object.update = updateExplosion
	return object
}
func updateExplosion(o *Object, grid *Grid, buffer *UpdateBuffer, ts float64) {
	if isWasm {
		return
	}

	o.health -= int(1000 * ts)
	if o.health <= 0 {
		grid.Delete(o.GetSpacedId())
	}
}