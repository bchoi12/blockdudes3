package main

import (
	"container/heap"
	"time"
)

type SpacedId struct {
	space SpaceType
	id IdType
}

func Id(space SpaceType, id IdType) SpacedId {
	return SpacedId {
		space: space,
		id: id,
	}
}

type Thing interface {
	SetId(id IdType)
	SetSpace(space SpaceType)
	SetSpacedId(sid SpacedId)

	GetId() IdType
	GetSpace() SpaceType
	GetSpacedId() SpacedId

	GetInit() Init
	GetProfile() Profile
	SetProfileOptions(options ProfileOptions)

	TakeHit(shot *Shot, hit *Hit)
	UpdateState(grid *Grid, buffer *UpdateBuffer, now time.Time) bool

	// WASM only
	SetData(od ObjectData)
	GetData() ObjectData
}

type Init struct {
	Id IdType
	S SpaceType
	Pos Vec2
	Dim Vec2
}

func NewInit(sid SpacedId, pos Vec2, dim Vec2) Init {
	return Init {
		Id: sid.id,
		S: sid.space,
		Pos: pos,
		Dim: dim,
	}
}

func (i *Init) SetId(id IdType) {
	i.Id = id
}
func (i *Init) SetSpace(space SpaceType) {
	i.S = space
}
func (i *Init) SetSpacedId(sid SpacedId) {
	i.SetId(sid.id)
	i.SetSpace(sid.space)
}

func (i Init) GetId() IdType {
	return i.Id
}
func (i Init) GetSpace() SpaceType {
	return i.S
}
func (i Init) GetSpacedId() SpacedId {
	return Id(i.S, i.Id)
}

func (i Init) GetInit() Init {
	return i
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
