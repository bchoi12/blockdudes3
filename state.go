package main

const (
	stateDefaultTTL int = 5
)

type State struct {
	state interface{}
	ttl int
}

func NewState(state interface{}) State {
	return State {
		state: state,
		ttl: 0,
	}
}

func (st *State) Set(state interface{}) {
	if st.state == state {
		return
	}

	st.state = state
	st.ttl = stateDefaultTTL
}

func (st State) TTL() int {
	return st.ttl
}

func (st State) Peek() interface{} {
	return st.state
}

func (st State) Pop() (interface{}, bool) {
	if st.ttl <= 0 {
		return nil, false
	}
	st.ttl -= 1
	return st.state, true
}