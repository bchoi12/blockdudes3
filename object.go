package main

import (
	"container/heap"
	"time"
)

type ObjectInitData struct {
	Pos Vec2
	Dim Vec2

	dynamic bool
}

type ObjectData struct {
	Pos Vec2
	Vel Vec2
}

func NewObject(id int, initData ObjectInitData) *Object {
	return &Object {
		id : id,
		Profile: NewRec2(initData.Pos, initData.Dim),
		dynamic: initData.dynamic,
	}
}

type ObjectUpdate func(o *Object, grid *Grid, buffer *UpdateBuffer, ts float64)
type Object struct {
	id int
	Profile

	dynamic bool
	update ObjectUpdate
	lastUpdateTime time.Time
}

func (o *Object) getObjectData() ObjectData {
	return ObjectData {
		Pos: o.Profile.Pos(),
		Vel: o.Profile.Vel(),
	}
}

func (o *Object) updateState(grid *Grid, buffer *UpdateBuffer, now time.Time) {
	if !o.dynamic {
		return
	}

	var timeStep time.Duration
	if o.lastUpdateTime.IsZero() {
		timeStep = 0
	} else {
		timeStep = now.Sub(o.lastUpdateTime)
	}
	o.lastUpdateTime = now
	ts := float64(timeStep) / float64(time.Second)

	o.update(o, grid, buffer, ts)
}


type ObjectItem struct {
	id int
	object *Object

	priority float64
	index int
}

type ObjectHeap []*ObjectItem

func (oh ObjectHeap) Len() int { return len(oh) }

func (oh ObjectHeap) Less(i, j int) bool {
	return oh[i].priority > oh[j].priority
}

func (oh ObjectHeap) Swap(i, j int) {
	oh[i], oh[j] = oh[j], oh[i]
	oh[i].index = i
	oh[j].index = j
}

func (oh *ObjectHeap) Push(x interface{}) {
	n := len(*oh)
	item := x.(*ObjectItem)
	item.index = n
	*oh = append(*oh, item)
}

func (oh *ObjectHeap) Pop() interface{} {
	old := *oh
	n := len(old)
	item := old[n-1]
	old[n-1] = nil
	item.index = -1
	*oh = old[0 : n-1]
	return item
}

func (oh *ObjectHeap) priority(item *ObjectItem,  priority float64) {
	item.priority = priority
	heap.Fix(oh, item.index)
}
