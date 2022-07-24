package main

import (
	"time"
)


type Timer struct {
	started time.Time
	duration time.Duration
}

func NewTimer(duration time.Duration) Timer {
	return Timer {
		started: time.Time{},
		duration: duration,
	}
}

func (t *Timer) SetDuration(duration time.Duration) {
	t.duration = duration
}

func (t *Timer) Start(now time.Time) {
	t.started = now
}

func (t *Timer) On(now time.Time) bool {
	return now.Sub(t.started) <= t.duration
}