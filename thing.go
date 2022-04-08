package main

import (
	"container/heap"
	"time"
)

type Thing interface {
	InitMethods
	Profile

	GetProfile() Profile
	GetInitData() Data
	GetData() Data
	GetUpdates() Data
	SetData(data Data)
	GetParent() Attachment
	SetParent(attach Attachment)
	GetChildren() []Attachment
	AddChild(attach Attachment)

	UpdateState(grid *Grid, now time.Time) bool
	Postprocess(grid *Grid, now time.Time)
}

type ThingState struct {
	initialized bool
	deleted bool
}

func NewThingState() *ThingState {
	return &ThingState {
		initialized: false,
		deleted: false,
	}
}

func (th ThingState) GetInitialized() bool {
	return th.initialized
}

func (th *ThingState) SetInitialized(initialized bool) {
	th.initialized = initialized
}

func (th ThingState) GetDeleted() bool {
	return th.deleted
}

func (th *ThingState) SetDeleted(deleted bool) {
	th.deleted = deleted
}

type ThingItem struct {
	id IdType
	thing Thing

	priority float64
	index int
}

type ThingHeap []*ThingItem

func PopThing(th *ThingHeap) Thing {
	item := heap.Pop(th).(*ThingItem)
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
