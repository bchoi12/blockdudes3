package main

import (
	"container/heap"
	"time"
)

type SpacedId struct {
	space IdSpaceType
	id IdType
}

func Id(space IdSpaceType, id IdType) SpacedId {
	return SpacedId {
		space: space,
		id: id,
	}
}

type Thing interface {
	GetId() IdType
	GetSpacedId() SpacedId

	GetInit() Init
	GetClass() ObjectClassType
	GetProfile() Profile
	SetProfileOptions(options ProfileOptions)

	TakeHit(shot *Shot, hit *Hit)
	UpdateState(grid *Grid, buffer *UpdateBuffer, now time.Time) bool
}

type Init struct {
	Id IdType
	S IdSpaceType
	C ObjectClassType
	Pos Vec2
	Dim Vec2
}

func NewInit(sid SpacedId, class ObjectClassType, pos Vec2, dim Vec2) Init {
	return Init {
		Id: sid.id,
		S: sid.space,
		C: class,
		Pos: pos,
		Dim: dim,
	}
}

func (i Init) GetId() IdType {
	return i.Id
}

func (i Init) GetInit() Init {
	return i
}

func (i Init) GetClass() ObjectClassType {
	return i.C
}


type ThingItem struct {
	id IdType
	thing Thing

	priority float64
	index int
}

type ThingHeap []*ThingItem

func PopThing(things *ThingHeap) Thing {
	item := heap.Pop(things).(*ThingItem)
	return item.thing
}

func (th ThingHeap) Len() int { return len(th) }

func (th ThingHeap) Less(i, j int) bool {
	return th[i].priority > th[j].priority
}

func (th ThingHeap) Swap(i, j int) {
	th[i], th[j] = th[j], th[i]
	th[i].index = i
	th[j].index = j
}

func (th *ThingHeap) Push(x interface{}) {
	n := len(*th)
	item := x.(*ThingItem)
	item.index = n
	*th = append(*th, item)
}

func (th *ThingHeap) Pop() interface{} {
	old := *th
	n := len(old)
	item := old[n-1]
	old[n-1] = nil
	item.index = -1
	*th = old[0 : n-1]
	return item
}

func (th *ThingHeap) priority(item *ThingItem,  priority float64) {
	item.priority = priority
	heap.Fix(th, item.index)
}
