package main

const (
	stateDefaultTTL int = 3
)

type State struct {
	state interface{}
	changed bool
	ttl int

	// If the state was ever set
	set bool
}

func NewBlankState(state interface{}) *State {
	return &State {
		state: state,
		changed: false,
		ttl: 0,
		set: false,
	}
}

func NewState(state interface{}) *State {
	return &State {
		state: state,
		changed: true,
		ttl: stateDefaultTTL,
		set: true,
	}
}

func (st State) TTL() int {
	return st.ttl
}

func (st State) Peek() interface{} {
	return st.state
}

func (st State) Has() bool {
	return st.set
}

func (st *State) Set(state interface{}) {
	st.set = true
	if st.state == state {
		return
	}

	st.state = state
	st.Refresh()
}

func (st *State) Refresh() {
	st.changed = true
	st.ttl = stateDefaultTTL
}

func (st *State) GetOnce() (interface{}, bool) {
	if !st.changed {
		return nil, false
	}

	st.changed = false
	return st.state, true
}

func (st *State) Pop() (interface{}, bool) {
	if st.ttl <= 0 {
		return nil, false
	}
	st.ttl -= 1
	return st.state, true
}